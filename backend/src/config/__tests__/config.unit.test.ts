/**
 * Unit tests for backend/src/config/index.ts
 *
 * Validates: Requirements 6.2, 6.6
 *
 * Strategy:
 * - jest.resetModules() + dynamic require() ensures the module is freshly
 *   evaluated for every test case, so top-level side-effects (NODE_ENV check,
 *   dotenv.config, missing-var check, process.exit) run from scratch each time.
 * - process.exit is replaced with a jest.spyOn mock so the process doesn't
 *   actually terminate during tests.
 * - dotenv.config is mocked to prevent real filesystem reads and to capture
 *   the path argument passed to it.
 */

import * as path from 'path';

// ─── helpers ────────────────────────────────────────────────────────────────

/** All seven variables required by the Config Loader. */
const ALL_VARS = {
  NODE_ENV: 'development',
  PORT: '4000',
  DATABASE_URL: 'postgres://user:pass@localhost:5432/mydb',
  JWT_SECRET: 'supersecretjwt',
  JWT_REFRESH_SECRET: 'supersecretrefresh',
  ACCESS_TOKEN_EXPIRY: '900',
  REFRESH_TOKEN_EXPIRY: '604800',
};

/** Snapshot of process.env keys set by the test suite so we can restore them. */
let savedEnvKeys: string[];

beforeEach(() => {
  savedEnvKeys = Object.keys(ALL_VARS);

  // Reset module registry so config/index.ts re-executes each time.
  jest.resetModules();
});

afterEach(() => {
  // Remove every var this suite may have set.
  savedEnvKeys.forEach((k) => delete process.env[k]);

  jest.restoreAllMocks();
});

// ─── helpers to load the module ─────────────────────────────────────────────

/**
 * Loads config/index.ts after setting process.env and mocking dotenv.config.
 * Returns the module exports (or undefined if process.exit was called first).
 */
function loadConfig(
  envVars: Record<string, string>,
  dotenvSpy?: jest.Mock,
):
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Record<string, any> | undefined {
  // Apply env vars
  Object.assign(process.env, envVars);

  // Mock dotenv so it doesn't touch the filesystem
  jest.mock('dotenv', () => ({
    config: dotenvSpy ?? jest.fn(),
  }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../index');
}

// ─── test cases ─────────────────────────────────────────────────────────────

describe('Config Loader — unit tests', () => {
  // ── 1. Happy path ──────────────────────────────────────────────────────────
  it('should load valid config and export correct typed AppConfig', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called unexpectedly');
    });

    const mod = loadConfig(ALL_VARS);

    expect(exitSpy).not.toHaveBeenCalled();

    const { appConfig } = mod as { appConfig: Record<string, unknown> };

    expect(appConfig.nodeEnv).toBe('development');
    expect(appConfig.port).toBe(4000); // parsed as number
    expect(appConfig.databaseUrl).toBe(ALL_VARS.DATABASE_URL);
    expect(appConfig.jwtSecret).toBe(ALL_VARS.JWT_SECRET);
    expect(appConfig.jwtRefreshSecret).toBe(ALL_VARS.JWT_REFRESH_SECRET);
    expect(appConfig.accessTokenExpiry).toBe(900); // parsed as number
    expect(appConfig.refreshTokenExpiry).toBe(604800); // parsed as number
  });

  // ── 2. Missing NODE_ENV ────────────────────────────────────────────────────
  it('should call process.exit(1) when NODE_ENV is missing', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const envWithoutNodeEnv = { ...ALL_VARS };
    delete (envWithoutNodeEnv as Record<string, string>).NODE_ENV;
    delete process.env.NODE_ENV;

    loadConfig(envWithoutNodeEnv);

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();
  });

  // ── 3. Invalid NODE_ENV ────────────────────────────────────────────────────
  it('should call process.exit(1) when NODE_ENV is invalid', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    loadConfig({ ...ALL_VARS, NODE_ENV: 'invalid' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();
  });

  // ── 4. Missing individual required variables ───────────────────────────────
  it('should log each missing required variable individually', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Omit PORT and JWT_SECRET
    const partialEnv = { ...ALL_VARS };
    delete (partialEnv as Record<string, string>).PORT;
    delete (partialEnv as Record<string, string>).JWT_SECRET;
    delete process.env.PORT;
    delete process.env.JWT_SECRET;

    loadConfig(partialEnv);

    expect(exitSpy).toHaveBeenCalledWith(1);

    // Each missing variable should have been logged separately
    const errorCalls = errorSpy.mock.calls.map((args) => String(args[0]));
    const portLogged = errorCalls.some((msg) => msg.includes('PORT'));
    const jwtLogged = errorCalls.some((msg) => msg.includes('JWT_SECRET'));

    expect(portLogged).toBe(true);
    expect(jwtLogged).toBe(true);
  });

  // ── 5. .env file path matches NODE_ENV ────────────────────────────────────
  it('should load the correct .env.<NODE_ENV> file based on NODE_ENV', () => {
    jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const dotenvConfigMock = jest.fn();

    loadConfig({ ...ALL_VARS, NODE_ENV: 'production' }, dotenvConfigMock);

    expect(dotenvConfigMock).toHaveBeenCalledTimes(1);

    const calledPath: string = dotenvConfigMock.mock.calls[0][0]?.path ?? '';
    // The path must include the NODE_ENV value in the filename
    expect(calledPath).toMatch(/\.env\.production$/);
    // Verify it's an absolute path pointing to the backend root
    expect(path.isAbsolute(calledPath)).toBe(true);
  });
});
