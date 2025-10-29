import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanService } from '../../shared/services/loan.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { ToastService } from '../../../../../core/services/toast.service';

interface LoanProduct {
  id?: number;
  productCode: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  interestType: string;
  minTermDays: number;
  maxTermDays: number;
  processingFeePercent: number;
  latePaymentPenaltyPercent: number;
  gracePeriodDays: number;
  isActive: boolean;
}

@Component({
  selector: 'app-loan-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📦</span>
            Loan Products Management
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Configure loan product offerings and their terms
          </p>
        </div>
        <button
          (click)="showAddForm()"
          class="px-3 py-1.5 text-xs font-medium rounded shadow-sm bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      <!-- Add/Edit Form -->
      @if (showForm()) {
        <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ editingProduct() ? 'Edit' : 'Add' }} Loan Product
            </h3>
            <button
              (click)="cancelForm()"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form (ngSubmit)="saveProduct()" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <!-- Product Code -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Product Code</label>
                <input
                  type="text"
                  [(ngModel)]="formData.productCode"
                  name="productCode"
                  required
                  [disabled]="!!editingProduct()"
                  placeholder="e.g., PL-001"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              <!-- Product Name -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                <input
                  type="text"
                  [(ngModel)]="formData.name"
                  name="name"
                  required
                  placeholder="e.g., Personal Loan"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <!-- Description -->
              <div class="col-span-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  [(ngModel)]="formData.description"
                  name="description"
                  rows="2"
                  placeholder="Product description..."
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              <!-- Min Amount -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Min Amount (₱)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.minAmount"
                  name="minAmount"
                  required
                  min="0"
                  step="1000"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <!-- Max Amount -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Max Amount (₱)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.maxAmount"
                  name="maxAmount"
                  required
                  min="0"
                  step="1000"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <!-- Interest Rate -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.interestRate"
                  name="interestRate"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <!-- Interest Type -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Type</label>
                <select
                  [(ngModel)]="formData.interestType"
                  name="interestType"
                  required
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="flat">Flat Rate</option>
                  <option value="reducing">Reducing Balance</option>
                  <option value="compound">Compound</option>
                </select>
              </div>

              <!-- Min Term Days -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Min Term (Days)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.minTermDays"
                  name="minTermDays"
                  required
                  min="1"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <!-- Max Term Days -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Max Term (Days)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.maxTermDays"
                  name="maxTermDays"
                  required
                  min="1"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <!-- Processing Fee -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Processing Fee (%)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.processingFeePercent"
                  name="processingFeePercent"
                  min="0"
                  max="100"
                  step="0.01"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <!-- Late Payment Penalty -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Late Payment Penalty (%)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.latePaymentPenaltyPercent"
                  name="latePaymentPenaltyPercent"
                  min="0"
                  max="100"
                  step="0.01"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <!-- Grace Period Days -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Grace Period (Days)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.gracePeriodDays"
                  name="gracePeriodDays"
                  min="0"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                [(ngModel)]="formData.isActive"
                name="isActive"
                id="isActive"
                class="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-1 focus:ring-blue-500"
              />
              <label for="isActive" class="text-xs text-gray-700 dark:text-gray-300">Active</label>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                (click)="cancelForm()"
                class="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="saving()"
                class="px-3 py-1.5 text-xs rounded shadow-sm bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ saving() ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Loading State -->
      @if (loading()) {
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">Loading...</p>
        </div>
      }

      <!-- Products Table -->
      @if (!loading()) {
        <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Product</th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Amount Range</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Interest</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Term (Days)</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Fees</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @for (product of loanProducts(); track product.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td class="px-3 py-2">
                      <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ product.name }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">{{ product.productCode }}</div>
                      @if (product.description) {
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ product.description }}</div>
                      }
                    </td>
                    <td class="px-3 py-2 text-right">
                      <div class="text-xs text-gray-600 dark:text-gray-400">
                        ₱{{ product.minAmount | number:'1.0-0' }} - ₱{{ product.maxAmount | number:'1.0-0' }}
                      </div>
                    </td>
                    <td class="px-3 py-2 text-center">
                      <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ product.interestRate }}%</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 capitalize">{{ product.interestType }}</div>
                    </td>
                    <td class="px-3 py-2 text-center text-xs text-gray-600 dark:text-gray-400">
                      {{ product.minTermDays }} - {{ product.maxTermDays }}
                    </td>
                    <td class="px-3 py-2 text-center text-xs text-gray-600 dark:text-gray-400">
                      <div>Processing: {{ product.processingFeePercent }}%</div>
                      <div>Penalty: {{ product.latePaymentPenaltyPercent }}%</div>
                    </td>
                    <td class="px-3 py-2 text-center">
                      @if (product.isActive) {
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          Active
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          Inactive
                        </span>
                      }
                    </td>
                    <td class="px-3 py-2">
                      <div class="flex items-center justify-center gap-1">
                        <button
                          (click)="editProduct(product)"
                          class="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                          title="Edit"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          (click)="toggleProductStatus(product)"
                          class="p-1 rounded text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition"
                          [title]="product.isActive ? 'Deactivate' : 'Activate'"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                      No loan products configured yet
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class LoanProductsComponent implements OnInit {
  private loanService = inject(LoanService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  editingProduct = signal<LoanProduct | null>(null);
  loanProducts = signal<LoanProduct[]>([]);
  private tenantId: string | number = '';

  formData: LoanProduct = this.getEmptyForm();

  ngOnInit() {
    const user = this.authService.currentUser();
    this.tenantId = user?.tenantId || '';
    this.loadLoanProducts();
  }

  loadLoanProducts() {
    this.loading.set(true);

    this.loanService.getLoanProducts(String(this.tenantId)).subscribe({
      next: (response) => {
        this.loanProducts.set(response.data || []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load loan products:', error);
        this.toastService.error('Failed to load loan products');
        this.loading.set(false);
      }
    });
  }

  showAddForm() {
    this.editingProduct.set(null);
    this.formData = this.getEmptyForm();
    this.showForm.set(true);
  }

  editProduct(product: LoanProduct) {
    this.editingProduct.set(product);
    this.formData = { ...product };
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingProduct.set(null);
    this.formData = this.getEmptyForm();
  }

  saveProduct() {
    this.saving.set(true);

    const observable = this.editingProduct()
      ? this.loanService.updateLoanProduct(String(this.tenantId), this.formData.id!, this.formData)
      : this.loanService.createLoanProduct(String(this.tenantId), this.formData);

    observable.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.loadLoanProducts();
        this.toastService.success(this.editingProduct() ? 'Product updated successfully' : 'Product created successfully');
      },
      error: (error) => {
        console.error('Failed to save loan product:', error);
        this.saving.set(false);
        this.toastService.error('Failed to save loan product');
      }
    });
  }

  toggleProductStatus(product: LoanProduct) {
    const updatedProduct = { ...product, isActive: !product.isActive };
    
    this.loanService.updateLoanProduct(String(this.tenantId), product.id!, updatedProduct).subscribe({
      next: () => {
        this.loadLoanProducts();
        this.toastService.success(`Product ${updatedProduct.isActive ? 'activated' : 'deactivated'} successfully`);
      },
      error: (error) => {
        console.error('Failed to update product status:', error);
        this.toastService.error('Failed to update product status');
      }
    });
  }

  private getEmptyForm(): LoanProduct {
    return {
      productCode: '',
      name: '',
      description: '',
      minAmount: 5000,
      maxAmount: 100000,
      interestRate: 12,
      interestType: 'reducing',
      minTermDays: 90,
      maxTermDays: 730,
      processingFeePercent: 0,
      latePaymentPenaltyPercent: 2,
      gracePeriodDays: 0,
      isActive: true
    };
  }
}
