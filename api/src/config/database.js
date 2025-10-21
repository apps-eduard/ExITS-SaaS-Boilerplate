// src/config/database.js
const { Pool } = require('pg');
const config = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  max: config.database.max,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis,
});

pool.on('error', (err) => {
  logger.error(`Database error: ${err.message}`);
});

pool.on('connect', () => {
  logger.debug('🔌 Database connection opened');
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error(`Database connection failed: ${err.message}`);
  } else {
    logger.success('Database connected successfully');
  }
});

module.exports = pool;
