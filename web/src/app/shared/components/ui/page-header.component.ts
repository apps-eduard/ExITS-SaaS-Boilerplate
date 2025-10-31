import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-3 mb-6">
      <span class="text-2xl">{{ icon }}</span>
      <div>
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ title }}</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ description }}</p>
      </div>
    </div>
  `
})
export class PageHeaderComponent {
  @Input() icon: string = '📄';
  @Input() title: string = '';
  @Input() description: string = '';
}
