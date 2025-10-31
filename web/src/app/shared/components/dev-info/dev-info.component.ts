import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentPathService } from '../../../core/services/component-path.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Development info component that displays file path and component information.
 * Shows as an icon that displays info in a toast when clicked.
 */
@Component({
  selector: 'app-dev-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="showInfo()"
      class="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title="Show component info">
      <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
      </svg>
      @if (componentPathService.getComponentFileName()) {
        <span class="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
      } @else {
        <span class="absolute top-1 right-1 w-2 h-2 bg-gray-400 rounded-full"></span>
      }
    </button>
  `
})
export class DevInfoComponent {
  componentPathService = inject(ComponentPathService);
  toastService = inject(ToastService);

  showInfo() {
    const fileName = this.componentPathService.getComponentFileName();
    const moduleName = this.componentPathService.getModuleName();
    const path = this.componentPathService.getFormattedPath();
    const componentName = this.componentPathService.getComponentName();

    const message = `
📁 Module: ${moduleName || 'Unknown'}
📄 File: ${fileName || 'Unknown'}
🔧 Component: ${componentName || 'Unknown'}
📂 Path: ${path || 'Unknown'}
    `.trim();

    this.toastService.info(message);
  }
}
