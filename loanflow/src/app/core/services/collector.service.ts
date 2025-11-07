import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { LoanCalculationPreview, LoanCalculationRequest } from '../models/loan-calculation.model';

// ==================== INTERFACES ====================

export interface CollectorLimits {
  maxApprovalAmount: number;
  maxApprovalPerDay: number;
  maxDisbursementAmount: number;
  maxDisbursementPerDay: number;
  maxDisbursementPerMonth: number;
  maxPenaltyWaiverAmount: number;
  maxPenaltyWaiverPercent: number;
}

export interface CollectorDailySummary {
  date: string;
  totalCustomers: number;
  activeLoans: number;
  overdueLoans: number;
  totalOutstanding: number;
  collectedToday: number;
  collectionTarget: number;
  visitsCompleted: number;
  visitsPlanned: number;
  pendingApplications: number;
  pendingDisbursements: number;
  pendingWaivers: number;
}

export interface AssignedCustomer {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  idNumber: string;
  address: string;
  activeLoans: number;
  totalOutstanding: number;
  overdueAmount: number;
  lastPaymentDate?: string;
  assignedDate: string;
}

export interface CollectorApplication {
  id: number;
  applicationNumber: string;
  customerId: number;
  loanProductId: number;
  // API returns these fields from JOIN
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  productName?: string;
  productInterestRate?: number | null;
  product_interest_rate?: number | null;
  productInterestType?: 'flat' | 'reducing' | 'compound' | null;
  product_interest_type?: 'flat' | 'reducing' | 'compound' | null;
  productProcessingFeePercent?: number | null;
  product_processing_fee_percent?: number | null;
  productPlatformFee?: number | null;
  product_platform_fee?: number | null;
  productPaymentFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | null;
  product_payment_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | null;
  productLoanTermType?: string | null;
  product_loan_term_type?: string | null;
  productFixedTermDays?: number | null;
  product_fixed_term_days?: number | null;
  // Fallback fields (if API changes)
  customerName?: string;
  loanProductName?: string;
  Customer?: {
    firstName: string;
    lastName: string;
  };
  LoanProduct?: {
    name: string;
  };
  requestedAmount: number;
  requestedTermDays: number;
  status: string;
  submittedAt?: string;
  createdAt?: string;
}

export interface ApproveApplicationDto {
  approvedAmount: number;
  approvedTermDays: number;
  approvedInterestRate: number;
  interestType?: 'flat' | 'reducing' | 'compound';
  notes?: string;
}

export interface RejectApplicationDto {
  rejectionReason: string;
  notes?: string;
}

export interface PendingDisbursement {
  id: number;
  loanNumber: string;
  customerId: number;
  customerName: string;
  principalAmount: number;
  processingFee: number;
  processingFeePercent?: number | null;
  platformFee: number;
  platformFeeMonthly?: number | null;
  netDisbursement: number;
  approvedAt: string;
  applicationId?: number;
  applicationNumber?: string;
  loanProductId?: number;
  interestRate?: number;
  interestType?: string;
  interestAmount?: number;
  totalRepayable?: number;
  termDays?: number;
  termMonths?: number;
  paymentFrequency?: string;
  status?: string;
  type?: 'loan' | 'application';
}

export interface DisburseDto {
  disbursementMethod: 'cash' | 'bank_transfer' | 'mobile_money';
  referenceNumber?: string;
  notes?: string;
}

export interface PenaltyWaiver {
  id: number;
  loanNumber: string;
  customerId: number;
  customerName: string;
  installmentNumber?: number;
  originalPenaltyAmount: number;
  requestedWaiverAmount: number;
  approvedWaiverAmount?: number;
  waiveType: 'full' | 'partial';
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  requestedAt: string;
  approvedAt?: string;
}

export interface RequestWaiverDto {
  loanId: number;
  installmentId?: number;
  waiveType: 'full' | 'partial';
  requestedWaiverAmount: number;
  reason: string;
  notes?: string;
}

export interface CustomerVisit {
  id: number;
  customerId: number;
  customerName: string;
  visitType: 'collection' | 'follow_up' | 'documentation' | 'relationship' | 'other';
  visitPurpose: string;
  checkInTime: string;
  checkOutTime?: string;
  durationMinutes?: number;
  visitOutcome?: 'payment_collected' | 'promise_to_pay' | 'customer_not_home' | 'refused_payment' | 'other';
  paymentCollectedAmount?: number;
  status: 'in_progress' | 'completed' | 'cancelled';
  distanceFromCustomerMeters?: number;
}

export interface LogVisitDto {
  customerId: number;
  visitType: 'collection' | 'follow_up' | 'documentation' | 'relationship' | 'other';
  visitPurpose: string;
  latitude: number;
  longitude: number;
  address?: string;
  notes?: string;
}

export interface CheckOutVisitDto {
  latitude: number;
  longitude: number;
  address?: string;
  outcome: 'payment_collected' | 'promise_to_pay' | 'customer_not_home' | 'refused_payment' | 'other';
  outcomeNotes: string;
  paymentAmount?: number;
  nextFollowUpDate?: string;
}

export interface ActionLog {
  id: number;
  actionType: string;
  customerId: number;
  customerName?: string;
  loanId?: number;
  loanNumber?: string;
  applicationId?: number;
  amount?: number;
  status: string;
  notes?: string;
  createdAt: string;
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root',
})
export class CollectorService {
  private apiService = inject(ApiService);

  // ==================== DASHBOARD & SUMMARY ====================

  /**
   * Get collector's daily summary
   */
  getDailySummary(collectorId: number): Observable<CollectorDailySummary> {
    return this.apiService.get<any>(
      `money-loan/collectors/${collectorId}/daily-summary`
    ).pipe(
      map((response: any) => response.data || response)
    );
  }

  /**
   * Get collector limits
   */
  getLimits(collectorId: number): Observable<CollectorLimits> {
    return this.apiService.get<any>(
      `money-loan/collectors/${collectorId}/limits`
    ).pipe(
      map((response: any) => response.data || response)
    );
  }

  /**
   * Get assigned customers
   */
  getAssignedCustomers(collectorId: number): Observable<AssignedCustomer[]> {
    return this.apiService.get<any>(
      `money-loan/collectors/${collectorId}/customers`
    ).pipe(
      map((response: any) => response.data || response)
    );
  }

  // ==================== APPLICATIONS ====================

  /**
   * Get pending applications
   */
  getPendingApplications(collectorId: number): Observable<CollectorApplication[]> {
    return this.apiService.get<any>(
      `money-loan/collectors/${collectorId}/applications`
    ).pipe(
      map((response: any) => response.data || response)
    );
  }

  /**
   * Get application details
   */
  getApplicationDetails(collectorId: number, applicationId: number): Observable<any> {
    return this.apiService.get<any>(
      `money-loan/collectors/${collectorId}/applications/${applicationId}`
    ).pipe(
      map((response: any) => response.data || response)
    );
  }

  /**
   * Approve application
   */
  approveApplication(
    collectorId: number,
    applicationId: number,
    dto: ApproveApplicationDto
  ): Observable<any> {
    // Map frontend DTO to backend DTO format
    const backendDto = {
      approvedAmount: Number(dto.approvedAmount),
      approvedTermDays: Number(dto.approvedTermDays),
      interestRate: Number(dto.approvedInterestRate), // Map approvedInterestRate to interestRate
      interestType: dto.interestType ?? 'flat',
      notes: dto.notes,
    };
    
    return this.apiService.post<any>(
      `money-loan/collectors/${collectorId}/applications/${applicationId}/approve`,
      backendDto
    ).pipe(
      map((response: any) => response.data || response)
    );
  }

  calculateLoanPreview(payload: LoanCalculationRequest): Observable<LoanCalculationPreview> {
    return this.apiService.calculateLoanPreview(payload);
  }

  /**
   * Reject application
   */
  rejectApplication(
    collectorId: number,
    applicationId: number,
    dto: RejectApplicationDto
  ): Observable<any> {
    return this.apiService.post<any>(
      `money-loan/collectors/${collectorId}/applications/${applicationId}/reject`,
      dto
    ).pipe(
      map((response: any) => response.data || response)
    );
  }

  /**
   * Request manager review
   */
  requestApplicationReview(
    collectorId: number,
    applicationId: number,
    notes: string
  ): Observable<any> {
    return this.apiService.post(
      `money-loan/collectors/${collectorId}/applications/${applicationId}/request-review`,
      { notes }
    );
  }

  // ==================== DISBURSEMENTS ====================

  /**
   * Get pending disbursements
   */
  getPendingDisbursements(collectorId: number): Observable<PendingDisbursement[]> {
    return this.apiService.get<PendingDisbursement[]>(
      `money-loan/collectors/${collectorId}/disbursements/pending`
    );
  }

  /**
   * Disburse loan
   */
  disburseLoan(
    collectorId: number,
    loanId: number,
    dto: DisburseDto
  ): Observable<any> {
    const backendDto = {
      disbursementMethod: dto.disbursementMethod,
      disbursementReference: dto.referenceNumber ?? undefined,
      disbursementNotes: dto.notes,
    };

    return this.apiService.post(
      `money-loan/collectors/${collectorId}/loans/${loanId}/disburse`,
      backendDto
    );
  }

  /**
   * Request disbursement approval
   */
  requestDisbursementApproval(
    collectorId: number,
    loanId: number,
    notes: string
  ): Observable<any> {
    return this.apiService.post(
      `money-loan/collectors/${collectorId}/disbursements/${loanId}/request-approval`,
      { notes }
    );
  }

  // ==================== PENALTY WAIVERS ====================

  /**
   * Get pending waivers
   */
  getPendingWaivers(collectorId: number): Observable<PenaltyWaiver[]> {
    return this.apiService.get<any>(
      `money-loan/collectors/${collectorId}/waivers/pending`
    ).pipe(
      map((response: any) => response?.data || response || [])
    );
  }

  /**
   * Get waiver details
   */
  getWaiverDetails(collectorId: number, waiverId: number): Observable<PenaltyWaiver> {
    return this.apiService.get<any>(
      `money-loan/collectors/${collectorId}/waivers/${waiverId}`
    ).pipe(
      map((response: any) => response?.data || response)
    );
  }

  /**
   * Request penalty waiver
   */
  requestWaiver(collectorId: number, dto: RequestWaiverDto): Observable<any> {
    return this.apiService.post(
      `money-loan/collectors/${collectorId}/waivers/request`,
      dto
    );
  }

  // ==================== CUSTOMER VISITS ====================

  /**
   * Get today's visits
   */
  getTodayVisits(collectorId: number): Observable<CustomerVisit[]> {
    return this.apiService.get<CustomerVisit[]>(
      `money-loan/collectors/${collectorId}/visits/today`
    );
  }

  /**
   * Get active visit
   */
  getActiveVisit(collectorId: number): Observable<CustomerVisit | null> {
    return this.apiService.get<CustomerVisit | null>(
      `money-loan/collectors/${collectorId}/visits/active`
    );
  }

  /**
   * Get customer visit history
   */
  getCustomerVisitHistory(
    collectorId: number,
    customerId: number,
    limit?: number
  ): Observable<CustomerVisit[]> {
    const params = limit ? { limit } : undefined;
    return this.apiService.get<CustomerVisit[]>(
      `money-loan/collectors/${collectorId}/visits/customer/${customerId}`,
      params
    );
  }

  /**
   * Log visit (GPS check-in)
   */
  logVisit(collectorId: number, dto: LogVisitDto): Observable<CustomerVisit> {
    return this.apiService.post<CustomerVisit>(
      `money-loan/collectors/${collectorId}/visits`,
      dto
    );
  }

  /**
   * Check out from visit
   */
  checkOutVisit(
    collectorId: number,
    visitId: number,
    dto: CheckOutVisitDto
  ): Observable<CustomerVisit> {
    return this.apiService.post<CustomerVisit>(
      `money-loan/collectors/${collectorId}/visits/${visitId}/checkout`,
      dto
    );
  }

  // ==================== ACTION LOGS ====================

  /**
   * Get action logs
   */
  getActionLogs(
    collectorId: number,
    params?: { limit?: number; offset?: number; actionType?: string }
  ): Observable<ActionLog[]> {
    return this.apiService.get<ActionLog[]>(
      `money-loan/collectors/${collectorId}/actions`,
      params
    );
  }
}
