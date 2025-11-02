import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme = signal<Theme>('auto');
  
  constructor() {
    this.initializeTheme();
  }

  async initializeTheme() {
    // Load saved theme preference
    const saved = await Preferences.get({ key: 'theme' });
    const theme = (saved.value as Theme) || 'auto';
    this.setTheme(theme);
  }

  setTheme(theme: Theme) {
    this.currentTheme.set(theme);
    Preferences.set({ key: 'theme', value: theme });

    if (theme === 'auto') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.applyTheme(prefersDark ? 'dark' : 'light');
    } else {
      this.applyTheme(theme);
    }
  }

  private applyTheme(theme: 'light' | 'dark') {
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(theme);
  }

  toggleTheme() {
    const current = this.currentTheme();
    if (current === 'light') {
      this.setTheme('dark');
    } else if (current === 'dark') {
      this.setTheme('auto');
    } else {
      this.setTheme('light');
    }
  }

  getTheme() {
    return this.currentTheme();
  }

  isDark(): boolean {
    return document.documentElement.classList.contains('dark');
  }
}
