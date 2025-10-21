/**
 * App Routing Module
 * Contains all application routes
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Guards
import { AuthGuard } from './core/guards/auth.guard';
import { LoginGuard } from './core/guards/login.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule),
    canActivate: [LoginGuard],
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'users',
    loadChildren: () => import('./modules/users/users.module').then(m => m.UsersModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'roles',
    loadChildren: () => import('./modules/roles/roles.module').then(m => m.RolesModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'tenants',
    loadChildren: () => import('./modules/tenants/tenants.module').then(m => m.TenantsModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'audit-logs',
    loadChildren: () => import('./modules/audit-logs/audit-logs.module').then(m => m.AuditLogsModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'settings',
    loadChildren: () => import('./modules/settings/settings.module').then(m => m.SettingsModule),
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
