import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  ToastController,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  cashOutline,
  calendarOutline,
  trendingUpOutline,
  informationCircleOutline,
  checkmarkCircleOutline,
  moonOutline,
  sunnyOutline,
  cardOutline
} from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { DevInfoComponent } from '../../shared/components/dev-info.component';

interface LoanProduct {
  id: number;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  minTerm: number;  // Now stores days, not months
  maxTerm: number;  // Now stores days, not months
  processingFee: number;
  platformFee?: number;
  requirements: string[];
  features: string[];
  loanTermType?: string;  // 'fixed' or 'flexible' (lowercase from DB)
  fixedTermDays?: number;
}

@Component({
  selector: 'app-apply-loan',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    DevInfoComponent
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-toolbar">
        <div class="toolbar-content">
          <div class="toolbar-left">
            <ion-button (click)="goBack()" class="icon-btn" fill="clear">
              <ion-icon name="arrow-back-outline" slot="icon-only"></ion-icon>
            </ion-button>
          </div>
          
          <div class="toolbar-center">
            <ion-icon name="card-outline" class="title-icon"></ion-icon>
            <span class="title-text">Products</span>
          </div>
          
          <div class="toolbar-right">
            <!-- Dev Info (Development Only) -->
            <app-dev-info />
            
            <ion-button (click)="toggleTheme()" class="icon-btn" fill="clear">
              <ion-icon 
                [name]="themeService.isDark() ? 'sunny-outline' : 'moon-outline'" 
                slot="icon-only"
                class="theme-icon"
              ></ion-icon>
            </ion-button>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="main-content">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="products-container">
        <!-- Header Section -->
        <div class="header-section">
          <h2 class="page-title">Choose Your Loan</h2>
          <p class="page-subtitle">Select a loan product that best fits your needs</p>
        </div>

        <!-- Loading State -->
        @if (loading()) {
          <div class="products-loading">
            @for (i of [1,2,3]; track i) {
              <div class="product-skeleton">
                <ion-skeleton-text animated class="skeleton-title"></ion-skeleton-text>
                <ion-skeleton-text animated class="skeleton-text"></ion-skeleton-text>
                <ion-skeleton-text animated class="skeleton-text"></ion-skeleton-text>
                <ion-skeleton-text animated class="skeleton-button"></ion-skeleton-text>
              </div>
            }
          </div>
        }
        
        <!-- Empty State -->
        @else if (products().length === 0) {
          <div class="empty-state">
            <div class="empty-icon-wrapper">
              <ion-icon name="card-outline" class="empty-icon"></ion-icon>
            </div>
            <p class="empty-title">No Loan Products Available</p>
            <p class="empty-subtitle">Please check back later or contact support</p>
          </div>
        }
        
        <!-- Products List -->
        @else {
          <div class="products-list">
            @for (product of products(); track product.id) {
              <div class="product-card">
                <!-- Product Header -->
                <div class="product-header">
                  <div class="product-icon-wrapper">
                    <ion-icon name="cash-outline" class="product-icon"></ion-icon>
                  </div>
                  <div class="product-title-section">
                    <h3 class="product-name">{{ product.name }}</h3>
                    <p class="product-description">{{ product.description }}</p>
                  </div>
                </div>

                <!-- Product Details -->
                <div class="product-details">
                  <!-- Amount Range -->
                  <div class="detail-row">
                    <div class="detail-item">
                      <ion-icon name="cash-outline" class="detail-icon"></ion-icon>
                      <div class="detail-content">
                        <p class="detail-label">Loan Amount</p>
                        <p class="detail-value">₱{{ formatCurrency(product.minAmount) }} - ₱{{ formatCurrency(product.maxAmount) }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Interest Rate & Term -->
                  <div class="detail-row">
                    <div class="detail-item">
                      <ion-icon name="trending-up-outline" class="detail-icon"></ion-icon>
                      <div class="detail-content">
                        <p class="detail-label">Interest Rate</p>
                        <p class="detail-value">{{ product.interestRate }}% per month</p>
                      </div>
                    </div>
                    <div class="detail-item">
                      <ion-icon name="calendar-outline" class="detail-icon"></ion-icon>
                      <div class="detail-content">
                        <p class="detail-label">Loan Term</p>
                        <p class="detail-value">
                          @if (product.loanTermType === 'fixed') {
                            <span class="fixed-term-badge">
                              🔒 {{ Math.round((product.fixedTermDays || 90) / 30) }}mo
                            </span>
                          } @else {
                            {{ Math.round(product.minTerm / 30) }}-{{ Math.round(product.maxTerm / 30) }} Months
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Processing Fee -->
                  @if (product.processingFee > 0) {
                    <div class="processing-fee-badge">
                      <ion-icon name="information-circle-outline"></ion-icon>
                      <span>Processing Fee: {{ product.processingFee }}%</span>
                    </div>
                  }

                  <!-- Platform Fee -->
                  @if (product.platformFee && product.platformFee > 0) {
                    <div class="platform-fee-badge">
                      <ion-icon name="business-outline"></ion-icon>
                      <span>₱{{ formatCurrency(product.platformFee) }}/mo <span class="fee-note">Only while loan is active</span></span>
                    </div>
                  }

                  <!-- Features -->
                  @if (product.features && product.features.length > 0) {
                    <div class="features-section">
                      <p class="features-title">Key Features</p>
                      <div class="features-list">
                        @for (feature of product.features.slice(0, 3); track feature) {
                          <div class="feature-item">
                            <ion-icon name="checkmark-circle-outline" class="feature-icon"></ion-icon>
                            <span class="feature-text">{{ feature }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>

                <!-- Apply Button -->
                <div class="product-footer">
                  <button class="apply-btn" (click)="applyForProduct(product)">
                    <span>Apply Now</span>
                    <ion-icon name="arrow-forward-outline" class="btn-icon"></ion-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    /* ===== HEADER STYLES ===== */
    .custom-toolbar {
      --background: linear-gradient(135deg, #667eea, #764ba2);
      --color: white;
      --border-style: none;
      --min-height: 60px;
      --padding-top: 0;
      --padding-bottom: 0;
      --padding-start: 0;
      --padding-end: 0;
    }

    .toolbar-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      width: 100%;
      height: 60px;
      color: white;
    }

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }

    .toolbar-left {
      justify-content: flex-start;
    }

    .toolbar-right {
      justify-content: flex-end;
    }

    .toolbar-center {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      flex: 0 0 auto;
    }

    .info-text {
      font-size: 13px;
      font-weight: 600;
      opacity: 0.95;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .title-icon {
      font-size: 22px;
      flex-shrink: 0;
    }

    .title-text {
      font-size: 18px;
      font-weight: 700;
      white-space: nowrap;
    }

    .icon-btn {
      --padding-start: 8px;
      --padding-end: 8px;
      margin: 0;
      height: 40px;
      width: 40px;
    }

    .icon-btn ion-icon {
      font-size: 22px;
    }

    /* ===== MAIN CONTENT ===== */
    .main-content {
      --background: var(--ion-background-color);
    }

    .products-container {
      padding: 1rem;
      max-width: 600px;
      margin: 0 auto;
    }

    /* ===== HEADER SECTION ===== */
    .header-section {
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0 0 0.5rem 0;
    }

    .page-subtitle {
      font-size: 0.9375rem;
      color: var(--ion-color-medium);
      margin: 0;
    }

    /* ===== LOADING STATES ===== */
    .products-loading {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .product-skeleton {
      background: var(--ion-card-background);
      border-radius: 18px;
      padding: 1.5rem;
      border: 1px solid var(--ion-border-color, #e5e7eb);
    }

    .skeleton-title {
      width: 60%;
      height: 24px;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .skeleton-text {
      width: 100%;
      height: 16px;
      border-radius: 4px;
      margin-bottom: 0.75rem;
    }

    .skeleton-button {
      width: 120px;
      height: 44px;
      border-radius: 12px;
      margin-top: 1rem;
    }

    /* ===== EMPTY STATE ===== */
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }

    .empty-icon-wrapper {
      width: 100px;
      height: 100px;
      background: var(--ion-color-light);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }

    .empty-icon {
      font-size: 3rem;
      color: var(--ion-color-medium);
    }

    .empty-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--ion-text-color);
      margin: 0 0 0.5rem 0;
    }

    .empty-subtitle {
      font-size: 0.9375rem;
      color: var(--ion-color-medium);
      margin: 0;
    }

    /* ===== PRODUCTS LIST ===== */
    .products-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem; /* Reduced from 1.25rem */
    }

    .product-card {
      background: var(--ion-card-background);
      border: 1px solid var(--ion-border-color, #e5e7eb);
      border-radius: 12px; /* Reduced from 18px */
      padding: 1rem; /* Reduced from 1.5rem */
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06); /* Lighter shadow */
      transition: all 0.3s ease;
    }

    .product-card:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* Lighter hover shadow */
      transform: translateY(-1px); /* Less movement */
    }

    /* ===== PRODUCT HEADER ===== */
    .product-header {
      display: flex;
      gap: 0.75rem; /* Reduced from 1rem */
      margin-bottom: 1rem; /* Reduced from 1.25rem */
    }

    .product-icon-wrapper {
      width: 44px; /* Reduced from 56px */
      height: 44px; /* Reduced from 56px */
      border-radius: 10px; /* Reduced from 14px */
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .product-icon {
      font-size: 1.5rem; /* Reduced from 2rem */
      color: white;
    }

    .product-title-section {
      flex: 1;
      min-width: 0;
    }

    .product-name {
      font-size: 1.0625rem; /* Reduced from 1.25rem */
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0 0 0.25rem 0; /* Reduced bottom margin */
    }

    .product-description {
      font-size: 0.8125rem; /* Reduced from 0.875rem */
      color: var(--ion-color-medium);
      margin: 0;
      line-height: 1.4; /* Tighter line height */
    }

    /* ===== PRODUCT DETAILS ===== */
    .product-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem; /* Reduced from 1rem */
    }

    .detail-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem; /* Reduced from 1rem */
    }

    .detail-row:has(.detail-item:nth-child(2)) {
      grid-template-columns: repeat(2, 1fr);
    }

    .detail-item {
      display: flex;
      gap: 0.5rem; /* Reduced from 0.75rem */
      align-items: flex-start;
    }

    .detail-icon {
      font-size: 1.125rem; /* Reduced from 1.25rem */
      color: #667eea;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .detail-content {
      flex: 1;
      min-width: 0;
    }

    .detail-label {
      font-size: 0.6875rem; /* Reduced from 0.75rem */
      color: var(--ion-color-medium);
      margin: 0 0 0.1875rem 0; /* Reduced bottom margin */
      font-weight: 500;
    }

    .detail-value {
      font-size: 0.875rem; /* Reduced from 0.9375rem */
      font-weight: 600;
      color: var(--ion-text-color);
      margin: 0;
      
      .fixed-term-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.2rem 0.4rem; /* Slightly reduced */
        background: rgba(139, 92, 246, 0.1);
        color: #8b5cf6;
        border-radius: 4px; /* Reduced from 6px */
        font-size: 0.875rem;
        font-weight: 600;
      }
    }

    /* ===== PROCESSING FEE ===== */
    .processing-fee-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem; /* Reduced from 0.5rem */
      padding: 0.5rem; /* Reduced from 0.75rem */
      background: rgba(102, 126, 234, 0.1);
      border-radius: 8px; /* Reduced from 10px */
      font-size: 0.8125rem; /* Reduced from 0.875rem */
      color: #667eea;
      font-weight: 600;
    }

    .processing-fee-badge ion-icon {
      font-size: 1rem; /* Reduced from 1.125rem */
    }

    /* ===== PLATFORM FEE ===== */
    .platform-fee-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem; /* Reduced from 0.5rem */
      padding: 0.5rem; /* Reduced from 0.75rem */
      background: rgba(16, 185, 129, 0.1);
      border-radius: 8px; /* Reduced from 10px */
      font-size: 0.8125rem; /* Reduced from 0.875rem */
      color: #10b981;
      font-weight: 600;
      margin-top: 0.375rem; /* Reduced from 0.5rem */
      
      .fee-note {
        font-size: 0.6875rem; /* Reduced from 0.75rem */
        opacity: 0.8;
        font-weight: 400;
      }
    }

    .platform-fee-badge ion-icon {
      font-size: 1rem; /* Reduced from 1.125rem */
    }

    /* ===== FEATURES SECTION ===== */
    .features-section {
      margin-top: 0.5rem;
    }

    .features-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--ion-text-color);
      margin: 0 0 0.5rem 0;
    }

    .features-list {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .feature-icon {
      font-size: 1rem;
      color: #10b981;
      flex-shrink: 0;
    }

    .feature-text {
      font-size: 0.8125rem;
      color: var(--ion-text-color);
      line-height: 1.4;
    }

    /* ===== PRODUCT FOOTER ===== */
    .product-footer {
      margin-top: 1.25rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--ion-border-color, #e5e7eb);
    }

    .apply-btn {
      width: 100%;
      height: 48px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .apply-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .apply-btn:active {
      transform: translateY(0);
    }

    .btn-icon {
      font-size: 1.25rem;
      transition: transform 0.3s ease;
    }

    .apply-btn:hover .btn-icon {
      transform: translateX(4px);
    }

    /* ===== DARK MODE ===== */
    body.dark .product-card,
    .dark .product-card,
    body.dark .product-skeleton,
    .dark .product-skeleton {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark .empty-icon-wrapper,
    .dark .empty-icon-wrapper {
      background: rgba(255, 255, 255, 0.1);
    }

    body.dark .processing-fee-badge,
    .dark .processing-fee-badge {
      background: rgba(102, 126, 234, 0.2);
    }
    
    body.dark .platform-fee-badge,
    .dark .platform-fee-badge {
      background: rgba(16, 185, 129, 0.2);
    }

    body.dark .product-footer,
    .dark .product-footer {
      border-top-color: rgba(255, 255, 255, 0.1);
    }
    
    body.dark .fixed-term-badge,
    .dark .fixed-term-badge {
      background: rgba(139, 92, 246, 0.3) !important;
      color: #c4b5fd !important;
    }
  `]
})
export class ApplyLoanPage implements OnInit {
  loading = signal(false);
  products = signal<LoanProduct[]>([]);
  Math = Math; // Expose Math to template

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
    private toastController: ToastController
  ) {
    addIcons({
      arrowBackOutline,
      cashOutline,
      calendarOutline,
      trendingUpOutline,
      informationCircleOutline,
      checkmarkCircleOutline,
      moonOutline,
      sunnyOutline,
      cardOutline
    });
  }

  ngOnInit() {
    this.loadLoanProducts();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  async loadLoanProducts() {
    this.loading.set(true);
    try {
      // Get current user's tenant ID
      const user = this.authService.currentUser();
      const tenantId = user?.tenant?.id;
      
      console.log('🏢 Loading products for tenant:', tenantId);
      
      const productsData = await this.apiService.getLoanProducts(tenantId).toPromise();
      
      console.log('📦 Raw products from API:', productsData);
      
      if (productsData && Array.isArray(productsData)) {
        const mappedProducts = productsData.map((product: any) => {
          // API now returns camelCase fields - use them directly like web version
          console.log('🔍 Mapping product:', product);
          
          const mapped = {
            id: product.id,
            name: product.name || 'Loan Product',
            description: product.description || '',
            minAmount: product.minAmount || 0,
            maxAmount: product.maxAmount || 0,
            interestRate: product.interestRate || 0,
            minTerm: product.minTermDays || 30,  // Store as days, convert in template
            maxTerm: product.maxTermDays || 360, // Store as days, convert in template
            processingFee: product.processingFeePercent || 0,
            platformFee: product.platformFee || 0,
            requirements: product.requirements || [],
            features: product.features || [],
            loanTermType: product.loanTermType || 'flexible',
            fixedTermDays: product.fixedTermDays || 90
          };
          
          console.log('✅ Mapped product:', mapped);
          return mapped;
        });
        this.products.set(mappedProducts);
        console.log('📊 Total products loaded:', mappedProducts.length);
      }
    } catch (error) {
      console.error('Failed to load loan products:', error);
      const toast = await this.toastController.create({
        message: 'Failed to load loan products',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.loading.set(false);
    }
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  async applyForProduct(product: LoanProduct) {
    // Navigate to loan application form with product data passed via state
    this.router.navigate(['/customer/apply-loan/form'], { 
      state: { product: product }
    });
  }

  goBack() {
    this.router.navigate(['/customer/dashboard']);
  }

  async handleRefresh(event: any) {
    await this.loadLoanProducts();
    event.target.complete();
  }
}
