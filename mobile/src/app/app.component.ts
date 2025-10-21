import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
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
      this.hideSplashScreen();
    });
  }

  private setupStatusBar(): void {
    StatusBar.setStyle({
      style: 'light',
    });
    StatusBar.setBackgroundColor({
      color: '#1a1a1a',
    });
  }

  private hideSplashScreen(): void {
    SplashScreen.hide();
  }
}
