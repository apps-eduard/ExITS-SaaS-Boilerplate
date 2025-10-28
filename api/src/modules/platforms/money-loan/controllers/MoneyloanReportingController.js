/**
 * Money Loan - Reporting Controller
 * Handles HTTP requests for reports and analytics
 */

const moneyloanReportingService = require('../services/MoneyloanReportingService');
const logger = require('../../../../utils/logger');

class MoneyloanReportingController {
  /**
   * GET: Portfolio summary report
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/reports/portfolio
   */
  async getPortfolioSummary(req, res) {
    try {
      const { tenantId } = req.params;
      const { startDate, endDate } = req.query;

      const dateRange = startDate && endDate ? { startDate, endDate } : null;

      const report = await moneyloanReportingService.getPortfolioSummary(tenantId, dateRange);

      return res.status(200).json({
        success: true,
        message: 'Portfolio summary generated successfully',
        data: report,
      });
    } catch (error) {
      logger.error('❌ Error generating portfolio summary:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate portfolio summary',
        error: error.message,
      });
    }
  }

  /**
   * GET: Performance report
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/reports/performance
   */
  async getPerformanceReport(req, res) {
    try {
      const { tenantId } = req.params;
      const { period } = req.query; // daily, monthly, quarterly, yearly

      const report = await moneyloanReportingService.getPerformanceReport(tenantId, period || 'monthly');

      return res.status(200).json({
        success: true,
        message: 'Performance report generated successfully',
        data: report,
      });
    } catch (error) {
      logger.error('❌ Error generating performance report:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate performance report',
        error: error.message,
      });
    }
  }

  /**
   * GET: Collections report
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/reports/collections
   */
  async getCollectionsReport(req, res) {
    try {
      const { tenantId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
      }

      const report = await moneyloanReportingService.getCollectionsReport(tenantId, startDate, endDate);

      return res.status(200).json({
        success: true,
        message: 'Collections report generated successfully',
        data: report,
      });
    } catch (error) {
      logger.error('❌ Error generating collections report:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate collections report',
        error: error.message,
      });
    }
  }

  /**
   * GET: Arrears (overdue) report
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/reports/arrears
   */
  async getArrearsReport(req, res) {
    try {
      const { tenantId } = req.params;

      const report = await moneyloanReportingService.getArrearsReport(tenantId);

      return res.status(200).json({
        success: true,
        message: 'Arrears report generated successfully',
        data: report,
      });
    } catch (error) {
      logger.error('❌ Error generating arrears report:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate arrears report',
        error: error.message,
      });
    }
  }

  /**
   * GET: Write-off report
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/reports/write-offs
   */
  async getWriteOffReport(req, res) {
    try {
      const { tenantId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
      }

      const report = await moneyloanReportingService.getWriteOffReport(tenantId, startDate, endDate);

      return res.status(200).json({
        success: true,
        message: 'Write-off report generated successfully',
        data: report,
      });
    } catch (error) {
      logger.error('❌ Error generating write-off report:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate write-off report',
        error: error.message,
      });
    }
  }

  /**
   * GET: Product performance report
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/reports/products
   */
  async getProductPerformanceReport(req, res) {
    try {
      const { tenantId } = req.params;

      const report = await moneyloanReportingService.getProductPerformanceReport(tenantId);

      return res.status(200).json({
        success: true,
        message: 'Product performance report generated successfully',
        data: report,
      });
    } catch (error) {
      logger.error('❌ Error generating product performance report:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate product performance report',
        error: error.message,
      });
    }
  }

  /**
   * GET: Revenue report
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/reports/revenue
   */
  async getRevenueReport(req, res) {
    try {
      const { tenantId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
      }

      const report = await moneyloanReportingService.getRevenueReport(tenantId, startDate, endDate);

      return res.status(200).json({
        success: true,
        message: 'Revenue report generated successfully',
        data: report,
      });
    } catch (error) {
      logger.error('❌ Error generating revenue report:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate revenue report',
        error: error.message,
      });
    }
  }

  /**
   * GET: Aging analysis report
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/reports/aging
   */
  async getAgingAnalysis(req, res) {
    try {
      const { tenantId } = req.params;

      const report = await moneyloanReportingService.getAgingAnalysis(tenantId);

      return res.status(200).json({
        success: true,
        message: 'Aging analysis generated successfully',
        data: report,
      });
    } catch (error) {
      logger.error('❌ Error generating aging analysis:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate aging analysis',
        error: error.message,
      });
    }
  }

  /**
   * POST: Export report to CSV
   * Route: POST /api/tenants/:tenantId/platforms/moneyloan/reports/export
   */
  async exportReport(req, res) {
    try {
      const { tenantId } = req.params;
      const { reportType, data } = req.body;

      if (!reportType || !data) {
        return res.status(400).json({
          success: false,
          message: 'Report type and data are required',
        });
      }

      const csv = await moneyloanReportingService.exportReportToCSV(data);

      // Set CSV headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${reportType}-${Date.now()}.csv`);

      return res.status(200).send(csv);
    } catch (error) {
      logger.error('❌ Error exporting report:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to export report',
        error: error.message,
      });
    }
  }
}

module.exports = new MoneyloanReportingController();
