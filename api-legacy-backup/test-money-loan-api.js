/**
 * Test Money Loan API Endpoints
 * Run: node api/test-money-loan-api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/money-loan';
const TENANT_ID = 2; // ACME Corporation

// You'll need to get a real token by logging in first
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE';

const headers = {
  'tenant-id': TENANT_ID,
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testEndpoints() {
  console.log('🧪 Testing Money Loan API Endpoints\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Tenant ID: ${TENANT_ID}\n`);

  try {
    // Test 1: Get all customers
    console.log('1️⃣ GET /customers - Fetch all loan customers');
    const customersResponse = await axios.get(`${BASE_URL}/customers`, { headers });
    console.log(`✅ Success! Found ${customersResponse.data.length} customers`);
    if (customersResponse.data.length > 0) {
      console.log(`   First customer: ${customersResponse.data[0].firstName} ${customersResponse.data[0].lastName}`);
      console.log(`   Status: ${customersResponse.data[0].status}, KYC: ${customersResponse.data[0].kycStatus}`);
    }
    console.log('');

    // Test 2: Get single customer
    if (customersResponse.data.length > 0) {
      const customerId = customersResponse.data[0].id;
      console.log(`2️⃣ GET /customers/${customerId} - Fetch single customer`);
      const customerResponse = await axios.get(`${BASE_URL}/customers/${customerId}`, { headers });
      console.log(`✅ Success! Customer: ${customerResponse.data.firstName} ${customerResponse.data.lastName}`);
      console.log(`   Email: ${customerResponse.data.email}`);
      console.log(`   Phone: ${customerResponse.data.phone}`);
      console.log(`   Credit Score: ${customerResponse.data.creditScore}`);
      console.log('');
    }

    // Test 3: Get all loans
    console.log('3️⃣ GET /loans - Fetch all loans');
    const loansResponse = await axios.get(`${BASE_URL}/loans`, { headers });
    console.log(`✅ Success! Found ${loansResponse.data.length} loans`);
    if (loansResponse.data.length > 0) {
      const loan = loansResponse.data[0];
      console.log(`   Loan #${loan.loanNumber}: ₱${parseFloat(loan.principalAmount).toLocaleString()}`);
      console.log(`   Status: ${loan.status}, Outstanding: ₱${parseFloat(loan.outstandingBalance).toLocaleString()}`);
    }
    console.log('');

    // Test 4: Get single loan with details
    if (loansResponse.data.length > 0) {
      const loanId = loansResponse.data[0].id;
      console.log(`4️⃣ GET /loans/${loanId} - Fetch single loan`);
      const loanResponse = await axios.get(`${BASE_URL}/loans/${loanId}`, { headers });
      console.log(`✅ Success! Loan details:`);
      console.log(`   Principal: ₱${parseFloat(loanResponse.data.principalAmount).toLocaleString()}`);
      console.log(`   Interest Rate: ${loanResponse.data.interestRate}%`);
      console.log(`   Term: ${loanResponse.data.termDays} days`);
      console.log(`   Total Amount: ₱${parseFloat(loanResponse.data.totalAmount).toLocaleString()}`);
      console.log('');

      // Test 5: Get repayment schedule
      console.log(`5️⃣ GET /loans/${loanId}/schedule - Fetch repayment schedule`);
      const scheduleResponse = await axios.get(`${BASE_URL}/loans/${loanId}/schedule`, { headers });
      console.log(`✅ Success! Found ${scheduleResponse.data.length} installments`);
      const paidCount = scheduleResponse.data.filter(s => s.status === 'paid').length;
      const pendingCount = scheduleResponse.data.filter(s => s.status === 'pending').length;
      console.log(`   Paid: ${paidCount}, Pending: ${pendingCount}`);
      if (scheduleResponse.data.length > 0) {
        const nextDue = scheduleResponse.data.find(s => s.status === 'pending');
        if (nextDue) {
          console.log(`   Next due: Installment #${nextDue.installmentNumber} - ₱${parseFloat(nextDue.totalAmount).toLocaleString()} on ${nextDue.dueDate}`);
        }
      }
      console.log('');

      // Test 6: Get payments for loan
      console.log(`6️⃣ GET /payments/loan/${loanId} - Fetch loan payments`);
      const paymentsResponse = await axios.get(`${BASE_URL}/payments/loan/${loanId}`, { headers });
      console.log(`✅ Success! Found ${paymentsResponse.data.length} payments`);
      if (paymentsResponse.data.length > 0) {
        paymentsResponse.data.forEach((payment, index) => {
          console.log(`   Payment ${index + 1}: ₱${parseFloat(payment.amount).toLocaleString()} via ${payment.paymentMethod} on ${payment.paymentDate}`);
        });
      }
      console.log('');
    }

    // Test 7: Create a new payment (COMMENTED OUT - Uncomment to test)
    /*
    console.log('7️⃣ POST /payments - Create new payment');
    const newPayment = {
      loanId: loansResponse.data[0].id,
      customerId: loansResponse.data[0].customerId,
      amount: 4591.67,
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: 'Test payment via API'
    };
    const paymentResponse = await axios.post(`${BASE_URL}/payments`, newPayment, { headers });
    console.log(`✅ Success! Payment created: ${paymentResponse.data.paymentReference}`);
    console.log('');
    */

    console.log('\n✅ All tests passed!\n');
    console.log('📊 Summary:');
    console.log(`   Customers: ${customersResponse.data.length}`);
    console.log(`   Loans: ${loansResponse.data.length}`);
    console.log(`   All endpoints working correctly!`);

  } catch (error) {
    console.error('\n❌ Test failed!');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${error.response.data.error || error.response.data.message}`);
      console.error('Response:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Make sure the API server is running on http://localhost:3000');
    } else {
      console.error('Error:', error.message);
    }
    
    console.error('\n💡 Common issues:');
    console.error('   1. API server not running → Run: cd api && npm run dev');
    console.error('   2. Invalid AUTH_TOKEN → Login first to get a valid token');
    console.error('   3. Wrong TENANT_ID → Make sure tenant ID 2 exists');
    console.error('   4. Database not seeded → Run: npx knex seed:run --specific=05_money_loan_seed.js');
  }
}

// Instructions
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║          Money Loan API Endpoint Testing Script             ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

if (AUTH_TOKEN === 'YOUR_AUTH_TOKEN_HERE') {
  console.log('⚠️  AUTH_TOKEN not set!\n');
  console.log('📝 Steps to get your auth token:');
  console.log('   1. Start the API: cd api && npm run dev');
  console.log('   2. Login via Postman/Browser:');
  console.log('      POST http://localhost:3000/api/auth/login');
  console.log('      Body: { "email": "admin@exitsaas.com", "password": "Admin@123" }');
  console.log('   3. Copy the "token" from response');
  console.log('   4. Edit this file and replace AUTH_TOKEN with your token');
  console.log('   5. Run: node api/test-money-loan-api.js\n');
  process.exit(1);
}

testEndpoints();
