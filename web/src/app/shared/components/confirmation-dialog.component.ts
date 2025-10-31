import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from '../../core/services/confirmation.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Backdrop -->
    <div
      *ngIf="confirmationService.isVisible()"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] animate-fade-in"
      (click)="confirmationService.onCancel()"
    ></div>

    <!-- Dialog -->
    <div
      *ngIf="confirmationService.isVisible()"
      class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[90vw] max-w-md animate-scale-in"
    >
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Header with Icon -->
        <div [class]="getHeaderClasses()">
          <div class="flex items-start gap-4">
            <!-- Icon -->
            <div [class]="getIconClasses()">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <!-- Info Icon -->
                <path *ngIf="confirmationService.config().type === 'info'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

                <!-- Warning Icon -->
                <path *ngIf="confirmationService.config().type === 'warning' || confirmationService.config().icon === 'disable'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />

                <!-- Danger/Delete Icon -->
                <path *ngIf="confirmationService.config().type === 'danger' || confirmationService.config().icon === 'trash'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />

                <!-- Success/Enable Icon -->
                <path *ngIf="confirmationService.config().type === 'success' || confirmationService.config().icon === 'enable'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <!-- Title & Message -->
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-1">
                {{ confirmationService.config().title }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed" [innerHTML]="confirmationService.config().message">
              </p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2 px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <button
            (click)="confirmationService.onCancel()"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
          >
            {{ confirmationService.config().cancelText }}
          </button>
          <button
            (click)="confirmationService.onConfirm()"
            [class]="getConfirmButtonClasses()"
          >
            {{ confirmationService.config().confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scale-in {
      from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }

    .animate-fade-in {
      animation: fade-in 0.15s ease-out;
    }

    .animate-scale-in {
      animation: scale-in 0.2s ease-out;
    }
  `]
})
export class ConfirmationDialogComponent {
  confirmationService = inject(ConfirmationService);

  getHeaderClasses(): string {
    return 'px-5 py-4';
  }

  getIconClasses(): string {
    const type = this.confirmationService.config().type;
    const baseClasses = 'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center';

    const typeClasses: Record<string, string> = {
      info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
      danger: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      success: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
    };

    return `${baseClasses} ${typeClasses[type || 'info']}`;
  }

  getConfirmButtonClasses(): string {
    const type = this.confirmationService.config().type;
    const baseClasses = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const typeClasses: Record<string, string> = {
      info: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
    };

    return `${baseClasses} ${typeClasses[type || 'info']}`;
  }
}
