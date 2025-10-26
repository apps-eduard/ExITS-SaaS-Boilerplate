import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';

interface SecurityPolicy {
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_special: boolean;
  password_expiry_days: number;
  session_timeout_minutes: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  mfa_required: boolean;
  ip_whitelist_enabled: boolean;
  ip_blacklist_enabled: boolean;
}

interface IPAddress {
  id: number;
  ip_address: string;
  type: 'whitelist' | 'blacklist';
  description: string;
  created_at: string;
}

@Component({
  selector: 'app-security-policy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 sm:p-6 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-4">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Security Policy</h1>
        <p class="text-xs text-gray-600 dark:text-gray-400">Configure system security settings and policies</p>
      </div>

      <!-- Password Policy -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <h2 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Password Policy</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Minimum Length
            </label>
            <input
              type="number"
              [(ngModel)]="policy.password_min_length"
              min="6"
              max="32"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password Expiry (Days)
            </label>
            <input
              type="number"
              [(ngModel)]="policy.password_expiry_days"
              min="0"
              max="365"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Set to 0 for no expiry</p>
          </div>
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              [(ngModel)]="policy.password_require_uppercase"
              class="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="text-xs text-gray-700 dark:text-gray-300">Require uppercase letters (A-Z)</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              [(ngModel)]="policy.password_require_lowercase"
              class="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="text-xs text-gray-700 dark:text-gray-300">Require lowercase letters (a-z)</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              [(ngModel)]="policy.password_require_numbers"
              class="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="text-xs text-gray-700 dark:text-gray-300">Require numbers (0-9)</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              [(ngModel)]="policy.password_require_special"
              class="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="text-xs text-gray-700 dark:text-gray-300">Require special characters (!@#$%)</span>
          </label>
        </div>
      </div>

      <!-- Session & Login Security -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <h2 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Session & Login Security</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Session Timeout (Minutes)
            </label>
            <input
              type="number"
              [(ngModel)]="policy.session_timeout_minutes"
              min="5"
              max="1440"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Login Attempts
            </label>
            <input
              type="number"
              [(ngModel)]="policy.max_login_attempts"
              min="1"
              max="10"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Lockout Duration (Minutes)
            </label>
            <input
              type="number"
              [(ngModel)]="policy.lockout_duration_minutes"
              min="5"
              max="120"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            [(ngModel)]="policy.mfa_required"
            class="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span class="text-xs text-gray-700 dark:text-gray-300">Require Multi-Factor Authentication (MFA) for all users</span>
        </label>
      </div>

      <!-- IP Access Control -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <h2 class="text-sm font-medium text-gray-900 dark:text-white mb-3">IP Access Control</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              [(ngModel)]="policy.ip_whitelist_enabled"
              class="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="text-xs text-gray-700 dark:text-gray-300">Enable IP Whitelist (allow only listed IPs)</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              [(ngModel)]="policy.ip_blacklist_enabled"
              class="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="text-xs text-gray-700 dark:text-gray-300">Enable IP Blacklist (block listed IPs)</span>
          </label>
        </div>

        <!-- Add IP Address -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          <input
            type="text"
            [(ngModel)]="newIP.ip_address"
            placeholder="192.168.1.1"
            class="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
          />
          <select
            [(ngModel)]="newIP.type"
            class="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="whitelist">Whitelist</option>
            <option value="blacklist">Blacklist</option>
          </select>
          <button
            (click)="addIP()"
            class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add IP
          </button>
        </div>

        <!-- IP List -->
        <div *ngIf="ipList().length > 0" class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">IP Address</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Type</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Description</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Added</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngFor="let ip of ipList()" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="px-3 py-2 text-gray-900 dark:text-white">{{ ip.ip_address }}</td>
                <td class="px-3 py-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        [ngClass]="{
                          'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300': ip.type === 'whitelist',
                          'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300': ip.type === 'blacklist'
                        }">
                    {{ ip.type }}
                  </span>
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ ip.description || '-' }}</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ formatDate(ip.created_at) }}</td>
                <td class="px-3 py-2">
                  <button
                    (click)="deleteIP(ip.id)"
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Remove
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button
          (click)="savePolicy()"
          [disabled]="saving()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded shadow-sm transition"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          {{ saving() ? 'Saving...' : 'Save Security Policy' }}
        </button>
      </div>
    </div>
  `
})
export class SecurityPolicyComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private apiUrl = 'http://localhost:3000/api';

  saving = signal(false);
  ipList = signal<IPAddress[]>([]);

  policy: SecurityPolicy = {
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_special: true,
    password_expiry_days: 90,
    session_timeout_minutes: 30,
    max_login_attempts: 5,
    lockout_duration_minutes: 15,
    mfa_required: false,
    ip_whitelist_enabled: false,
    ip_blacklist_enabled: false
  };

  newIP = {
    ip_address: '',
    type: 'whitelist' as 'whitelist' | 'blacklist',
    description: ''
  };

  ngOnInit() {
    this.loadPolicy();
    this.loadIPList();
  }

  loadPolicy() {
    this.http.get<SecurityPolicy>(`${this.apiUrl}/system/security-policy`).subscribe({
      next: (data) => {
        if (data) {
          this.policy = data;
        }
      },
      error: (error) => {
        console.error('Error loading policy:', error);
      }
    });
  }

  savePolicy() {
    this.saving.set(true);

    this.http.post(`${this.apiUrl}/system/security-policy`, this.policy).subscribe({
      next: () => {
        this.toastService.success('Security policy saved successfully');
        this.saving.set(false);
      },
      error: (error) => {
        this.toastService.error('Failed to save security policy');
        console.error('Save error:', error);
        this.saving.set(false);
      }
    });
  }

  loadIPList() {
    this.http.get<IPAddress[]>(`${this.apiUrl}/system/security-policy/ip-list`).subscribe({
      next: (data) => {
        this.ipList.set(data);
      },
      error: (error) => {
        console.error('Error loading IP list:', error);
      }
    });
  }

  addIP() {
    if (!this.newIP.ip_address) {
      this.toastService.error('Please enter an IP address');
      return;
    }

    this.http.post(`${this.apiUrl}/system/security-policy/ip-list`, this.newIP).subscribe({
      next: () => {
        this.toastService.success('IP address added successfully');
        this.newIP = { ip_address: '', type: 'whitelist', description: '' };
        this.loadIPList();
      },
      error: (error) => {
        this.toastService.error('Failed to add IP address');
        console.error('Add IP error:', error);
      }
    });
  }

  deleteIP(id: number) {
    if (confirm('Are you sure you want to remove this IP address?')) {
      this.http.delete(`${this.apiUrl}/system/security-policy/ip-list/${id}`).subscribe({
        next: () => {
          this.toastService.success('IP address removed successfully');
          this.loadIPList();
        },
        error: (error) => {
          this.toastService.error('Failed to remove IP address');
          console.error('Delete IP error:', error);
        }
      });
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
