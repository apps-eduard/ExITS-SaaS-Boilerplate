import { Injectable, signal, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface ComponentPathInfo {
  componentName: string;
  moduleName?: string;
  filePath: string;
  routePath: string;
}

/**
 * Global service to track and display component file paths in the navbar.
 * Components can register their file paths using the setComponentPath method.
 */
@Injectable({
  providedIn: 'root'
})
export class ComponentPathService {
  private router = inject(Router);
  private componentPath = signal<ComponentPathInfo | null>(null);
  
  // Public readonly signal for components to consume
  readonly currentComponentPath = this.componentPath.asReadonly();

  constructor() {
    // Clear component path on route changes and try to auto-detect
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Clear first
        this.clearComponentPath();
        
        // Try to auto-detect from route
        this.autoDetectFromRoute(event.urlAfterRedirects || event.url);
      });
  }

  /**
   * Auto-detect component information from the current route
   */
  private autoDetectFromRoute(url: string): void {
    // Extract route segments
    const segments = url.split('/').filter(s => s && !/^\d+$/.test(s)); // Remove empty and numeric segments
    
    if (segments.length === 0) return;

    // Try to build meaningful info from route
    const moduleName = this.extractModuleFromRoute(segments);
    const componentName = this.extractComponentFromRoute(segments);
    const filePath = this.guessFilePath(segments);

    // Only set if we have meaningful information
    if (moduleName || componentName) {
      this.componentPath.set({
        componentName: componentName || 'Component',
        moduleName: moduleName,
        filePath: filePath,
        routePath: url
      });
    }
  }

  /**
   * Extract module name from route segments
   */
  private extractModuleFromRoute(segments: string[]): string {
    // Common route patterns
    if (segments.includes('platforms') && segments.includes('money-loan')) {
      const subModule = segments[segments.indexOf('money-loan') + 1];
      return subModule ? `Money Loan - ${this.formatModuleName(subModule)}` : 'Money Loan';
    }
    
    if (segments.includes('admin')) {
      const subModule = segments[segments.indexOf('admin') + 1];
      return subModule ? `Admin - ${this.formatModuleName(subModule)}` : 'Admin';
    }
    
    if (segments.includes('tenant')) {
      const subModule = segments[segments.indexOf('tenant') + 1];
      return subModule ? `Tenant - ${this.formatModuleName(subModule)}` : 'Tenant';
    }

    // Default: use first segment
    return this.formatModuleName(segments[0] || 'App');
  }

  /**
   * Extract likely component name from route
   */
  private extractComponentFromRoute(segments: string[]): string {
    // Use the last meaningful segment
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment) return '';
    
    // Convert to component name format
    return this.formatModuleName(lastSegment) + 'Component';
  }

  /**
   * Guess the file path from route segments
   */
  private guessFilePath(segments: string[]): string {
    // Build a likely path based on route structure
    if (segments.includes('platforms') && segments.includes('money-loan')) {
      const idx = segments.indexOf('money-loan');
      const subPath = segments.slice(idx + 1).join('/');
      return `src/app/features/platforms/money-loan/${subPath || 'dashboard'}`;
    }
    
    if (segments.includes('admin')) {
      const idx = segments.indexOf('admin');
      const subPath = segments.slice(idx + 1).join('/');
      return `src/app/features/admin/${subPath || 'dashboard'}`;
    }
    
    if (segments.includes('tenant')) {
      const idx = segments.indexOf('tenant');
      const subPath = segments.slice(idx + 1).join('/');
      return `src/app/features/tenant/${subPath || 'dashboard'}`;
    }

    return `src/app/${segments.join('/')}`;
  }

  /**
   * Set the current component's file path information
   * @param info Component path information
   */
  setComponentPath(info: ComponentPathInfo): void {
    this.componentPath.set(info);
  }

  /**
   * Clear the current component path
   */
  clearComponentPath(): void {
    this.componentPath.set(null);
  }

  /**
   * Get the formatted file path for display
   * @returns Formatted file path string
   */
  getFormattedPath(): string {
    const info = this.componentPath();
    if (!info) return '';
    
    // Remove common prefixes to make path more readable
    let path = info.filePath;
    
    // Remove workspace root prefix if present
    path = path.replace(/^.*?[\\/]web[\\/]src[\\/]/, 'src/');
    
    // Normalize path separators for display
    path = path.replace(/\\/g, '/');
    
    return path;
  }

  /**
   * Get the component name
   * @returns Component name
   */
  getComponentName(): string {
    return this.componentPath()?.componentName || '';
  }

  /**
   * Get the component filename
   * @returns Component filename (e.g., "loan-applications.component.ts")
   */
  getComponentFileName(): string {
    const info = this.componentPath();
    if (!info) return '';
    
    // Extract filename from path
    const normalizedPath = info.filePath.replace(/\\/g, '/');
    const segments = normalizedPath.split('/');
    return segments[segments.length - 1] || '';
  }

  /**
   * Get the module/feature name
   * @returns Module name
   */
  getModuleName(): string {
    const info = this.componentPath();
    if (!info) return '';
    
    // If explicitly set, use it
    if (info.moduleName) return info.moduleName;
    
    // Otherwise, extract from file path
    return this.extractModuleFromPath(info.filePath);
  }

  /**
   * Extract module name from file path
   * @param filePath The file path
   * @returns Extracted module name
   */
  private extractModuleFromPath(filePath: string): string {
    // Normalize path
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Extract feature/module from path patterns
    const patterns = [
      /\/features\/platforms\/([^\/]+)/,  // platforms/money-loan
      /\/features\/([^\/]+)/,              // features/dashboard
      /\/shared\/components\/([^\/]+)/,    // shared/header
      /\/core\/([^\/]+)/,                  // core/auth
    ];
    
    for (const pattern of patterns) {
      const match = normalizedPath.match(pattern);
      if (match) {
        return this.formatModuleName(match[1]);
      }
    }
    
    return 'App';
  }

  /**
   * Format module name for display
   * @param name Raw module name
   * @returns Formatted module name
   */
  private formatModuleName(name: string): string {
    // Convert kebab-case to Title Case
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
