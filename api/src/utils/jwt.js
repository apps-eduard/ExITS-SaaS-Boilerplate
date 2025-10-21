// src/utils/jwt.js
const jwt = require('jsonwebtoken');
const config = require('../config/env');

class JwtUtil {
  static generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        tenantId: user.tenant_id,
        permissions: user.permissions || [],
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  static generateRefreshToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        tenantId: user.tenant_id,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }
}

module.exports = JwtUtil;
