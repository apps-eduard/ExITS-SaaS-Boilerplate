import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

interface Application {
  id: number;
  referenceNumber: string;
  applicantName: string;
  loanProduct: string;
  loanAmount: number;
  loanTerm: number;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'disbursed';
  submittedDate: string;
  reviewedDate?: string;
  approvedDate?: string;
  disbursedDate?: string;
  loanOfficer: {
    name: string;
    email: string;
    phone: string;
  };
  disbursementDetails?: {
    accountNumber: string;
    accountName: string;
    bank: string;
    amount: number;
    releaseDate: string;
  };
  rejectionReason?: string;
}

interface Document {
  id: number;
  name: string;
  type: string;
  status: 'pending' | 'submitted' | 'verified' | 'rejected';
  uploadedDate?: string;
  verifiedDate?: string;
  remarks?: string;
}

interface TimelineEvent {
  date: string;
  status: string;
  description: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-loan-status-tracking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4">
      <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Loan Application Status</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Reference: <span class="font-mono font-semibold">{{ application()?.referenceNumber }}</span>
            </p>
          </div>
          <button (click)="goBack()"
            class="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back
          </button>
        </div>

        @if (application()) {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column: Timeline & Details -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Status Overview Card -->
              <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
                <div class="flex items-start justify-between mb-4">
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Current Status</h2>
                    <div class="flex items-center gap-2">
                      <span [class]="getStatusClass(application()!.status)"
                        class="px-2.5 py-1 rounded-full text-xs font-medium">
                        {{ getStatusLabel(application()!.status) }}
                      </span>
                      @if (application()!.status === 'approved' || application()!.status === 'disbursed') {
                        <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                      }
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-gray-500 dark:text-gray-400">Submitted</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDate(application()!.submittedDate) }}</p>
                  </div>
                </div>

                <!-- Loan Details Summary -->
                <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Loan Product</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ application()!.loanProduct }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Loan Amount</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">₱{{ formatNumber(application()!.loanAmount) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Loan Term</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ application()!.loanTerm }} months</p>
                  </div>
                </div>
              </div>

              <!-- Timeline -->
              <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Timeline</h2>

                <div class="relative">
                  <!-- Timeline Line -->
                  <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                  <!-- Timeline Events -->
                  <div class="space-y-6">
                    @for (event of timeline(); track $index) {
                      <div class="relative flex gap-4">
                        <!-- Icon -->
                        <div [class]="'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ' + event.color">
                          @if (event.icon === 'check') {
                            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                            </svg>
                          } @else if (event.icon === 'clock') {
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          } @else if (event.icon === 'document') {
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                          } @else if (event.icon === 'dollar') {
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                            </svg>
                          } @else {
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          }
                        </div>

                        <!-- Content -->
                        <div class="flex-1 pb-6">
                          <div class="flex items-center gap-2 mb-1">
                            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ event.status }}</p>
                            <span class="text-xs text-gray-500 dark:text-gray-400">{{ event.date }}</span>
                          </div>
                          <p class="text-xs text-gray-600 dark:text-gray-400">{{ event.description }}</p>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Disbursement Details (if approved/disbursed) -->
              @if (application()!.disbursementDetails) {
                <div class="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-6 shadow-sm">
                  <div class="flex items-start gap-3 mb-4">
                    <svg class="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <div>
                      <h3 class="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">Loan Disbursed</h3>
                      <p class="text-xs text-green-700 dark:text-green-300">Your loan has been released to your account</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p class="text-xs text-green-700 dark:text-green-400 mb-1">Account Number</p>
                      <p class="text-sm font-mono font-semibold text-green-900 dark:text-green-100">{{ application()!.disbursementDetails?.accountNumber }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-green-700 dark:text-green-400 mb-1">Account Name</p>
                      <p class="text-sm font-medium text-green-900 dark:text-green-100">{{ application()!.disbursementDetails?.accountName }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-green-700 dark:text-green-400 mb-1">Bank</p>
                      <p class="text-sm font-medium text-green-900 dark:text-green-100">{{ application()!.disbursementDetails?.bank }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-green-700 dark:text-green-400 mb-1">Amount Released</p>
                      <p class="text-sm font-semibold text-green-900 dark:text-green-100">₱{{ formatNumber(application()!.disbursementDetails?.amount || 0) }}</p>
                    </div>
                    <div class="col-span-2">
                      <p class="text-xs text-green-700 dark:text-green-400 mb-1">Release Date</p>
                      <p class="text-sm font-medium text-green-900 dark:text-green-100">{{ formatDate(application()!.disbursementDetails?.releaseDate || '') }}</p>
                    </div>
                  </div>
                </div>
              }

              <!-- Rejection Reason (if rejected) -->
              @if (application()!.status === 'rejected' && application()!.rejectionReason) {
                <div class="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 shadow-sm">
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                    <div>
                      <h3 class="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">Application Rejected</h3>
                      <p class="text-xs text-red-700 dark:text-red-300">{{ application()!.rejectionReason }}</p>
                      <button class="mt-3 px-3 py-1.5 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700 transition">
                        Apply Again
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Right Column: Sidebar -->
            <div class="space-y-6">
              <!-- Loan Officer Contact -->
              <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Your Loan Officer</h3>

                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <span class="text-white font-medium text-sm">{{ getInitials(application()!.loanOfficer.name) }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ application()!.loanOfficer.name }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Loan Officer</p>
                  </div>
                </div>

                <div class="space-y-2">
                  <a [href]="'mailto:' + application()!.loanOfficer.email"
                    class="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    {{ application()!.loanOfficer.email }}
                  </a>
                  <a [href]="'tel:' + application()!.loanOfficer.phone"
                    class="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    {{ application()!.loanOfficer.phone }}
                  </a>
                </div>
              </div>

              <!-- Required Documents Checklist -->
              <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Document Checklist</h3>

                <div class="space-y-3">
                  @for (doc of documents(); track doc.id) {
                    <div class="flex items-start gap-3">
                      <div [class]="getDocumentIconClass(doc.status)" class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center">
                        @if (doc.status === 'verified') {
                          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                          </svg>
                        } @else if (doc.status === 'rejected') {
                          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                          </svg>
                        } @else if (doc.status === 'submitted') {
                          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        }
                      </div>
                      <div class="flex-1">
                        <p class="text-xs font-medium text-gray-900 dark:text-white">{{ doc.name }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <span [class]="getDocumentStatusClass(doc.status)">{{ getDocumentStatusLabel(doc.status) }}</span>
                          @if (doc.uploadedDate) {
                            · {{ formatDate(doc.uploadedDate) }}
                          }
                        </p>
                        @if (doc.remarks) {
                          <p class="text-xs text-red-600 dark:text-red-400 mt-1">{{ doc.remarks }}</p>
                        }
                      </div>
                    </div>
                  }
                </div>

                @if (pendingDocuments() > 0) {
                  <button class="w-full mt-4 px-3 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition">
                    Upload Missing Documents
                  </button>
                }
              </div>

              <!-- Quick Actions -->
              <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>

                <div class="space-y-2">
                  <button class="w-full px-3 py-1.5 text-xs text-left rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <svg class="w-3.5 h-3.5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                    </svg>
                    Print Application
                  </button>
                  <button class="w-full px-3 py-1.5 text-xs text-left rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <svg class="w-3.5 h-3.5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    Download Documents
                  </button>
                  <button class="w-full px-3 py-1.5 text-xs text-left rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <svg class="w-3.5 h-3.5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        } @else {
          <!-- Loading State -->
          <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-4">Loading application details...</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class LoanStatusTrackingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  application = signal<Application | null>(null);
  documents = signal<Document[]>([]);

  timeline = computed(() => {
    const app = this.application();
    if (!app) return [];

    const events: TimelineEvent[] = [];

    // Submitted
    events.push({
      date: this.formatDate(app.submittedDate),
      status: 'Application Submitted',
      description: 'Your loan application has been successfully submitted and is awaiting review.',
      icon: 'document',
      color: 'bg-blue-600'
    });

    // Under Review
    if (app.status !== 'submitted') {
      events.push({
        date: app.reviewedDate ? this.formatDate(app.reviewedDate) : 'Pending',
        status: 'Under Review',
        description: 'Your application is being reviewed by our loan officers.',
        icon: 'clock',
        color: app.reviewedDate ? 'bg-yellow-600' : 'bg-gray-400'
      });
    }

    // Approved/Rejected
    if (app.status === 'approved' || app.status === 'disbursed') {
      events.push({
        date: app.approvedDate ? this.formatDate(app.approvedDate) : 'Pending',
        status: 'Application Approved',
        description: 'Congratulations! Your loan application has been approved.',
        icon: 'check',
        color: 'bg-green-600'
      });
    } else if (app.status === 'rejected') {
      events.push({
        date: app.approvedDate ? this.formatDate(app.approvedDate) : 'Pending',
        status: 'Application Rejected',
        description: app.rejectionReason || 'Unfortunately, your application could not be approved at this time.',
        icon: 'x',
        color: 'bg-red-600'
      });
    }

    // Disbursed
    if (app.status === 'disbursed' && app.disbursementDetails) {
      events.push({
        date: this.formatDate(app.disbursementDetails.releaseDate),
        status: 'Loan Disbursed',
        description: `₱${this.formatNumber(app.disbursementDetails.amount)} has been released to your account.`,
        icon: 'dollar',
        color: 'bg-green-600'
      });
    }

    return events;
  });

  pendingDocuments = computed(() => {
    return this.documents().filter(d => d.status === 'pending' || d.status === 'rejected').length;
  });

  ngOnInit() {
    const idParam =
      this.route.snapshot.paramMap.get('id') ||
      this.route.snapshot.queryParamMap.get('applicationId') ||
      this.route.snapshot.queryParamMap.get('loanId');

    if (idParam) {
      const id = parseInt(idParam, 10);
      this.loadApplicationDetails(id);
      this.loadDocuments(id);
    }
  }

  loadApplicationDetails(id: number) {
    // TODO: Replace with actual API call
    setTimeout(() => {
      this.application.set({
        id: id,
        referenceNumber: 'ML-2024-' + id.toString().padStart(6, '0'),
        applicantName: 'Juan Dela Cruz',
        loanProduct: 'Personal Loan',
        loanAmount: 50000,
        loanTerm: 12,
        status: 'disbursed',
        submittedDate: '2024-01-15T10:30:00',
        reviewedDate: '2024-01-16T14:20:00',
        approvedDate: '2024-01-18T09:15:00',
        disbursedDate: '2024-01-19T11:00:00',
        loanOfficer: {
          name: 'Maria Santos',
          email: 'maria.santos@company.com',
          phone: '+63 917 123 4567'
        },
        disbursementDetails: {
          accountNumber: '1234-5678-9012',
          accountName: 'Juan Dela Cruz',
          bank: 'BDO Unibank',
          amount: 50000,
          releaseDate: '2024-01-19T11:00:00'
        }
      });
    }, 500);
  }

  loadDocuments(applicationId: number) {
    // TODO: Replace with actual API call
    setTimeout(() => {
      this.documents.set([
        {
          id: 1,
          name: 'Valid Government ID',
          type: 'identification',
          status: 'verified',
          uploadedDate: '2024-01-15T10:30:00',
          verifiedDate: '2024-01-16T14:00:00'
        },
        {
          id: 2,
          name: 'Proof of Income',
          type: 'income',
          status: 'verified',
          uploadedDate: '2024-01-15T10:32:00',
          verifiedDate: '2024-01-16T14:05:00'
        },
        {
          id: 3,
          name: 'Certificate of Employment',
          type: 'employment',
          status: 'verified',
          uploadedDate: '2024-01-15T10:35:00',
          verifiedDate: '2024-01-16T14:10:00'
        },
        {
          id: 4,
          name: 'Proof of Billing',
          type: 'billing',
          status: 'verified',
          uploadedDate: '2024-01-15T10:37:00',
          verifiedDate: '2024-01-16T14:15:00'
        }
      ]);
    }, 500);
  }

  goBack() {
    this.router.navigate(['/platforms/money-loan/customer/loans']);
  }

  getStatusClass(status: string): string {
    const classes = {
      'submitted': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      'under_review': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
      'approved': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      'rejected': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      'disbursed': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
    };
    return classes[status as keyof typeof classes] || classes['submitted'];
  }

  getStatusLabel(status: string): string {
    const labels = {
      'submitted': 'Submitted',
      'under_review': 'Under Review',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'disbursed': 'Disbursed'
    };
    return labels[status as keyof typeof labels] || status;
  }

  getDocumentIconClass(status: string): string {
    const classes = {
      'pending': 'bg-gray-300 dark:bg-gray-600',
      'submitted': 'bg-yellow-500',
      'verified': 'bg-green-500',
      'rejected': 'bg-red-500'
    };
    return classes[status as keyof typeof classes] || classes['pending'];
  }

  getDocumentStatusClass(status: string): string {
    const classes = {
      'pending': 'text-gray-600 dark:text-gray-400',
      'submitted': 'text-yellow-600 dark:text-yellow-400',
      'verified': 'text-green-600 dark:text-green-400',
      'rejected': 'text-red-600 dark:text-red-400'
    };
    return classes[status as keyof typeof classes] || classes['pending'];
  }

  getDocumentStatusLabel(status: string): string {
    const labels = {
      'pending': 'Pending Upload',
      'submitted': 'Under Verification',
      'verified': 'Verified',
      'rejected': 'Rejected'
    };
    return labels[status as keyof typeof labels] || status;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatNumber(value: number): string {
    return value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
