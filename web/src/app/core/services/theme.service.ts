/**
 * Theme Service
 * Manages application theme (dark/light mode)
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'app_theme';
  private readonly DARK_THEME = 'dark-theme';
  private readonly LIGHT_THEME = 'light-theme';

  private isDarkModeSubject = new BehaviorSubject<boolean>(this.getStoredTheme());
  public isDarkMode$ = this.isDarkModeSubject.asObservable();

  constructor() {
    this.applyTheme();
  }

  toggleDarkMode(): void {
    const isDarkMode = !this.isDarkModeSubject.value;
    this.isDarkModeSubject.next(isDarkMode);
    localStorage.setItem(this.THEME_KEY, isDarkMode ? this.DARK_THEME : this.LIGHT_THEME);
    this.applyTheme();
  }

  setDarkMode(isDark: boolean): void {
    this.isDarkModeSubject.next(isDark);
    localStorage.setItem(this.THEME_KEY, isDark ? this.DARK_THEME : this.LIGHT_THEME);
    this.applyTheme();
  }

  private getStoredTheme(): boolean {
    const theme = localStorage.getItem(this.THEME_KEY);
    return theme === this.DARK_THEME || this.isDarkModeDefault();
  }

  private isDarkModeDefault(): boolean {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private applyTheme(): void {
    const isDarkMode = this.isDarkModeSubject.value;
    const root = document.documentElement;

    if (isDarkMode) {
      root.classList.add(this.DARK_THEME);
      root.classList.remove(this.LIGHT_THEME);
    } else {
      root.classList.add(this.LIGHT_THEME);
      root.classList.remove(this.DARK_THEME);
    }
  }
}
