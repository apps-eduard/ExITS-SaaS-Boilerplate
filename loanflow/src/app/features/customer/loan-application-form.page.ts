import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonTextarea,
  IonRange,
  IonButton,
  IonIcon,
  IonSpinner,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkCircleOutline,
  moonOutline,
  sunnyOutline,
  cardOutline
} from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ThemeService } from '../../core/services/theme.service';
import { DevInfoComponent } from '../../shared/components/dev-info.component';
import { LoanCalculatorService, LoanCalculationResult } from '../../core/services/loan-calculator.service';

interface LoanProduct {
  id: number;
  name: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  minTerm: number;  // Store in days like the web version
  maxTerm: number;  // Store in days like the web version
  processingFee: number;
  platformFee?: number;
  paymentFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  features: string[];
  loanTermType?: string; // 'fixed' or 'flexible' (lowercase from DB)
  fixedTermDays?: number; // Fixed term in days
  interestType?: string;
}

interface LoanApplicationRequest {
  customerId: number;
  loanProductId: number;
  requestedAmount: number;
  requestedTermDays: number;
  purpose?: string;
}

@Component({
  selector: 'app-loan-application-form',
  templateUrl: './loan-application-form.page.html',
  styleUrls: ['./loan-application-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonTextarea,
    IonRange,
    IonButton,
    IonIcon,
    IonSpinner,
    DevInfoComponent
  ]
})
export class LoanApplicationFormPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private location = inject(Location);
  private loanCalculator = inject(LoanCalculatorService);
  
  themeService = inject(ThemeService);

  product = signal<LoanProduct | null>(null);
  loading = signal(false);
  submitting = signal(false);

  // Form fields
  requestedAmount = signal(0);
  requestedTermMonths = signal(1);
  purpose = signal('');
  
  // Expose Math to template
  Math = Math;

  // User info (get from auth service)
  customerId = signal(0);

  constructor() {
    addIcons({
      arrowBackOutline,
      checkmarkCircleOutline,
      moonOutline,
      sunnyOutline,
      cardOutline
    });
  }
  
  toggleTheme() {
    this.themeService.toggleTheme();
  }

  async ngOnInit() {
    // Get product from navigation state (passed from products page)
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || window.history.state;
    
    if (state?.product) {
      console.log('📦 Received product from navigation:', state.product);
      this.loadProductFromState(state.product);
    } else {
      // Fallback: check query params for productId (shouldn't happen normally)
      this.route.queryParams.subscribe(params => {
        const productId = params['productId'];
        if (productId) {
          console.warn('⚠️ Using fallback: fetching product by ID');
          this.loadProduct(productId);
        } else {
          this.showToast('No product selected', 'danger');
          this.router.navigate(['/customer/apply-loan']);
        }
      });
    }

    // Get customer ID from the stored customer object
    const customerStr = localStorage.getItem('customer');
    console.log('📦 Raw customer string from localStorage:', customerStr);
    
    if (customerStr) {
      try {
        const customer = JSON.parse(customerStr);
        console.log('✅ Parsed customer object:', customer);
        console.log('🔑 Customer keys:', Object.keys(customer));
        
        const customerId = customer.id || 0;
        console.log('🆔 Customer ID resolved:', customerId);
        
        this.customerId.set(customerId);
      } catch (e) {
        console.error('❌ Error parsing customer data:', e);
      }
    } else {
      console.warn('⚠️ No customer data in localStorage');
      
      // Fallback: try to get from user storage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        console.log('🔄 Trying fallback from user');
        const user = JSON.parse(userStr);
        const customerId = user.customer?.id || user.customerId || user.id || 0;
        console.log('🆔 Fallback Customer ID:', customerId);
        this.customerId.set(customerId);
      }
    }
  }
  
  loadProductFromState(productData: any) {
    console.log('✅ Loading product from state:', productData);
    
    // Product is already in the correct format from apply-loan page
    const interestType = this.normalizeInterestType(productData);
    const product: LoanProduct = {
      id: productData.id,
      name: productData.name || 'Loan Product',
      minAmount: Number(productData.minAmount) || 0,
      maxAmount: Number(productData.maxAmount) || 0,
      interestRate: Number(productData.interestRate) || 0,
      minTerm: Number(productData.minTerm) || 30,  // Already in days
      maxTerm: Number(productData.maxTerm) || 360, // Already in days
      processingFee: Number(productData.processingFee) || 0,
      platformFee: Number(productData.platformFee) || 0,
      paymentFrequency: productData.paymentFrequency || 'monthly',
      features: productData.features || [],
      loanTermType: productData.loanTermType || 'flexible',
      fixedTermDays: Number(productData.fixedTermDays) || 90,
      interestType
    };
    
    console.log('🎯 Processed product:', product);
    console.log('🔍 Is Fixed Term?', product.loanTermType === 'fixed');
    
    this.product.set(product);
    // Set default values
    this.requestedAmount.set(product.minAmount);
    
    // Set default term in months
    this.requestedTermMonths.set(this.getDefaultTermMonths(product));
    
    // Log initial calculations
    console.log('💰 Initial Amount:', this.requestedAmount());
    console.log('📅 Initial Term (months):', this.requestedTermMonths());
    console.log('💵 Total Repayment:', this.getTotalRepayment());
    console.log('📊 Daily Payment:', this.getDailyPayment());
  }

  async loadProduct(productId: number) {
    this.loading.set(true);
    try {
      // Get tenant ID from user
      const userStr = localStorage.getItem('user');
      let tenantId = '1'; // Default
      
      if (userStr) {
        const user = JSON.parse(userStr);
        tenantId = user.tenant?.id || '1';
      }
      
      console.log('🔍 Loading product:', productId, 'for tenant:', tenantId);
      
      // Use the correct tenant-based API endpoint
      const response = await this.http.get<any>(
        `${environment.apiUrl}/tenants/${tenantId}/platforms/moneyloan/loans/products/${productId}`
      ).toPromise();

      console.log('📡 API Response:', response);

      if (response?.success && response?.data) {
        const productData = response.data;
        
        console.log('📦 Raw Product Data:', productData);
        console.log('🔍 Loan Term Type:', productData.loanTermType);
        console.log('🔍 Fixed Term Days:', productData.fixedTermDays);
        console.log('🔍 Min Term Days:', productData.minTermDays);
        console.log('🔍 Max Term Days:', productData.maxTermDays);
        
        // Store product data in days, just like web version
        const interestType = this.normalizeInterestType(productData);
        const product: LoanProduct = {
          id: productData.id,
          name: productData.name || 'Loan Product',
          minAmount: Number(productData.minAmount) || 0,
          maxAmount: Number(productData.maxAmount) || 0,
          interestRate: Number(productData.interestRate) || 0,
          minTerm: Number(productData.minTermDays) || 30,  // Store as days
          maxTerm: Number(productData.maxTermDays) || 360, // Store as days
          processingFee: Number(productData.processingFeePercent) || 0,
          features: productData.features || [],
          loanTermType: productData.loanTermType || 'flexible',  // lowercase
          fixedTermDays: Number(productData.fixedTermDays) || 90,
          platformFee: Number(productData.platformFee) || 0,
          interestType
        };
        
        console.log('✅ Processed Product:', product);
        console.log('🎯 Is Fixed Term?', product.loanTermType === 'fixed');
        
        this.product.set(product);
        // Set default values
        this.requestedAmount.set(product.minAmount);
        
        // Set default term in months
        this.requestedTermMonths.set(this.getDefaultTermMonths(product));
        
        // Log initial calculations
        console.log('💰 Initial Amount:', this.requestedAmount());
        console.log('📅 Initial Term (months):', this.requestedTermMonths());
        console.log('💵 Total Repayment:', this.getTotalRepayment());
        console.log('📊 Daily Payment:', this.getDailyPayment());
      } else {
        throw new Error('Invalid product data');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      await this.showToast('Failed to load product details', 'danger');
      this.router.navigate(['/customer/apply-loan']);
    } finally {
      this.loading.set(false);
    }
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  onAmountChange(event: any) {
    const product = this.product();
    if (!product) return;
    
    const value = event.detail.value;
    
    // Enforce min/max limits
    if (value < product.minAmount) {
      this.requestedAmount.set(product.minAmount);
    } else if (value > product.maxAmount) {
      this.requestedAmount.set(product.maxAmount);
    } else {
      this.requestedAmount.set(value);
    }
  }

  onTermChange(event: any) {
    const product = this.product();
    if (!product) return;
    
    const value = event.detail.value;
    
    // For fixed term, don't allow changes
    if (product.loanTermType === 'fixed') {
      const fixedTermMonths = Math.round((product.fixedTermDays || 90) / 30);
      this.requestedTermMonths.set(fixedTermMonths);
      console.warn('Cannot change fixed term loan duration');
      return;
    }
    
    // For flexible term, enforce min/max limits
    const minTermMonths = this.coerceTermMonths(product.minTerm, 1);
    const maxTermMonths = this.coerceTermMonths(product.maxTerm, minTermMonths);
    
    if (value < minTermMonths) {
      this.requestedTermMonths.set(minTermMonths);
    } else if (value > maxTermMonths) {
      this.requestedTermMonths.set(maxTermMonths);
    } else {
      this.requestedTermMonths.set(value);
    }
  }

  getEstimatedMonthlyPayment(): number {
    const termMonths = this.requestedTermMonths();
    if (!termMonths) {
      return 0;
    }

    const calculation = this.getCalculation();
    if (!calculation) {
      return 0;
    }

    const totalRepayment = this.getTotalRepayment();
    return this.roundToCents(totalRepayment / termMonths);
  }

  getTotalRepayment(): number {
    const calculation = this.getCalculation();
    if (!calculation) {
      return 0;
    }

    return calculation.totalRepayable;
  }
  
  getProcessingFeeAmount(): number {
    const calculation = this.getCalculation();
    return calculation ? calculation.processingFeeAmount : 0;
  }
  
  hasPlatformFee(): boolean {
    return this.getPlatformFee() > 0;
  }
  
  getPlatformFee(): number {
    const product = this.product();
    if (!product) {
      return 0;
    }
    return product.platformFee || 0;
  }

  getPlatformFeeTotal(): number {
    const calculation = this.getCalculation();
    return calculation ? calculation.platformFee : 0;
  }

  getTotalInterest(): number {
    const calculation = this.getCalculation();
    return calculation ? calculation.interestAmount : 0;
  }

  getNetReceived(): number {
    const calculation = this.getCalculation();
    if (!calculation) {
      return 0;
    }
    return calculation.netProceeds;
  }

  getDailyPayment(): number {
    const calculation = this.getCalculation();
    if (!calculation) {
      return 0;
    }
    const product = this.product();
    // Return installment amount if frequency is daily
    if (product?.paymentFrequency === 'daily') {
      return calculation.installmentAmount;
    }
    // Otherwise calculate from total repayment
    const termDays = this.requestedTermMonths() * 30;
    if (!termDays) {
      return 0;
    }
    return this.roundToCents(calculation.totalRepayable / termDays);
  }

  getPaymentCount(): number {
    const calculation = this.getCalculation();
    return calculation ? calculation.numPayments : 0;
  }

  getInstallmentAmount(): number {
    const calculation = this.getCalculation();
    return calculation ? calculation.installmentAmount : 0;
  }

  getPaymentLabel(): string {
    const product = this.product();
    const freq = product?.paymentFrequency || 'monthly';
    return freq.charAt(0).toUpperCase() + freq.slice(1);
  }

  getPaymentFrequencyDisplay(): string {
    const product = this.product();
    const freq = product?.paymentFrequency || 'monthly';
    const freqMap: { [key: string]: string } = {
      'daily': 'Daily',
      'weekly': 'Weekly',
      'biweekly': 'Bi-Weekly',
      'monthly': 'Monthly'
    };
    return freqMap[freq] || freq;
  }

  getInterestLabel(): string {
    const product = this.product();
    if (!product) {
      return 'flat';
    }
    const type = this.resolveInterestType(product.interestType);
    switch (type) {
      case 'reducing':
        return 'reducing balance';
      case 'compound':
        return 'compound';
      default:
        return 'flat';
    }
  }

  formatNumber(value: number): string {
    if (!value) {
      return '0';
    }
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  }

  private getCalculation(): LoanCalculationResult | null {
    const product = this.product();
    if (!product) {
      console.warn('⚠️ No product set');
      return null;
    }

    const principal = this.requestedAmount();
    if (!principal) {
      console.warn('⚠️ No principal amount');
      return null;
    }

    const termMonths = Math.max(1, this.requestedTermMonths());
    if (!termMonths) {
      console.warn('⚠️ No term months');
      return null;
    }

    const monthlyInterestRate = Number(product.interestRate) || 0;
    const interestType = this.resolveInterestType(product.interestType);
    const platformFeePerMonth = Number(product.platformFee) || 0;
    const processingFeePercent = Number(product.processingFee) || 0;
    const paymentFrequency = product.paymentFrequency || 'monthly';

    console.log('📊 Calculation Params:', {
      loanAmount: principal,
      termMonths,
      paymentFrequency,
      monthlyInterestRate,
      interestType,
      processingFeePercentage: processingFeePercent,
      platformFeePerMonth: platformFeePerMonth
    });

    const result = this.loanCalculator.calculate({
      loanAmount: principal,
      termMonths,
      paymentFrequency,
      interestRate: monthlyInterestRate,
      interestType,
      processingFeePercentage: processingFeePercent,
      platformFee: platformFeePerMonth,
      latePenaltyPercentage: 0
    });

    console.log('📊 Calculation Result:', result);

    return result;
  }

  private resolveInterestType(rawType?: string): 'flat' | 'reducing' | 'compound' {
    if (!rawType) {
      return 'flat';
    }
    const normalized = rawType.toLowerCase();
    if (normalized === 'reducing' || normalized === 'compound') {
      return normalized;
    }
    return 'flat';
  }

  private normalizeInterestType(productData: any): string {
    const candidate = productData?.interestType || productData?.interestComputation || productData?.interestMethod;
    return (candidate ? String(candidate) : 'flat').toLowerCase();
  }

  private getDefaultTermMonths(product: LoanProduct): number {
    if (product.loanTermType === 'fixed') {
      const fixedTerm = this.coerceTermMonths(product.fixedTermDays, 3);
      return Math.max(1, fixedTerm);
    }

    const minTerm = this.coerceTermMonths(product.minTerm, 1);
    return Math.max(1, minTerm);
  }

  private coerceTermMonths(termDays?: number, fallbackMonths: number = 1): number {
    const days = typeof termDays === 'number' && !isNaN(termDays) ? termDays : fallbackMonths * 30;
    const months = Math.round(days / 30);
    return Math.max(1, months);
  }

  private roundToCents(value: number): number {
    return Math.round((value || 0) * 100) / 100;
  }

  async submitApplication() {
    const product = this.product();
    if (!product) return;

    // Validation
    if (this.requestedAmount() < product.minAmount || this.requestedAmount() > product.maxAmount) {
      await this.showToast(
        `Amount must be between ₱${this.formatCurrency(product.minAmount)} and ₱${this.formatCurrency(product.maxAmount)}`,
        'warning'
      );
      return;
    }

    // Validate term based on product type
    const requestedTermDays = this.requestedTermMonths() * 30;
    if (product.loanTermType === 'fixed') {
      // For fixed term, it must match the fixed term
      const fixedTermDays = product.fixedTermDays || 90;
      if (requestedTermDays !== fixedTermDays) {
        await this.showToast(
          `This product has a fixed term of ${Math.round(fixedTermDays / 30)} months`,
          'warning'
        );
        return;
      }
    } else {
      // For flexible term, check if within min/max range
      if (requestedTermDays < product.minTerm || requestedTermDays > product.maxTerm) {
        await this.showToast(
          `Term must be between ${Math.round(product.minTerm / 30)} and ${Math.round(product.maxTerm / 30)} months`,
          'warning'
        );
        return;
      }
    }

    if (!this.customerId()) {
      console.error('❌ Customer ID is not set:', this.customerId());
      console.error('📋 LocalStorage user:', localStorage.getItem('user'));
      await this.showToast('Customer information not found. Please login again.', 'danger');
      return;
    }

    console.log('✅ Customer ID validated:', this.customerId());

    const loading = await this.loadingController.create({
      message: 'Submitting application...',
      spinner: 'crescent'
    });
    await loading.present();

    this.submitting.set(true);

    try {
      // Get tenant ID
      const userStr = localStorage.getItem('user');
      let tenantId = '1';
      
      if (userStr) {
        const user = JSON.parse(userStr);
        tenantId = user.tenant?.id || '1';
      }
      
      // Convert months to days (30 days per month)
      const requestedTermDays = this.requestedTermMonths() * 30;

      const applicationData: LoanApplicationRequest = {
        customerId: this.customerId(),
        loanProductId: product.id,
        requestedAmount: this.requestedAmount(),
        requestedTermDays: requestedTermDays,
        purpose: this.purpose() || 'Personal loan'
      };

      console.log('📤 Submitting application:', applicationData);

      // Use the correct tenant-based API endpoint
      const response = await this.http.post<any>(
        `${environment.apiUrl}/tenants/${tenantId}/platforms/moneyloan/loans/applications`,
        applicationData
      ).toPromise();

      await loading.dismiss();

      if (response?.success) {
        await this.showToast('Loan application submitted successfully!', 'success');
        // Navigate to dashboard
        this.router.navigate(['/customer/dashboard']);
      } else {
        throw new Error(response?.message || 'Failed to submit application');
      }
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error submitting application:', error);
      const message = error.error?.message || error.message || 'Failed to submit application';
      await this.showToast(message, 'danger');
    } finally {
      this.submitting.set(false);
    }
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    await toast.present();
  }

  goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/customer/apply-loan']);
  }
}
