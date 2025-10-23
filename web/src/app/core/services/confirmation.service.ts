import { Injectable, signal } from '@angular/core';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  isVisible = signal(false);
  config = signal<ConfirmationConfig>({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'info'
  });

  private resolvePromise?: (value: boolean) => void;

  confirm(config: ConfirmationConfig): Promise<boolean> {
    this.config.set({
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      type: 'info',
      ...config
    });
    this.isVisible.set(true);

    return new Promise((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  onConfirm(): void {
    this.isVisible.set(false);
    if (this.resolvePromise) {
      this.resolvePromise(true);
      this.resolvePromise = undefined;
    }
  }

  onCancel(): void {
    this.isVisible.set(false);
    if (this.resolvePromise) {
      this.resolvePromise(false);
      this.resolvePromise = undefined;
    }
  }

  // Quick confirmation methods
  async delete(itemName: string): Promise<boolean> {
    return this.confirm({
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'trash'
    });
  }

  async disable(itemName: string): Promise<boolean> {
    return this.confirm({
      title: 'Disable Confirmation',
      message: `Are you sure you want to disable "${itemName}"?`,
      confirmText: 'Disable',
      cancelText: 'Cancel',
      type: 'warning',
      icon: 'disable'
    });
  }

  async enable(itemName: string): Promise<boolean> {
    return this.confirm({
      title: 'Enable Confirmation',
      message: `Are you sure you want to enable "${itemName}"?`,
      confirmText: 'Enable',
      cancelText: 'Cancel',
      type: 'success',
      icon: 'enable'
    });
  }
}
