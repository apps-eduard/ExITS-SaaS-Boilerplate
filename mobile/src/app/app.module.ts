import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { MenuPage } from './pages/menu/menu.page';
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { ProfilePage } from './pages/profile/profile.page';
import { NotificationsPage } from './pages/notifications/notifications.page';
import { SettingsPage } from './pages/settings/settings.page';

@NgModule({
  declarations: [
    AppComponent,
    MenuPage,
    DashboardPage,
    ProfilePage,
    NotificationsPage,
    SettingsPage,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    IonicModule.forRoot(),
    HttpClientModule,
    AppRoutingModule,
    CoreModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
