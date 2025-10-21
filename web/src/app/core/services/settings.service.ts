/**
 * Settings Service
 * Manages application settings
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppSettings {
  language: string;
  timezone: string;
  itemsPerPage: number;
  dateFormat: string;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly SETTINGS_KEY = 'app_settings';
  private defaultSettings: AppSettings = {
    language: 'en',
    timezone: 'UTC',
    itemsPerPage: 20,
    dateFormat: 'YYYY-MM-DD',
  };

  private settingsSubject = new BehaviorSubject<AppSettings>(this.getStoredSettings());
  public settings$ = this.settingsSubject.asObservable();

  getSettings(): AppSettings {
    return this.settingsSubject.value;
  }

  updateSettings(settings: Partial<AppSettings>): void {
    const updated = { ...this.settingsSubject.value, ...settings };
    this.settingsSubject.next(updated);
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
  }

  private getStoredSettings(): AppSettings {
    const stored = localStorage.getItem(this.SETTINGS_KEY);
    return stored ? JSON.parse(stored) : this.defaultSettings;
  }
}
