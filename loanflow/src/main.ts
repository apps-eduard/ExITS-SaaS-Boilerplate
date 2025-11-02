import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
// Register Ionicons used across the app early to avoid runtime warnings on web
import './app/icons';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error('Error starting app:', err));
