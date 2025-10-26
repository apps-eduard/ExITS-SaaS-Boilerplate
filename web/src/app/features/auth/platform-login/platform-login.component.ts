import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { PlatformSelectorModalComponent } from '../../../shared/components/platform-selector-modal/platform-selector-modal.component';

@Component({
  selector: 'app-platform-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PlatformSelectorModalComponent],
  templateUrl: './platform-login.component.html',
  styles: []
})
export class PlatformLoginComponent {
  error = '';

  authService = inject(AuthService);
  toastService = inject(ToastService);
  themeService = inject(ThemeService);
  router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  
  // Platform selector state
  showPlatformSelector = signal(false);
  userPlatforms = signal<any[]>([]);

  fillCredentials(account: { email: string; password: string }) {
    this.email = account.email;
    this.password = account.password;
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.toastService.warning('Please enter email and password');
      return;
    }

    this.loading.set(true);

    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        this.loading.set(false);
        this.toastService.success(`Welcome back, ${response.data.user.first_name}!`);

        const user = response.data.user;
        const platforms = response.data.platforms || [];

        // Platform login is ONLY for tenant users with platform access
        const isSystemAdmin = user.tenant_id === null || user.tenant_id === undefined;

        if (isSystemAdmin) {
          this.error = 'This login is for platform employees only. Please use the main login.';
          this.toastService.error('This login is for platform employees only');
          this.authService.logout().subscribe();
          return;
        }

        // Tenant User with NO platforms → Error (shouldn't use platform login)
        if (platforms.length === 0) {
          this.error = 'No platform access found. Please contact your administrator.';
          this.toastService.error('No platform access found');
          this.authService.logout().subscribe();
          return;
        }

        // Tenant User with SINGLE platform → Auto-route to that platform
        if (platforms.length === 1) {
          const route = this.getPlatformRoute(platforms[0].productType);
          console.log(`✅ Single platform detected: ${platforms[0].productType} → ${route}`);
          this.router.navigate([route]);
          return;
        }

        // Tenant User with MULTIPLE platforms → Show selector modal
        console.log(`🎯 Multiple platforms detected (${platforms.length}), showing selector`);
        this.userPlatforms.set(platforms);
        this.showPlatformSelector.set(true);
      },
      error: (error: any) => {
        this.loading.set(false);
        const message = error.error?.message || 'Login failed. Please check your credentials.';
        this.toastService.error(message);
        this.error = message;
      }
    });
  }

  onPlatformSelected(route: string) {
    console.log(`✅ Platform selected: ${route}`);
    this.showPlatformSelector.set(false);
    this.router.navigate([route]);
  }

  getPlatformRoute(productType: string): string {
    const routes: Record<string, string> = {
      'money_loan': '/platforms/money-loan/dashboard',
      'bnpl': '/platforms/bnpl/dashboard',
      'pawnshop': '/platforms/pawnshop/dashboard'
    };
    return routes[productType] || '/tenant/dashboard';
  }
}
