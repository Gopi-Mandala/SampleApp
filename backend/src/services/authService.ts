import * as crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { User, RevokedToken } from '../models';
import { appConfig } from '../config';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  email: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
}

export interface AuthService {
  login(email: string, password: string): Promise<TokenPair>;
  refresh(refreshToken: string): Promise<Pick<TokenPair, 'accessToken'>>;
  logout(refreshToken: string): Promise<void>;
  verifyAccessToken(token: string): JwtPayload;
  revokeRefreshToken(token: string): Promise<void>;
  isRefreshTokenRevoked(token: string): Promise<boolean>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Computes the SHA-256 hex digest of a token string.
 * Used so the raw token is never stored in the database.
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Decodes the expiry timestamp from a JWT string without verifying the
 * signature. Returns the `exp` claim as a Date, or `null` when absent.
 */
function decodeExpiry(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload | null;
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000);
    }
  } catch {
    // ignore — treat as no expiry
  }
  return null;
}

// ─── AuthService Implementation ──────────────────────────────────────────────

/**
 * Concrete implementation of the AuthService interface.
 *
 * Secrets and expiry durations are always read from `appConfig`, which in
 * turn reads them from environment variables — they are never hard-coded
 * (Requirement 5.8).
 */
export const authService: AuthService = {
  /**
   * Validates the user's credentials and issues an access + refresh token pair.
   *
   * @param email    - The user's email address.
   * @param password - The plaintext password submitted by the user.
   * @returns A `TokenPair` containing both tokens on success.
   * @throws An error with message "Invalid credentials" when the email is not
   *         found or the password does not match.
   *
   * Requirements: 5.1, 5.8
   */
  async login(email: string, password: string): Promise<TokenPair> {
    // Look up the user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Compare submitted password against stored bcrypt hash
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error('Invalid credentials');
    }

    // Issue tokens — expiry read from env via appConfig (never hard-coded)
    const now = Math.floor(Date.now() / 1000);

    const accessTokenPayload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = jwt.sign(accessTokenPayload, appConfig.jwtSecret, {
      expiresIn: appConfig.accessTokenExpiry,
    });

    const refreshTokenPayload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      sub: user.id,
    };

    const refreshToken = jwt.sign(refreshTokenPayload, appConfig.jwtRefreshSecret, {
      expiresIn: appConfig.refreshTokenExpiry,
    });

    // Suppress unused variable warning — `now` is kept for documentation clarity
    void now;

    return { accessToken, refreshToken };
  },

  /**
   * Issues a new access token in exchange for a valid, non-revoked refresh
   * token, and rotates (revokes) the old refresh token.
   *
   * @param refreshToken - The current refresh token from the client.
   * @returns A new `accessToken`.
   * @throws An error when the token is expired, malformed, or already revoked.
   *
   * Requirements: 5.2, 5.3
   */
  async refresh(refreshToken: string): Promise<Pick<TokenPair, 'accessToken'>> {
    // Verify signature and expiry
    let payload: RefreshTokenPayload;
    try {
      payload = jwt.verify(refreshToken, appConfig.jwtRefreshSecret) as RefreshTokenPayload;
    } catch {
      throw new Error('Invalid or expired refresh token');
    }

    // Check whether this token has already been revoked
    const revoked = await authService.isRefreshTokenRevoked(refreshToken);
    if (revoked) {
      throw new Error('Invalid or expired refresh token');
    }

    // Rotate: revoke the consumed token before issuing the new access token
    await authService.revokeRefreshToken(refreshToken);

    const accessToken = jwt.sign({ sub: payload.sub, email: payload.email }, appConfig.jwtSecret, {
      expiresIn: appConfig.accessTokenExpiry,
    });

    return { accessToken };
  },

  /**
   * Revokes the provided refresh token so it can no longer be used.
   * If the token is already expired or malformed the call is a no-op
   * (returns 200 to the caller per Requirement 5.7).
   *
   * @param refreshToken - The refresh token to invalidate.
   *
   * Requirements: 5.6, 5.7
   */
  async logout(refreshToken: string): Promise<void> {
    // Attempt a silent revocation — do NOT throw on invalid/expired tokens
    try {
      jwt.verify(refreshToken, appConfig.jwtRefreshSecret);
    } catch {
      // Token is already expired or malformed — treat as no-op (Req 5.7)
      return;
    }

    // Only store if not already revoked (avoid unique-constraint errors)
    const alreadyRevoked = await authService.isRefreshTokenRevoked(refreshToken);
    if (!alreadyRevoked) {
      await authService.revokeRefreshToken(refreshToken);
    }
  },

  /**
   * Verifies an access token and returns its decoded payload.
   *
   * @param token - The JWT access token string to verify.
   * @returns The decoded `JwtPayload` when the token is valid and non-expired.
   * @throws A `JsonWebTokenError` or `TokenExpiredError` when invalid.
   *
   * Requirements: 5.4, 5.5
   */
  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, appConfig.jwtSecret) as JwtPayload;
  },

  /**
   * Inserts the SHA-256 hash of a refresh token into the `revoked_tokens` table.
   *
   * @param token - The raw refresh token to revoke.
   *
   * Requirements: 5.2, 5.6
   */
  async revokeRefreshToken(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    const expiresAt =
      decodeExpiry(token) ?? new Date(Date.now() + appConfig.refreshTokenExpiry * 1000);

    await RevokedToken.create({
      tokenHash,
      revokedAt: new Date(),
      expiresAt,
    });
  },

  /**
   * Returns `true` when the SHA-256 hash of `token` exists in the
   * `revoked_tokens` table, `false` otherwise.
   *
   * @param token - The raw refresh token to check.
   *
   * Requirements: 5.2, 5.6
   */
  async isRefreshTokenRevoked(token: string): Promise<boolean> {
    const tokenHash = hashToken(token);
    const record = await RevokedToken.findOne({ where: { tokenHash } });
    return record !== null;
  },
};

export default authService;
