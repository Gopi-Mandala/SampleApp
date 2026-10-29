/**
 * Unit tests for backend/src/models/index.ts — initializeDatabase()
 *
 * Validates: Requirements 4.7, 4.8
 *
 * Strategy:
 * - jest.resetModules() + jest.mock() ensure the module is freshly
 *   re-evaluated for each test so top-level Sequelize instantiation
 *   and the exported initializeDatabase() function behave independently.
 * - The Sequelize constructor and sequelize.authenticate() are mocked so
 *   no real database connection is required.
 * - appConfig is mocked to provide a controlled DATABASE_URL, allowing
 *   host:port extraction tests to be deterministic.
 * - process.exit is replaced with a jest.spyOn mock so the process never
 *   actually terminates during tests.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** A DATABASE_URL whose host and port are clearly identifiable in assertions. */
const TEST_DATABASE_URL = 'postgres://user:pass@db.example.com:5432/testdb';

/**
 * Loads backend/src/models/index.ts after applying mocks.
 * Must be called after jest.resetModules() and jest.mock() setup.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadModels(): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../index');
}

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('initializeDatabase()', () => {
  // ── 1. DB reachable — success path ──────────────────────────────────────────
  it('logs "Database connection established" when DB is reachable', async () => {
    // Arrange: mock authenticate to resolve (DB reachable)
    const mockAuthenticate = jest.fn().mockResolvedValue(undefined);
    jest.mock('sequelize', () => {
      return {
        Sequelize: jest.fn().mockImplementation(() => ({
          authenticate: mockAuthenticate,
        })),
        DataTypes: {
          UUID: 'UUID',
          UUIDV4: 'UUIDV4',
          STRING: jest.fn(() => 'STRING'),
          DATE: 'DATE',
          NOW: 'NOW',
          INTEGER: 'INTEGER',
        },
        Model: class {
          static init = jest.fn();
        },
      };
    });

    jest.mock('../../config', () => ({
      appConfig: {
        databaseUrl: TEST_DATABASE_URL,
        nodeEnv: 'development',
        port: 5000,
        jwtSecret: 'secret',
        jwtRefreshSecret: 'refreshsecret',
        accessTokenExpiry: 900,
        refreshTokenExpiry: 604800,
      },
    }));

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const { initializeDatabase } = loadModels();
    await initializeDatabase();

    // Assert
    expect(exitSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('Database connection established');
  });

  // ── 2. DB unreachable — logs host:port and calls process.exit(1) ────────────
  it('logs error containing host:port and calls process.exit(1) when DB is unreachable', async () => {
    // Arrange: mock authenticate to reject (DB unreachable)
    const connectionError = new Error('connection refused');
    const mockAuthenticate = jest.fn().mockRejectedValue(connectionError);

    jest.mock('sequelize', () => {
      return {
        Sequelize: jest.fn().mockImplementation(() => ({
          authenticate: mockAuthenticate,
        })),
        DataTypes: {
          UUID: 'UUID',
          UUIDV4: 'UUIDV4',
          STRING: jest.fn(() => 'STRING'),
          DATE: 'DATE',
          NOW: 'NOW',
          INTEGER: 'INTEGER',
        },
        Model: class {
          static init = jest.fn();
        },
      };
    });

    jest.mock('../../config', () => ({
      appConfig: {
        databaseUrl: TEST_DATABASE_URL,
        nodeEnv: 'development',
        port: 5000,
        jwtSecret: 'secret',
        jwtRefreshSecret: 'refreshsecret',
        accessTokenExpiry: 900,
        refreshTokenExpiry: 604800,
      },
    }));

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const { initializeDatabase } = loadModels();
    await initializeDatabase();

    // Assert — process.exit(1) must be called
    expect(exitSpy).toHaveBeenCalledWith(1);

    // Assert — error message must include host and port from DATABASE_URL
    const errorCalls = errorSpy.mock.calls.map((args) => String(args[0]));
    const hostLogged = errorCalls.some((msg) => msg.includes('db.example.com'));
    const portLogged = errorCalls.some((msg) => msg.includes('5432'));
    expect(hostLogged).toBe(true);
    expect(portLogged).toBe(true);
  });

  // ── 3. DB unreachable — process.exit(1) is called before HTTP server starts ─
  it('calls process.exit(1) and does NOT log connection established on failure', async () => {
    // Arrange: mock authenticate to reject
    const mockAuthenticate = jest.fn().mockRejectedValue(new Error('timeout'));

    jest.mock('sequelize', () => {
      return {
        Sequelize: jest.fn().mockImplementation(() => ({
          authenticate: mockAuthenticate,
        })),
        DataTypes: {
          UUID: 'UUID',
          UUIDV4: 'UUIDV4',
          STRING: jest.fn(() => 'STRING'),
          DATE: 'DATE',
          NOW: 'NOW',
          INTEGER: 'INTEGER',
        },
        Model: class {
          static init = jest.fn();
        },
      };
    });

    jest.mock('../../config', () => ({
      appConfig: {
        databaseUrl: 'postgres://user:pass@localhost:5432/mydb',
        nodeEnv: 'development',
        port: 5000,
        jwtSecret: 'secret',
        jwtRefreshSecret: 'refreshsecret',
        accessTokenExpiry: 900,
        refreshTokenExpiry: 604800,
      },
    }));

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const { initializeDatabase } = loadModels();
    await initializeDatabase();

    // Assert — exit was called
    expect(exitSpy).toHaveBeenCalledWith(1);
    // Assert — success message was NOT logged
    const successLogged = logSpy.mock.calls.some((args) =>
      String(args[0]).includes('Database connection established'),
    );
    expect(successLogged).toBe(false);
  });

  // ── 4. DB reachable — process.exit not called ───────────────────────────────
  it('does NOT call process.exit when DB is reachable', async () => {
    // Arrange: mock authenticate to resolve
    const mockAuthenticate = jest.fn().mockResolvedValue(undefined);

    jest.mock('sequelize', () => {
      return {
        Sequelize: jest.fn().mockImplementation(() => ({
          authenticate: mockAuthenticate,
        })),
        DataTypes: {
          UUID: 'UUID',
          UUIDV4: 'UUIDV4',
          STRING: jest.fn(() => 'STRING'),
          DATE: 'DATE',
          NOW: 'NOW',
          INTEGER: 'INTEGER',
        },
        Model: class {
          static init = jest.fn();
        },
      };
    });

    jest.mock('../../config', () => ({
      appConfig: {
        databaseUrl: TEST_DATABASE_URL,
        nodeEnv: 'development',
        port: 5000,
        jwtSecret: 'secret',
        jwtRefreshSecret: 'refreshsecret',
        accessTokenExpiry: 900,
        refreshTokenExpiry: 604800,
      },
    }));

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const { initializeDatabase } = loadModels();
    await initializeDatabase();

    // Assert
    expect(exitSpy).not.toHaveBeenCalled();
  });

  // ── 5. DB unreachable — error log contains both host and port ───────────────
  it('includes both host and port in error log when connection URL has explicit port', async () => {
    const customUrl = 'postgres://admin:secret@my-db-host.internal:5433/prod';
    const mockAuthenticate = jest.fn().mockRejectedValue(new Error('refused'));

    jest.mock('sequelize', () => {
      return {
        Sequelize: jest.fn().mockImplementation(() => ({
          authenticate: mockAuthenticate,
        })),
        DataTypes: {
          UUID: 'UUID',
          UUIDV4: 'UUIDV4',
          STRING: jest.fn(() => 'STRING'),
          DATE: 'DATE',
          NOW: 'NOW',
          INTEGER: 'INTEGER',
        },
        Model: class {
          static init = jest.fn();
        },
      };
    });

    jest.mock('../../config', () => ({
      appConfig: {
        databaseUrl: customUrl,
        nodeEnv: 'development',
        port: 5000,
        jwtSecret: 'secret',
        jwtRefreshSecret: 'refreshsecret',
        accessTokenExpiry: 900,
        refreshTokenExpiry: 604800,
      },
    }));

    jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { initializeDatabase } = loadModels();
    await initializeDatabase();

    const allErrorMessages = errorSpy.mock.calls.map((args) => String(args[0])).join(' ');
    expect(allErrorMessages).toContain('my-db-host.internal');
    expect(allErrorMessages).toContain('5433');
  });
});
