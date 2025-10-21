import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { LoginGuard } from './core/guards/login.guard';
import { MenuPage } from './pages/menu/menu.page';
import { DashboardPage } from './pages/dashboard/dashboard.page';

const routes: Routes = [
  {
    path: '',
    component: MenuPage,
    children: [
      {
        path: 'dashboard',
        component: DashboardPage,
        canActivate: [AuthGuard],
      },
      {
        path: 'auth',
        loadChildren: () => import('./pages/auth/auth.module').then((m) => m.AuthModule),
        canActivate: [LoginGuard],
      },
      {
        path: 'users',
        loadChildren: () => import('./pages/auth/auth.module').then((m) => m.AuthModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'roles',
        loadChildren: () => import('./pages/auth/auth.module').then((m) => m.AuthModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'tenants',
        loadChildren: () => import('./pages/auth/auth.module').then((m) => m.AuthModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'audit-logs',
        loadChildren: () => import('./pages/auth/auth.module').then((m) => m.AuthModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'profile',
        component: DashboardPage,
        canActivate: [AuthGuard],
      },
      {
        path: 'notifications',
        component: DashboardPage,
        canActivate: [AuthGuard],
      },
      {
        path: 'settings',
        component: DashboardPage,
        canActivate: [AuthGuard],
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.module').then((m) => m.AuthModule),
    canActivate: [LoginGuard],
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
