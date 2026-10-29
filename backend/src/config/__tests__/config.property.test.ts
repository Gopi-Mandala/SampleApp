// Feature: full-stack-app-setup, Property 10: Config Loader reports all missing required variables

/**
 * Property 10: Config Loader reports all missing required variables
 *
 * For any non-empty subset of the seven required backend environment variables
 * (NODE_ENV, PORT, DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET,
 * ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY) that is absent at startup,
 * the Config_Loader SHALL log the name of every missing variable and exit
 * with a non-zero status code without starting the HTTP server.
 *
 * Validates: Requirements 6.5, 6.6
 */

import fc from 'fast-check';
import * as path from 'path';

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

/** Full set of env values that produce a valid config (minus any we strip out per run). */
const VALID_ENV_VALUES: Record<RequiredVar, string> = {
  NODE_ENV: 'development',
  PORT: '5000',
  DATABASE_URL: 'postgres://user:pass@localhost:5432/testdb',
  JWT_SECRET: 'test-jwt-secret',
  JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
  ACCESS_TOKEN_EXPIRY: '900',
  REFRESH_TOKEN_EXPIRY: '604800',
};

/** Absolute path to the config module so require() always resolves it correctly. */
const CONFIG_MODULE_PATH = path.resolve(__dirname, '..', 'index');

/**
 * Arbitrary that produces a non-empty subset of REQUIRED_VARS.
 * When NODE_ENV is in the missing subset, the module exits on the first check
 * (invalid/missing NODE_ENV), which still satisfies the "exit + log" requirement.
 * For other vars the module proceeds to the bulk missing-variable check.
 */
const nonEmptySubsetArb = fc
  .subarray(REQUIRED_VARS as unknown as RequiredVar[], { minLength: 1 })
  .map((arr) => new Set(arr));

describe('Property 10: Config Loader reports all missing required variables', () => {
  // Snapshot of the environment before all tests so we can restore it after each iteration.
  const savedEnvKeys = Object.keys(process.env);

  /** Restore process.env to only the keys present before the test suite started. */
  function restoreEnv(snapshot: Record<string, string | undefined>): void {
    // Remove any keys added during the test
    for (const key of Object.keys(process.env)) {
      if (!(key in snapshot)) {
        delete process.env[key];
      }
    }
    // Restore original values
    for (const key of savedEnvKeys) {
      if (snapshot[key] !== undefined) {
        process.env[key] = snapshot[key] as string;
      } else {
        delete process.env[key];
      }
    }
  }

  it('logs every missing variable name and calls process.exit(1) for any non-empty missing subset', () => {
    // Feature: full-stack-app-setup, Property 10: Config Loader reports all missing required variables
    fc.assert(
      fc.property(nonEmptySubsetArb, (missingVars) => {
        // Snapshot current env
        const envSnapshot: Record<string, string | undefined> = { ...process.env };

        // ---- Setup mocks for this iteration ----
        const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
          return undefined as never;
        });

        const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

        try {
          // ---- Populate process.env with all valid values ----
          for (const key of REQUIRED_VARS) {
            process.env[key] = VALID_ENV_VALUES[key];
          }

          // ---- Remove the generated missing subset ----
          for (const key of missingVars) {
            delete process.env[key];
          }

          // ---- Re-require the config module fresh ----
          jest.resetModules();

          try {
            // Use absolute path so require() always finds the module after resetModules()
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            require(CONFIG_MODULE_PATH);
          } catch {
            // The module may throw after process.exit is mocked (since we mock it to not
            // actually exit, downstream code may fail). Swallow those secondary errors.
          }

          // ---- Assertions ----

          // process.exit must have been called with a non-zero code (1)
          expect(mockExit).toHaveBeenCalledWith(1);

          // Every missing variable must have been logged via console.error
          const allErrorOutput: string = mockConsoleError.mock.calls
            .map((args: unknown[]) => args.join(' '))
            .join('\n');

          for (const missingKey of missingVars) {
            expect(allErrorOutput).toContain(missingKey);
          }
        } finally {
          // ---- Teardown: restore mocks and env between iterations ----
          mockExit.mockRestore();
          mockConsoleError.mockRestore();
          restoreEnv(envSnapshot);
        }
      }),
      { numRuns: 100 },
    );
  });
});
