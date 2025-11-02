import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';

export interface ConfirmationOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger';
  icon?: string;
  backdropDismiss?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  constructor(private alertController: AlertController) {}

  /**
   * Show a modern, aesthetic confirmation dialog
   * @param options Configuration options for the confirmation dialog
   * @returns Promise<boolean> - true if confirmed, false if canceled
   */
  async confirm(options: ConfirmationOptions): Promise<boolean> {
    const {
      title = 'Confirm Action',
      message,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmColor = 'primary',
      icon,
      backdropDismiss = true
    } = options;

    const alert = await this.alertController.create({
      header: title,
      message: message,
      backdropDismiss,
      cssClass: 'modern-confirmation-alert',
      buttons: [
        {
          text: cancelText,
          role: 'cancel',
          cssClass: 'alert-button-cancel',
        },
        {
          text: confirmText,
          role: 'confirm',
          cssClass: `alert-button-confirm alert-button-${confirmColor}`,
        }
      ]
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

  /**
   * Show a logout confirmation dialog
   */
  async confirmLogout(): Promise<boolean> {
    return this.confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out from your account?',
      confirmText: 'Sign Out',
      cancelText: 'Stay',
      confirmColor: 'danger'
    });
  }

  /**
   * Show a delete confirmation dialog
   */
  async confirmDelete(itemName?: string): Promise<boolean> {
    return this.confirm({
      title: 'Delete Item',
      message: itemName 
        ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
        : 'Are you sure you want to delete this item? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmColor: 'danger'
    });
  }

  /**
   * Show a save confirmation dialog
   */
  async confirmSave(): Promise<boolean> {
    return this.confirm({
      title: 'Save Changes',
      message: 'Do you want to save your changes?',
      confirmText: 'Save',
      cancelText: 'Discard',
      confirmColor: 'success'
    });
  }

  /**
   * Show a custom warning confirmation
   */
  async confirmWarning(message: string, title?: string): Promise<boolean> {
    return this.confirm({
      title: title || 'Warning',
      message,
      confirmText: 'Continue',
      cancelText: 'Cancel',
      confirmColor: 'warning'
    });
  }
}
