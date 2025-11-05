import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { systemAdminGuard } from './core/guards/system-admin.guard';
import { tenantUserGuard } from './core/guards/tenant-user.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [noAuthGuard]
  },
  {
    path: 'platform/login',
    loadComponent: () => import('./features/auth/platform-login/platform-login.component').then(m => m.PlatformLoginComponent),
    canActivate: [noAuthGuard]
  },
  {
    path: 'customer/login',
    loadComponent: () => import('./features/auth/customer-login/customer-login.component').then(m => m.CustomerLoginComponent)
  },
  {
    path: 'customer',
    loadComponent: () => import('./features/platforms/money-loan/customer/customer-layout.component').then(m => m.CustomerLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/platforms/money-loan/customer/customer-dashboard.component').then(m => m.CustomerDashboardComponent)
      }
    ]
  },
  {
    path: 'platforms/money-loan/customer',
    loadComponent: () => import('./features/platforms/money-loan/customer/customer-layout.component').then(m => m.CustomerLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/platforms/money-loan/customer/customer-dashboard.component').then(m => m.CustomerDashboardComponent)
      },
      {
        path: 'loans',
        loadComponent: () => import('./features/platforms/money-loan/customer/my-loans.component').then(m => m.MyLoansComponent)
      },
      {
        path: 'loans/:id',
        loadComponent: () => import('./features/platforms/money-loan/customer/loan-details.component').then(m => m.LoanDetailsComponent)
      },
      {
        path: 'apply',
        loadComponent: () => import('./features/platforms/money-loan/customer/apply-loan.component').then(m => m.ApplyLoanComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/platforms/money-loan/customer/products.component').then(m => m.CustomerProductsComponent)
      },
      {
        path: 'account',
        loadComponent: () => import('./features/platforms/money-loan/customer/my-account.component').then(m => m.MyAccountComponent)
      },
      {
        path: 'payment',
        loadComponent: () => import('./features/platforms/money-loan/customer/make-payment.component').then(m => m.CustomerMakePaymentComponent)
      },
      {
        path: 'loan-status-tracking',
        loadComponent: () => import('./features/platforms/money-loan/customer/loan-status-tracking.component').then(m => m.LoanStatusTrackingComponent)
      },
      {
        path: 'loan-status-tracking/:id',
        loadComponent: () => import('./features/platforms/money-loan/customer/loan-status-tracking.component').then(m => m.LoanStatusTrackingComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'platforms/money-loan/admin',
    loadChildren: () => import('./features/platforms/money-loan/modules/money-loan-routing.module').then(m => m.MoneyLoanRoutingModule),
    canActivate: [authGuard]
  },
  {
    path: 'platforms/money-loan/dashboard',
    loadComponent: () => import('./features/platforms/money-loan/dashboard/money-loan-layout.component').then(m => m.MoneyLoanLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/platforms/money-loan/admin/loan-overview.component').then(m => m.LoanOverviewComponent)
      },
      // Interest & Configuration
      {
        path: 'config/quick-product',
        loadComponent: () => import('./features/platforms/money-loan/admin/configuration/quick-product.component').then(m => m.QuickProductComponent)
      },
      {
        path: 'config/loan-products',
        loadComponent: () => import('./features/platforms/money-loan/admin/configuration/loan-products.component').then(m => m.LoanProductsComponent)
      },
      {
        path: 'config/payment-schedules',
        loadComponent: () => import('./features/platforms/money-loan/admin/configuration/payment-schedules.component').then(m => m.PaymentSchedulesComponent)
      },
      {
        path: 'config/fees',
        loadComponent: () => import('./features/platforms/money-loan/admin/configuration/fee-structures.component').then(m => m.FeeStructuresComponent)
      },
      {
        path: 'config/approval-rules',
        loadComponent: () => import('./features/platforms/money-loan/admin/configuration/approval-rules.component').then(m => m.ApprovalRulesComponent)
      },
      {
        path: 'config/modifications',
        loadComponent: () => import('./features/platforms/money-loan/admin/configuration/loan-modifications.component').then(m => m.LoanModificationsComponent)
      },
      {
        path: 'interest/rates',
        loadComponent: () => import('./features/platforms/money-loan/admin/configuration/interest-rates.component').then(m => m.InterestRatesComponent)
      },
      {
        path: 'interest/auto-rules',
        loadComponent: () => import('./features/platforms/money-loan/admin/configuration/approval-rules.component').then(m => m.ApprovalRulesComponent)
      },
      {
        path: 'interest/manual-override',
        loadComponent: () => import('./features/platforms/money-loan/admin/configuration/loan-modifications.component').then(m => m.LoanModificationsComponent)
      },
      {
        path: 'interest/calculator',
        loadComponent: () => import('./features/platforms/money-loan/admin/loan-calculator.component').then(m => m.LoanCalculatorComponent)
      },
      {
        path: 'loans/calculator',
        loadComponent: () => import('./features/platforms/money-loan/admin/loan-calculator.component').then(m => m.LoanCalculatorComponent)
      },
      // Customers
      {
        path: 'customers/all',
        loadComponent: () => import('./features/platforms/money-loan/admin/customers-list.component').then(m => m.CustomersListComponent)
      },
      {
        path: 'customers/assignments',
        loadComponent: () => import('./features/platforms/money-loan/admin/customer-assignment.component').then(m => m.CustomerAssignmentComponent)
      },
      {
        path: 'customers/new',
        loadComponent: () => import('./features/platforms/money-loan/admin/customer-form.component').then(m => m.CustomerFormComponent)
      },
      {
        path: 'customers/kyc-pending',
        loadComponent: () => import('./features/platforms/money-loan/admin/kyc-pending.component').then(m => m.KycPendingComponent)
      },
      {
        path: 'customers/high-risk',
        loadComponent: () => import('./features/platforms/money-loan/admin/high-risk-customers.component').then(m => m.HighRiskCustomersComponent)
      },
      // KYC Verification Routes
      {
        path: 'kyc/pending',
        loadComponent: () => import('./features/platforms/money-loan/admin/kyc-pending.component').then(m => m.KycPendingComponent)
      },
      {
        path: 'kyc/verified',
        loadComponent: () => import('./features/platforms/money-loan/admin/kyc-verified.component').then(m => m.KycVerifiedComponent)
      },
      {
        path: 'kyc/rejected',
        loadComponent: () => import('./features/platforms/money-loan/admin/kyc-rejected.component').then(m => m.KycRejectedComponent)
      },
      {
        path: 'kyc/audit-logs',
        loadComponent: () => import('./features/platforms/money-loan/admin/kyc-audit-logs.component').then(m => m.KycAuditLogsComponent)
      },
      {
        path: 'kyc/webhook-logs',
        loadComponent: () => import('./features/platforms/money-loan/admin/kyc-webhook-logs.component').then(m => m.KycWebhookLogsComponent)
      },
      // Reports
      {
        path: 'reports/periodic',
        loadComponent: () => import('./features/platforms/money-loan/admin/reports/reports-periodic.component').then(m => m.ReportsPeriodicComponent)
      },
      {
        path: 'reports/tax-summary',
        loadComponent: () => import('./features/platforms/money-loan/admin/reports/reports-tax-summary.component').then(m => m.ReportsTaxSummaryComponent)
      },
      {
        path: 'reports/export',
        loadComponent: () => import('./features/platforms/money-loan/admin/reports/reports-export.component').then(m => m.ReportsExportComponent)
      },
      {
        path: 'reports/custom-queries',
        loadComponent: () => import('./features/platforms/money-loan/admin/reports/reports-custom-queries.component').then(m => m.ReportsCustomQueriesComponent)
      },
      // Collections
      {
        path: 'collections/overdue-workflow',
        loadComponent: () => import('./features/platforms/money-loan/admin/collections/collections-overdue-workflow.component').then(m => m.CollectionsOverdueWorkflowComponent)
      },
      {
        path: 'collections/strategies',
        loadComponent: () => import('./features/platforms/money-loan/admin/collections/collections-strategies.component').then(m => m.CollectionsStrategiesComponent)
      },
      {
        path: 'collections/legal-actions',
        loadComponent: () => import('./features/platforms/money-loan/admin/collections/collections-legal-actions.component').then(m => m.CollectionsLegalActionsComponent)
      },
      {
        path: 'collections/recovery',
        loadComponent: () => import('./features/platforms/money-loan/admin/collections/collections-recovery.component').then(m => m.CollectionsRecoveryComponent)
      },
      // Collector Management
      {
        path: 'collectors/limits',
        loadComponent: () => import('./features/platforms/money-loan/admin/collectors/collector-limits.component').then(m => m.CollectorLimitsComponent)
      },
      {
        path: 'collectors/performance',
        loadComponent: () => import('./features/platforms/money-loan/admin/collectors/collector-performance.component').then(m => m.CollectorPerformanceComponent)
      },
      {
        path: 'collectors/action-logs',
        loadComponent: () => import('./features/platforms/money-loan/admin/collectors/collector-action-logs.component').then(m => m.CollectorActionLogsComponent)
      },
      {
        path: 'collectors/routes',
        loadComponent: () => import('./features/platforms/money-loan/admin/collectors/collector-routes.component').then(m => m.CollectorRoutesComponent)
      },
      {
        path: 'collectors/waivers',
        loadComponent: () => import('./features/platforms/money-loan/admin/collectors/penalty-waivers.component').then(m => m.PenaltyWaiversComponent)
      },
      {
        path: 'collectors/targets',
        loadComponent: () => import('./features/platforms/money-loan/admin/collectors/collector-targets.component').then(m => m.CollectorTargetsComponent)
      },
      // Audit & Notifications
      {
        path: 'audit-log',
        loadComponent: () => import('./features/platforms/money-loan/admin/audit-log.component').then(m => m.AuditLogComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/platforms/money-loan/admin/notifications.component').then(m => m.NotificationsComponent)
      },
      // User Management
      {
        path: 'users',
        loadComponent: () => import('./features/platforms/money-loan/admin/users-management.component').then(m => m.UsersManagementComponent)
      },
      {
        path: 'customers/:id',
        loadComponent: () => import('./features/platforms/money-loan/admin/customer-form.component').then(m => m.CustomerFormComponent)
      },
      {
        path: 'customers/:id/edit',
        loadComponent: () => import('./features/platforms/money-loan/admin/customer-form.component').then(m => m.CustomerFormComponent)
      },
      // Loans
      {
        path: 'loans/all',
        loadComponent: () => import('./features/platforms/money-loan/admin/loans-list.component').then(m => m.LoansListComponent)
      },
      {
        path: 'loans/pending',
        loadComponent: () => import('./features/platforms/money-loan/admin/applications/loan-applications.component').then(m => m.LoanApplicationsComponent)
      },
      {
        path: 'loans/active',
        loadComponent: () => import('./features/platforms/money-loan/admin/loans-list.component').then(m => m.LoansListComponent)
      },
      {
        path: 'loans/overdue',
        loadComponent: () => import('./features/platforms/money-loan/admin/loans-list.component').then(m => m.LoansListComponent)
      },
      {
        path: 'loans/closed',
        loadComponent: () => import('./features/platforms/money-loan/admin/loans-list.component').then(m => m.LoansListComponent)
      },
      {
        path: 'loans/disbursement',
        loadComponent: () => import('./features/platforms/money-loan/admin/loan-disbursement.component').then(m => m.LoanDisbursementComponent)
      },
      {
        path: 'loans/calculator',
        loadComponent: () => import('./features/platforms/money-loan/admin/loan-overview.component').then(m => m.LoanOverviewComponent)
      },
      // Payments
      {
        path: 'payments/record',
        loadComponent: () => import('./features/platforms/money-loan/admin/payments/record-payment.component').then(m => m.RecordPaymentComponent)
      },
      {
        path: 'payments/today',
        loadComponent: () => import('./features/platforms/money-loan/admin/payments/today-collections.component').then(m => m.TodayCollectionsComponent)
      },
      {
        path: 'payments/history',
        loadComponent: () => import('./features/platforms/money-loan/admin/payments/payment-history.component').then(m => m.PaymentHistoryComponent)
      },
      {
        path: 'payments/bulk-import',
        loadComponent: () => import('./features/platforms/money-loan/admin/payment-form.component').then(m => m.PaymentFormComponent)
      },
      {
        path: 'payments/refunds',
        loadComponent: () => import('./features/platforms/money-loan/admin/payment-form.component').then(m => m.PaymentFormComponent)
      },
      {
        path: 'payments/failed',
        loadComponent: () => import('./features/platforms/money-loan/admin/payment-form.component').then(m => m.PaymentFormComponent)
      },
      {
        path: 'payments/gateway-settings',
        loadComponent: () => import('./features/platforms/money-loan/admin/configuration/configuration-dashboard.component').then(m => m.ConfigurationDashboardComponent)
      },
      // Reports
      {
        path: 'reports/performance',
        loadComponent: () => import('./features/platforms/money-loan/admin/reports/reports-dashboard.component').then(m => m.ReportsDashboardComponent)
      },
      {
        path: 'reports/collections',
        loadComponent: () => import('./features/platforms/money-loan/admin/reports/reports-dashboard.component').then(m => m.ReportsDashboardComponent)
      },
      {
        path: 'reports/arrears',
        loadComponent: () => import('./features/platforms/money-loan/admin/reports/reports-dashboard.component').then(m => m.ReportsDashboardComponent)
      },
      {
        path: 'reports/write-offs',
        loadComponent: () => import('./features/platforms/money-loan/admin/reports/reports-dashboard.component').then(m => m.ReportsDashboardComponent)
      },
      {
        path: 'reports/revenue',
        loadComponent: () => import('./features/platforms/money-loan/admin/reports/reports-dashboard.component').then(m => m.ReportsDashboardComponent)
      },
      {
        path: 'reports/disbursements',
        loadComponent: () => import('./features/platforms/money-loan/admin/reports/reports-dashboard.component').then(m => m.ReportsDashboardComponent)
      },
      {
        path: 'reports/profit-loss',
        loadComponent: () => import('./features/platforms/money-loan/admin/reports/reports-dashboard.component').then(m => m.ReportsDashboardComponent)
      },
      // Audit
      {
        path: 'audit/data-changes',
        loadComponent: () => import('./features/platforms/money-loan/admin/reports/reports-dashboard.component').then(m => m.ReportsDashboardComponent)
      },
      {
        path: 'audit/export',
        loadComponent: () => import('./features/platforms/money-loan/admin/reports/reports-dashboard.component').then(m => m.ReportsDashboardComponent)
      }
    ]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [systemAdminGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/admin/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./shared/layouts/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [systemAdminGuard],
    children: [
      {
        path: 'roles',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/roles/roles-list.component').then(m => m.RolesListComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/admin/roles/role-editor.component').then(m => m.RoleEditorComponent)
          }
        ]
      },
      {
        path: 'users',
        children: [
          {
            path: '',
            redirectTo: 'tenants',
            pathMatch: 'full'
          },
          {
            path: 'tenants',
            loadComponent: () => import('./features/admin/users/users-tenant-list.component').then(m => m.UsersTenantListComponent)
          },
          {
            path: 'system',
            loadComponent: () => import('./features/admin/users/users-system-list.component').then(m => m.UsersSystemListComponent)
          },
          {
            path: 'all',
            loadComponent: () => import('./features/admin/users/users-list.component').then(m => m.UsersListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/admin/users/user-editor.component').then(m => m.UserEditorComponent)
          },
          {
            path: 'invite',
            loadComponent: () => import('./features/admin/users/user-invite.component').then(m => m.UserInviteComponent)
          },
          {
            path: 'admins',
            loadComponent: () => import('./features/admin/users/users-admins.component').then(m => m.UsersAdminsComponent)
          },
          {
            path: 'activity',
            loadComponent: () => import('./features/admin/users/users-activity.component').then(m => m.UsersActivityComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/admin/users/user-editor.component').then(m => m.UserEditorComponent)
          },
          {
            path: ':id/profile',
            loadComponent: () => import('./features/admin/users/user-profile.component').then(m => m.UserProfileComponent)
          }
        ]
      },
      {
        path: 'recycle-bin',
        loadComponent: () => import('./features/admin/recycle-bin/recycle-bin.component').then(m => m.RecycleBinComponent)
      },
      {
        path: 'modules',
        loadComponent: () => import('./features/admin/modules/modules-list.component').then(m => m.ModulesListComponent)
      },
      {
        path: 'permissions',
        loadComponent: () => import('./features/admin/permissions/permissions.component').then(m => m.PermissionsComponent)
      },
      {
        path: 'tenants',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/tenants/tenants-list.component').then(m => m.TenantsListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/admin/tenants/tenant-editor.component').then(m => m.TenantEditorComponent)
          },
          {
            path: 'settings',
            loadComponent: () => import('./features/admin/tenants/settings/tenant-settings.component').then(m => m.TenantSettingsComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/admin/tenants/tenant-details.component').then(m => m.TenantDetailsComponent)
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./features/admin/tenants/tenant-editor.component').then(m => m.TenantEditorComponent)
          }
        ]
      },
      {
        path: 'platforms',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/platforms/platforms-list.component').then(m => m.PlatformsListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/admin/platforms/platform-new.component').then(m => m.PlatformNewComponent)
          },
          {
            path: 'mapping',
            loadComponent: () => import('./features/admin/platforms/platform-mapping.component').then(m => m.PlatformMappingComponent)
          },
          {
            path: 'settings',
            loadComponent: () => import('./features/admin/platforms/platform-settings.component').then(m => m.PlatformSettingsComponent)
          }
        ]
      },
      {
        path: 'money-loan',
        loadChildren: () => import('./features/platforms/money-loan/modules/money-loan-routing.module').then(m => m.MoneyLoanRoutingModule)
      },
      {
        path: 'subscriptions',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/subscriptions/subscriptions-list.component').then(m => m.SubscriptionsListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/admin/subscriptions/subscription-new.component').then(m => m.SubscriptionNewComponent)
          },
          {
            path: 'plans',
            loadComponent: () => import('./features/admin/subscriptions/plan-templates.component').then(m => m.PlanTemplatesComponent)
          },
          {
            path: 'billing',
            loadComponent: () => import('./features/admin/subscriptions/billing-overview.component').then(m => m.BillingOverviewComponent)
          },
          {
            path: 'invoices',
            loadComponent: () => import('./features/admin/subscriptions/invoices.component').then(m => m.InvoicesComponent)
          },
          {
            path: 'renewal-settings',
            loadComponent: () => import('./features/admin/subscriptions/renewal-settings.component').then(m => m.RenewalSettingsComponent)
          }
        ]
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/admin/reports/reports-layout.component').then(m => m.ReportsLayoutComponent),
        children: [
          {
            path: '',
            redirectTo: 'tenant-usage',
            pathMatch: 'full'
          },
          {
            path: 'tenant-usage',
            loadComponent: () => import('./features/admin/reports/tenant-usage.component').then(m => m.TenantUsageComponent)
          },
          {
            path: 'revenue',
            loadComponent: () => import('./features/admin/reports/revenue-reports.component').then(m => m.RevenueReportsComponent)
          },
          {
            path: 'subscription-history',
            loadComponent: () => import('./features/admin/reports/subscription-history.component').then(m => m.SubscriptionHistoryComponent)
          }
        ]
      },
      {
        path: 'platform-adoption',
        loadComponent: () => import('./features/admin/reports/platform-adoption.component').then(m => m.PlatformAdoptionComponent)
      },
      {
        path: 'system-activity-logs',
        loadComponent: () => import('./features/admin/system/system-logs.component').then(m => m.SystemActivityLogsComponent)
      },
      {
        path: 'system',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/system/system-dashboard.component').then(m => m.SystemDashboardComponent)
          },
          {
            path: 'health',
            loadComponent: () => import('./features/admin/system/system-health.component').then(m => m.SystemHealthComponent)
          },
          {
            path: 'performance',
            loadComponent: () => import('./features/admin/system/system-performance.component').then(m => m.SystemPerformanceComponent)
          },
          {
            path: 'config',
            loadComponent: () => import('./features/admin/system/system-config.component').then(m => m.SystemConfigComponent)
          },
          {
            path: 'backup',
            loadComponent: () => import('./features/admin/system/system-backup.component').then(m => m.SystemBackupComponent)
          },
          {
            path: 'security-policy',
            loadComponent: () => import('./features/admin/system/security-policy.component').then(m => m.SecurityPolicyComponent)
          },
          {
            path: 'logs',
            loadComponent: () => import('./features/admin/system/system-logs.component').then(m => m.SystemActivityLogsComponent)
          }
        ]
      },
      {
        path: 'settings',
        children: [
          {
            path: 'general',
            loadComponent: () => import('./features/settings/general-settings.component').then(m => m.GeneralSettingsComponent)
          },
          {
            path: 'security-policies',
            loadComponent: () => import('./features/settings/security-policies-settings.component').then(m => m.SecurityPoliciesSettingsComponent)
          },
          {
            path: 'email',
            loadComponent: () => import('./features/settings/email-settings.component').then(m => m.EmailSettingsComponent)
          },
          {
            path: 'storage',
            loadComponent: () => import('./features/settings/storage-settings.component').then(m => m.StorageSettingsComponent)
          },
          {
            path: 'performance',
            loadComponent: () => import('./features/settings/performance-settings.component').then(m => m.PerformanceSettingsComponent)
          },
          {
            path: 'notifications',
            loadComponent: () => import('./features/admin/settings/notification-rules.component').then(m => m.NotificationRulesComponent)
          }
        ]
      },
      {
        path: 'billing',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/billing/billing-dashboard.component').then(m => m.BillingDashboardComponent)
          },
          {
            path: 'plans',
            loadComponent: () => import('./features/admin/billing/billing-plans.component').then(m => m.BillingPlansComponent)
          },
          {
            path: 'subscriptions',
            loadComponent: () => import('./features/admin/billing/billing-subscriptions.component').then(m => m.BillingSubscriptionsComponent)
          },
          {
            path: 'invoices',
            loadComponent: () => import('./features/admin/billing/billing-invoices.component').then(m => m.BillingInvoicesComponent)
          }
        ]
      }
    ]
  },
  {
    path: 'tenant',
    loadComponent: () => import('./shared/layouts/tenant-layout.component').then(m => m.TenantLayoutComponent),
    canActivate: [tenantUserGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/tenant/dashboard/tenant-dashboard.component').then(m => m.TenantDashboardComponent)
      },
      {
        path: 'users',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/tenant/employees/employees-list.component').then(m => m.EmployeesListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/admin/users/user-editor.component').then(m => m.UserEditorComponent)
          },
          {
            path: 'invite',
            loadComponent: () => import('./features/admin/users/user-invite.component').then(m => m.UserInviteComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/admin/users/user-editor.component').then(m => m.UserEditorComponent)
          }
        ]
      },
      {
        path: 'customers',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/tenant/customers/customers-list.component').then(m => m.CustomersListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/platforms/money-loan/admin/customer-form.component').then(m => m.CustomerFormComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/platforms/money-loan/admin/customer-form.component').then(m => m.CustomerFormComponent)
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./features/platforms/money-loan/admin/customer-form.component').then(m => m.CustomerFormComponent)
          }
        ]
      },
      {
        path: 'roles',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/roles/roles-list.component').then(m => m.RolesListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/admin/roles/role-editor.component').then(m => m.RoleEditorComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/admin/roles/role-editor.component').then(m => m.RoleEditorComponent)
          }
        ]
      },
      {
        path: 'platforms',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/tenant/platforms/tenant-platforms.component').then(m => m.TenantPlatformsComponent)
          },
          {
            path: 'settings',
            loadComponent: () => import('./features/tenant/platforms/tenant-platform-settings.component').then(m => m.TenantPlatformSettingsComponent)
          },
          {
            path: 'config',
            loadComponent: () => import('./features/tenant/platform-configs/tenant-platform-configs.component').then(m => m.TenantPlatformConfigsComponent)
          },
          {
            path: 'config/money-loan',
            loadComponent: () => import('./features/tenant/platform-configs/tenant-money-loan-config.component').then(m => m.TenantMoneyLoanConfigComponent)
          },
          {
            path: 'config/bnpl',
            loadComponent: () => import('./features/tenant/platform-configs/tenant-bnpl-config.component').then(m => m.TenantBnplConfigComponent)
          },
          {
            path: 'config/pawnshop',
            loadComponent: () => import('./features/tenant/platform-configs/tenant-pawnshop-config.component').then(m => m.TenantPawnshopConfigComponent)
          }
        ]
      },
      {
        path: 'subscriptions',
        loadComponent: () => import('./features/tenant/billing/tenant-subscriptions.component').then(m => m.TenantSubscriptionsComponent)
      },
      {
        path: 'payment-simulation',
        loadComponent: () => import('./features/tenant/payment/payment-simulation.component').then(m => m.PaymentSimulationComponent)
      },
      {
        path: 'billing',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/tenant/billing/tenant-billing-overview.component').then(m => m.TenantBillingOverviewComponent)
          },
          {
            path: 'invoices',
            loadComponent: () => import('./features/tenant/billing/tenant-invoices.component').then(m => m.TenantInvoicesComponent)
          },
          {
            path: 'renewal',
            loadComponent: () => import('./features/tenant/billing/tenant-renewal-settings.component').then(m => m.TenantRenewalSettingsComponent)
          }
        ]
      },
      {
        path: 'reports',
        children: [
          {
            path: 'platform-usage',
            loadComponent: () => import('./features/tenant/reports/platform-usage.component').then(m => m.PlatformUsageComponent)
          },
          {
            path: 'user-activity',
            loadComponent: () => import('./features/tenant/reports/user-activity.component').then(m => m.UserActivityComponent)
          },
          {
            path: 'billing-summary',
            loadComponent: () => import('./features/tenant/reports/billing-summary.component').then(m => m.BillingSummaryComponent)
          },
          {
            path: 'transactions',
            loadComponent: () => import('./features/tenant/reports/transaction-history.component').then(m => m.TransactionHistoryComponent)
          },
          {
            path: '',
            redirectTo: 'transactions',
            pathMatch: 'full'
          }
        ]
      },
      {
        path: 'modules/money-loan',
        loadChildren: () => import('./features/platforms/money-loan/modules/money-loan-routing.module').then(m => m.MoneyLoanRoutingModule)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
