import * as dotenv from 'dotenv';
import * as path from 'path';

// Step 1: Validate NODE_ENV before loading any .env file
const VALID_ENVS = ['development', 'stage', 'production'] as const;
type NodeEnv = (typeof VALID_ENVS)[number];

const rawNodeEnv = process.env.NODE_ENV;

if (!rawNodeEnv || !(VALID_ENVS as readonly string[]).includes(rawNodeEnv)) {
  console.error(
    `[Config] Invalid or missing NODE_ENV: "${rawNodeEnv ?? ''}". Must be one of: ${VALID_ENVS.join(', ')}.`,
  );
  process.exit(1);
}

const nodeEnv = rawNodeEnv as NodeEnv;

// Step 2: Load .env.<NODE_ENV> from the backend directory
dotenv.config({
  path: path.resolve(__dirname, '..', '..', `.env.${nodeEnv}`),
});

// Step 3: Validate all required variables
const REQUIRED_VARS = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'ACCESS_TOKEN_EXPIRY',
  'REFRESH_TOKEN_EXPIRY',
] as const;

type RequiredVar = (typeof REQUIRED_VARS)[number];

const missingVars: RequiredVar[] = REQUIRED_VARS.filter(
  (key) => !process.env[key],
) as RequiredVar[];

if (missingVars.length > 0) {
  missingVars.forEach((key) => {
    console.error(`[Config] Missing required environment variable: ${key}`);
  });
  process.exit(1);
}

// Step 4: Export typed AppConfig interface and singleton
export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  /** Duration in seconds */
  accessTokenExpiry: number;
  /** Duration in seconds */
  refreshTokenExpiry: number;
}

export const appConfig: AppConfig = {
  nodeEnv,
  port: parseInt(process.env.PORT as string, 10),
  databaseUrl: process.env.DATABASE_URL as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  accessTokenExpiry: parseInt(process.env.ACCESS_TOKEN_EXPIRY as string, 10),
  refreshTokenExpiry: parseInt(process.env.REFRESH_TOKEN_EXPIRY as string, 10),
};

export default appConfig;
