import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    IonApp,
    IonRouterOutlet
  ],
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private authService: AuthService
  ) {
    this.initializeApp();
  }

  ngOnInit(): void {
    this.authService.checkAuth();
  }

  initializeApp(): void {
    this.platform.ready().then(() => {
      this.setupStatusBar();
    });
  }

  private async setupStatusBar(): Promise<void> {
    if (Capacitor.getPlatform() === 'web' || !Capacitor.isPluginAvailable('StatusBar')) {
      return;
    }

    try {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#1a1a1a' });
    } catch (error) {
      console.log('StatusBar not available:', error);
    }
  }
}
