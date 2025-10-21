/**
 * Core Module
 * Provides core services and guards
 */

import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { MenuService } from './services/menu.service';
import { NotificationService } from './services/notification.service';
import { SettingsService } from './services/settings.service';

import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [
    AuthService,
    ThemeService,
    MenuService,
    NotificationService,
    SettingsService,
    AuthGuard,
    LoginGuard,
  ],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import only once in AppModule');
    }
  }
}
