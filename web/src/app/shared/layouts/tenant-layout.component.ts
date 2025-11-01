import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../components/header/header.component';
import { TenantSidebarComponent } from '../../features/tenant/tenant-sidebar/tenant-sidebar.component';

@Component({
  selector: 'app-tenant-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, TenantSidebarComponent],
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <!-- Tenant Sidebar -->
      <app-tenant-sidebar #sidebar />

      <!-- Main Content Area -->
      <div
        class="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
        <app-header (menuToggle)="toggleSidebar()" />
        <main class="flex-1 overflow-y-auto">
          <router-outlet />
        </main>
      </div>
  </div>
  `
})
export class TenantLayoutComponent {
  @ViewChild('sidebar') sidebar!: TenantSidebarComponent;

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.isOpen.update((v: boolean) => !v);
    }
  }
}
