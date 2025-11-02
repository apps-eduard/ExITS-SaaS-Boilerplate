import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private document = inject(DOCUMENT);
  isDark = signal<boolean>(true); // Default to dark mode

  constructor() {
    // Check localStorage or default to dark mode
    const savedTheme = localStorage.getItem('theme');
    
    // If no saved preference, default to dark mode
    const defaultDark = savedTheme === null ? true : savedTheme === 'dark';
    this.isDark.set(defaultDark);
    
    // console.log('🎨 ThemeService initialized:', { savedTheme, defaultDark });
    
    // Apply theme immediately
    this.applyTheme(defaultDark);
    
    // Apply theme on change with effect
    effect(() => {
      const dark = this.isDark();
      // console.log('🎨 ThemeService effect triggered, applying dark mode:', dark);
      this.applyTheme(dark);
    });
  }

  private applyTheme(isDark: boolean) {
    const html = this.document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      // console.log('🎨 Applied DARK theme');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      console.log('🎨 Applied LIGHT theme');
    }
  }

  toggle() {
    console.log('🎨 ThemeService.toggle() called, current:', this.isDark());
    this.isDark.update(v => !v);
  }

  isDarkMode() {
    return this.isDark();
  }
}
