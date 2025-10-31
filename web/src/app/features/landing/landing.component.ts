import { Component, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RegisterComponentPath } from '../../core/decorators/register-component-path.decorator';

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  benefits: string[];
  color: string;
  locked: boolean;
}

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  unlockCount: number;
  popular?: boolean;
  badge?: string;
}

@RegisterComponentPath('src/app/features/landing/landing.component.ts', 'Landing Page')
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './landing.component.html',
  styles: []
})
export class LandingComponent {
  showDemo = signal(false);
  isDarkMode = signal<boolean>(true);

  constructor() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.isDarkMode.set(savedTheme === 'dark');
  }

  toggleTheme(): void {
    const newDarkMode = !this.isDarkMode();
    this.isDarkMode.set(newDarkMode);
    
    const html = document.documentElement;
    const body = document.body;
    
    if (newDarkMode) {
      html.classList.add('dark');
      body.classList.add('dark');
      html.style.colorScheme = 'dark';
      body.style.backgroundColor = '#111827';
      body.style.color = '#f3f4f6';
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      body.classList.remove('dark');
      html.style.colorScheme = 'light';
      body.style.backgroundColor = '#f9fafb';
      body.style.color = '#111827';
      localStorage.setItem('theme', 'light');
    }
  }

  features: Feature[] = [
    {
      id: 'loan',
      icon: '💸',
      title: 'Money Loan',
      description: 'Manage lending operations seamlessly with automated workflows and intelligent tracking.',
      benefits: [
        'Track borrower profiles and credit history',
        'Automated interest calculations',
        'Flexible repayment schedules',
        'Perfect for microfinance companies'
      ],
      color: 'blue',
      locked: false
    },
    {
      id: 'pawnshop',
      icon: '💍',
      title: 'Pawnshop',
      description: 'Digitize your pawnshop operations with automated ticketing and inventory management.',
      benefits: [
        'Automated ticketing and tracking',
        'Renewal and redemption management',
        'Inventory and collateral tracking',
        'Built for gold, gadgets, or any collateral'
      ],
      color: 'purple',
      locked: true
    },
    {
      id: 'bnpl',
      icon: '🛒',
      title: 'Buy Now, Pay Later',
      description: 'Offer flexible payment plans to your customers with automated installment tracking.',
      benefits: [
        'Track purchases and installments',
        'Manage customer credit limits',
        'Automated payment reminders',
        'Ideal for retail and appliance stores'
      ],
      color: 'green',
      locked: true
    }
  ];

  pricingPlans: PricingPlan[] = [
    {
      name: 'Starter',
      price: 'Free',
      period: '14 days',
      features: [
        'Dashboard Access',
        '1 Feature of Your Choice',
        'Basic Analytics',
        'Email Support',
        'Up to 100 transactions'
      ],
      unlockCount: 1
    },
    {
      name: 'Standard',
      price: '$29',
      period: 'month',
      features: [
        'Unlock Any 2 Features',
        'Advanced Analytics',
        'Priority Email Support',
        'Up to 1,000 transactions/month',
        'API Access',
        'Custom Reports'
      ],
      unlockCount: 2,
      popular: true,
      badge: 'MOST POPULAR'
    },
    {
      name: 'Premium',
      price: '$49',
      period: 'month',
      features: [
        'Unlock All 3 Features',
        'Unlimited Transactions',
        'Premium Support (24/7)',
        'Full API Access',
        'White-Label Options',
        'Dedicated Account Manager'
      ],
      unlockCount: 3
    }
  ];
}
