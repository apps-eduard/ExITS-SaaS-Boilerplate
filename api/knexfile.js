require('dotenv').config();

// Helper functions for case conversion
const toCamelCase = (str) => {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
};

const toSnakeCase = (str) => {
  return str.replace(/([A-Z])/g, (group) => `_${group.toLowerCase()}`);
};

// Recursively convert object keys to camelCase
const keysToCamel = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(v => keysToCamel(v));
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      result[toCamelCase(key)] = keysToCamel(obj[key]);
      return result;
    }, {});
  }
  return obj;
};

// Configuration shared between development and production
const sharedConfig = {
  // Convert column names from snake_case to camelCase when reading from DB
  postProcessResponse: (result) => {
    return keysToCamel(result);
  },
  
  // Convert identifiers from camelCase to snake_case when writing to DB
  // BUT: Only convert column names, NOT table names
  wrapIdentifier: (value, origImpl, queryContext) => {
    // Don't convert '*' or values that are already snake_case (likely table names)
    if (value === '*' || value.includes('_')) {
      return origImpl(value);
    }
    // Convert camelCase to snake_case for column names
    return origImpl(toSnakeCase(value));
  }
};

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'exits_saas'
    },
    migrations: {
      directory: './src/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/seeds'
    },
    ...sharedConfig
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    migrations: {
      directory: './src/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/seeds'
    },
    ...sharedConfig
  }
};