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
    path: 'customer/login',
    loadComponent: () => import('./features/auth/customer-login/customer-login.component').then(m => m.CustomerLoginComponent)
  },
  {
    path: 'customer',
    loadComponent: () => import('./features/products/money-loan/customer/customer-layout.component').then(m => m.CustomerLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/customer/customer-dashboard.component').then(m => m.CustomerDashboardComponent)
      }
    ]
  },
  {
    path: 'products/money-loan/customer',
    loadComponent: () => import('./features/products/money-loan/customer/customer-layout.component').then(m => m.CustomerLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/products/money-loan/customer/customer-dashboard.component').then(m => m.CustomerDashboardComponent)
      },
      {
        path: 'loans',
        loadComponent: () => import('./features/products/money-loan/customer/my-loans.component').then(m => m.MyLoansComponent)
      },
      {
        path: 'apply',
        loadComponent: () => import('./features/products/money-loan/customer/apply-loan.component').then(m => m.ApplyLoanComponent)
      },
      {
        path: 'payment',
        loadComponent: () => import('./features/products/money-loan/customer/make-payment.component').then(m => m.CustomerMakePaymentComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
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
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
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
            loadComponent: () => import('./features/admin/users/users-list.component').then(m => m.UsersListComponent)
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
        path: 'products',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/products/products-list.component').then(m => m.ProductsListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/admin/products/product-new.component').then(m => m.ProductNewComponent)
          },
          {
            path: 'mapping',
            loadComponent: () => import('./features/admin/products/product-mapping.component').then(m => m.ProductMappingComponent)
          },
          {
            path: 'settings',
            loadComponent: () => import('./features/admin/products/product-settings.component').then(m => m.ProductSettingsComponent)
          }
        ]
      },
      {
        path: 'money-loan',
        loadChildren: () => import('./admin/modules/money-loan/money-loan-routing.module').then(m => m.MoneyLoanRoutingModule)
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
        children: [
          {
            path: 'tenant-usage',
            loadComponent: () => import('./features/admin/reports/tenant-usage.component').then(m => m.TenantUsageComponent)
          },
          {
            path: 'revenue',
            loadComponent: () => import('./features/admin/reports/revenue-reports.component').then(m => m.RevenueReportsComponent)
          },
          {
            path: 'product-adoption',
            loadComponent: () => import('./features/admin/reports/product-adoption.component').then(m => m.ProductAdoptionComponent)
          },
          {
            path: 'activity-logs',
            loadComponent: () => import('./features/admin/reports/system-activity-logs.component').then(m => m.SystemActivityLogsComponent)
          }
        ]
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
            path: 'logs',
            loadComponent: () => import('./features/admin/system/system-logs.component').then(m => m.SystemLogsComponent)
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
            loadComponent: () => import('./features/admin/users/users-list.component').then(m => m.UsersListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/admin/users/user-editor.component').then(m => m.UserEditorComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/admin/users/user-editor.component').then(m => m.UserEditorComponent)
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
        path: 'products',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/tenant/products/tenant-products.component').then(m => m.TenantProductsComponent)
          },
          {
            path: 'settings',
            loadComponent: () => import('./features/tenant/products/tenant-product-settings.component').then(m => m.TenantProductSettingsComponent)
          },
          {
            path: 'config',
            loadComponent: () => import('./features/tenant/products/tenant-product-config.component').then(m => m.TenantProductConfigComponent)
          }
        ]
      },
      {
        path: 'subscriptions',
        loadComponent: () => import('./features/tenant/billing/tenant-subscriptions.component').then(m => m.TenantSubscriptionsComponent)
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
