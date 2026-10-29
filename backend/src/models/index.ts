import {
  Sequelize,
  DataTypes,
  Model,
  InferCreationAttributes,
  InferAttributes,
  CreationOptional,
} from 'sequelize';
import { appConfig } from '../config';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RevokedTokenAttributes {
  id: number;
  tokenHash: string;
  revokedAt: Date;
  expiresAt: Date;
}

// ─── Sequelize Models ───────────────────────────────────────────────────────

export class User extends Model<UserAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare password: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export class RevokedToken
  extends Model<InferAttributes<RevokedToken>, InferCreationAttributes<RevokedToken>>
  implements RevokedTokenAttributes
{
  declare id: CreationOptional<number>;
  declare tokenHash: string;
  declare revokedAt: CreationOptional<Date>;
  declare expiresAt: Date;
}

// ─── Sequelize Instance ─────────────────────────────────────────────────────

export const sequelize = new Sequelize(appConfig.databaseUrl, {
  dialect: 'postgres',
  logging: false, // Set to console.log to see SQL queries in development
});

// ─── Model Initialization ───────────────────────────────────────────────────

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
  },
);

RevokedToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tokenHash: {
      type: DataTypes.STRING(512),
      allowNull: false,
      unique: true,
      field: 'token_hash',
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'revoked_at',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
  },
  {
    sequelize,
    tableName: 'revoked_tokens',
    timestamps: false,
    underscored: true,
  },
);

// ─── Database Initialization Function ───────────────────────────────────────

/**
 * Initializes the database connection by calling sequelize.authenticate().
 * Logs success or logs error with host:port and exits process on failure.
 *
 * Requirements: 4.7, 4.8
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');
  } catch (error) {
    // Extract host and port from the connection string for error logging
    const match = appConfig.databaseUrl.match(/@([^:/]+):?(\d+)?/);
    const host = match?.[1] ?? 'unknown';
    const port = match?.[2] ?? '5432';

    console.error(`[Database] Failed to connect to database at ${host}:${port}`, error);
    process.exit(1);
  }
}
