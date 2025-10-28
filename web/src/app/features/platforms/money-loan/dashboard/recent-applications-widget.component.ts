import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface RecentApplication {
  id: number;
  referenceNumber: string;
  applicantName: string;
  loanProduct: string;
  loanAmount: number;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedDate: string;
}

@Component({
  selector: 'app-recent-applications-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Recent Applications</h3>
          <button (click)="viewAll()" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">View All</button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4">
        @if (applications().length > 0) {
          <div class="space-y-3">
            @for (app of applications(); track app.id) {
              <div class="p-3 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer"
                   (click)="viewApplication(app.id)">
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ app.applicantName }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ app.referenceNumber }}</p>
                  </div>
                  <span [class]="getStatusClass(app.status)" class="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                    {{ getStatusLabel(app.status) }}
                  </span>
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs text-gray-600 dark:text-gray-400">{{ app.loanProduct }}</p>
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">₱{{ formatNumber(app.loanAmount) }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ getTimeAgo(app.submittedDate) }}</p>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Summary Footer -->
          <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-600 dark:text-gray-400">Total this week:</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{ totalThisWeek() }} applications</span>
            </div>
          </div>
        } @else if (loading()) {
          <!-- Loading State -->
          <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Loading applications...</p>
          </div>
        } @else {
          <!-- Empty State -->
          <div class="text-center py-8">
            <svg class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p class="text-sm text-gray-600 dark:text-gray-400">No recent applications</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class RecentApplicationsWidgetComponent implements OnInit {
  private router: Router;

  applications = signal<RecentApplication[]>([]);
  loading = signal(true);
  totalThisWeek = signal(0);

  constructor(router: Router) {
    this.router = router;
  }

  ngOnInit() {
    this.loadRecentApplications();
  }

  loadRecentApplications() {
    // TODO: Replace with actual API call
    setTimeout(() => {
      this.applications.set([
        {
          id: 1,
          referenceNumber: 'ML-2024-000234',
          applicantName: 'Juan Dela Cruz',
          loanProduct: 'Personal Loan',
          loanAmount: 50000,
          status: 'submitted',
          submittedDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          referenceNumber: 'ML-2024-000233',
          applicantName: 'Maria Santos',
          loanProduct: 'Business Loan',
          loanAmount: 150000,
          status: 'under_review',
          submittedDate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          referenceNumber: 'ML-2024-000232',
          applicantName: 'Pedro Garcia',
          loanProduct: 'Emergency Loan',
          loanAmount: 25000,
          status: 'approved',
          submittedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 4,
          referenceNumber: 'ML-2024-000231',
          applicantName: 'Ana Reyes',
          loanProduct: 'Personal Loan',
          loanAmount: 75000,
          status: 'under_review',
          submittedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 5,
          referenceNumber: 'ML-2024-000230',
          applicantName: 'Carlos Lopez',
          loanProduct: 'Business Loan',
          loanAmount: 200000,
          status: 'rejected',
          submittedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);
      this.totalThisWeek.set(18);
      this.loading.set(false);
    }, 500);
  }

  viewApplication(id: number) {
    this.router.navigate(['/platforms/money-loan/applications', id]);
  }

  viewAll() {
    this.router.navigate(['/platforms/money-loan/applications']);
  }

  getStatusClass(status: string): string {
    const classes = {
      'submitted': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      'under_review': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
      'approved': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      'rejected': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
    };
    return classes[status as keyof typeof classes] || classes['submitted'];
  }

  getStatusLabel(status: string): string {
    const labels = {
      'submitted': 'New',
      'under_review': 'Review',
      'approved': 'Approved',
      'rejected': 'Rejected'
    };
    return labels[status as keyof typeof labels] || status;
  }

  getTimeAgo(date: string): string {
    const now = new Date().getTime();
    const then = new Date(date).getTime();
    const diff = now - then;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  formatNumber(value: number): string {
    return value.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}
