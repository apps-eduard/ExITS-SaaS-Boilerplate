/**
 * Module Controller
 * Handles module/menu management
 */

const pool = require('../config/database');
const logger = require('../utils/logger');
const { CONSTANTS } = require('../config/constants');

class ModuleController {
  /**
   * GET /modules
   * Get all modules/menu items
   */
  static async listModules(req, res, next) {
    try {
      const { space = null } = req.query;

      let query = `SELECT id, menu_key, display_name, parent_menu_key, icon, space, route_path, component_name, action_keys
                   FROM modules`;
      const params = [];

      if (space) {
        query += ` WHERE space IN ($1, 'both')`;
        params.push(space);
      }

      query += ` ORDER BY parent_menu_key, menu_key`;

      const result = await pool.query(query, params);

      // Build hierarchical structure
      const modules = result.rows.map(row => ({
        ...row,
        action_keys: typeof row.action_keys === 'string' ? JSON.parse(row.action_keys) : row.action_keys,
      }));

      const rootModules = modules.filter(m => !m.parent_menu_key);
      const hierarchical = rootModules.map(root => ({
        ...root,
        children: modules.filter(m => m.parent_menu_key === root.menu_key),
      }));

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Modules retrieved successfully',
        data: hierarchical,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /modules/:menuKey
   * Get module by key
   */
  static async getModule(req, res, next) {
    try {
      const { menuKey } = req.params;

      const result = await pool.query(
        `SELECT id, menu_key, display_name, parent_menu_key, icon, space, route_path, component_name, action_keys
         FROM modules WHERE menu_key = $1`,
        [menuKey]
      );

      if (result.rows.length === 0) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          error: 'Module not found',
        });
      }

      const module = result.rows[0];
      module.action_keys = typeof module.action_keys === 'string' ? JSON.parse(module.action_keys) : module.action_keys;

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Module retrieved successfully',
        data: module,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /modules
   * Create new module
   */
  static async createModule(req, res, next) {
    try {
      const { menu_key, display_name, parent_menu_key, icon, space, route_path, component_name, action_keys } = req.body;

      if (!menu_key || !display_name || !space) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Menu key, display name, and space are required',
        });
      }

      const result = await pool.query(
        `INSERT INTO modules (menu_key, display_name, parent_menu_key, icon, space, route_path, component_name, action_keys)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, menu_key, display_name, space`,
        [
          menu_key,
          display_name,
          parent_menu_key || null,
          icon || null,
          space,
          route_path || null,
          component_name || null,
          action_keys ? JSON.stringify(action_keys) : JSON.stringify(['view']),
        ]
      );

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        message: 'Module created successfully',
        data: result.rows[0],
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /modules/:menuKey/permissions
   * Get all permissions for a module across roles
   */
  static async getModulePermissions(req, res, next) {
    try {
      const { menuKey } = req.params;

      const result = await pool.query(
        `SELECT r.id, r.name, rp.id as permission_id, rp.action_key, rp.status
         FROM modules m
         JOIN role_permissions rp ON m.id = rp.module_id
         JOIN roles r ON rp.role_id = r.id
         WHERE m.menu_key = $1
         ORDER BY r.name, rp.action_key`,
        [menuKey]
      );

      const permissions = result.rows.reduce((acc, row) => {
        if (!acc[row.name]) {
          acc[row.name] = { role_id: row.id, permissions: [] };
        }
        acc[row.name].permissions.push({
          action_key: row.action_key,
          status: row.status,
        });
        return acc;
      }, {});

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Module permissions retrieved successfully',
        data: permissions,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ModuleController;
