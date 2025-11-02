import { config } from 'dotenv';
import { Knex } from 'knex';

config();

// Helper functions for case conversion
const toCamelCase = (str: string): string => {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', ''),
  );
};

const toSnakeCase = (str: string): string => {
  return str
    .replace(/([A-Z])/g, (group) => `_${group.toLowerCase()}`)
    .replace(/^_/, ''); // Remove leading underscore if any
};

// Recursively convert object keys to camelCase
const keysToCamel = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamel(v));
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
    return Object.keys(obj).reduce((result: any, key) => {
      // Only convert keys that have underscores (actual DB columns)
      // Leave camelCase aliases as-is
      const newKey = key.includes('_') ? toCamelCase(key) : key;
      result[newKey] = keysToCamel(obj[key]);
      return result;
    }, {});
  }
  return obj;
};

// Configuration shared between development and production
const sharedConfig: Partial<Knex.Config> = {
  // Convert column names from snake_case to camelCase when reading from DB
  postProcessResponse: (result) => {
    return keysToCamel(result);
  },

  // Don't modify identifiers - use them as-is (snake_case in DB)
  // The postProcessResponse will handle conversion to camelCase when reading
};

const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_NAME || 'exits_saas_db',
    },
    migrations: {
      directory: './src/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
    ...sharedConfig,
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    migrations: {
      directory: './src/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
    ...sharedConfig,
  },
};

export default knexConfig;
