import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ConfirmationDialogComponent } from './shared/components/confirmation-dialog.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, ConfirmationDialogComponent],
  template: `
    <div class="min-h-screen">
      <router-outlet />
      <app-toast />
      <app-confirmation-dialog />
    </div>
  `
})
export class App implements OnInit {
  // Initialize theme service at app startup
  private themeService = inject(ThemeService);
  private router = inject(Router);

  ngOnInit() {
    console.log('App initialized, current route:', this.router.url);
  }
}
