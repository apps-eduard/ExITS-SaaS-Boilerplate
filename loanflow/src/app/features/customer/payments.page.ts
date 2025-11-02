import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonLabel,
  IonBadge,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonNote,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cashOutline,
  cardOutline,
  walletOutline,
  receiptOutline,
  calendarOutline,
  checkmarkCircleOutline,
  timeOutline,
  closeCircleOutline,
} from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface Payment {
  id: number;
  loanId: number;
  loanNumber: string;
  paymentReference: string;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  penaltyAmount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  notes: string;
  createdAt: string;
}

@Component({
  selector: 'app-customer-payments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonBackButton,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonLabel,
    IonBadge,
    IonIcon,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonSegment,
    IonSegmentButton,
    IonNote,
  ],
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
})
export class CustomerPaymentsPage implements OnInit {
  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  loading = false;
  selectedFilter = 'all';
  totalPaid = 0;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastController: ToastController
  ) {
    addIcons({
      cashOutline,
      cardOutline,
      walletOutline,
      receiptOutline,
      calendarOutline,
      checkmarkCircleOutline,
      timeOutline,
      closeCircleOutline,
    });
  }

  ngOnInit() {
    this.loadPayments();
  }

  async loadPayments() {
    this.loading = true;
    try {
      console.log('📡 Loading payment history...');
      const response: any = await this.apiService.getPaymentHistory().toPromise();
      console.log('✅ Payment history response:', response);

      if (response && response.success && response.data) {
        this.payments = response.data.map((p: any) => ({
          id: p.id,
          loanId: p.loanId || p.loan_id,
          loanNumber: p.loanNumber || p.loan_number,
          paymentReference: p.paymentReference || p.payment_reference,
          amount: parseFloat(p.amount || 0),
          principalAmount: parseFloat(p.principalAmount || p.principal_amount || 0),
          interestAmount: parseFloat(p.interestAmount || p.interest_amount || 0),
          penaltyAmount: parseFloat(p.penaltyAmount || p.penalty_amount || 0),
          paymentMethod: p.paymentMethod || p.payment_method || 'cash',
          paymentDate: p.paymentDate || p.payment_date,
          status: p.status || 'completed',
          notes: p.notes || '',
          createdAt: p.createdAt || p.created_at,
        }));

        this.totalPaid = this.payments.reduce((sum, p) => sum + p.amount, 0);
        this.applyFilter(this.selectedFilter);
        console.log(`💰 Total payments: ${this.payments.length}, Total paid: ₱${this.totalPaid}`);
      }
    } catch (error) {
      console.error('❌ Error loading payments:', error);
      const toast = await this.toastController.create({
        message: 'Failed to load payment history',
        duration: 3000,
        color: 'danger',
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  applyFilter(filter: string) {
    this.selectedFilter = filter;
    if (filter === 'all') {
      this.filteredPayments = this.payments;
    } else {
      this.filteredPayments = this.payments.filter((p) => p.status === filter);
    }
  }

  onFilterChange(event: any) {
    this.applyFilter(event.detail.value);
  }

  async handleRefresh(event: any) {
    await this.loadPayments();
    event.target.complete();
  }

  getPaymentMethodIcon(method: string): string {
    switch (method.toLowerCase()) {
      case 'cash':
        return 'cash-outline';
      case 'card':
      case 'credit_card':
      case 'debit_card':
        return 'card-outline';
      case 'bank_transfer':
      case 'online_banking':
        return 'wallet-outline';
      default:
        return 'receipt-outline';
    }
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'success';
      case 'pending':
      case 'processing':
        return 'warning';
      case 'failed':
      case 'rejected':
        return 'danger';
      default:
        return 'medium';
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatCurrency(amount: number): string {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  getPaymentMethodLabel(method: string): string {
    switch (method.toLowerCase()) {
      case 'cash':
        return 'Cash';
      case 'card':
      case 'credit_card':
        return 'Credit Card';
      case 'debit_card':
        return 'Debit Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'online_banking':
        return 'Online Banking';
      case 'gcash':
        return 'GCash';
      case 'paymaya':
        return 'PayMaya';
      default:
        return method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ');
    }
  }
}

