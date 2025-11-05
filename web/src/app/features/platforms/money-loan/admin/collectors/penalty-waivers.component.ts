/**
 * Penalty Waiver Approval Component
 *
 * Approve or reject penalty waiver requests from collectors.
 *
 * Features:
 * - Pending waiver requests queue
 * - Approve/reject with notes
 * - Waiver history and audit trail
 * - Quick filters and search
 * - Compact card-based layout
 *
 * Route: /platforms/money-loan/dashboard/collectors/waivers
 */

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../../../../../core/services/toast.service';

interface PenaltyWaiver {
  id: number;
  loanId: number;
  customerId: number;
  customerName: string;
  collectorId: number;
  collectorName: string;
  originalPenalty: number;
  requestedWaiver: number;
  reason: string;
  justification: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNotes?: string;
}

@Component({
  selector: 'app-penalty-waivers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <!-- Compact Header -->
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">💰</span>
            <div>
              <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
                Penalty Waiver Approvals
              </h1>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Review and approve waiver requests
              </p>
            </div>
          </div>
          <button
            (click)="goBack()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back
          </button>
        </div>
      </div>

      <!-- Stats & Filters -->
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div class="flex items-center gap-3 mb-3">
          <div class="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <span class="text-xs font-medium text-orange-700 dark:text-orange-400">Pending</span>
            <span class="text-sm font-bold text-orange-700 dark:text-orange-400">{{ pendingCount() }}</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <span class="text-xs font-medium text-green-700 dark:text-green-400">Approved</span>
            <span class="text-sm font-bold text-green-700 dark:text-green-400">{{ approvedCount() }}</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <span class="text-xs font-medium text-red-700 dark:text-red-400">Rejected</span>
            <span class="text-sm font-bold text-red-700 dark:text-red-400">{{ rejectedCount() }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <select
            [(ngModel)]="filterStatus"
            (change)="loadWaivers()"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <input
            type="search"
            [(ngModel)]="searchTerm"
            (ngModelChange)="filterWaivers()"
            placeholder="Search customer or collector..."
            class="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 overflow-auto p-4">
        
        <!-- Loading State -->
        @if (loading()) {
          <div class="flex items-center justify-center h-64">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        }

        @if (!loading()) {
          <!-- Waiver Cards -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
            @for (waiver of filteredWaivers(); track waiver.id) {
              <div class="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm overflow-hidden"
                [class]="waiver.status === 'pending' ? 'border-orange-200 dark:border-orange-900/30' : waiver.status === 'approved' ? 'border-green-200 dark:border-green-900/30' : 'border-red-200 dark:border-red-900/30'">
                
                <!-- Header -->
                <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
                  [class]="waiver.status === 'pending' ? 'bg-orange-50 dark:bg-orange-900/10' : waiver.status === 'approved' ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                      {{ getInitials(waiver.customerName) }}
                    </div>
                    <div>
                      <div class="text-sm font-semibold text-gray-900 dark:text-white">
                        {{ waiver.customerName }}
                      </div>
                      <div class="text-xs text-gray-600 dark:text-gray-400">
                        Loan #{{ waiver.loanId }}
                      </div>
                    </div>
                  </div>
                  <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
                    [class]="waiver.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : waiver.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'">
                    @if (waiver.status === 'pending') {
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                      </svg>
                    } @else if (waiver.status === 'approved') {
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                    } @else {
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                      </svg>
                    }
                    {{ waiver.status }}
                  </span>
                </div>

                <!-- Body -->
                <div class="p-4">
                  <!-- Amounts -->
                  <div class="grid grid-cols-2 gap-3 mb-3">
                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                      <div class="text-xs text-gray-600 dark:text-gray-400 mb-1">Original Penalty</div>
                      <div class="text-lg font-bold text-red-700 dark:text-red-400">₱{{ waiver.originalPenalty | number:'1.2-2' }}</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                      <div class="text-xs text-gray-600 dark:text-gray-400 mb-1">Requested Waiver</div>
                      <div class="text-lg font-bold text-green-700 dark:text-green-400">₱{{ waiver.requestedWaiver | number:'1.2-2' }}</div>
                    </div>
                  </div>

                  <!-- Collector -->
                  <div class="flex items-center gap-2 mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <svg class="w-4 h-4 text-blue-700 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                    </svg>
                    <span class="text-xs text-gray-600 dark:text-gray-400">Requested by:</span>
                    <span class="text-sm font-medium text-gray-900 dark:text-white">{{ waiver.collectorName }}</span>
                  </div>

                  <!-- Reason -->
                  <div class="mb-3">
                    <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Reason</div>
                    <div class="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                      {{ waiver.reason }}
                    </div>
                  </div>

                  <!-- Justification -->
                  @if (waiver.justification) {
                    <div class="mb-3">
                      <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Justification</div>
                      <div class="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 rounded p-2 italic">
                        "{{ waiver.justification }}"
                      </div>
                    </div>
                  }

                  <!-- Review Notes -->
                  @if (waiver.reviewNotes) {
                    <div class="mb-3">
                      <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Review Notes</div>
                      <div class="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                        {{ waiver.reviewNotes }}
                      </div>
                    </div>
                  }

                  <!-- Timestamp -->
                  <div class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Requested {{ formatDateTime(waiver.requestedAt) }}
                    @if (waiver.reviewedAt) {
                      · Reviewed {{ formatDateTime(waiver.reviewedAt) }}
                    }
                  </div>

                  <!-- Actions (Only for pending) -->
                  @if (waiver.status === 'pending') {
                    <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
                      @if (reviewingId() === waiver.id) {
                        <div class="space-y-2">
                          <textarea
                            [(ngModel)]="reviewNotes"
                            placeholder="Add review notes..."
                            rows="2"
                            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"></textarea>
                          <div class="flex gap-2">
                            <button
                              (click)="approveWaiver(waiver.id)"
                              class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                              </svg>
                              Approve
                            </button>
                            <button
                              (click)="rejectWaiver(waiver.id)"
                              class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                              </svg>
                              Reject
                            </button>
                            <button
                              (click)="cancelReview()"
                              class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                              Cancel
                            </button>
                          </div>
                        </div>
                      } @else {
                        <button
                          (click)="startReview(waiver.id)"
                          class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors">
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                          </svg>
                          Review Request
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            } @empty {
              <div class="col-span-2 flex flex-col items-center justify-center py-12">
                <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">No waiver requests found</div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class PenaltyWaiversComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toastService = inject(ToastService);

  waivers = signal<PenaltyWaiver[]>([]);
  filteredWaivers = signal<PenaltyWaiver[]>([]);
  loading = signal(false);
  filterStatus = signal<string>('');
  searchTerm = signal<string>('');
  reviewingId = signal<number | null>(null);
  reviewNotes = signal<string>('');

  pendingCount = computed(() => this.waivers().filter(w => w.status === 'pending').length);
  approvedCount = computed(() => this.waivers().filter(w => w.status === 'approved').length);
  rejectedCount = computed(() => this.waivers().filter(w => w.status === 'rejected').length);

  ngOnInit(): void {
    this.loadWaivers();
  }

  async loadWaivers(): Promise<void> {
    this.loading.set(true);
    try {
      const params = this.filterStatus() ? `?status=${this.filterStatus()}` : '';
      const response: any = await this.http.get(`/api/money-loan/penalty-waivers${params}`).toPromise();
      
      const data = response?.data || response || [];
      this.waivers.set(data);
      this.filterWaivers();
    } catch (error: any) {
      console.error('Error loading waivers:', error);
      this.waivers.set([]);
      this.toastService.error(error.error?.message || 'Failed to load penalty waivers');
    } finally {
      this.loading.set(false);
    }
  }

  filterWaivers(): void {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      this.filteredWaivers.set(this.waivers());
      return;
    }

    const filtered = this.waivers().filter(w =>
      w.customerName.toLowerCase().includes(term) ||
      w.collectorName.toLowerCase().includes(term)
    );
    this.filteredWaivers.set(filtered);
  }

  startReview(id: number): void {
    this.reviewingId.set(id);
    this.reviewNotes.set('');
  }

  cancelReview(): void {
    this.reviewingId.set(null);
    this.reviewNotes.set('');
  }

  async approveWaiver(id: number): Promise<void> {
    try {
      await this.http.put(`/api/money-loan/penalty-waivers/${id}/approve`, {
        reviewNotes: this.reviewNotes()
      }).toPromise();
      
      this.toastService.success('Penalty waiver approved successfully');
      this.reviewingId.set(null);
      this.reviewNotes.set('');
      this.loadWaivers();
    } catch (error: any) {
      console.error('Error approving waiver:', error);
      this.toastService.error(error.error?.message || 'Failed to approve waiver');
    }
  }

  async rejectWaiver(id: number): Promise<void> {
    try {
      await this.http.put(`/api/money-loan/penalty-waivers/${id}/reject`, {
        reviewNotes: this.reviewNotes()
      }).toPromise();
      
      this.toastService.success('Penalty waiver rejected');
      this.reviewingId.set(null);
      this.reviewNotes.set('');
      this.loadWaivers();
    } catch (error: any) {
      console.error('Error rejecting waiver:', error);
      this.toastService.error(error.error?.message || 'Failed to reject waiver');
    }
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  goBack(): void {
    this.router.navigate(['/platforms/money-loan/dashboard']);
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}
