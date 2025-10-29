/**
 * Test Customer Money Loan APIs
 * Quick test script to validate the customer loan endpoints
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
let authToken = '';
let testCustomerId = '';
let testLoanId = '';

// Test credentials (adjust based on your seed data)
const testCredentials = {
  email: 'maria.santos@test.com', // Sample customer from seed data
  password: 'Admin@123'
};

// Helper function for API calls
async function apiCall(method, endpoint, data = null, useAuth = false) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {}
    };

    if (useAuth && authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

// Test 1: Customer Login
async function testLogin() {
  console.log('\n📝 Test 1: Customer Login');
  console.log('=======================');
  
  const result = await apiCall('POST', '/customer/auth/login', testCredentials);
  
  if (result.success && result.data.data?.token) {
    authToken = result.data.data.token;
    testCustomerId = result.data.data.customer.id;
    console.log('✅ Login successful');
    console.log(`   Customer ID: ${testCustomerId}`);
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    return true;
  } else {
    console.log('❌ Login failed:', result.error);
    return false;
  }
}

// Test 2: Get Dashboard Stats
async function testDashboardStats() {
  console.log('\n📊 Test 2: Dashboard Stats');
  console.log('==========================');
  
  const result = await apiCall('GET', '/customer/money-loan/dashboard', null, true);
  
  if (result.success) {
    console.log('✅ Dashboard stats retrieved');
    console.log('   Active Loans:', result.data.data.activeLoans);
    console.log('   Total Outstanding:', result.data.data.totalOutstanding);
    console.log('   Pending Applications:', result.data.data.pendingApplications);
    return true;
  } else {
    console.log('❌ Failed:', result.error);
    return false;
  }
}

// Test 3: Get My Applications
async function testGetApplications() {
  console.log('\n📋 Test 3: Get My Applications');
  console.log('==============================');
  
  const result = await apiCall('GET', '/customer/money-loan/applications', null, true);
  
  if (result.success) {
    console.log('✅ Applications retrieved');
    console.log('   Total:', result.data.data.pagination.total);
    console.log('   Applications:', result.data.data.applications.length);
    return true;
  } else {
    console.log('❌ Failed:', result.error);
    return false;
  }
}

// Test 4: Submit Loan Application
async function testSubmitApplication() {
  console.log('\n📝 Test 4: Submit Loan Application');
  console.log('==================================');
  
  const applicationData = {
    loanAmount: 50000,
    loanTermMonths: 12,
    purpose: 'Business capital',
    monthlyIncome: 25000,
    collateralType: 'vehicle',
    collateralDescription: 'Honda Civic 2018'
  };
  
  const result = await apiCall('POST', '/customer/money-loan/applications', applicationData, true);
  
  if (result.success) {
    console.log('✅ Application submitted');
    console.log('   Application ID:', result.data.data.application.id);
    console.log('   Amount:', result.data.data.application.requestedAmount);
    console.log('   Status:', result.data.data.application.status);
    return true;
  } else {
    console.log('❌ Failed:', result.error);
    return false;
  }
}

// Test 5: Get My Loans
async function testGetLoans() {
  console.log('\n💰 Test 5: Get My Loans');
  console.log('=======================');
  
  const result = await apiCall('GET', '/customer/money-loan/loans', null, true);
  
  if (result.success) {
    console.log('✅ Loans retrieved');
    console.log('   Total:', result.data.data.pagination.total);
    console.log('   Loans:', result.data.data.loans.length);
    
    if (result.data.data.loans.length > 0) {
      testLoanId = result.data.data.loans[0].id;
      console.log('   First Loan ID:', testLoanId);
      console.log('   Loan Number:', result.data.data.loans[0].loanNumber);
      console.log('   Remaining Balance:', result.data.data.loans[0].remainingBalance);
    }
    return true;
  } else {
    console.log('❌ Failed:', result.error);
    return false;
  }
}

// Test 6: Get Loan Details
async function testGetLoanDetails() {
  console.log('\n📖 Test 6: Get Loan Details');
  console.log('===========================');
  
  if (!testLoanId) {
    console.log('⏭️  Skipped: No active loans found');
    return true;
  }
  
  const result = await apiCall('GET', `/customer/money-loan/loans/${testLoanId}`, null, true);
  
  if (result.success) {
    console.log('✅ Loan details retrieved');
    console.log('   Loan Number:', result.data.data.loan.loanNumber);
    console.log('   Total Amount:', result.data.data.loan.totalAmount);
    console.log('   Remaining Balance:', result.data.data.loan.remainingBalance);
    console.log('   Payment Schedules:', result.data.data.schedules?.length || 0);
    console.log('   Payment History:', result.data.data.payments?.length || 0);
    return true;
  } else {
    console.log('❌ Failed:', result.error);
    return false;
  }
}

// Test 7: Get Payment Schedules
async function testGetPaymentSchedules() {
  console.log('\n📅 Test 7: Get Payment Schedules');
  console.log('================================');
  
  if (!testLoanId) {
    console.log('⏭️  Skipped: No active loans found');
    return true;
  }
  
  const result = await apiCall('GET', `/customer/money-loan/loans/${testLoanId}/schedules`, null, true);
  
  if (result.success) {
    console.log('✅ Payment schedules retrieved');
    console.log('   Total Schedules:', result.data.data.schedules.length);
    
    if (result.data.data.schedules.length > 0) {
      const nextSchedule = result.data.data.schedules.find(s => s.status === 'pending');
      if (nextSchedule) {
        console.log('   Next Payment Due:', nextSchedule.dueDate);
        console.log('   Amount Due:', nextSchedule.amount);
      }
    }
    return true;
  } else {
    console.log('❌ Failed:', result.error);
    return false;
  }
}

// Test 8: Get Payment History
async function testGetPaymentHistory() {
  console.log('\n💳 Test 8: Get Payment History');
  console.log('==============================');
  
  if (!testLoanId) {
    console.log('⏭️  Skipped: No active loans found');
    return true;
  }
  
  const result = await apiCall('GET', `/customer/money-loan/loans/${testLoanId}/payments`, null, true);
  
  if (result.success) {
    console.log('✅ Payment history retrieved');
    console.log('   Total Payments Made:', result.data.data.payments.length);
    console.log('   Total Amount Paid:', result.data.data.summary.totalPaid);
    return true;
  } else {
    console.log('❌ Failed:', result.error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  Customer Money Loan API Test Suite   ║');
  console.log('╚════════════════════════════════════════╝');
  
  const tests = [
    testLogin,
    testDashboardStats,
    testGetApplications,
    testSubmitApplication,
    testGetLoans,
    testGetLoanDetails,
    testGetPaymentSchedules,
    testGetPaymentHistory
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await test();
    if (result) passed++;
    else failed++;
  }
  
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║          Test Summary                  ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);
  console.log('');
}

// Run the tests
runAllTests().catch(console.error);
