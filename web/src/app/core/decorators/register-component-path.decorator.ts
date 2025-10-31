import { inject, OnInit, OnDestroy } from '@angular/core';
import { ComponentPathService } from '../services/component-path.service';
import { Router } from '@angular/router';

/**
 * Decorator to automatically register component file path with the ComponentPathService.
 * This makes the component's file path visible in the navbar.
 * 
 * @param filePath - The file path of the component (use __filename or provide manually)
 * @param moduleName - Optional: Explicit module name (auto-detected from path if not provided)
 * 
 * @example
 * ```typescript
 * @RegisterComponentPath('src/app/features/dashboard/dashboard.component.ts', 'Dashboard')
 * @Component({
 *   selector: 'app-dashboard',
 *   // ... component config
 * })
 * export class DashboardComponent {
 *   // ... component code
 * }
 * ```
 */
export function RegisterComponentPath(filePath: string, moduleName?: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor implements OnInit, OnDestroy {
      private componentPathService = inject(ComponentPathService);
      private router = inject(Router);
      private originalNgOnInit: any;
      private originalNgOnDestroy: any;

      constructor(...args: any[]) {
        super(...args);
        this.originalNgOnInit = (this as any).ngOnInit;
        this.originalNgOnDestroy = (this as any).ngOnDestroy;
      }

      ngOnInit() {
        // Register component path
        const componentName = constructor.name;
        const routePath = this.router.url;

        this.componentPathService.setComponentPath({
          componentName,
          moduleName,
          filePath,
          routePath
        });

        // Call original ngOnInit if it exists
        if (this.originalNgOnInit) {
          this.originalNgOnInit.call(this);
        }
      }

      ngOnDestroy() {
        // Clear component path when component is destroyed
        this.componentPathService.clearComponentPath();

        // Call original ngOnDestroy if it exists
        if (this.originalNgOnDestroy) {
          this.originalNgOnDestroy.call(this);
        }
      }
    };
  };
}
