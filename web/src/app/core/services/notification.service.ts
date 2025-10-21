/**
 * Notification Service
 * Handles toast notifications
 */

import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly DEFAULT_DURATION = 3000;

  constructor(private snackBar: MatSnackBar) {}

  showSuccess(message: string, duration: number = this.DEFAULT_DURATION): void {
    this.showNotification(message, 'success-snackbar', duration);
  }

  showError(message: string, duration: number = this.DEFAULT_DURATION): void {
    this.showNotification(message, 'error-snackbar', duration);
  }

  showInfo(message: string, duration: number = this.DEFAULT_DURATION): void {
    this.showNotification(message, 'info-snackbar', duration);
  }

  showWarning(message: string, duration: number = this.DEFAULT_DURATION): void {
    this.showNotification(message, 'warning-snackbar', duration);
  }

  private showNotification(message: string, panelClass: string, duration: number): void {
    const config: MatSnackBarConfig = {
      duration,
      panelClass: [panelClass],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    };

    this.snackBar.open(message, 'Close', config);
  }
}
