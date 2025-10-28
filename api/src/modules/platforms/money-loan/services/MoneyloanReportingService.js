/**
 * Money Loan - Reporting Service
 * Generates reports, analytics, and dashboards for Money Loan platform
 */

const knex = require('../../../../config/database');
const logger = require('../../../../utils/logger');

class MoneyloanReportingService {
  /**
   * Generate portfolio summary report
   */
  async getPortfolioSummary(tenantId, dateRange = null) {
    try {
      let query = knex('loans').where({ tenant_id: tenantId });

      if (dateRange) {
        if (dateRange.startDate) {
          query = query.where('created_at', '>=', dateRange.startDate);
        }
        if (dateRange.endDate) {
          query = query.where('created_at', '<=', dateRange.endDate);
        }
      }

      const loans = await query;

      const summary = {
        totalLoans: loans.length,
        totalDisbursed: loans.reduce((sum, l) => sum + (l.disbursed_amount || 0), 0),
        totalOutstanding: 0, // Will be calculated from payments
        activeLoans: loans.filter((l) => l.status === 'active').length,
        closedLoans: loans.filter((l) => l.status === 'closed').length,
        defaultedLoans: loans.filter((l) => l.status === 'defaulted').length,
        approvalRate: loans.length > 0 ? (loans.filter((l) => l.status !== 'rejected').length / loans.length) * 100 : 0,
      };

      return {
        reportType: 'Portfolio Summary',
        generatedAt: new Date(),
        ...summary,
      };
    } catch (error) {
      logger.error('❌ Error generating portfolio summary:', error);
      throw error;
    }
  }

  /**
   * Generate performance report
   */
  async getPerformanceReport(tenantId, period = 'monthly') {
    try {
      let dateGrouping;

      switch (period) {
        case 'daily':
          dateGrouping = 'DATE(created_at)';
          break;
        case 'monthly':
          dateGrouping = "DATE_TRUNC('month', created_at)";
          break;
        case 'quarterly':
          dateGrouping = "DATE_TRUNC('quarter', created_at)";
          break;
        case 'yearly':
          dateGrouping = "DATE_TRUNC('year', created_at)";
          break;
        default:
          dateGrouping = "DATE_TRUNC('month', created_at)";
      }

      const performanceData = await knex('loans')
        .where({ tenant_id: tenantId })
        .select(
          knex.raw(`${dateGrouping} as period`),
          knex.raw('COUNT(*) as total_loans'),
          knex.raw('SUM(loan_amount) as total_amount'),
          knex.raw("COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans"),
          knex.raw("COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_loans"),
          knex.raw("COUNT(CASE WHEN status = 'defaulted' THEN 1 END) as defaulted_loans")
        )
        .groupBy(knex.raw(dateGrouping))
        .orderBy(knex.raw(dateGrouping), 'asc');

      return {
        reportType: 'Performance Report',
        period,
        generatedAt: new Date(),
        data: performanceData,
      };
    } catch (error) {
      logger.error('❌ Error generating performance report:', error);
      throw error;
    }
  }

  /**
   * Generate collections report
   */
  async getCollectionsReport(tenantId, startDate, endDate) {
    try {
      const payments = await knex('loan_payments')
        .where({ tenant_id: tenantId })
        .whereBetween('payment_date', [startDate, endDate]);

      const collections = {
        periodStart: startDate,
        periodEnd: endDate,
        totalPayments: payments.length,
        totalCollected: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        averagePayment: payments.length > 0 ? payments.reduce((sum, p) => sum + (p.amount || 0), 0) / payments.length : 0,
      };

      // Group by payment method
      const byMethod = {};
      payments.forEach((p) => {
        if (!byMethod[p.payment_method]) {
          byMethod[p.payment_method] = { count: 0, total: 0 };
        }
        byMethod[p.payment_method].count += 1;
        byMethod[p.payment_method].total += p.amount || 0;
      });

      return {
        reportType: 'Collections Report',
        generatedAt: new Date(),
        summary: collections,
        paymentMethods: byMethod,
      };
    } catch (error) {
      logger.error('❌ Error generating collections report:', error);
      throw error;
    }
  }

  /**
   * Generate arrears report
   */
  async getArrearsReport(tenantId) {
    try {
      const today = new Date();

      // Get overdue repayment schedules
      const overdueSchedules = await knex('repayment_schedules')
        .where({ tenant_id: tenantId, status: 'overdue' })
        .select('*');

      const arrearsData = {
        totalOverdueLoans: 0,
        totalOverdueAmount: 0,
        overdue30Days: 0,
        overdue60Days: 0,
        overdue90Days: 0,
        overdue180Days: 0,
        overdueSchedules: [],
      };

      for (const schedule of overdueSchedules) {
        const daysOverdue = Math.floor((today - new Date(schedule.scheduled_date)) / (1000 * 60 * 60 * 24));

        arrearsData.totalOverdueAmount += schedule.total_due || 0;

        if (daysOverdue <= 30) {
          arrearsData.overdue30Days += 1;
        } else if (daysOverdue <= 60) {
          arrearsData.overdue60Days += 1;
        } else if (daysOverdue <= 90) {
          arrearsData.overdue90Days += 1;
        } else if (daysOverdue <= 180) {
          arrearsData.overdue180Days += 1;
        }

        arrearsData.overdueSchedules.push({
          scheduleId: schedule.id,
          loanId: schedule.loan_id,
          daysOverdue,
          amountDue: schedule.total_due,
        });
      }

      arrearsData.totalOverdueLoans = arrearsData.overdueSchedules.length;

      return {
        reportType: 'Arrears Report',
        generatedAt: new Date(),
        asOf: today,
        data: arrearsData,
      };
    } catch (error) {
      logger.error('❌ Error generating arrears report:', error);
      throw error;
    }
  }

  /**
   * Generate write-off report
   */
  async getWriteOffReport(tenantId, startDate, endDate) {
    try {
      const writeOffs = await knex('loans')
        .where({ tenant_id: tenantId })
        .where('closure_type', 'written_off')
        .whereBetween('closure_date', [startDate, endDate]);

      return {
        reportType: 'Write-off Report',
        generatedAt: new Date(),
        periodStart: startDate,
        periodEnd: endDate,
        totalWriteOffs: writeOffs.length,
        totalAmountWrittenOff: writeOffs.reduce((sum, l) => sum + (l.loan_amount || 0), 0),
        averageWriteOffAmount: writeOffs.length > 0 ? writeOffs.reduce((sum, l) => sum + (l.loan_amount || 0), 0) / writeOffs.length : 0,
        writeOffs: writeOffs.map((l) => ({
          loanId: l.id,
          amount: l.loan_amount,
          closureDate: l.closure_date,
          closureReason: l.closure_reason,
        })),
      };
    } catch (error) {
      logger.error('❌ Error generating write-off report:', error);
      throw error;
    }
  }

  /**
   * Generate product performance report
   */
  async getProductPerformanceReport(tenantId) {
    try {
      const products = await knex('loan_products')
        .where({ tenant_id: tenantId })
        .select('*');

      const productReports = [];

      for (const product of products) {
        const loans = await knex('loans')
          .where({ tenant_id: tenantId, loan_product_id: product.id });

        const activeLoans = loans.filter((l) => l.status === 'active');
        const closedLoans = loans.filter((l) => l.status === 'closed');
        const defaultedLoans = loans.filter((l) => l.status === 'defaulted');

        productReports.push({
          productId: product.id,
          productName: product.product_name,
          totalLoans: loans.length,
          activeLoans: activeLoans.length,
          closedLoans: closedLoans.length,
          defaultedLoans: defaultedLoans.length,
          totalDisbursed: loans.reduce((sum, l) => sum + (l.disbursed_amount || 0), 0),
          defaultRate: loans.length > 0 ? (defaultedLoans.length / loans.length) * 100 : 0,
        });
      }

      return {
        reportType: 'Product Performance Report',
        generatedAt: new Date(),
        products: productReports,
      };
    } catch (error) {
      logger.error('❌ Error generating product performance report:', error);
      throw error;
    }
  }

  /**
   * Generate revenue report
   */
  async getRevenueReport(tenantId, startDate, endDate) {
    try {
      const loans = await knex('loans')
        .where({ tenant_id: tenantId })
        .whereBetween('created_at', [startDate, endDate]);

      const totalInterest = loans.reduce((sum, l) => sum + (l.total_interest || 0), 0);
      const totalFees = loans.reduce((sum, l) => sum + (l.total_fees || 0), 0);
      const totalRevenue = totalInterest + totalFees;

      return {
        reportType: 'Revenue Report',
        generatedAt: new Date(),
        periodStart: startDate,
        periodEnd: endDate,
        totalLoansOriginated: loans.length,
        totalInterestIncome: Math.round(totalInterest * 100) / 100,
        totalFeeIncome: Math.round(totalFees * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageInterestPerLoan: loans.length > 0 ? Math.round((totalInterest / loans.length) * 100) / 100 : 0,
      };
    } catch (error) {
      logger.error('❌ Error generating revenue report:', error);
      throw error;
    }
  }

  /**
   * Export report to CSV format
   */
  async exportReportToCSV(reportData) {
    try {
      // Basic CSV conversion
      const headers = Object.keys(reportData);
      const csvContent = [
        headers.join(','),
        Object.values(reportData).join(','),
      ].join('\n');

      return csvContent;
    } catch (error) {
      logger.error('❌ Error exporting report to CSV:', error);
      throw error;
    }
  }

  /**
   * Get aging analysis of loans
   */
  async getAgingAnalysis(tenantId) {
    try {
      const loans = await knex('loans')
        .where({ tenant_id: tenantId })
        .whereIn('status', ['active', 'suspended']);

      const today = new Date();
      const aging = {
        lessThan30Days: [],
        days30to60: [],
        days60to90: [],
        days90to180: [],
        moreThan180Days: [],
      };

      for (const loan of loans) {
        const ageInDays = Math.floor((today - new Date(loan.disbursed_date)) / (1000 * 60 * 60 * 24));

        if (ageInDays < 30) {
          aging.lessThan30Days.push(loan);
        } else if (ageInDays < 60) {
          aging.days30to60.push(loan);
        } else if (ageInDays < 90) {
          aging.days60to90.push(loan);
        } else if (ageInDays < 180) {
          aging.days90to180.push(loan);
        } else {
          aging.moreThan180Days.push(loan);
        }
      }

      return {
        reportType: 'Aging Analysis',
        generatedAt: new Date(),
        buckets: {
          lessThan30Days: aging.lessThan30Days.length,
          days30to60: aging.days30to60.length,
          days60to90: aging.days60to90.length,
          days90to180: aging.days90to180.length,
          moreThan180Days: aging.moreThan180Days.length,
        },
        totalActiveLoans: loans.length,
      };
    } catch (error) {
      logger.error('❌ Error generating aging analysis:', error);
      throw error;
    }
  }
}

module.exports = new MoneyloanReportingService();
