import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoanOverviewComponent } from '../../../features/products/money-loan/admin/loan-overview.component';
import { LoansListComponent } from '../../../features/products/money-loan/admin/loans-list.component';
import { CustomersListComponent } from '../../../features/products/money-loan/admin/customers-list.component';
import { CustomerFormComponent } from '../../../features/products/money-loan/admin/customer-form.component';
import { LoanDetailsComponent } from '../../../features/products/money-loan/admin/loan-details.component';
import { PaymentFormComponent } from '../../../features/products/money-loan/admin/payment-form.component';

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
    component: PaymentFormComponent,
    data: { title: 'Record Payment', permission: 'money_loan:payments:create' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MoneyLoanRoutingModule { }
