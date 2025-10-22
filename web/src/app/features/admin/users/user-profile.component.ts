import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-4 max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button
            (click)="goBack()"
            class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">User Profile</h1>
        </div>
        <button
          [routerLink]="'/admin/users/' + userId"
          class="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          ✏️ Edit Profile
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="userService.loadingSignal()" class="text-center py-12">
        <p class="text-sm text-gray-500 dark:text-gray-400">Loading user profile...</p>
      </div>

      <!-- User Profile Content -->
      <div *ngIf="!userService.loadingSignal() && user()" class="space-y-6">
        <!-- Profile Header Card -->
        <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div class="flex items-start gap-6">
            <!-- Avatar -->
            <div class="flex-shrink-0">
              <div class="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <span class="text-3xl font-bold text-white">
                  {{ getInitials() }}
                </span>
              </div>
            </div>

            <!-- Basic Info -->
            <div class="flex-1">
              <div class="flex items-start justify-between">
                <div>
                  <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    {{ user()?.fullName || user()?.firstName || user()?.email }}
                  </h2>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ user()?.email }}</p>
                </div>
                <span [class]="'px-3 py-1 rounded-full text-xs font-medium ' + getStatusClass()">
                  {{ user()?.status | titlecase }}
                </span>
              </div>

              <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">User ID</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {{ user()?.id.substring(0, 8) }}...
                  </p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Type</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {{ user()?.tenantId ? 'Tenant User' : 'System Admin' }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Created</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {{ formatDate(user()?.createdAt) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Last Login</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {{ user()?.lastLogin ? formatDate(user()?.lastLogin) : 'Never' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Roles & Permissions -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Roles -->
          <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assigned Roles</h3>
            
            <div *ngIf="user()?.roles && user()!.roles!.length > 0" class="space-y-2">
              <div *ngFor="let role of user()?.roles" class="flex items-center justify-between p-3 rounded border border-gray-200 dark:border-gray-700">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ role.name }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ role.space }} role</p>
                </div>
                <button
                  (click)="removeRole(role.id)"
                  class="text-red-600 hover:text-red-700 dark:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Remove role"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div *ngIf="!user()?.roles || user()!.roles!.length === 0" class="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
              No roles assigned
            </div>

            <button
              (click)="showAddRole.set(true)"
              class="mt-4 w-full rounded border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-800 transition"
            >
              + Add Role
            </button>

            <!-- Add Role Modal -->
            <div *ngIf="showAddRole()" class="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Select Role</h4>
                <button
                  (click)="showAddRole.set(false)"
                  class="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <select
                [(ngModel)]="selectedRoleToAdd"
                class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white mb-2"
              >
                <option value="">Select a role...</option>
                <option *ngFor="let role of availableRolesToAdd()" [value]="role.id">
                  {{ role.name }} ({{ role.space }})
                </option>
              </select>
              <button
                (click)="addRole()"
                [disabled]="!selectedRoleToAdd"
                class="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Add Role
              </button>
            </div>
          </div>

          <!-- Activity Stats -->
          <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Overview</h3>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 rounded bg-gray-50 dark:bg-gray-800">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">Total Logins</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">All time</p>
                  </div>
                </div>
                <span class="text-2xl font-bold text-gray-900 dark:text-white">--</span>
              </div>

              <div class="flex items-center justify-between p-3 rounded bg-gray-50 dark:bg-gray-800">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">Actions Performed</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Last 30 days</p>
                  </div>
                </div>
                <span class="text-2xl font-bold text-gray-900 dark:text-white">--</span>
              </div>

              <div class="flex items-center justify-between p-3 rounded bg-gray-50 dark:bg-gray-800">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">Avg. Session Time</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Last 7 days</p>
                  </div>
                </div>
                <span class="text-2xl font-bold text-gray-900 dark:text-white">--</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tenant Information (if tenant user) -->
        <div *ngIf="user()?.tenantId" class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tenant Information</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Tenant Name</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">
                {{ user()?.tenant?.name || 'N/A' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Tenant ID</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">
                {{ user()?.tenantId.substring(0, 8) }}...
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Subscription</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">Active</p>
            </div>
          </div>
        </div>

        <!-- Recent Activity Log -->
        <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          
          <div class="space-y-3">
            <div class="flex items-start gap-3 p-3 rounded bg-gray-50 dark:bg-gray-800">
              <div class="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">User logged in</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">2 hours ago • IP: 192.168.1.1</p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 rounded bg-gray-50 dark:bg-gray-800">
              <div class="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">Profile updated</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">1 day ago</p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 rounded bg-gray-50 dark:bg-gray-800">
              <div class="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">Role assigned: Support</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">3 days ago</p>
              </div>
            </div>

            <div class="text-center py-4">
              <p class="text-xs text-gray-500 dark:text-gray-400">Activity logs coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserProfileComponent implements OnInit {
  userId: string | null = null;
  user = signal<User | null>(null);
  showAddRole = signal(false);
  selectedRoleToAdd = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public userService: UserService,
    public roleService: RoleService
  ) {}

  async ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id');
    
    if (this.userId) {
      await this.roleService.loadRoles();
      const user = await this.userService.getUser(this.userId);
      if (user) {
        this.user.set(user);
      }
    }
  }

  getInitials(): string {
    const u = this.user();
    if (!u) return '?';
    
    if (u.firstName && u.lastName) {
      return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    }
    if (u.fullName) {
      const parts = u.fullName.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    return u.email[0].toUpperCase();
  }

  getStatusClass(): string {
    const status = this.user()?.status;
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'suspended':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString();
  }

  availableRolesToAdd() {
    const userRoleIds = this.user()?.roles?.map(r => r.id) || [];
    const userType = this.user()?.tenantId ? 'tenant' : 'system';
    return this.roleService.rolesSignal()
      .filter(r => r.space === userType && !userRoleIds.includes(r.id));
  }

  async addRole() {
    if (!this.selectedRoleToAdd || !this.userId) return;
    
    await this.userService.assignRole(this.userId, this.selectedRoleToAdd);
    
    // Reload user
    const updatedUser = await this.userService.getUser(this.userId);
    if (updatedUser) {
      this.user.set(updatedUser);
    }
    
    this.showAddRole.set(false);
    this.selectedRoleToAdd = '';
  }

  async removeRole(roleId: string) {
    if (!this.userId) return;
    
    const confirmed = confirm('Remove this role from the user?');
    if (!confirmed) return;
    
    await this.userService.removeRole(this.userId, roleId);
    
    // Reload user
    const updatedUser = await this.userService.getUser(this.userId);
    if (updatedUser) {
      this.user.set(updatedUser);
    }
  }

  goBack() {
    this.router.navigate(['/admin/users']);
  }
}
