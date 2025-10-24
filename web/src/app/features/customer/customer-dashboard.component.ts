import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span class="text-xl">💰</span>
              </div>
              <div>
                <h1 class="text-xl font-bold text-gray-900 dark:text-white">Customer Portal</h1>
                <p class="text-xs text-gray-500 dark:text-gray-400">Money Loan Dashboard</p>
              </div>
            </div>
            
            <div class="flex items-center space-x-4">
              <div class="text-right hidden sm:block">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ customerName() }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ customerCode() }}
                </p>
              </div>
              <button
                (click)="logout()"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if (loading()) {
          <div class="flex items-center justify-center py-12">
            <div class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p class="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
            </div>
          </div>
        } @else {
          <!-- Welcome Section -->
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {{ customerFirstName() }}! 👋
            </h2>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Here's an overview of your loan accounts
            </p>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Active Loans -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <span class="text-2xl">📝</span>
                </div>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white">0</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Active Loans</p>
            </div>

            <!-- Total Outstanding -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <span class="text-2xl">💵</span>
                </div>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white">₱0.00</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Outstanding</p>
            </div>

            <!-- Next Payment -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <span class="text-2xl">📅</span>
                </div>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white">-</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Next Payment</p>
            </div>

            <!-- Credit Score -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <span class="text-2xl">⭐</span>
                </div>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white">{{ creditScore() || '-' }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Credit Score</p>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button class="flex items-center justify-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                <span class="text-2xl">💳</span>
                <span class="font-medium text-gray-900 dark:text-white">Make Payment</span>
              </button>
              <button class="flex items-center justify-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors">
                <span class="text-2xl">📝</span>
                <span class="font-medium text-gray-900 dark:text-white">Apply for Loan</span>
              </button>
              <button class="flex items-center justify-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                <span class="text-2xl">📊</span>
                <span class="font-medium text-gray-900 dark:text-white">View Statement</span>
              </button>
            </div>
          </div>

          <!-- Coming Soon Notice -->
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-8 text-center">
            <div class="text-6xl mb-4">🚧</div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Customer Portal Under Development
            </h3>
            <p class="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Your customer portal is being built with amazing features including loan tracking, 
              payment history, application management, and more. Stay tuned!
            </p>
          </div>
        }
      </main>
    </div>
  `
})
export class CustomerDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:3000/api';

  loading = signal(true);
  customerName = signal('');
  customerCode = signal('');
  customerFirstName = signal('');
  creditScore = signal<number | null>(null);

  ngOnInit() {
    this.loadCustomerProfile();
  }

  loadCustomerProfile() {
    const customerData = localStorage.getItem('customerData');
    
    if (!customerData) {
      this.router.navigate(['/customer/login']);
      return;
    }

    const customer = JSON.parse(customerData);
    this.customerName.set(`${customer.firstName} ${customer.lastName}`);
    this.customerFirstName.set(customer.firstName);
    this.customerCode.set(customer.customerCode);
    this.creditScore.set(customer.creditScore);
    this.loading.set(false);
  }

  logout() {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerRefreshToken');
    localStorage.removeItem('customerData');
    this.router.navigate(['/customer/login']);
  }
}
