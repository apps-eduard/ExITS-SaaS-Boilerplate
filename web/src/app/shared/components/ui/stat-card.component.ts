import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-gray-600 dark:text-gray-400">{{ label }}</p>
          <p class="text-lg font-bold" [ngClass]="valueColorClass">{{ value }}</p>
        </div>
        <div class="flex h-8 w-8 items-center justify-center rounded-full" [ngClass]="iconBgClass">
          <span class="text-base">{{ icon }}</span>
        </div>
      </div>
    </div>
  `
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = 0;
  @Input() icon: string = '📊';
  @Input() valueColorClass: string = 'text-gray-900 dark:text-white';
  @Input() iconBgClass: string = 'bg-blue-100 dark:bg-blue-900/30';
}
