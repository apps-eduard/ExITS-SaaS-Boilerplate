const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const rbacMiddleware = require('../../../middleware/rbac');

/**
 * @route GET /api/money-loan/loans/overview
 * @desc Get loan overview statistics
 * @access Private
 */
router.get('/loans/overview', authMiddleware, rbacMiddleware(['money-loan'], ['overview:view']), async (req, res) => {
  try {
    const { tenantId } = req.user;

    // Mock data for now - replace with actual database queries
    const overview = {
      totalLoans: 0,
      activeLoans: 0,
      pendingLoans: 0,
      totalDisbursed: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      overdueLoans: 0,
      overdueAmount: 0,
      collectionRate: 0,
      recentLoans: []
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error fetching loan overview:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch loan overview' 
    });
  }
});

/**
 * @route GET /api/money-loan/customers
 * @desc Get customers list
 * @access Private
 */
router.get('/customers', authMiddleware, rbacMiddleware(['money-loan'], ['customers:read']), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { page = 1, limit = 10, search = '' } = req.query;

    // Mock data for now - replace with actual database queries
    const mockCustomers = [
      {
        id: 1,
        customerCode: 'CUS-001',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        status: 'active',
        kycStatus: 'verified',
        creditScore: 750,
        activeLoans: 1,
        monthlyIncome: 5000,
        riskLevel: 'low',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-10-20')
      },
      {
        id: 2,
        customerCode: 'CUS-002',
        firstName: 'Jane',
        lastName: 'Smith',
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        status: 'active',
        kycStatus: 'pending',
        creditScore: 680,
        activeLoans: 1,
        monthlyIncome: 4500,
        riskLevel: 'medium',
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-10-15')
      },
      {
        id: 3,
        customerCode: 'CUS-003',
        firstName: 'Michael',
        lastName: 'Johnson',
        fullName: 'Michael Johnson',
        email: 'michael.j@example.com',
        phone: '+1234567892',
        status: 'active',
        kycStatus: 'verified',
        creditScore: 720,
        activeLoans: 0,
        monthlyIncome: 6000,
        riskLevel: 'low',
        createdAt: new Date('2023-11-20'),
        updatedAt: new Date('2024-09-30')
      },
      {
        id: 4,
        customerCode: 'CUS-004',
        firstName: 'Sarah',
        lastName: 'Williams',
        fullName: 'Sarah Williams',
        email: 'sarah.w@example.com',
        phone: '+1234567893',
        status: 'suspended',
        kycStatus: 'rejected',
        creditScore: 580,
        activeLoans: 0,
        monthlyIncome: 3000,
        riskLevel: 'high',
        createdAt: new Date('2024-08-05'),
        updatedAt: new Date('2024-08-10')
      },
      {
        id: 5,
        customerCode: 'CUS-005',
        firstName: 'Robert',
        lastName: 'Brown',
        fullName: 'Robert Brown',
        email: 'robert.b@example.com',
        phone: '+1234567894',
        status: 'active',
        kycStatus: 'verified',
        creditScore: 800,
        activeLoans: 2,
        monthlyIncome: 8000,
        riskLevel: 'low',
        createdAt: new Date('2023-06-15'),
        updatedAt: new Date('2024-10-25')
      }
    ];

    // Filter by search if provided
    let filteredCustomers = mockCustomers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCustomers = mockCustomers.filter(c => 
        c.firstName.toLowerCase().includes(searchLower) ||
        c.lastName.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.customerCode.toLowerCase().includes(searchLower)
      );
    }

    const customers = {
      data: filteredCustomers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredCustomers.length,
        pages: Math.ceil(filteredCustomers.length / parseInt(limit))
      }
    };

    res.json({
      success: true,
      message: 'Customers fetched successfully',
      ...customers
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch customers' 
    });
  }
});

/**
 * @route GET /api/money-loan/loans
 * @desc Get loans list
 * @access Private
 */
router.get('/loans', authMiddleware, rbacMiddleware(['money-loan'], ['loans:read']), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { page = 1, limit = 10, status = '', search = '' } = req.query;

    // Mock data for now - replace with actual database queries
    const loans = {
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    };

    res.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

/**
 * @route GET /api/money-loan/payments
 * @desc Get payments list
 * @access Private
 */
router.get('/payments', authMiddleware, rbacMiddleware(['money-loan'], ['payments:read']), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { page = 1, limit = 10 } = req.query;

    // Mock data for now - replace with actual database queries
    const payments = {
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    };

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

/**
 * @route GET /api/money-loan/collections
 * @desc Get collections list
 * @access Private
 */
router.get('/collections', authMiddleware, rbacMiddleware(['money-loan'], ['collections:read']), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { page = 1, limit = 10 } = req.query;

    // Mock data for now - replace with actual database queries
    const collections = {
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    };

    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

/**
 * @route GET /api/money-loan/reports
 * @desc Get reports data
 * @access Private
 */
router.get('/reports', authMiddleware, rbacMiddleware(['money-loan'], ['reports:read']), async (req, res) => {
  try {
    const { tenantId } = req.user;

    // Mock data for now - replace with actual database queries
    const reports = {
      summary: {},
      charts: []
    };

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

module.exports = router;
