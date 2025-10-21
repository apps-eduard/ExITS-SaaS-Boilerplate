import { Component, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../components/header/header.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
      <app-sidebar #sidebar />
      
      <div class="flex-1 flex flex-col overflow-hidden">
        <app-header (menuToggle)="toggleSidebar()" />
        
        <main class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent {
  @ViewChild('sidebar') sidebar!: SidebarComponent;
  isDesktop = signal(window.innerWidth >= 1024);

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.isOpen.update(v => !v);
    }
  }

  constructor() {
    window.addEventListener('resize', () => {
      this.isDesktop.set(window.innerWidth >= 1024);
    });
  }
}
