import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { tap, catchError, of } from 'rxjs';

export interface SpaceInfo {
  id: string | number;
  name: string;
  type: 'system' | 'tenant' | 'platform';
  platformName?: string; // e.g., "Money Loan"
}

/**
 * Global service to track and display the current space/tenant context.
 * This shows which organizational space the user is currently working in.
 */
@Injectable({
  providedIn: 'root'
})
export class SpaceService {
  private apiUrl = 'http://localhost:3000/api';
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private currentSpace = signal<SpaceInfo | null>(null);
  
  // Public readonly signal for components to consume
  readonly space = this.currentSpace.asReadonly();

  // Computed values for easy access
  readonly spaceName = computed(() => this.currentSpace()?.name || 'System');
  readonly spaceType = computed(() => this.currentSpace()?.type || 'system');
  readonly platformName = computed(() => this.currentSpace()?.platformName);

  constructor() {
    // React to user changes using effect
    effect(() => {
      const user = this.authService.currentUser();
      const isAuthenticated = this.authService.isAuthenticated();
      
      if (isAuthenticated && user) {
        this.initializeSpace();
      } else {
        this.setSystemSpace();
      }
    });
  }

  /**
   * Initialize space based on current user context
   */
  private initializeSpace(): void {
    const user = this.authService.currentUser();
    
    if (!user) {
      this.setSystemSpace();
      return;
    }

    // Check if user is a system admin
    if (this.authService.isSystemAdmin()) {
      this.setSystemSpace();
      return;
    }

    // Check if user belongs to a tenant
    if (user.tenantId) {
      this.loadTenantSpace(user.tenantId);
      return;
    }

    // Default to system space
    this.setSystemSpace();
  }

  /**
   * Set space to system-level
   */
  setSystemSpace(): void {
    this.currentSpace.set({
      id: 'system',
      name: 'System Admin',
      type: 'system'
    });
  }

  /**
   * Load tenant space information from API
   * @param tenantId The tenant ID
   */
  loadTenantSpace(tenantId: string | number): void {
    this.http.get<any>(`${this.apiUrl}/tenants/${tenantId}`).pipe(
      tap(response => {
        if (response && response.data) {
          this.currentSpace.set({
            id: tenantId,
            name: response.data.name || response.data.organization_name || 'My Organization',
            type: 'tenant'
          });
        }
      }),
      catchError(error => {
        console.error('Failed to load tenant space:', error);
        // Fallback to basic tenant space
        this.currentSpace.set({
          id: tenantId,
          name: `Tenant ${tenantId}`,
          type: 'tenant'
        });
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Set space to a specific platform context
   * @param platformName The platform name (e.g., "Money Loan")
   */
  setPlatformSpace(platformName: string): void {
    const current = this.currentSpace();
    if (current) {
      this.currentSpace.set({
        ...current,
        type: 'platform',
        platformName
      });
    }
  }

  /**
   * Manually set space information
   * @param space Space information
   */
  setSpace(space: SpaceInfo): void {
    this.currentSpace.set(space);
  }

  /**
   * Refresh space information
   */
  refresh(): void {
    this.initializeSpace();
  }

  /**
   * Get display name for the current space
   * @returns Formatted space name
   */
  getDisplayName(): string {
    const space = this.currentSpace();
    if (!space) return 'System';

    if (space.platformName) {
      return `${space.name} / ${space.platformName}`;
    }

    return space.name;
  }

  /**
   * Get space badge color based on type
   * @returns Tailwind color classes
   */
  getBadgeColor(): string {
    const type = this.spaceType();
    switch (type) {
      case 'system':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300';
      case 'platform':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300';
      case 'tenant':
      default:
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300';
    }
  }

  /**
   * Get icon for space type
   * @returns SVG icon path
   */
  getIcon(): string {
    const type = this.spaceType();
    switch (type) {
      case 'system':
        return 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'; // Settings/System
      case 'platform':
        return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'; // Building/Platform
      case 'tenant':
      default:
        return 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'; // Briefcase/Organization
    }
  }
}
