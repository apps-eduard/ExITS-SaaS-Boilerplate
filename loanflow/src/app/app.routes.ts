// App Routes - Role-based routing for customer and collector
import { Routes } from '@angular/router';
import { customerGuard, collectorGuard } from './shared/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login.page').then((m) => m.LoginPage),
  },
  
  // Customer routes
  {
    path: 'customer',
    canActivate: [customerGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/customer/customer_dashboard.page').then((m) => m.CustomerDashboardPage),
      },
      {
        path: 'loans',
        loadComponent: () => import('./features/customer/loans.page').then((m) => m.CustomerLoansPage),
      },
      {
        path: 'loans/:id',
        loadComponent: () => import('./features/customer/loan-details.page').then((m) => m.LoanDetailsPage),
      },
      {
        path: 'payments',
        loadComponent: () => import('./features/customer/payments.page').then((m) => m.CustomerPaymentsPage),
      },
      {
        path: 'apply',
        loadComponent: () => import('./features/customer/apply-loan.page').then((m) => m.ApplyLoanPage),
      },
      {
        path: 'apply-loan/form',
        loadComponent: () => import('./features/customer/loan-application-form.page').then((m) => m.LoanApplicationFormPage),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  
  // Collector routes
  {
    path: 'collector',
    canActivate: [collectorGuard],
    children: [
      {
        path: 'route',
        loadComponent: () => import('./features/collector/route.page').then((m) => m.CollectorRoutePage),
      },
      {
        path: 'visit/:customerId',
        loadComponent: () => import('./features/collector/visit.page').then((m) => m.VisitPage),
      },
      {
        path: 'collect/:loanId',
        loadComponent: () => import('./features/collector/collect.page').then((m) => m.CollectPage),
      },
      {
        path: '',
        redirectTo: 'route',
        pathMatch: 'full',
      },
    ],
  },
  
  // Fallback
  {
    path: '**',
    redirectTo: 'login',
  },
];
