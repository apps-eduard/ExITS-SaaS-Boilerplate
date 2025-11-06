/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COLLECTOR DISBURSEMENTS PAGE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This page allows collectors to disburse approved loans to customers.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * IMPORTANT: LOAN CALCULATION FORMULA
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Total Repayable = Principal + Interest + Processing Fee + Platform Fee
 * 
 * What Customer Receives (Net Proceeds):
 *   Net = Principal - Processing Fee - Platform Fee
 * 
 * What Customer Must Pay Back (Total Repayable):
 *   Total = Principal + Interest + Processing Fee + Platform Fee
 * 
 * Example:
 *   Principal:        ₱10,000.00
 *   Interest (10%):   ₱1,000.00
 *   Processing (3%):  ₱300.00
 *   Platform (₱100):  ₱200.00 (₱100 × 2 months)
 *   ─────────────────────────────
 *   Net Proceeds:     ₱9,500.00  (Customer receives this)
 *   Total Repayable:  ₱11,500.00 (Customer pays back this)
 * 
 * ⚠️  Processing Fee and Platform Fee are:
 *     1. Deducted UPFRONT from disbursement (customer receives less)
 *     2. Added to TOTAL REPAYABLE (customer must pay them back)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * CURRENCY DISPLAY STANDARD
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * All currency amounts MUST be displayed with:
 *   - Comma thousands separator (e.g., 10,000 not 10000)
 *   - Two decimal places (e.g., 10,000.00 not 10000)
 * 
 * Use formatCurrency() method for all amount displays.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  ToastController,
  AlertController,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import {
  CollectorService,
  PendingDisbursement,
  DisburseDto,
} from '../../core/services/collector.service';
import { AuthService } from '../../core/services/auth.service';
import { CollectorTopBarComponent } from '../../shared/components/collector-top-bar.component';

@Component({
  selector: 'app-collector-disbursements',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    CollectorTopBarComponent
  ],
  template: `
    <ion-content [fullscreen]="true" class="main-content">
      <!-- Pull to Refresh -->
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <app-collector-top-bar
        emoji="💰"
        title="Disbursements"
        subtitle="Process approved loans"
      />

      <!-- Content Container -->
      <div class="disbursements-container">

        <!-- Loading State -->
        @if (loading()) {
          <div class="loading-container">
            @for (item of [1,2,3]; track item) {
              <div class="skeleton-card"></div>
            }
          </div>
        }

        <!-- Empty State -->
        @else if (disbursements().length === 0) {
          <div class="empty-state">
            <div class="empty-emoji">💰</div>
            <h3 class="empty-title">No Pending Disbursements</h3>
            <p class="empty-subtitle">All approved loans have been disbursed</p>
            <div class="hint-box">
              <div class="hint-label">✨ Quick Tip</div>
              <div class="hint-text">New disbursements will appear here when loans are approved by your manager</div>
            </div>
          </div>
        }

        <!-- Disbursements List -->
        @else {
          <div class="disbursements-list">
            @for (disbursement of disbursements(); track disbursement.id) {
              <div class="disbursement-card">
                <!-- Header -->
                <div class="card-header">
                  <div>
                    <div class="customer-name">{{ getCustomerName(disbursement) }}</div>
                    <div class="loan-number">{{ disbursement.loanNumber }}</div>
                  </div>
                  <div class="status-badge">Approved</div>
                </div>

                <!-- Amount Breakdown -->
                <div class="amounts-section">
                  <div class="amount-row">
                    <span class="amount-label">💵 Principal</span>
                    <span class="amount-value principal">₱{{ formatCurrency(disbursement.principalAmount) }}</span>
                  </div>

                  @if (disbursement.interestAmount !== undefined && disbursement.interestAmount !== null) {
                    <div class="amount-row interest-row">
                      <span class="amount-label">
                        📈 Interest ({{ (disbursement.interestRate ?? 0) | number:'1.0-2' }}%)
                      </span>
                      <span class="amount-value interest">₱{{ formatCurrency(disbursement.interestAmount) }}</span>
                    </div>
                  }
                  
                  <div class="amount-row fee-row">
                    <span class="amount-label">
                      📝 Processing Fee ({{ (disbursement.processingFeePercent ?? 0) | number:'1.0-2' }}%)
                    </span>
                    <span class="amount-value fee">-₱{{ formatCurrency(disbursement.processingFee) }}</span>
                  </div>
                  
                  <div class="amount-row fee-row">
                    <span class="amount-label">
                      ⚡ Platform Fee (₱{{ formatCurrency(disbursement.platformFeeMonthly ?? 0) }}/month)
                    </span>
                    <span class="amount-value fee">-₱{{ formatCurrency(disbursement.platformFee) }}</span>
                  </div>
                  
                  <div class="amount-row net-row">
                    <span class="amount-label bold">Net Disbursement</span>
                    <span class="amount-value net">₱{{ formatCurrency(disbursement.netDisbursement) }}</span>
                  </div>
                </div>

                <!-- Details -->
                <div class="details-grid">
                  <div class="detail-item">
                    <div class="detail-label">Customer ID</div>
                    <div class="detail-value">#{{ disbursement.customerId }}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Approved</div>
                    <div class="detail-value">{{ formatDate(disbursement.approvedAt) }}</div>
                  </div>
                  @if (disbursement.interestRate !== undefined && disbursement.interestRate !== null) {
                    <div class="detail-item">
                      <div class="detail-label">Interest Rate</div>
                      <div class="detail-value">{{ disbursement.interestRate }}%</div>
                    </div>
                  }
                  @if (disbursement.totalRepayable !== undefined && disbursement.totalRepayable !== null) {
                    <div class="detail-item">
                      <div class="detail-label">Total Repayable</div>
                      <div class="detail-value">₱{{ formatCurrency(disbursement.totalRepayable) }}</div>
                    </div>
                  }
                </div>

                <!-- Disburse Button -->
                <button class="disburse-button" (click)="openDisburseModal(disbursement)">
                  <span class="button-icon">💸</span>
                  <span>Disburse Loan</span>
                </button>
              </div>
            }
          </div>
        }

        <!-- Disburse Modal -->
        @if (showDisburseModal() && selectedDisbursement()) {
          <div class="modal-backdrop" (click)="closeDisburseModal()">
            <div class="modal-container" (click)="$event.stopPropagation()">
              <!-- Modal Header -->
              <div class="modal-header">
                <h2 class="modal-title">💸 Disburse Loan</h2>
                <button class="close-button" (click)="closeDisburseModal()">✕</button>
              </div>

              <!-- Modal Content -->
              <div class="modal-content">
                <!-- Customer Info -->
                <div class="info-card">
                  <div class="info-row">
                    <span class="info-label">Customer</span>
                    <span class="info-value">{{ getCustomerName(selectedDisbursement()) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Loan Number</span>
                    <span class="info-value">{{ selectedDisbursement()!.loanNumber }}</span>
                  </div>
                  <div class="info-row highlighted">
                    <span class="info-label">Net Amount</span>
                    <span class="info-value amount">₱{{ formatCurrency(selectedDisbursement()!.netDisbursement) }}</span>
                  </div>
                </div>

                <!-- Disbursement Method -->
                <div class="form-field">
                  <label class="field-label">Disbursement Method <span class="required">*</span></label>
                  <div class="select-wrapper">
                    <select [(ngModel)]="disburseForm.disbursementMethod" class="custom-select">
                      <option value="cash">💵 Cash</option>
                      <option value="bank_transfer">🏦 Bank Transfer</option>
                      <option value="gcash">📱 GCash</option>
                      <option value="paymaya">💳 PayMaya</option>
                    </select>
                    <div class="select-arrow">▼</div>
                  </div>
                </div>

                <!-- Reference Number (if not cash) -->
                @if (disburseForm.disbursementMethod !== 'cash') {
                  <div class="form-field">
                    <label class="field-label">Reference Number <span class="required">*</span></label>
                    <input 
                      type="text"
                      [(ngModel)]="disburseForm.referenceNumber"
                      placeholder="Enter reference/transaction number"
                      class="custom-input">
                  </div>
                }

                <!-- Notes -->
                <div class="form-field">
                  <label class="field-label">Notes (Optional)</label>
                  <textarea 
                    [(ngModel)]="disburseForm.notes"
                    rows="3"
                    placeholder="Add any additional notes..."
                    class="custom-textarea"></textarea>
                </div>

                <!-- Warning for high amounts -->
                @if (selectedDisbursement()!.principalAmount > 100000) {
                  <div class="warning-box">
                    <div class="warning-icon">⚠️</div>
                    <div class="warning-text">
                      <div class="warning-title">High-Value Disbursement</div>
                      <div>Please verify customer identity and ensure proper documentation.</div>
                    </div>
                  </div>
                }

                <!-- Info Box -->
                <div class="info-box">
                  <div class="info-icon">📋</div>
                  <div class="info-content">
                    <div class="info-title">Important Checklist:</div>
                    <ul class="checklist">
                      <li>✓ Verify customer identity before disbursing</li>
                      <li>✓ Customer must sign disbursement receipt</li>
                      <li>✓ For cash: Count amount in front of customer</li>
                      <li>✓ For transfers: Confirm receipt before closing</li>
                    </ul>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="modal-actions">
                  <button
                    class="submit-button"
                    [class.disabled]="!isDisburseFormValid()"
                    [disabled]="!isDisburseFormValid()"
                    (click)="confirmDisburse()">
                    <span class="button-icon">✓</span>
                    <span>Confirm Disbursement</span>
                  </button>
                  <button class="cancel-button" (click)="closeDisburseModal()">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        }

      </div>
    </ion-content>
  `,
  styles: [`
    /* ======================
       MAIN LAYOUT
       ====================== */
    .main-content {
      --background: var(--ion-background-color, #f8fafc);
    }

    /* Main Container */
    .disbursements-container {
      padding: calc(84px + env(safe-area-inset-top) + 0.85rem) 0.85rem calc(72px + env(safe-area-inset-bottom) + 0.85rem) 0.85rem;
    }

    /* ======================
       LOADING STATE
       ====================== */
    .loading-container {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .skeleton-card {
      height: 220px;
      background: linear-gradient(
        90deg,
        var(--ion-card-background, #fff) 0%,
        var(--ion-color-light, #f4f5f8) 50%,
        var(--ion-card-background, #fff) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 14px;
      border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* ======================
       EMPTY STATE
       ====================== */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 56px - env(safe-area-inset-top) - 60px - env(safe-area-inset-bottom));
      text-align: center;
      padding: 3rem 1.5rem;
    }

    .empty-emoji {
      font-size: 4rem;
      margin-bottom: 1.25rem;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .empty-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--ion-text-color, #1e293b);
      margin: 0 0 0.5rem 0;
    }

    .empty-subtitle {
      font-size: 0.9375rem;
      color: var(--ion-color-step-600, #64748b);
      margin: 0 0 1.5rem 0;
      line-height: 1.5;
    }

    .hint-box {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border-radius: 12px;
      padding: 1rem;
      max-width: 300px;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
    }

    .hint-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #065f46;
      margin-bottom: 0.35rem;
    }

    .hint-text {
      font-size: 0.8125rem;
      color: #047857;
      line-height: 1.4;
    }

    /* ======================
       DISBURSEMENT CARDS
       ====================== */
    .disbursements-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .disbursement-card {
      background: var(--ion-card-background, #fff);
      border-radius: 14px;
      padding: 1rem;
      border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
      box-shadow: 0 1px 3px var(--shadow-color, rgba(0,0,0,0.05));
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    /* Card Header */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .customer-name {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--ion-text-color, #1e293b);
      line-height: 1.3;
    }

    .loan-number {
      font-size: 0.8125rem;
      color: var(--ion-color-step-600, #64748b);
      margin-top: 0.25rem;
    }

    .status-badge {
      padding: 0.3rem 0.65rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      color: #065f46;
    }

    /* Amounts Section */
    .amounts-section {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border-radius: 10px;
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .amount-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .amount-row.fee-row {
      padding-left: 0.5rem;
      opacity: 0.85;
    }

    .amount-row.interest-row {
      padding-left: 0.5rem;
    }

    .amount-row.net-row {
      border-top: 2px solid #10b981;
      padding-top: 0.65rem;
      margin-top: 0.35rem;
    }

    .amount-label {
      font-size: 0.8125rem;
      color: var(--ion-color-step-700, #475569);
    }

    .amount-label.bold {
      font-weight: 600;
      color: var(--ion-text-color, #1e293b);
    }

    .amount-value {
      font-size: 0.9375rem;
      font-weight: 700;
    }

    .amount-value.principal {
      color: #10b981;
    }

    .amount-value.fee {
      color: #f59e0b;
      font-size: 0.875rem;
    }

    .amount-value.interest {
      color: #2563eb;
      font-size: 0.9rem;
    }

    .amount-value.net {
      color: #059669;
      font-size: 1.0625rem;
    }

    /* Details Grid */
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-label {
      font-size: 0.75rem;
      color: var(--ion-color-step-600, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .detail-value {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--ion-text-color, #1e293b);
    }

    /* Disburse Button */
    .disburse-button {
      width: 100%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 0.85rem 1.25rem;
      font-size: 0.9375rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
      transition: all 0.2s;
    }

    .disburse-button:active {
      transform: scale(0.98);
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
    }

    .button-icon {
      font-size: 1.125rem;
      line-height: 1;
    }

    /* ======================
       MODAL
       ====================== */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      align-items: flex-end;
      animation: fadeIn 0.2s;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-container {
      background: var(--ion-card-background, #fff);
      border-radius: 20px 20px 0 0;
      width: 100%;
      max-height: 85vh;
      overflow-y: auto;
      animation: slideUp 0.3s;
      padding-bottom: env(safe-area-inset-bottom);
    }

    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.25rem 1rem 1.25rem;
      border-bottom: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
      position: sticky;
      top: 0;
      background: var(--ion-card-background, #fff);
      z-index: 1;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--ion-text-color, #1e293b);
      margin: 0;
    }

    .close-button {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--ion-color-light, #f4f5f8);
      border: none;
      color: var(--ion-text-color, #1e293b);
      font-size: 1.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .close-button:active {
      background: var(--ion-color-step-200, #e2e8f0);
    }

    .modal-content {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Info Card */
    .info-card {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-row.highlighted {
      border-top: 2px solid #10b981;
      padding-top: 0.65rem;
      margin-top: 0.35rem;
    }

    .info-label {
      font-size: 0.8125rem;
      color: #047857;
    }

    .info-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #065f46;
    }

    .info-value.amount {
      font-size: 1.0625rem;
      font-weight: 700;
      color: #059669;
    }

    /* Form Fields */
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .field-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--ion-text-color, #1e293b);
    }

    .field-label .required {
      color: #dc2626;
      margin-left: 0.15rem;
    }

    .select-wrapper {
      position: relative;
    }

    .custom-select {
      width: 100%;
      padding: 0.75rem 2.5rem 0.75rem 0.85rem;
      border: 1.5px solid var(--ion-border-color, rgba(0,0,0,0.15));
      border-radius: 10px;
      font-size: 0.9375rem;
      color: var(--ion-text-color, #1e293b);
      background: var(--ion-card-background, #fff);
      appearance: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .custom-select:focus {
      outline: none;
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    .select-arrow {
      position: absolute;
      right: 0.85rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--ion-color-step-600, #64748b);
      pointer-events: none;
      font-size: 0.75rem;
    }

    .custom-input {
      width: 100%;
      padding: 0.75rem 0.85rem;
      border: 1.5px solid var(--ion-border-color, rgba(0,0,0,0.15));
      border-radius: 10px;
      font-size: 0.9375rem;
      color: var(--ion-text-color, #1e293b);
      background: var(--ion-card-background, #fff);
      transition: all 0.2s;
    }

    .custom-input:focus {
      outline: none;
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    .custom-input::placeholder {
      color: var(--ion-color-step-400, #94a3b8);
    }

    .custom-textarea {
      width: 100%;
      padding: 0.75rem 0.85rem;
      border: 1.5px solid var(--ion-border-color, rgba(0,0,0,0.15));
      border-radius: 10px;
      font-size: 0.9375rem;
      color: var(--ion-text-color, #1e293b);
      background: var(--ion-card-background, #fff);
      font-family: inherit;
      resize: vertical;
      transition: all 0.2s;
    }

    .custom-textarea:focus {
      outline: none;
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    .custom-textarea::placeholder {
      color: var(--ion-color-step-400, #94a3b8);
    }

    /* Warning Box */
    .warning-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 10px;
      padding: 0.85rem;
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .warning-icon {
      font-size: 1.25rem;
      line-height: 1;
    }

    .warning-text {
      flex: 1;
    }

    .warning-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 0.25rem;
    }

    .warning-text > div:last-child {
      font-size: 0.8125rem;
      color: #78350f;
      line-height: 1.4;
    }

    /* Info Box */
    .info-box {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-radius: 10px;
      padding: 0.85rem;
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .info-icon {
      font-size: 1.25rem;
      line-height: 1;
    }

    .info-content {
      flex: 1;
    }

    .info-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 0.5rem;
    }

    .checklist {
      margin: 0;
      padding-left: 1.25rem;
      list-style: none;
    }

    .checklist li {
      font-size: 0.8125rem;
      color: #1e3a8a;
      line-height: 1.6;
      margin-bottom: 0.25rem;
    }

    .checklist li::before {
      content: '';
      margin-right: 0;
    }

    /* Modal Actions */
    .modal-actions {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      padding-top: 0.5rem;
    }

    .submit-button {
      width: 100%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 0.85rem 1.25rem;
      font-size: 0.9375rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
      transition: all 0.2s;
    }

    .submit-button:active {
      transform: scale(0.98);
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
    }

    .submit-button.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    .submit-button.disabled:active {
      transform: none;
    }

    .cancel-button {
      width: 100%;
      background: var(--ion-color-light, #f4f5f8);
      color: var(--ion-text-color, #1e293b);
      border: none;
      border-radius: 10px;
      padding: 0.85rem 1.25rem;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .cancel-button:active {
      background: var(--ion-color-step-200, #e2e8f0);
    }

    /* ======================
       RESPONSIVE
       ====================== */
    @media (min-width: 768px) {
      .disbursements-container {
        max-width: 600px;
        margin: 0 auto;
      }

      .modal-container {
        max-width: 600px;
        margin: 0 auto;
      }
    }
  `]
})
export class CollectorDisbursementsPage implements OnInit, ViewWillEnter {
  private collectorService = inject(CollectorService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  loading = signal(true);
  disbursements = signal<PendingDisbursement[]>([]);
  collectorId = signal<number>(0);

  // Modal states
  showDisburseModal = signal(false);
  selectedDisbursement = signal<PendingDisbursement | null>(null);

  // Form model
  disburseForm: DisburseDto = {
    disbursementMethod: 'cash',
    referenceNumber: '',
    notes: '',
  };

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.collectorId.set(Number(user.id));
    }
  }

  ionViewWillEnter() {
    if (this.collectorId()) {
      this.loadDisbursements();
    }
  }

  async loadDisbursements() {
    this.loading.set(true);
    try {
      const response = await this.collectorService.getPendingDisbursements(this.collectorId()).toPromise();
      console.log('💰 Raw disbursements response:', response);
      console.log('💰 Response type:', typeof response);
      console.log('💰 Is array:', Array.isArray(response));
      
      let dataArray: PendingDisbursement[] = [];
      
      // Handle different response formats
      if (Array.isArray(response)) {
        // Direct array response
        dataArray = response;
        console.log('✅ Direct array format');
      } else if (response && typeof response === 'object') {
        // Check for wrapped response with 'data' property
        if ('data' in response && Array.isArray((response as any).data)) {
          dataArray = (response as any).data;
          console.log('✅ Wrapped data format');
        } else if ('data' in response && (response as any).data && typeof (response as any).data === 'object') {
          // Sometimes data might be an object with results inside
          const dataObj = (response as any).data;
          if ('results' in dataObj && Array.isArray(dataObj.results)) {
            dataArray = dataObj.results;
            console.log('✅ Nested results format');
          } else if ('items' in dataObj && Array.isArray(dataObj.items)) {
            dataArray = dataObj.items;
            console.log('✅ Nested items format');
          }
        }
      }
      
      console.log('✅ Final disbursements array:', dataArray);
      console.log('✅ Count:', dataArray.length);
      this.disbursements.set(dataArray);
    } catch (error: any) {
      console.error('❌ Failed to load disbursements:', error);
      console.error('❌ Error response:', error.error);
      this.disbursements.set([]);
      await this.showToast(error.error?.message || 'Failed to load disbursements', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  async handleRefresh(event: any) {
    await this.loadDisbursements();
    event.target.complete();
  }

  openDisburseModal(disbursement: PendingDisbursement) {
    this.selectedDisbursement.set(disbursement);
    this.disburseForm = {
      disbursementMethod: 'cash',
      referenceNumber: '',
      notes: '',
    };
    this.showDisburseModal.set(true);
  }

  closeDisburseModal() {
    this.showDisburseModal.set(false);
    this.selectedDisbursement.set(null);
  }

  isDisburseFormValid(): boolean {
    if (!this.disburseForm.disbursementMethod) return false;
    
    if (this.disburseForm.disbursementMethod !== 'cash' && !this.disburseForm.referenceNumber) {
      return false;
    }
    
    return true;
  }

  async confirmDisburse() {
    if (!this.selectedDisbursement()) return;

    const methodLabel = this.getMethodLabel(this.disburseForm.disbursementMethod);
    const customerName = this.getCustomerName(this.selectedDisbursement());

    const alert = await this.alertController.create({
      header: 'Confirm Disbursement',
      message: `
        Customer: ${customerName}
        Amount: ₱${this.selectedDisbursement()!.netDisbursement.toLocaleString()}
        Method: ${methodLabel}
        
        ⚠️ This action cannot be undone.
      `,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Disburse',
          handler: async () => {
            await this.disburseLoan();
          },
        },
      ],
    });

    await alert.present();
  }

  async disburseLoan() {
    if (!this.selectedDisbursement()) return;

    try {
      await this.collectorService.disburseLoan(
        this.collectorId(),
        this.selectedDisbursement()!.id,
        this.disburseForm
      ).toPromise();

      await this.showToast('✅ Loan disbursed successfully!', 'success');
      this.closeDisburseModal();
      await this.loadDisbursements();
    } catch (error: any) {
      await this.showToast(error.error?.message || 'Failed to disburse loan', 'danger');
    }
  }

  /**
   * Format currency with comma thousands separator and 2 decimal places
   * Example: 10000 → "10,000.00"
   */
  formatCurrency(amount: number | null | undefined): string {
    const value = Number(amount ?? 0);
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
    });
  }

  getCustomerName(disbursement: PendingDisbursement | null): string {
    if (!disbursement) return 'N/A';
    
    // Handle different response formats
    const anyDisbursement = disbursement as any;
    
    // Web format: { customer: { fullName: "...", customerCode: "..." } }
    if (anyDisbursement.customer) {
      // First try fullName
      if (anyDisbursement.customer.fullName && anyDisbursement.customer.fullName.trim()) {
        return anyDisbursement.customer.fullName;
      }
      // Fallback to customerCode (usually email)
      if (anyDisbursement.customer.customerCode) {
        return anyDisbursement.customer.customerCode;
      }
    }
    
    // Direct format: { customerName: "..." }
    if (disbursement.customerName && disbursement.customerName.trim()) {
      return disbursement.customerName;
    }
    
    // Try customerCode directly
    if (anyDisbursement.customerCode) {
      return anyDisbursement.customerCode;
    }
    
    // Last resort: show customer ID
    if (disbursement.customerId) {
      return `Customer #${disbursement.customerId}`;
    }
    
    // Fallback
    return 'N/A';
  }

  getMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      cash: '💵 Cash',
      bank_transfer: '🏦 Bank Transfer',
      gcash: '📱 GCash',
      paymaya: '💳 PayMaya',
    };
    return labels[method] || method;
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
