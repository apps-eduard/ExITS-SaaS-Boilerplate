import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
// Register Ionicons used across the app early to avoid runtime warnings on web
import './app/icons';

// Define jeep-sqlite custom element for web platform
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import { Capacitor } from '@capacitor/core';

// Initialize jeep-sqlite for web
async function initializeApp() {
  // Only load jeep-sqlite on web platform
  if (Capacitor.getPlatform() === 'web') {
    await jeepSqlite(window);
    console.log('✅ jeep-sqlite web component loaded');
  }

  // Bootstrap Angular app
  bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error('Error starting app:', err));
}

initializeApp();
