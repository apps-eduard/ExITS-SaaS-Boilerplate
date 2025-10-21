import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { TenantService, Tenant } from '../../../../core/services/tenant.service';

@Component({
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.scss']
})
export class GeneralSettingsComponent implements OnInit {
  settingsForm: FormGroup;
  isLoading = false;
  isSaving = false;
  currentTenant: Tenant | null = null;
  tenantId: string = '';

  constructor(
    private fb: FormBuilder,
    private tenantService: TenantService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {
    this.settingsForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      subdomain: ['', [Validators.required, Validators.minLength(2)]],
      plan: ['basic', Validators.required],
      maxUsers: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Get tenant ID from URL or use a default identifier
    this.route.parent?.params.subscribe(params => {
      this.tenantId = params['tenantId'] || 'current';
      this.loadSettings();
    });
  }

  loadSettings(): void {
    this.isLoading = true;
    // For now, load sample data - in production, this would fetch the current tenant
    this.isLoading = false;
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 5000 });
      return;
    }

    this.isSaving = true;
    const formValue = this.settingsForm.value;
    const updateData = {
      name: formValue.name,
      subdomain: formValue.subdomain,
      plan: formValue.plan,
      max_users: formValue.maxUsers
    };

    this.tenantService.updateTenant(this.tenantId, updateData).subscribe({
      next: (tenant) => {
        this.currentTenant = tenant;
        this.snackBar.open('Settings saved successfully', 'Close', { duration: 3000 });
        this.isSaving = false;
      },
      error: () => {
        this.snackBar.open('Failed to save settings', 'Close', { duration: 5000 });
        this.isSaving = false;
      }
    });
  }
}
