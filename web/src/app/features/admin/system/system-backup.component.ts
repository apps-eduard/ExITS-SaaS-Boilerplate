import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';

interface BackupRecord {
  id: number;
  backup_type: string;
  file_name: string;
  file_size: number;
  status: string;
  created_by: string;
  created_at: string;
  notes?: string;
}

interface BackupSchedule {
  id: number;
  frequency: string;
  time: string;
  retention_days: number;
  enabled: boolean;
}

@Component({
  selector: 'app-system-backup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 sm:p-6 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-4">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">System Backup</h1>
        <p class="text-xs text-gray-600 dark:text-gray-400">Manage database backups and restore points</p>
      </div>

      <!-- Manual Backup Section -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <h2 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Manual Backup</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Backup Type
            </label>
            <select
              [(ngModel)]="backupType"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="full">Full Backup</option>
              <option value="incremental">Incremental</option>
              <option value="differential">Differential</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              [(ngModel)]="backupNotes"
              placeholder="e.g., Before major update"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          (click)="createBackup()"
          [disabled]="creating()"
          class="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded shadow-sm transition"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
          </svg>
          {{ creating() ? 'Creating...' : 'Create Backup Now' }}
        </button>
      </div>

      <!-- Automatic Backup Schedule -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <h2 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Automatic Backup Schedule</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Frequency
            </label>
            <select
              [(ngModel)]="schedule.frequency"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time
            </label>
            <input
              type="time"
              [(ngModel)]="schedule.time"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Retention (Days)
            </label>
            <input
              type="number"
              [(ngModel)]="schedule.retention_days"
              min="1"
              max="365"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              [(ngModel)]="schedule.enabled"
              class="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="text-xs text-gray-700 dark:text-gray-300">Enable automatic backups</span>
          </label>

          <button
            (click)="saveSchedule()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded shadow-sm transition"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Save Schedule
          </button>
        </div>
      </div>

      <!-- Backup History -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-medium text-gray-900 dark:text-white">Backup History</h2>
          <button
            (click)="loadBackups()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded shadow-sm transition"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
        </div>

        <div *ngIf="loading()" class="text-center py-8">
          <div class="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Loading backups...</p>
        </div>

        <div *ngIf="!loading() && backups().length === 0" class="text-center py-8">
          <svg class="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">No backups found</p>
        </div>

        <div *ngIf="!loading() && backups().length > 0" class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">File Name</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Type</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Size</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Created By</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Date</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngFor="let backup of backups()" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="px-3 py-2 text-gray-900 dark:text-white">{{ backup.file_name }}</td>
                <td class="px-3 py-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        [ngClass]="{
                          'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300': backup.backup_type === 'full',
                          'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300': backup.backup_type === 'incremental',
                          'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300': backup.backup_type === 'differential'
                        }">
                    {{ backup.backup_type }}
                  </span>
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ formatFileSize(backup.file_size) }}</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ backup.created_by }}</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ formatDate(backup.created_at) }}</td>
                <td class="px-3 py-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        [ngClass]="{
                          'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300': backup.status === 'completed',
                          'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300': backup.status === 'pending',
                          'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300': backup.status === 'failed'
                        }">
                    {{ backup.status }}
                  </span>
                </td>
                <td class="px-3 py-2">
                  <div class="flex items-center gap-2">
                    <button
                      (click)="downloadBackup(backup.id)"
                      class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                      Download
                    </button>
                    <button
                      (click)="restoreBackup(backup.id)"
                      class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                      Restore
                    </button>
                    <button
                      (click)="deleteBackup(backup.id)"
                      class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class SystemBackupComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private apiUrl = 'http://localhost:3000/api';

  backupType = 'full';
  backupNotes = '';
  creating = signal(false);
  loading = signal(false);
  backups = signal<BackupRecord[]>([]);

  schedule = {
    frequency: 'daily',
    time: '02:00',
    retention_days: 30,
    enabled: false
  };

  ngOnInit() {
    this.loadBackups();
    this.loadSchedule();
  }

  createBackup() {
    this.creating.set(true);

    this.http.post(`${this.apiUrl}/system/backup`, {
      backup_type: this.backupType,
      notes: this.backupNotes
    }).subscribe({
      next: () => {
        this.toastService.success('Backup created successfully');
        this.backupNotes = '';
        this.loadBackups();
        this.creating.set(false);
      },
      error: (error) => {
        this.toastService.error('Failed to create backup');
        console.error('Backup error:', error);
        this.creating.set(false);
      }
    });
  }

  loadBackups() {
    this.loading.set(true);

    this.http.get<BackupRecord[]>(`${this.apiUrl}/system/backup`).subscribe({
      next: (data) => {
        this.backups.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading backups:', error);
        this.loading.set(false);
      }
    });
  }

  loadSchedule() {
    this.http.get<BackupSchedule>(`${this.apiUrl}/system/backup/schedule`).subscribe({
      next: (data) => {
        if (data) {
          this.schedule = data;
        }
      },
      error: (error) => {
        console.error('Error loading schedule:', error);
      }
    });
  }

  saveSchedule() {
    this.http.post(`${this.apiUrl}/system/backup/schedule`, this.schedule).subscribe({
      next: () => {
        this.toastService.success('Backup schedule saved successfully');
      },
      error: (error) => {
        this.toastService.error('Failed to save backup schedule');
        console.error('Schedule error:', error);
      }
    });
  }

  downloadBackup(id: number) {
    window.open(`${this.apiUrl}/system/backup/${id}/download`, '_blank');
  }

  restoreBackup(id: number) {
    if (confirm('Are you sure you want to restore this backup? This will overwrite current data.')) {
      this.http.post(`${this.apiUrl}/system/backup/${id}/restore`, {}).subscribe({
        next: () => {
          this.toastService.success('Backup restored successfully');
        },
        error: (error) => {
          this.toastService.error('Failed to restore backup');
          console.error('Restore error:', error);
        }
      });
    }
  }

  deleteBackup(id: number) {
    if (confirm('Are you sure you want to delete this backup?')) {
      this.http.delete(`${this.apiUrl}/system/backup/${id}`).subscribe({
        next: () => {
          this.toastService.success('Backup deleted successfully');
          this.loadBackups();
        },
        error: (error) => {
          this.toastService.error('Failed to delete backup');
          console.error('Delete error:', error);
        }
      });
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
