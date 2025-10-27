import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RBACService } from '../../../core/services/rbac.service';

interface ModuleItem {
  menuKey: string;
  displayName: string;
  space: string;
  actionKeys: string[];
}

@Component({
  selector: 'app-modules-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span class="text-xl">📦</span>
          Module Registry
        </h1>
        <p class="text-xs text-gray-500 dark:text-gray-400">View and manage available modules and their action keys</p>
      </div>

      <!-- Stats -->
      <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Modules</p>
          <p class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{{ modules().length }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Actions</p>
          <p class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{{ getTotalActions() }}</p>
        </div>
      </div>

      <!-- Modules Table -->
      <div class="rounded-lg border border-gray-200 bg-white overflow-hidden dark:border-gray-700 dark:bg-gray-900">
        <table class="w-full">
          <thead class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <span class="inline-flex items-center gap-1">
                  <span class="w-3.5 h-3.5">🔑</span>
                  Menu Key
                </span>
              </th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <span class="inline-flex items-center gap-1">
                  <span class="w-3.5 h-3.5">📝</span>
                  Display Name
                </span>
              </th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <span class="inline-flex items-center gap-1">
                  <span class="w-3.5 h-3.5">🌐</span>
                  Space
                </span>
              </th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <span class="inline-flex items-center gap-1">
                  <span class="w-3.5 h-3.5">⚡</span>
                  Action Keys
                </span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr *ngFor="let module of modules()" class="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              <td class="px-3 py-2 font-mono text-xs font-medium text-gray-900 dark:text-white">
                {{ module.menuKey }}
              </td>
              <td class="px-3 py-2 text-xs text-gray-900 dark:text-white">
                {{ module.displayName }}
              </td>
              <td class="px-3 py-2">
                <span [class]="'px-2 py-1 rounded text-xs font-medium ' + (module.space === 'system' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300')">
                  {{ module.space | uppercase }}
                </span>
              </td>
              <td class="px-3 py-2">
                <div class="flex flex-wrap gap-1">
                  <span *ngFor="let action of module.actionKeys" class="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                    {{ action }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div *ngIf="modules().length === 0" class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400">No modules registered yet</p>
      </div>

      <!-- Module Details -->
      <div *ngIf="modules().length > 0" class="mt-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Module Details</h2>
        
        <div class="space-y-6">
          <div *ngFor="let module of modules()" class="border-b border-gray-200 pb-4 last:border-b-0 dark:border-gray-700">
            <div class="mb-2 flex items-center gap-2">
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ module.displayName }}</h3>
              <span [class]="'px-2 py-0.5 rounded text-xs font-medium ' + (module.space === 'system' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300')">
                {{ module.space }}
              </span>
            </div>
            
            <p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
              <span class="font-mono">{{ module.menuKey }}</span>
            </p>
            
            <div>
              <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Available Actions:</p>
              <div class="flex flex-wrap gap-2">
                <div *ngFor="let action of module.actionKeys" class="rounded-lg bg-green-50 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
                  {{ action }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ModulesListComponent implements OnInit {
  modules = signal<ModuleItem[]>([]);

  constructor(private rbacService: RBACService) {}

  ngOnInit(): void {
    console.log('📦 ModulesListComponent initialized');
    this.loadModules();
  }

  loadModules(): void {
    const allModules = this.rbacService.allModules();
    if (allModules) {
      const modulesList: ModuleItem[] = Object.entries(allModules).map(([key, module]: any) => ({
        menuKey: key,
        displayName: module.displayName || key,
        space: module.space || 'system',
        actionKeys: module.actionKeys || ['view']
      }));
      this.modules.set(modulesList);
    } else {
      // Set default modules if not loaded
      const defaults = [
        { menuKey: 'dashboard', displayName: 'Dashboard', space: 'system', actionKeys: ['view'] },
        { menuKey: 'tenants', displayName: 'Tenants', space: 'system', actionKeys: ['view', 'create', 'edit', 'delete'] },
        { menuKey: 'users', displayName: 'Users', space: 'system', actionKeys: ['view', 'create', 'edit', 'delete'] },
        { menuKey: 'roles', displayName: 'Roles', space: 'system', actionKeys: ['view', 'create', 'edit', 'delete'] },
        { menuKey: 'system', displayName: 'System Settings', space: 'system', actionKeys: ['view'] },
        { menuKey: 'monitoring', displayName: 'Monitoring', space: 'system', actionKeys: ['view'] },
        { menuKey: 'config', displayName: 'Configuration', space: 'system', actionKeys: ['view', 'edit', 'create'] },
        { menuKey: 'billing', displayName: 'Billing', space: 'system', actionKeys: ['view', 'edit'] }
      ];
      this.modules.set(defaults);
    }
  }

  getTotalActions(): number {
    return this.modules().reduce((total, module) => total + module.actionKeys.length, 0);
  }
}
