export interface LoanCustomer {
  id: number;
  tenantId: number;
  customerCode: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  idType?: string;
  idNumber?: string;
  employmentStatus?: string;
  employerName?: string;
  monthlyIncome: number;
  creditScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'suspended' | 'blacklisted';
  kycStatus: 'pending' | 'verified' | 'rejected';
  kycVerifiedAt?: string;
  kycNotes?: string;
  activeLoans?: number; // Number of active loans
  assignedEmployeeId?: number; // ID of assigned employee for collections
  assignedEmployeeName?: string; // Name of assigned employee
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: number;
  tenantId: number;
  loanNumber: string;
  customerId: number;
  loanProductId: number;
  applicationId?: number;
  principalAmount: number;
  interestRate: number;
  interestType: 'flat' | 'reducing' | 'compound';
  termDays: number;
  processingFee: number;
  totalInterest: number;
  totalAmount: number;
  monthlyPayment: number;
  disbursementDate?: string;
  firstPaymentDate?: string;
  maturityDate?: string;
  amountPaid: number;
  outstandingBalance: number;
  penaltyAmount: number;
  status: 'pending' | 'disbursed' | 'active' | 'overdue' | 'defaulted' | 'paid_off' | 'cancelled';
  daysOverdue: number;
  approvedBy?: number;
  disbursedBy?: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  customer?: {
    customerCode: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    fullName: string;
    email?: string;
    phone: string;
  };
  product?: {
    name: string;
    productCode: string;
  };
  productName?: string;
}

export interface RepaymentSchedule {
  id: number;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  amountPaid: number;
  outstandingAmount: number;
  penaltyAmount: number;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  paidDate?: string;
  daysOverdue: number;
}

export interface LoanPayment {
  id: number;
  tenantId: number;
  paymentReference: string;
  loanId: number;
  customerId: number;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  penaltyAmount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'online' | 'mobile_money' | 'other';
  transactionId?: string;
  paymentDate: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  receivedBy?: number;
  notes?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface LoanOverview {
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  defaultedLoans: number;
  paidOffLoans: number;
  totalOutstanding: number;
  totalCollected: number;
  totalPenalties: number;
  collectionRate: number;
  defaultRate: number;
  overduePercent: number;
}

export interface CustomerStats {
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  paidOffLoans: number;
  totalOutstanding: number;
  totalPaid: number;
}

export interface TodayCollections {
  date: string;
  totalPayments: number;
  totalAmount: number;
  principalCollected: number;
  interestCollected: number;
  penaltyCollected: number;
}
