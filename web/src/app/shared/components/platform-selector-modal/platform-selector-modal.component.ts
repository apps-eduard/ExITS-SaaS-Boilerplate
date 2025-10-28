import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Platform {
  productType: string;
  name: string;
  icon: string;
  route: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-platform-selector-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full mx-4 p-8 animate-slideUp">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="text-6xl mb-4 animate-bounce">🚀</div>
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Choose Your Platform
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            You have access to multiple platforms. Select where you want to start.
          </p>
        </div>

        <!-- Platform Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            *ngFor="let platform of platformOptions"
            (click)="selectPlatform(platform)"
            [class]="'group cursor-pointer border-2 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl ' + platform.color"
          >
            <div class="text-center">
              <div class="text-5xl mb-3 group-hover:scale-110 transition-transform">{{ platform.icon }}</div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {{ platform.name }}
              </h3>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                {{ platform.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- Info Text -->
        <div class="text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            💡 Tip: You can access other platforms anytime from the navigation menu
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(20px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out;
    }
    
    .animate-slideUp {
      animation: slideUp 0.3s ease-out;
    }
  `]
})
export class PlatformSelectorModalComponent {
  @Input() platforms: any[] = [];
  @Output() platformSelected = new EventEmitter<string>();

  get platformOptions(): Platform[] {
    const platformMap: Record<string, Platform> = {
      money_loan: {
        productType: 'money_loan',
        name: 'Money Loan',
        icon: '💰',
        route: '/platforms/money-loan/dashboard',
        description: 'Lending & Collections',
        color: 'border-amber-300 hover:border-amber-500 dark:border-amber-700 dark:hover:border-amber-500'
      },
      bnpl: {
        productType: 'bnpl',
        name: 'Buy Now Pay Later',
        icon: '🛒',
        route: '/platforms/bnpl/dashboard',
        description: 'Installment Management',
        color: 'border-blue-300 hover:border-blue-500 dark:border-blue-700 dark:hover:border-blue-500'
      },
      pawnshop: {
        productType: 'pawnshop',
        name: 'Pawnshop',
        icon: '💎',
        route: '/platforms/pawnshop/dashboard',
        description: 'Pawn & Redemption',
        color: 'border-green-300 hover:border-green-500 dark:border-green-700 dark:hover:border-green-500'
      }
    };

    return this.platforms
      .map(p => platformMap[p.productType])
      .filter(p => p !== undefined);
  }

  selectPlatform(platform: Platform) {
    this.platformSelected.emit(platform.route);
  }
}
