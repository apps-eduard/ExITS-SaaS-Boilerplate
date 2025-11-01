/**
 * Knex Database Instance
 * Provides knex query builder for the application
 */

const knex = require('knex');
const knexConfig = require('../../knexfile');

// Get environment (default to development)
const environment = process.env.NODE_ENV || 'development';

// Create knex instance with the appropriate configuration
const db = knex(knexConfig[environment]);

module.exports = db;
