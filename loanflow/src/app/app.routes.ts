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
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.page').then((m) => m.RegisterPage),
  },
  
  // Customer routes with bottom tabs
  {
    path: 'customer',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/customer/customer-layout.component').then((m) => m.CustomerLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/customer/customer_dashboard.page').then((m) => m.CustomerDashboardPage),
      },
      {
        path: 'loans',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/customer/loans.page').then((m) => m.CustomerLoansPage),
          },
          {
            path: ':id',
            loadComponent: () => import('./features/customer/loan-details.page').then((m) => m.LoanDetailsPage),
          },
        ],
      },
      {
        path: 'apply',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/customer/apply-loan.page').then((m) => m.ApplyLoanPage),
          },
          {
            path: 'form',
            loadComponent: () => import('./features/customer/loan-application-form.page').then((m) => m.LoanApplicationFormPage),
          },
        ],
      },
      {
        path: 'payments',
        loadComponent: () => import('./features/customer/payments.page').then((m) => m.CustomerPaymentsPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/customer/profile.page').then((m) => m.ProfilePage),
      },
      // Legacy routes for compatibility
      {
        path: 'applications/:id',
        loadComponent: () => import('./features/customer/application-timeline.page').then((m) => m.ApplicationTimelinePage),
      },
      {
        path: 'apply-loan',
        redirectTo: 'apply',
        pathMatch: 'full',
      },
      {
        path: 'apply-loan/form',
        redirectTo: 'apply/form',
        pathMatch: 'full',
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  
  // Collector routes with bottom tabs
  {
    path: 'collector',
    canActivate: [collectorGuard],
    loadComponent: () => import('./features/collector/collector-layout.component').then((m) => m.CollectorLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/collector/collector-dashboard.page').then((m) => m.CollectorDashboardPage),
      },
      {
        path: 'applications',
        loadComponent: () => import('./features/collector/applications.page').then((m) => m.CollectorApplicationsPage),
      },
      {
        path: 'disbursements',
        loadComponent: () => import('./features/collector/disbursements.page').then((m) => m.CollectorDisbursementsPage),
      },
      {
        path: 'waivers',
        loadComponent: () => import('./features/collector/waivers.page').then((m) => m.CollectorWaiversPage),
      },
      {
        path: 'route',
        loadComponent: () => import('./features/collector/route.page').then((m) => m.CollectorRoutePage),
      },
      // Detail pages outside tabs
      {
        path: 'visits',
        loadComponent: () => import('./features/collector/visits.page').then((m) => m.CollectorVisitsPage),
      },
      {
        path: 'customers',
        redirectTo: 'route',
        pathMatch: 'full',
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
        redirectTo: 'dashboard',
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
