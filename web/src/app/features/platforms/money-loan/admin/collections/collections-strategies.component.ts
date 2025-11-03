import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../../core/services/toast.service';

interface CollectionStrategy {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'call' | 'mixed';
  triggerDays: number;
  targetStage: 'reminder' | 'warning' | 'pre-legal';
  template: string;
  isActive: boolean;
  successRate: number;
  totalExecutions: number;
  averageRecovery: number;
  lastModified: string;
}

interface AutomationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  executionCount: number;
}

interface StrategyTemplate {
  id: string;
  name: string;
  category: 'early-stage' | 'mid-stage' | 'late-stage';
  content: string;
  variables: string[];
}

@Component({
  selector: 'app-collections-strategies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6">
      <!-- Compact Header -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span class="text-lg">📋</span>
            </div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Collection Strategies</h1>
          </div>
          <button
            (click)="createNewStrategy()"
            class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            ➕ New Strategy
          </button>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400 ml-11">Manage collection strategies, templates, and automation</p>
      </div>

      <!-- Strategy Performance Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p class="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Active Strategies</p>
          <p class="text-xl font-bold text-blue-700 dark:text-blue-300">{{ activeStrategies() }}</p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <p class="text-xs text-green-600 dark:text-green-400 mb-0.5">Avg Success Rate</p>
          <p class="text-xl font-bold text-green-700 dark:text-green-300">{{ avgSuccessRate() }}%</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
          <p class="text-xs text-purple-600 dark:text-purple-400 mb-0.5">Total Executions</p>
          <p class="text-xl font-bold text-purple-700 dark:text-purple-300">{{ totalExecutions() }}</p>
        </div>
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
          <p class="text-xs text-orange-600 dark:text-orange-400 mb-0.5">Avg Recovery</p>
          <p class="text-xl font-bold text-orange-700 dark:text-orange-300">₱{{ formatCurrency(avgRecovery()) }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Strategies List -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Active Strategies -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">✅ Active Strategies</h3>
            </div>
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (strategy of strategies().filter(s => s.isActive); track strategy.id) {
                <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{{ strategy.name }}</h4>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        Trigger: {{ strategy.triggerDays }} days overdue • {{ getTypeLabel(strategy.type) }}
                      </p>
                    </div>
                    <span [class]="getStageClass(strategy.targetStage)" class="px-2 py-0.5 text-xs font-semibold rounded">
                      {{ strategy.targetStage }}
                    </span>
                  </div>
                  
                  <!-- Performance Metrics -->
                  <div class="grid grid-cols-3 gap-2 mb-3">
                    <div class="bg-gray-50 dark:bg-gray-900 rounded p-2">
                      <p class="text-xs text-gray-600 dark:text-gray-400">Success Rate</p>
                      <p class="text-sm font-bold text-green-600 dark:text-green-400">{{ strategy.successRate }}%</p>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-900 rounded p-2">
                      <p class="text-xs text-gray-600 dark:text-gray-400">Executions</p>
                      <p class="text-sm font-bold text-gray-900 dark:text-white">{{ strategy.totalExecutions }}</p>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-900 rounded p-2">
                      <p class="text-xs text-gray-600 dark:text-gray-400">Avg Recovery</p>
                      <p class="text-sm font-bold text-blue-600 dark:text-blue-400">₱{{ formatCurrency(strategy.averageRecovery) }}</p>
                    </div>
                  </div>

                  <!-- Template Preview -->
                  <div class="mb-3">
                    <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Template:</p>
                    <div class="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                      <p class="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{{ strategy.template }}</p>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex gap-2">
                    <button
                      (click)="editStrategy(strategy)"
                      class="px-3 py-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded">
                      ✏️ Edit
                    </button>
                    <button
                      (click)="viewAnalytics(strategy)"
                      class="px-3 py-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded">
                      📊 Analytics
                    </button>
                    <button
                      (click)="toggleStrategyStatus(strategy)"
                      class="px-3 py-1 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded">
                      ⏸️ Pause
                    </button>
                    <button
                      (click)="duplicateStrategy(strategy)"
                      class="ml-auto px-3 py-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                      📋 Duplicate
                    </button>
                  </div>
                </div>
              } @empty {
                <p class="text-xs text-gray-500 dark:text-gray-400 text-center py-8">No active strategies</p>
              }
            </div>
          </div>

          <!-- Automation Rules -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">⚙️ Automation Rules</h3>
              <button
                (click)="createAutomationRule()"
                class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                + Add Rule
              </button>
            </div>
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (rule of automationRules(); track rule.id) {
                <div class="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h4 class="text-sm font-medium text-gray-900 dark:text-white">{{ rule.name }}</h4>
                      <span [class]="rule.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'" 
                            class="px-2 py-0.5 text-xs font-semibold rounded">
                        {{ rule.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      When: {{ rule.condition }} → {{ rule.action }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-500">
                      Frequency: {{ rule.frequency }} • Executed {{ rule.executionCount }} times
                    </p>
                  </div>
                  <div class="flex gap-1">
                    <button
                      (click)="toggleRuleStatus(rule)"
                      class="px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      [title]="rule.isActive ? 'Pause' : 'Activate'">
                      {{ rule.isActive ? '⏸️' : '▶️' }}
                    </button>
                    <button
                      (click)="editRule(rule)"
                      class="px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      title="Edit">
                      ✏️
                    </button>
                    <button
                      (click)="deleteRule(rule.id)"
                      class="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Delete">
                      🗑️
                    </button>
                  </div>
                </div>
              } @empty {
                <p class="text-xs text-gray-500 dark:text-gray-400 text-center py-6">No automation rules configured</p>
              }
            </div>
          </div>
        </div>

        <!-- Sidebar: Templates & Tools -->
        <div class="space-y-4">
          <!-- Strategy Templates -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">📄 Message Templates</h3>
            <div class="space-y-2">
              @for (template of templates(); track template.id) {
                <div class="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div class="flex justify-between items-start mb-1">
                    <p class="text-xs font-medium text-gray-900 dark:text-white">{{ template.name }}</p>
                    <span [class]="getCategoryClass(template.category)" class="px-1.5 py-0.5 text-xs font-semibold rounded">
                      {{ template.category }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{{ template.content }}</p>
                  <div class="flex gap-1">
                    <button
                      (click)="useTemplate(template)"
                      class="flex-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded">
                      Use
                    </button>
                    <button
                      (click)="editTemplate(template)"
                      class="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                      ✏️
                    </button>
                  </div>
                </div>
              } @empty {
                <p class="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No templates available</p>
              }
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">⚡ Quick Actions</h3>
            <div class="space-y-2">
              <button
                (click)="testStrategy()"
                class="w-full px-3 py-2 text-xs text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                🧪 Test Strategy
              </button>
              <button
                (click)="exportStrategies()"
                class="w-full px-3 py-2 text-xs text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                📥 Export Strategies
              </button>
              <button
                (click)="importStrategies()"
                class="w-full px-3 py-2 text-xs text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                📤 Import Strategies
              </button>
              <button
                (click)="viewPerformanceReport()"
                class="w-full px-3 py-2 text-xs text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                📊 Performance Report
              </button>
            </div>
          </div>

          <!-- Best Practices -->
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
            <h3 class="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">💡 Best Practices</h3>
            <ul class="text-xs text-blue-800 dark:text-blue-400 space-y-1">
              <li>• Contact within 24hrs of overdue</li>
              <li>• Use personalized messages</li>
              <li>• Escalate gradually (3-5 attempts)</li>
              <li>• Track all contact attempts</li>
              <li>• Offer payment plan options</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CollectionsStrategiesComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  strategies = signal<CollectionStrategy[]>([]);
  automationRules = signal<AutomationRule[]>([]);
  templates = signal<StrategyTemplate[]>([]);

  activeStrategies = computed(() => this.strategies().filter(s => s.isActive).length);
  avgSuccessRate = computed(() => {
    const active = this.strategies().filter(s => s.isActive);
    return active.length > 0 ? Math.round(active.reduce((sum, s) => sum + s.successRate, 0) / active.length) : 0;
  });
  totalExecutions = computed(() => this.strategies().reduce((sum, s) => sum + s.totalExecutions, 0));
  avgRecovery = computed(() => {
    const active = this.strategies().filter(s => s.isActive);
    return active.length > 0 ? Math.round(active.reduce((sum, s) => sum + s.averageRecovery, 0) / active.length) : 0;
  });

  ngOnInit() {
    this.loadStrategies();
    this.loadAutomationRules();
    this.loadTemplates();
  }

  loadStrategies() {
    const mockData: CollectionStrategy[] = [
      {
        id: '1',
        name: 'Early Reminder SMS',
        type: 'sms',
        triggerDays: 3,
        targetStage: 'reminder',
        template: 'Hi {customer_name}, friendly reminder that your payment of ₱{amount} is due on {due_date}.',
        isActive: true,
        successRate: 78,
        totalExecutions: 1250,
        averageRecovery: 8500,
        lastModified: '2024-10-15'
      },
      {
        id: '2',
        name: 'Warning Email Campaign',
        type: 'email',
        triggerDays: 15,
        targetStage: 'warning',
        template: 'Dear {customer_name}, Your account is now {days_overdue} days overdue. Please settle ₱{total_due} immediately.',
        isActive: true,
        successRate: 62,
        totalExecutions: 890,
        averageRecovery: 15200,
        lastModified: '2024-10-20'
      },
      {
        id: '3',
        name: 'Pre-Legal Notice',
        type: 'mixed',
        triggerDays: 45,
        targetStage: 'pre-legal',
        template: 'URGENT: This is a final notice. Legal action will be initiated if ₱{total_due} is not paid within 7 days.',
        isActive: true,
        successRate: 45,
        totalExecutions: 320,
        averageRecovery: 28500,
        lastModified: '2024-10-25'
      }
    ];
    this.strategies.set(mockData);
  }

  loadAutomationRules() {
    const mockRules: AutomationRule[] = [
      {
        id: '1',
        name: 'Auto-escalate 60+ days',
        condition: 'Days overdue > 60',
        action: 'Move to Pre-Legal stage',
        frequency: 'daily',
        isActive: true,
        executionCount: 45
      },
      {
        id: '2',
        name: 'Promise-to-pay reminder',
        condition: 'Promise date reached',
        action: 'Send follow-up SMS',
        frequency: 'daily',
        isActive: true,
        executionCount: 120
      }
    ];
    this.automationRules.set(mockRules);
  }

  loadTemplates() {
    const mockTemplates: StrategyTemplate[] = [
      {
        id: '1',
        name: 'Friendly Reminder',
        category: 'early-stage',
        content: 'Hi {name}! Just a friendly reminder about your payment of ₱{amount} due on {date}. Thank you!',
        variables: ['name', 'amount', 'date']
      },
      {
        id: '2',
        name: 'Urgent Notice',
        category: 'mid-stage',
        content: 'URGENT: Your account is {days} days overdue. Please contact us immediately to avoid additional fees.',
        variables: ['days']
      },
      {
        id: '3',
        name: 'Final Warning',
        category: 'late-stage',
        content: 'FINAL WARNING: Legal proceedings will commence if payment is not received within 7 days.',
        variables: []
      }
    ];
    this.templates.set(mockTemplates);
  }

  createNewStrategy() {
    this.toastService.info('Opening strategy creation form...');
  }

  editStrategy(strategy: CollectionStrategy) {
    this.toastService.info(`Editing strategy: ${strategy.name}`);
  }

  viewAnalytics(strategy: CollectionStrategy) {
    this.toastService.info(`Viewing analytics for: ${strategy.name}`);
  }

  toggleStrategyStatus(strategy: CollectionStrategy) {
    strategy.isActive = !strategy.isActive;
    this.toastService.success(`Strategy ${strategy.isActive ? 'activated' : 'paused'}`);
  }

  duplicateStrategy(strategy: CollectionStrategy) {
    this.toastService.info('Duplicating strategy...');
  }

  createAutomationRule() {
    this.toastService.info('Creating automation rule...');
  }

  toggleRuleStatus(rule: AutomationRule) {
    rule.isActive = !rule.isActive;
    this.toastService.success(`Rule ${rule.isActive ? 'activated' : 'paused'}`);
  }

  editRule(rule: AutomationRule) {
    this.toastService.info(`Editing rule: ${rule.name}`);
  }

  deleteRule(id: string) {
    if (confirm('Delete this automation rule?')) {
      this.automationRules.update(rules => rules.filter(r => r.id !== id));
      this.toastService.success('Rule deleted');
    }
  }

  useTemplate(template: StrategyTemplate) {
    this.toastService.info(`Using template: ${template.name}`);
  }

  editTemplate(template: StrategyTemplate) {
    this.toastService.info(`Editing template: ${template.name}`);
  }

  testStrategy() {
    this.toastService.info('Testing strategy with sample data...');
  }

  exportStrategies() {
    this.toastService.info('Exporting strategies...');
  }

  importStrategies() {
    this.toastService.info('Opening import dialog...');
  }

  viewPerformanceReport() {
    this.toastService.info('Generating performance report...');
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      sms: 'SMS',
      email: 'Email',
      call: 'Phone Call',
      mixed: 'Multi-Channel'
    };
    return labels[type] || type;
  }

  getStageClass(stage: string): string {
    const classes: Record<string, string> = {
      reminder: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'pre-legal': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return classes[stage] || '';
  }

  getCategoryClass(category: string): string {
    const classes: Record<string, string> = {
      'early-stage': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'mid-stage': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'late-stage': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return classes[category] || '';
  }
}
