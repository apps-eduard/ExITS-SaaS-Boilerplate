import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanCalculatorService, LoanParams, LoanCalculation, ScheduleItem, PenaltyCalculation } from '../shared/services/loan-calculator.service';

@Component({
  selector: 'app-loan-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">🧮 Loan Calculator</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Calculate loan amounts, repayments, and view amortization schedules
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Input Form -->
        <div class="lg:col-span-1">
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span class="text-xl">📋</span>
              Loan Parameters
            </h2>

            <!-- Loan Amount -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Loan Amount (₱)
              </label>
              <input
                type="number"
                [(ngModel)]="loanAmount"
                (ngModelChange)="calculate()"
                min="1000"
                step="1000"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="10,000"
              />
            </div>

            <!-- Loan Term -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Loan Term
              </label>
              <select
                [(ngModel)]="termMonths"
                (ngModelChange)="calculate()"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option [value]="1">1 Month</option>
                <option [value]="2">2 Months</option>
                <option [value]="3">Quarter (3 Months)</option>
                <option [value]="6">6 Months</option>
              </select>
            </div>

            <!-- Payment Frequency -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Frequency
              </label>
              <select
                [(ngModel)]="paymentFrequency"
                (ngModelChange)="calculate()"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <!-- Interest Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interest Type
              </label>
              <select
                [(ngModel)]="interestType"
                (ngModelChange)="calculate()"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="flat">Flat (Interest Deducted Upfront)</option>
                <option value="reducing">Reducing Balance</option>
                <option value="compound">Compound Interest</option>
              </select>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                @if (interestType === 'flat') {
                  Interest calculated once and deducted upfront
                } @else if (interestType === 'reducing') {
                  Interest recalculated on remaining balance
                } @else {
                  Interest accumulates and compounds
                }
              </p>
            </div>

            <!-- Interest Rate -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interest Rate (%)
              </label>
              <input
                type="number"
                [(ngModel)]="interestRate"
                (ngModelChange)="calculate()"
                min="0"
                max="100"
                step="0.5"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="5.0"
              />
            </div>

            <!-- Processing Fee -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Processing Fee (%)
              </label>
              <input
                type="number"
                [(ngModel)]="processingFeePercentage"
                (ngModelChange)="calculate()"
                min="0"
                max="10"
                step="0.1"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="2.0"
              />
            </div>

            <!-- Platform Fee -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Platform Fee (₱)
              </label>
              <input
                type="number"
                [(ngModel)]="platformFee"
                (ngModelChange)="calculate()"
                min="0"
                step="10"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="50"
              />
            </div>

            <!-- Late Penalty Rate -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Late Penalty Rate (% per day)
              </label>
              <input
                type="number"
                [(ngModel)]="latePenaltyPercentage"
                (ngModelChange)="calculate()"
                min="0"
                max="5"
                step="0.1"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="1.0"
              />
            </div>

            <!-- Calculate Button -->
            <button
              (click)="calculate()"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              🔄 Recalculate
            </button>
          </div>
        </div>

        <!-- Right: Results -->
        <div class="lg:col-span-2 space-y-6">
          @if (result()) {
            <!-- Summary Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <!-- Net Proceeds -->
              <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
                <p class="text-xs font-medium text-green-600 dark:text-green-400">Borrower Receives</p>
                <p class="text-xl font-bold text-green-700 dark:text-green-300 mt-1">
                  {{ formatCurrency(result()!.netProceeds) }}
                </p>
                <p class="text-xs text-green-600/70 dark:text-green-400/70 mt-1">Net Proceeds</p>
              </div>

              <!-- Total Repayable -->
              <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
                <p class="text-xs font-medium text-blue-600 dark:text-blue-400">Total Repayable</p>
                <p class="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                  {{ formatCurrency(result()!.totalRepayable) }}
                </p>
                <p class="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">Full Amount</p>
              </div>

              <!-- Installment Amount -->
              <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-4">
                <p class="text-xs font-medium text-purple-600 dark:text-purple-400">Per {{ result()!.paymentFrequency }}</p>
                <p class="text-xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                  {{ formatCurrency(result()!.installmentAmount) }}
                </p>
                <p class="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">{{ result()!.numPayments }} payments</p>
              </div>

              <!-- Effective Rate -->
              <div class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-4">
                <p class="text-xs font-medium text-amber-600 dark:text-amber-400">Effective APR</p>
                <p class="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                  {{ result()!.effectiveInterestRate.toFixed(2) }}%
                </p>
                <p class="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">True cost</p>
              </div>
            </div>

            <!-- Detailed Breakdown -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span class="text-xl">💰</span>
                Loan Breakdown
              </h3>

              <div class="space-y-3">
                <!-- Loan Amount -->
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 dark:text-gray-400">Loan Amount</span>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ formatCurrency(result()!.loanAmount) }}</span>
                </div>

                <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                <!-- Deductions -->
                <div class="space-y-2 bg-red-50 dark:bg-red-900/10 p-3 rounded">
                  <p class="text-xs font-semibold text-red-700 dark:text-red-400">Deductions:</p>
                  
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Interest ({{ interestRate }}%)</span>
                    <span class="text-red-600 dark:text-red-400">-{{ formatCurrency(result()!.interestAmount) }}</span>
                  </div>

                  @if (result()!.processingFeeAmount > 0) {
                    <div class="flex justify-between items-center text-sm">
                      <span class="text-gray-600 dark:text-gray-400">Processing Fee ({{ processingFeePercentage }}%)</span>
                      <span class="text-red-600 dark:text-red-400">-{{ formatCurrency(result()!.processingFeeAmount) }}</span>
                    </div>
                  }

                  @if (result()!.platformFee > 0) {
                    <div class="flex justify-between items-center text-sm">
                      <span class="text-gray-600 dark:text-gray-400">Platform Fee</span>
                      <span class="text-red-600 dark:text-red-400">-{{ formatCurrency(result()!.platformFee) }}</span>
                    </div>
                  }

                  <div class="border-t border-red-200 dark:border-red-800 pt-2 mt-2">
                    <div class="flex justify-between items-center font-semibold text-sm">
                      <span class="text-red-700 dark:text-red-400">Total Deductions</span>
                      <span class="text-red-700 dark:text-red-400">-{{ formatCurrency(result()!.totalDeductions) }}</span>
                    </div>
                  </div>
                </div>

                <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                <!-- Net Proceeds -->
                <div class="flex justify-between items-center bg-green-50 dark:bg-green-900/10 p-3 rounded">
                  <span class="text-sm font-bold text-green-700 dark:text-green-400">Net Proceeds (You Get)</span>
                  <span class="text-lg font-bold text-green-700 dark:text-green-400">{{ formatCurrency(result()!.netProceeds) }}</span>
                </div>

                <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                <!-- Payment Info -->
                <div class="space-y-2">
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Number of Payments</span>
                    <span class="text-gray-900 dark:text-white font-semibold">{{ result()!.numPayments }} {{ result()!.paymentFrequency }} payments</span>
                  </div>

                  <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Each {{ result()!.paymentFrequency }} Payment</span>
                    <span class="text-gray-900 dark:text-white font-semibold">{{ formatCurrency(result()!.installmentAmount) }}</span>
                  </div>

                  @if (result()!.monthlyEquivalent && result()!.paymentFrequency !== 'monthly') {
                    <div class="flex justify-between items-center text-sm">
                      <span class="text-gray-600 dark:text-gray-400">Monthly Equivalent</span>
                      <span class="text-gray-900 dark:text-white font-semibold">{{ formatCurrency(result()!.monthlyEquivalent) }}</span>
                    </div>
                  }

                  <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Grace Period</span>
                    <span class="text-gray-900 dark:text-white font-semibold">{{ result()!.gracePeriodDays }} day(s)</span>
                  </div>
                </div>

                <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                <!-- Total Repayable -->
                <div class="flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 p-3 rounded">
                  <span class="text-sm font-bold text-blue-700 dark:text-blue-400">Total to Repay</span>
                  <span class="text-lg font-bold text-blue-700 dark:text-blue-400">{{ formatCurrency(result()!.totalRepayable) }}</span>
                </div>
              </div>
            </div>

            <!-- Tabs for Schedule and Penalty Calculator -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <!-- Tab Headers -->
              <div class="border-b border-gray-200 dark:border-gray-700">
                <div class="flex">
                  <button
                    (click)="activeTab.set('schedule')"
                    [class.border-blue-500]="activeTab() === 'schedule'"
                    [class.text-blue-600]="activeTab() === 'schedule'"
                    [class.dark:text-blue-400]="activeTab() === 'schedule'"
                    class="flex-1 px-4 py-3 text-sm font-medium border-b-2 transition"
                  >
                    📅 Repayment Schedule
                  </button>
                  <button
                    (click)="activeTab.set('penalty')"
                    [class.border-blue-500]="activeTab() === 'penalty'"
                    [class.text-blue-600]="activeTab() === 'penalty'"
                    [class.dark:text-blue-400]="activeTab() === 'penalty'"
                    class="flex-1 px-4 py-3 text-sm font-medium border-b-2 transition"
                  >
                    ⚠️ Penalty Calculator
                  </button>
                </div>
              </div>

              <!-- Tab Content -->
              <div class="p-6">
                @if (activeTab() === 'schedule') {
                  <!-- Repayment Schedule -->
                  <div class="space-y-4">
                    <div class="flex justify-between items-center">
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Payment Schedule</h3>
                      <button
                        (click)="generateSchedule()"
                        class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        🔄 Regenerate
                      </button>
                    </div>

                    @if (schedule().length > 0) {
                      <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                          <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
                              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Due Date</th>
                              <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Installment</th>
                              <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Balance</th>
                              <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Cumulative</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                            @for (item of schedule(); track item.paymentNumber) {
                              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td class="px-4 py-2 text-gray-900 dark:text-white">{{ item.paymentNumber }}</td>
                                <td class="px-4 py-2 text-gray-600 dark:text-gray-400">{{ formatDate(item.dueDate) }}</td>
                                <td class="px-4 py-2 text-right font-semibold text-gray-900 dark:text-white">{{ formatCurrency(item.installmentAmount) }}</td>
                                <td class="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{{ formatCurrency(item.remainingBalance) }}</td>
                                <td class="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{{ formatCurrency(item.cumulativePaid) }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    } @else {
                      <p class="text-center text-gray-500 dark:text-gray-400 py-8">
                        Click "Regenerate" to create schedule
                      </p>
                    }
                  </div>
                } @else {
                  <!-- Penalty Calculator -->
                  <div class="space-y-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Late Payment Penalty</h3>

                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Days Late
                        </label>
                        <input
                          type="number"
                          [(ngModel)]="daysLate"
                          (ngModelChange)="calculatePenalty()"
                          min="0"
                          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    @if (penaltyResult()) {
                      <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
                        <div class="flex justify-between text-sm">
                          <span class="text-gray-600 dark:text-gray-400">Installment Amount</span>
                          <span class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(penaltyResult()!.installmentAmount) }}</span>
                        </div>

                        <div class="flex justify-between text-sm">
                          <span class="text-gray-600 dark:text-gray-400">Days Late</span>
                          <span class="font-semibold text-gray-900 dark:text-white">{{ penaltyResult()!.daysLate }} days</span>
                        </div>

                        <div class="flex justify-between text-sm">
                          <span class="text-gray-600 dark:text-gray-400">Grace Period</span>
                          <span class="font-semibold text-gray-900 dark:text-white">{{ penaltyResult()!.gracePeriod }} days</span>
                        </div>

                        <div class="flex justify-between text-sm">
                          <span class="text-gray-600 dark:text-gray-400">Effective Late Days</span>
                          <span class="font-semibold text-amber-700 dark:text-amber-400">{{ penaltyResult()!.effectiveLateDays }} days</span>
                        </div>

                        <div class="border-t border-amber-200 dark:border-amber-700 pt-2 mt-2">
                          <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">Penalty ({{ penaltyResult()!.penaltyRate }}% per day)</span>
                            <span class="font-bold text-red-600 dark:text-red-400">{{ formatCurrency(penaltyResult()!.penaltyAmount) }}</span>
                          </div>
                        </div>

                        <div class="bg-red-100 dark:bg-red-900/30 border-t border-red-300 dark:border-red-700 p-3 rounded mt-2">
                          <div class="flex justify-between">
                            <span class="text-sm font-bold text-red-700 dark:text-red-400">Total Due</span>
                            <span class="text-lg font-bold text-red-700 dark:text-red-400">{{ formatCurrency(penaltyResult()!.totalDue) }}</span>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          } @else {
            <!-- Empty State -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div class="text-6xl mb-4">🧮</div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Enter Loan Details</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Fill in the loan parameters on the left to see calculations and schedule
              </p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoanCalculatorComponent {
  private calculatorService = new LoanCalculatorService();

  // Input signals
  loanAmount = 10000;
  termMonths = 1;
  paymentFrequency: 'daily' | 'weekly' | 'monthly' = 'weekly';
  interestType: 'flat' | 'reducing' | 'compound' = 'flat';
  interestRate = 5;
  processingFeePercentage = 0;
  platformFee = 50;
  latePenaltyPercentage = 1;

  // Results
  result = signal<LoanCalculation | null>(null);
  schedule = signal<ScheduleItem[]>([]);
  penaltyResult = signal<PenaltyCalculation | null>(null);

  // UI State
  activeTab = signal<'schedule' | 'penalty'>('schedule');
  daysLate = 0;

  constructor() {
    this.calculate();
  }

  calculate(): void {
    const params: LoanParams = {
      loanAmount: this.loanAmount,
      termMonths: this.termMonths,
      paymentFrequency: this.paymentFrequency,
      interestRate: this.interestRate,
      interestType: this.interestType,
      processingFeePercentage: this.processingFeePercentage,
      platformFee: this.platformFee,
      latePenaltyPercentage: this.latePenaltyPercentage
    };

    const calculation = this.calculatorService.calculate(params);
    this.result.set(calculation);

    // Auto-generate schedule
    this.generateSchedule();

    // Reset penalty calculator
    this.calculatePenalty();
  }

  generateSchedule(): void {
    const calc = this.result();
    if (!calc) return;

    const startDate = new Date();
    const scheduleItems = this.calculatorService.generateSchedule(calc, startDate);
    this.schedule.set(scheduleItems);
  }

  calculatePenalty(): void {
    const calc = this.result();
    if (!calc) return;

    const dueDate = new Date();
    const paymentDate = new Date();
    paymentDate.setDate(paymentDate.getDate() + this.daysLate);

    const penalty = this.calculatorService.calculatePenalty(
      calc.installmentAmount,
      dueDate,
      paymentDate,
      this.paymentFrequency,
      this.latePenaltyPercentage
    );

    this.penaltyResult.set(penalty);
  }

  formatCurrency(amount: number): string {
    return this.calculatorService.formatCurrency(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }
}
