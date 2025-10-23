import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ConfirmationDialogComponent } from './shared/components/confirmation-dialog.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, ConfirmationDialogComponent],
  template: `
    <router-outlet />
    <app-toast />
    <app-confirmation-dialog />
  `
})
export class App {
  // Initialize theme service at app startup
  private themeService = inject(ThemeService);
}
