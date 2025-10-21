import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  okButtonText?: string;
  cancelButtonText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    this.data.okButtonText = this.data.okButtonText || 'OK';
    this.data.cancelButtonText = this.data.cancelButtonText || 'Cancel';
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onOk(): void {
    this.dialogRef.close(true);
  }
}
