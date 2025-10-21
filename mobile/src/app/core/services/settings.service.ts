import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Settings {
  theme: 'light' | 'dark';
  language: string;
  timezone: string;
  notifications: boolean;
  offlineMode: boolean;
  biometricAuth: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  language: 'en',
  timezone: 'UTC',
  notifications: true,
  offlineMode: true,
  biometricAuth: false,
};

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private settingsSubject = new BehaviorSubject<Settings>(DEFAULT_SETTINGS);
  public settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    const result = await Preferences.get({ key: 'appSettings' });
    if (result.value) {
      const settings = JSON.parse(result.value);
      this.settingsSubject.next(settings);
      this.applyTheme(settings.theme);
    } else {
      this.applyTheme(DEFAULT_SETTINGS.theme);
    }
  }

  async updateSetting(key: keyof Settings, value: any): Promise<void> {
    const current = this.settingsSubject.value;
    const updated = { ...current, [key]: value };

    if (key === 'theme') {
      this.applyTheme(value);
    }

    this.settingsSubject.next(updated);
    await Preferences.set({ key: 'appSettings', value: JSON.stringify(updated) });
  }

  async updateSettings(settings: Partial<Settings>): Promise<void> {
    const current = this.settingsSubject.value;
    const updated = { ...current, ...settings };

    if (settings.theme) {
      this.applyTheme(settings.theme);
    }

    this.settingsSubject.next(updated);
    await Preferences.set({ key: 'appSettings', value: JSON.stringify(updated) });
  }

  getSettings(): Settings {
    return this.settingsSubject.value;
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  toggleTheme(): void {
    const current = this.settingsSubject.value;
    const newTheme = current.theme === 'dark' ? 'light' : 'dark';
    this.updateSetting('theme', newTheme);
  }

  toggleNotifications(): void {
    const current = this.settingsSubject.value;
    this.updateSetting('notifications', !current.notifications);
  }

  toggleOfflineMode(): void {
    const current = this.settingsSubject.value;
    this.updateSetting('offlineMode', !current.offlineMode);
  }

  toggleBiometricAuth(): void {
    const current = this.settingsSubject.value;
    this.updateSetting('biometricAuth', !current.biometricAuth);
  }
}
