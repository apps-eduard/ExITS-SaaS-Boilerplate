import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-platform-usage',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">📈 Platform Usage Report</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Coming soon...</p>
    </div>
  `
})
export class PlatformUsageComponent {}
