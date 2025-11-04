import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoanOverviewComponent } from '../admin/loan-overview.component';
import { LoansListComponent } from '../admin/loans-list.component';
import { CustomersListComponent } from '../admin/customers-list.component';
import { CustomerFormComponent } from '../admin/customer-form.component';
import { CustomerAssignmentComponent } from '../admin/customer-assignment.component';
import { LoanDetailsComponent } from '../admin/loan-details.component';
import { PaymentFormComponent } from '../admin/payment-form.component';

// Configuration Management
import { ConfigurationDashboardComponent } from '../admin/configuration/configuration-dashboard.component';
import { LoanProductsComponent } from '../admin/configuration/loan-products.component';
import { PaymentSchedulesComponent } from '../admin/configuration/payment-schedules.component';
import { FeeStructuresComponent } from '../admin/configuration/fee-structures.component';
import { ApprovalRulesComponent } from '../admin/configuration/approval-rules.component';
import { LoanModificationsComponent } from '../admin/configuration/loan-modifications.component';

// Loan Applications
import { LoanApplicationsComponent } from '../admin/applications/loan-applications.component';

// Reports
import { ReportsDashboardComponent } from '../admin/reports/reports-dashboard.component';

// Payments
import { PaymentProcessingComponent } from '../admin/payments/payment-processing.component';
import { RecordPaymentComponent } from '../admin/payments/record-payment.component';

// Customer Components
import { LoanApplicationFormComponent } from '../customer/loan-application-form.component';
import { LoanStatusTrackingComponent } from '../customer/loan-status-tracking.component';
import { CustomerMakePaymentComponent } from '../customer/make-payment.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
  },
  {
    path: 'overview',
    component: LoanOverviewComponent,
    data: { title: 'Money Loan Overview', permission: 'money_loan:view' }
  },
  {
    path: 'customers',
    component: CustomersListComponent,
    data: { title: 'Loan Customers', permission: 'money_loan:customers:view' }
  },
  {
    path: 'customers/add',
    component: CustomerFormComponent,
    data: { title: 'Add Customer', permission: 'money_loan:customers:create' }
  },
  {
    path: 'customers/assignments',
    component: CustomerAssignmentComponent,
    data: { title: 'Customer Assignments', permission: 'money_loan:customers:update' }
  },
  {
    path: 'customers/:id',
    component: CustomerFormComponent,
    data: { title: 'View Customer', permission: 'money_loan:customers:view', viewMode: true }
  },
  {
    path: 'customers/:id/edit',
    component: CustomerFormComponent,
    data: { title: 'Edit Customer', permission: 'money_loan:customers:update' }
  },
  {
    path: 'loans',
    component: LoansListComponent,
    data: { title: 'All Loans', permission: 'money_loan:loans:view' }
  },
  {
    path: 'loans/:id',
    component: LoanDetailsComponent,
    data: { title: 'Loan Details', permission: 'money_loan:loans:view' }
  },
  {
    path: 'payments/record',
    component: RecordPaymentComponent,
    data: { title: 'Record Walk-in Payment', permission: 'money_loan:payments:create' }
  },
  {
    path: 'payments/process/:id',
    component: PaymentProcessingComponent,
    data: { title: 'Process Payment', permission: 'money_loan:payments:create' }
  },
  // Configuration routes
  {
    path: 'config',
    component: ConfigurationDashboardComponent,
    data: { title: 'Configuration', permission: 'money_loan:config:view' }
  },
  {
    path: 'config/loan-products',
    component: LoanProductsComponent,
    data: { title: 'Loan Products', permission: 'money_loan:config:edit' }
  },
  {
    path: 'config/payment-schedules',
    component: PaymentSchedulesComponent,
    data: { title: 'Payment Schedules', permission: 'money_loan:config:edit' }
  },
  {
    path: 'config/fees',
    component: FeeStructuresComponent,
    data: { title: 'Fee Structures', permission: 'money_loan:config:edit' }
  },
  {
    path: 'config/approval-rules',
    component: ApprovalRulesComponent,
    data: { title: 'Approval Rules', permission: 'money_loan:config:edit' }
  },
  {
    path: 'config/modifications',
    component: LoanModificationsComponent,
    data: { title: 'Loan Modifications', permission: 'money_loan:config:edit' }
  },
  // Application routes
  {
    path: 'applications',
    component: LoanApplicationsComponent,
    data: { title: 'Loan Applications', permission: 'money_loan:applications:view' }
  },
  // Reports routes
  {
    path: 'reports',
    component: ReportsDashboardComponent,
    data: { title: 'Reports & Analytics', permission: 'money_loan:reports:view' }
  },
  // Customer routes
  {
    path: 'customer/apply',
    component: LoanApplicationFormComponent,
    data: { title: 'Apply for Loan' }
  },
  {
    path: 'customer/loan-status-tracking',
    component: LoanStatusTrackingComponent,
    data: { title: 'Track Application Status' }
  },
  {
    path: 'customer/status/:id',
    component: LoanStatusTrackingComponent,
    data: { title: 'Loan Status' }
  },
  {
    path: 'customer/payment',
    component: CustomerMakePaymentComponent,
    data: { title: 'Make Payment' }
  },
  {
    path: 'customer/loans/:id',
    component: LoanDetailsComponent,
    data: { title: 'Loan Details' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MoneyLoanRoutingModule { }
