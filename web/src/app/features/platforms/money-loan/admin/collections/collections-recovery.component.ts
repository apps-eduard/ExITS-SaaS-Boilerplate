import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../../core/services/toast.service';

interface RecoveryMetric {
  month: string;
  recovered: number;
  writeOffs: number;
  settlements: number;
  recoveryRate: number;
}

@Component({
  selector: 'app-collections-recovery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6">
      <div class="mb-4">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <span class="text-lg">🔄</span>
          </div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Recovery Dashboard</h1>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400 ml-11">Recovery analytics, write-offs, and settlements</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <p class="text-xs text-green-600 dark:text-green-400 mb-0.5">Total Recovered</p>
          <p class="text-xl font-bold text-green-700 dark:text-green-300">₱{{ formatCurrency(totalRecovered()) }}</p>
        </div>
        <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
          <p class="text-xs text-red-600 dark:text-red-400 mb-0.5">Write-Offs</p>
          <p class="text-xl font-bold text-red-700 dark:text-red-300">₱{{ formatCurrency(totalWriteOffs()) }}</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
          <p class="text-xs text-purple-600 dark:text-purple-400 mb-0.5">Settlements</p>
          <p class="text-xl font-bold text-purple-700 dark:text-purple-300">₱{{ formatCurrency(totalSettlements()) }}</p>
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p class="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Recovery Rate</p>
          <p class="text-xl font-bold text-blue-700 dark:text-blue-300">{{ avgRecoveryRate() }}%</p>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">📊 Monthly Recovery Metrics</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Month</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Recovered</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Write-Offs</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Settlements</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Recovery Rate</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (metric of metrics(); track metric.month) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td class="px-3 py-2 text-gray-900 dark:text-white font-medium">{{ metric.month }}</td>
                  <td class="px-3 py-2 text-green-600 dark:text-green-400 font-semibold">₱{{ formatCurrency(metric.recovered) }}</td>
                  <td class="px-3 py-2 text-red-600 dark:text-red-400">₱{{ formatCurrency(metric.writeOffs) }}</td>
                  <td class="px-3 py-2 text-purple-600 dark:text-purple-400">₱{{ formatCurrency(metric.settlements) }}</td>
                  <td class="px-3 py-2">
                    <span [class]="getRecoveryRateClass(metric.recoveryRate)" class="px-2 py-0.5 text-xs font-semibold rounded">
                      {{ metric.recoveryRate }}%
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class CollectionsRecoveryComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  metrics = signal<RecoveryMetric[]>([
    { month: 'Oct 2024', recovered: 450000, writeOffs: 85000, settlements: 120000, recoveryRate: 72 },
    { month: 'Sep 2024', recovered: 520000, writeOffs: 62000, settlements: 95000, recoveryRate: 78 },
    { month: 'Aug 2024', recovered: 380000, writeOffs: 110000, settlements: 88000, recoveryRate: 65 }
  ]);

  totalRecovered = computed(() => this.metrics().reduce((sum, m) => sum + m.recovered, 0));
  totalWriteOffs = computed(() => this.metrics().reduce((sum, m) => sum + m.writeOffs, 0));
  totalSettlements = computed(() => this.metrics().reduce((sum, m) => sum + m.settlements, 0));
  avgRecoveryRate = computed(() => {
    const metrics = this.metrics();
    return metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + m.recoveryRate, 0) / metrics.length) : 0;
  });

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  getRecoveryRateClass(rate: number): string {
    if (rate >= 75) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (rate >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  }
}
