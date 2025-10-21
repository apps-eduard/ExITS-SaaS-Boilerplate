import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { User, UserService } from '@app/core/services/user.service';

interface Role {
  id: string;
  name: string;
}

@Component({
  selector: 'app-user-form-dialog',
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss']
})
export class UserFormDialogComponent implements OnInit {
  form: FormGroup;
  isNew: boolean;
  roles: Role[] = [];
  statuses = ['active', 'inactive', 'suspended'];
  loadingRoles = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    public dialogRef: MatDialogRef<UserFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { isNew: boolean; user?: User }
  ) {
    this.isNew = data.isNew;
    this.form = this.createForm();
    
    if (!this.isNew && data.user) {
      this.form.patchValue({
        email: data.user.email,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        status: data.user.status
      });
      this.form.get('email')?.disable(); // Email cannot be changed
      this.form.get('password')?.clearValidators(); // Password not required for updates
    }
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  private loadRoles(): void {
    this.loadingRoles = true;
    // TODO: Load roles from RoleService once created
    this.roles = [
      { id: '1', name: 'admin' },
      { id: '2', name: 'user' },
      { id: '3', name: 'viewer' }
    ];
    this.loadingRoles = false;
  }

  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      password: ['', this.isNew ? [Validators.required, Validators.minLength(6)] : []],
      role_id: ['', ''],
      status: ['active', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formValue = this.form.getRawValue(); // getRawValue to include disabled fields
      this.dialogRef.close(formValue);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
