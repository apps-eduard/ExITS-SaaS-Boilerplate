import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic()
  .bootstrapModule(AppModule, {
    ngZone: 'zone.js',
  })
  .catch((err) => console.log('Error starting app:', err));
