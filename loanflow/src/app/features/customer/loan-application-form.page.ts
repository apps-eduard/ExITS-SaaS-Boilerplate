import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonNote,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  cashOutline,
  calendarOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  moonOutline,
  sunnyOutline
} from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ThemeService } from '../../core/services/theme.service';
import { DevInfoComponent } from '../../shared/components/dev-info.component';

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
  features: string[];
  loanTermType?: string; // 'fixed' or 'flexible' (lowercase from DB)
  fixedTermDays?: number; // Fixed term in days
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
    IonNote,
    DevInfoComponent
  ]
})
export class LoanApplicationFormPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  
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
      cashOutline,
      calendarOutline,
      documentTextOutline,
      checkmarkCircleOutline,
      moonOutline,
      sunnyOutline
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

    // Get customer ID from storage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.customerId.set(user.customer?.id || 0);
    }
  }
  
  loadProductFromState(productData: any) {
    console.log('✅ Loading product from state:', productData);
    
    // Product is already in the correct format from apply-loan page
    const product: LoanProduct = {
      id: productData.id,
      name: productData.name || 'Loan Product',
      minAmount: productData.minAmount || 0,
      maxAmount: productData.maxAmount || 0,
      interestRate: productData.interestRate || 0,
      minTerm: productData.minTerm || 30,  // Already in days
      maxTerm: productData.maxTerm || 360, // Already in days
      processingFee: productData.processingFee || 0,
      platformFee: productData.platformFee || 0,
      features: productData.features || [],
      loanTermType: productData.loanTermType || 'flexible',
      fixedTermDays: productData.fixedTermDays || 90
    };
    
    console.log('🎯 Processed product:', product);
    console.log('🔍 Is Fixed Term?', product.loanTermType === 'fixed');
    
    this.product.set(product);
    // Set default values
    this.requestedAmount.set(product.minAmount);
    
    // Set default term in months
    if (product.loanTermType === 'fixed') {
      // For fixed term, use the fixed term days
      this.requestedTermMonths.set(Math.round((product.fixedTermDays || 90) / 30));
    } else {
      // For flexible term, use minimum term
      this.requestedTermMonths.set(Math.round(product.minTerm / 30));
    }
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
        const product: LoanProduct = {
          id: productData.id,
          name: productData.name || 'Loan Product',
          minAmount: productData.minAmount || 0,
          maxAmount: productData.maxAmount || 0,
          interestRate: productData.interestRate || 0,
          minTerm: productData.minTermDays || 30,  // Store as days
          maxTerm: productData.maxTermDays || 360, // Store as days
          processingFee: productData.processingFeePercent || 0,
          features: productData.features || [],
          loanTermType: productData.loanTermType || 'flexible',  // lowercase
          fixedTermDays: productData.fixedTermDays || 90
        };
        
        console.log('✅ Processed Product:', product);
        console.log('🎯 Is Fixed Term?', product.loanTermType === 'fixed');
        
        this.product.set(product);
        // Set default values
        this.requestedAmount.set(product.minAmount);
        
        // Set default term in months
        if (product.loanTermType === 'fixed') {
          // For fixed term, use the fixed term days
          this.requestedTermMonths.set(Math.round((product.fixedTermDays || 90) / 30));
        } else {
          // For flexible term, use minimum term
          this.requestedTermMonths.set(Math.round(product.minTerm / 30));
        }
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
    const minTermMonths = Math.round(product.minTerm / 30);
    const maxTermMonths = Math.round(product.maxTerm / 30);
    
    if (value < minTermMonths) {
      this.requestedTermMonths.set(minTermMonths);
    } else if (value > maxTermMonths) {
      this.requestedTermMonths.set(maxTermMonths);
    } else {
      this.requestedTermMonths.set(value);
    }
  }

  getEstimatedMonthlyPayment(): number {
    const product = this.product();
    if (!product) return 0;

    const principal = this.requestedAmount();
    if (!principal) return 0;
    
    const monthlyRate = product.interestRate / 100;
    const termMonths = this.requestedTermMonths();
    const processingFeeAmount = principal * (product.processingFee / 100);

    // Simple interest calculation
    const totalInterest = principal * monthlyRate * termMonths;
    const totalAmount = principal + totalInterest + processingFeeAmount;
    
    return Math.round((totalAmount / termMonths) * 100) / 100; // Round to 2 decimals
  }

  getTotalRepayment(): number {
    const product = this.product();
    if (!product) return 0;

    const principal = this.requestedAmount();
    if (!principal) return 0;
    
    const monthlyRate = product.interestRate / 100;
    const termMonths = this.requestedTermMonths();
    const processingFeeAmount = principal * (product.processingFee / 100);

    const totalInterest = principal * monthlyRate * termMonths;
    const total = principal + totalInterest + processingFeeAmount;
    
    return Math.round(total * 100) / 100; // Round to 2 decimals
  }
  
  getProcessingFeeAmount(): number {
    const product = this.product();
    if (!product) return 0;
    return this.requestedAmount() * (product.processingFee / 100);
  }
  
  hasPlatformFee(): boolean {
    const product = this.product();
    return !!(product?.platformFee && product.platformFee > 0);
  }
  
  getPlatformFee(): number {
    const product = this.product();
    return product?.platformFee || 0;
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
      await this.showToast('Customer information not found. Please login again.', 'danger');
      return;
    }

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
    this.router.navigate(['/customer/apply-loan']);
  }
}
