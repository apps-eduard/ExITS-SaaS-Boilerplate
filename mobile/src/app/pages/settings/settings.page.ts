import { Component, OnInit } from '@angular/core';
import { SettingsService } from '@app/core/services/settings.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  settings$: Observable<any>;

  constructor(private settingsService: SettingsService) {
    this.settings$ = this.settingsService.settings$;
  }

  ngOnInit(): void {}

  toggleTheme(): void {
    this.settingsService.toggleTheme();
  }

  toggleNotifications(): void {
    this.settingsService.toggleNotifications();
  }

  toggleOfflineMode(): void {
    this.settingsService.toggleOfflineMode();
  }

  toggleBiometricAuth(): void {
    this.settingsService.toggleBiometricAuth();
  }

  changeLanguage(lang: string): void {
    this.settingsService.updateSetting('language', lang);
  }

  changeTimezone(tz: string): void {
    this.settingsService.updateSetting('timezone', tz);
  }
}
