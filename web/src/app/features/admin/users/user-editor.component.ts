import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, User, UserCreatePayload, UserUpdatePayload } from '../../../core/services/user.service';
import { RoleService, Role } from '../../../core/services/role.service';
import { AddressService, AddressCreatePayload } from '../../../core/services/address.service';

@Component({
  selector: 'app-user-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-4">
        <div class="flex items-center gap-2 mb-1">
          <button
            (click)="goBack()"
            class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ isEditMode() ? 'Edit User' : 'Create New User' }}
          </h1>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 ml-7">
          {{ isEditMode() ? 'Update user information and manage roles' : 'Add a new user to the system' }}
        </p>
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage()" class="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-900/20">
        <div class="flex items-start gap-2">
          <svg class="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="text-xs font-medium text-red-800 dark:text-red-300">{{ errorMessage() }}</p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <div class="space-y-4">
        <!-- Basic Information -->
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Basic Information</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- First Name -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                name="firstName"
                [value]="formData.firstName"
                (input)="formData.firstName = $any($event.target).value"
                type="text"
                placeholder="John"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <!-- Last Name -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                name="lastName"
                [value]="formData.lastName"
                (input)="formData.lastName = $any($event.target).value"
                type="text"
                placeholder="Doe"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <!-- Email -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span class="text-red-500">*</span>
              </label>
              <input
                name="email"
                [value]="formData.email"
                (input)="formData.email = $any($event.target).value"
                type="email"
                placeholder="john.doe@example.com"
                [disabled]="isEditMode()"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-700"
                required
              />
            </div>

            <!-- Password (Create only) -->
            <div *ngIf="!isEditMode()">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password <span class="text-red-500">*</span>
              </label>
              <input
                name="password"
                [(ngModel)]="formData.password"
                type="password"
                placeholder="••••••••"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                required
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Minimum 8 characters</p>
            </div>

            <!-- Status (Edit only) -->
            <div *ngIf="isEditMode()">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                name="status"
                [(ngModel)]="formData.status"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <!-- Tenant ID -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                User Type
              </label>
              <select
                name="userType"
                [(ngModel)]="userType"
                (ngModelChange)="onUserTypeChange()"
                [disabled]="isEditMode()"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-700"
              >
                <option value="system">System Admin</option>
                <option value="tenant">Tenant User</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Role Assignment -->
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Role Assignment</h2>

          <div *ngIf="roleService.loadingSignal()" class="text-center py-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">Loading roles...</p>
          </div>

          <div *ngIf="!roleService.loadingSignal()" class="space-y-2">
            <div *ngFor="let role of availableRoles()" class="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="checkbox"
                [checked]="isRoleSelected(role.id)"
                (change)="toggleRole(role.id)"
                [id]="'role-' + role.id"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label [for]="'role-' + role.id" class="flex-1 cursor-pointer">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium text-gray-900 dark:text-white">{{ role.name }}</span>
                  <span [class]="'px-1.5 py-0.5 rounded text-xs font-medium ' + (role.space === 'system' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300')">
                    {{ role.space | uppercase }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ role.description || 'No description' }}</p>
              </label>
            </div>

            <div *ngIf="availableRoles().length === 0" class="text-center py-3 text-xs text-gray-500 dark:text-gray-400">
              No roles available for this user type
            </div>
          </div>
        </div>

        <!-- Address Information (Optional) -->
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Address Information</h2>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                [(ngModel)]="includeAddress"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Add address</span>
            </label>
          </div>

          <div *ngIf="includeAddress" class="space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <!-- Address Type -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address Type <span class="text-red-500">*</span>
                </label>
                <select
                  [(ngModel)]="addressData.addressType"
                  class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                >
                  <option value="">Select type</option>
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="billing">Billing</option>
                  <option value="shipping">Shipping</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <!-- Region -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Region <span class="text-red-500">*</span>
                </label>
                <select
                  [(ngModel)]="addressData.region"
                  class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                >
                  <option value="">Select region</option>
                  <option *ngFor="let region of addressService.regionsSignal()" [value]="region.name">
                    {{ region.name }}
                  </option>
                </select>
              </div>

              <!-- Province -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Province <span class="text-red-500">*</span>
                </label>
                <input
                  [(ngModel)]="addressData.province"
                  type="text"
                  placeholder="e.g., Metro Manila"
                  class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>

              <!-- City/Municipality -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City/Municipality <span class="text-red-500">*</span>
                </label>
                <input
                  [(ngModel)]="addressData.cityMunicipality"
                  type="text"
                  placeholder="e.g., Quezon City"
                  class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>

              <!-- Barangay -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Barangay <span class="text-red-500">*</span>
                </label>
                <input
                  [(ngModel)]="addressData.barangay"
                  type="text"
                  placeholder="e.g., Barangay Commonwealth"
                  class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>

              <!-- Zip Code -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Zip Code
                </label>
                <input
                  [(ngModel)]="addressData.zipCode"
                  type="text"
                  placeholder="e.g., 1121"
                  class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <!-- Street -->
              <div class="md:col-span-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Street Address <span class="text-red-500">*</span>
                </label>
                <input
                  [(ngModel)]="addressData.street"
                  type="text"
                  placeholder="e.g., 123 Main Street, Subdivision Name"
                  class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>

              <!-- Landmark -->
              <div class="md:col-span-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Landmark (Optional)
                </label>
                <input
                  [(ngModel)]="addressData.landmark"
                  type="text"
                  placeholder="e.g., Near SM Mall, Across McDonald's"
                  class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <!-- Contact Name -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Name
                </label>
                <input
                  [(ngModel)]="addressData.contactName"
                  type="text"
                  placeholder="Contact person name"
                  class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <!-- Contact Phone -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Phone
                </label>
                <input
                  [(ngModel)]="addressData.contactPhone"
                  type="tel"
                  placeholder="e.g., +63 912 345 6789"
                  class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <!-- Notes -->
              <div class="md:col-span-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  [(ngModel)]="addressData.notes"
                  rows="2"
                  placeholder="Additional delivery instructions or notes"
                  class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                ></textarea>
              </div>

              <!-- Set as Primary -->
              <div class="md:col-span-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    [(ngModel)]="addressData.isPrimary"
                    class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Set as primary address</span>
                </label>
              </div>
            </div>

            <div class="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <p class="text-xs text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> Philippine address format follows: Street → Barangay → City/Municipality → Province → Region
              </p>
            </div>
          </div>

          <div *ngIf="!includeAddress" class="text-center py-3 text-xs text-gray-500 dark:text-gray-400">
            Address can be added later in the user profile
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2">
          <button
            (click)="goBack()"
            type="button"
            class="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            (click)="save()"
            [disabled]="saving() || !isFormValid()"
            class="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {{ saving() ? 'Saving...' : (isEditMode() ? 'Update User' : 'Create User') }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class UserEditorComponent implements OnInit {
  userId: string | null = null;
  isEditMode = signal(false);
  saving = signal(false);
  errorMessage = signal<string | null>(null);
  userType = 'tenant'; // 'system' or 'tenant'

  formData: any = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    status: 'active',
    tenantId: null
  };

  selectedRoles = signal<Set<string>>(new Set());

  // Address fields
  includeAddress = false;
  addressData: any = {
    addressType: 'home',
    street: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    region: '',
    zipCode: '',
    landmark: '',
    isPrimary: true,
    contactPhone: '',
    contactName: '',
    notes: ''
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    public userService: UserService,
    public roleService: RoleService,
    public addressService: AddressService
  ) {}

  async ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(this.userId !== null && this.userId !== 'new');

    // Load roles
    await this.roleService.loadRoles();

    // Load user if editing
    if (this.isEditMode() && this.userId) {
      console.log('🔍 Loading user ID:', this.userId);
      const user = await this.userService.getUser(this.userId);
      console.log('📦 User data received:', user);

      if (user) {
        console.log('✅ User data found:', {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          status: user.status,
          tenantId: user.tenantId,
          roles: user.roles
        });

        // Update form data properties individually to trigger change detection
        this.formData.firstName = user.firstName || '';
        this.formData.lastName = user.lastName || '';
        this.formData.email = user.email;
        this.formData.status = user.status || 'active';
        this.formData.tenantId = user.tenantId;

        console.log('📝 Form data set to:', this.formData);

        // Set user type
        this.userType = user.tenantId ? 'tenant' : 'system';

        // Set selected roles
        if (user.roles) {
          this.selectedRoles.set(new Set(user.roles.map(r => r.id)));
          console.log('👥 Selected roles:', Array.from(this.selectedRoles()));
        }

        // Manually trigger change detection
        this.cdr.detectChanges();
        console.log('🔄 Change detection triggered');
      } else {
        console.error('❌ No user data returned from API');
      }
    }
  }

  availableRoles() {
    const roles = this.roleService.rolesSignal();
    console.log('🎭 All roles:', roles);
    console.log('👤 User type:', this.userType);

    if (this.userType === 'system') {
      const systemRoles = roles.filter(r => r.space === 'system');
      console.log('🔧 System roles:', systemRoles);
      return systemRoles;
    } else {
      const tenantRoles = roles.filter(r => r.space === 'tenant');
      console.log('🏢 Tenant roles:', tenantRoles);
      return tenantRoles;
    }
  }

  isRoleSelected(roleId: string): boolean {
    return this.selectedRoles().has(roleId);
  }

  toggleRole(roleId: string) {
    const roles = new Set(this.selectedRoles());
    if (roles.has(roleId)) {
      roles.delete(roleId);
    } else {
      roles.add(roleId);
    }
    this.selectedRoles.set(roles);
  }

  onUserTypeChange() {
    // Clear selected roles when user type changes
    this.selectedRoles.set(new Set());

    // Set tenantId based on user type
    this.formData.tenantId = this.userType === 'system' ? null : undefined;
  }

  isFormValid(): boolean {
    if (!this.formData.email) return false;
    if (!this.isEditMode() && !this.formData.password) return false;
    if (!this.isEditMode() && this.formData.password.length < 8) return false;
    return true;
  }

  async save() {
    if (!this.isFormValid() || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    try {
      let user: User | null = null;

      if (this.isEditMode() && this.userId) {
        // Update existing user
        const updatePayload: UserUpdatePayload = {
          firstName: this.formData.firstName,
          lastName: this.formData.lastName,
          email: this.formData.email,
          status: this.formData.status
        };
        user = await this.userService.updateUser(this.userId, updatePayload);
      } else {
        // Create new user
        const createPayload: UserCreatePayload = {
          email: this.formData.email,
          password: this.formData.password,
          firstName: this.formData.firstName,
          lastName: this.formData.lastName,
          tenantId: this.userType === 'system' ? null : undefined
        };
        user = await this.userService.createUser(createPayload);
      }

      if (user) {
        // Update roles (if editing)
        if (this.isEditMode() && this.userId) {
          // Get current roles from loaded user data
          const currentUser = await this.userService.getUser(this.userId);
          const currentRoleIds = new Set(currentUser?.roles?.map(r => r.id) || []);
          const selectedRoleIds = this.selectedRoles();

          console.log('🔄 Updating roles:', {
            current: Array.from(currentRoleIds),
            selected: Array.from(selectedRoleIds)
          });

          // Remove roles that are no longer selected
          for (const roleId of currentRoleIds) {
            if (!selectedRoleIds.has(roleId)) {
              console.log(`➖ Removing role ${roleId}`);
              await this.userService.removeRole(user.id, roleId);
            }
          }

          // Add newly selected roles
          for (const roleId of selectedRoleIds) {
            if (!currentRoleIds.has(roleId)) {
              console.log(`➕ Adding role ${roleId}`);
              await this.userService.assignRole(user.id, roleId);
            }
          }
        } else if (!this.isEditMode()) {
          // For new users, just assign selected roles
          if (this.selectedRoles().size > 0) {
            for (const roleId of this.selectedRoles()) {
              await this.userService.assignRole(user.id, roleId);
            }
          }
        }

        // Create address if included
        if (this.includeAddress && this.isAddressValid()) {
          try {
            const addressPayload: AddressCreatePayload = {
              userId: user.id,
              addressType: this.addressData.addressType,
              street: this.addressData.street,
              barangay: this.addressData.barangay,
              cityMunicipality: this.addressData.cityMunicipality,
              province: this.addressData.province,
              region: this.addressData.region,
              zipCode: this.addressData.zipCode || undefined,
              country: 'Philippines',
              landmark: this.addressData.landmark || undefined,
              isPrimary: this.addressData.isPrimary,
              contactPhone: this.addressData.contactPhone || undefined,
              contactName: this.addressData.contactName || undefined,
              notes: this.addressData.notes || undefined
            };
            await this.addressService.createAddress(addressPayload);
            console.log('✅ Address created successfully');
          } catch (addressError) {
            console.error('⚠️ User created but address failed:', addressError);
            // Don't fail the whole operation if address creation fails
          }
        }

        console.log('✅ User saved successfully');
        this.router.navigate(['/admin/users']);
      } else {
        this.errorMessage.set('Failed to save user. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error saving user:', error);
      this.errorMessage.set(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      this.saving.set(false);
    }
  }

  isAddressValid(): boolean {
    if (!this.includeAddress) return true;

    return !!(
      this.addressData.addressType &&
      this.addressData.street &&
      this.addressData.barangay &&
      this.addressData.cityMunicipality &&
      this.addressData.province &&
      this.addressData.region
    );
  }

  goBack() {
    this.router.navigate(['/admin/users']);
  }
}
