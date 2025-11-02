import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { 
  IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonList, IonItem, IonIcon, IonLabel, IonButton,
  IonRouterOutlet, MenuController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  homeOutline, peopleOutline, shieldOutline, businessOutline, 
  documentTextOutline, personOutline, settingsOutline, logOutOutline 
} from 'ionicons/icons';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonButton,
    IonRouterOutlet
  ],
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
})
export class MenuPage implements OnInit {
  currentUser = this.authService.getCurrentUser();

  menuItems = [
    { label: 'Dashboard', icon: 'home-outline', route: '/dashboard' },
    { label: 'Users', icon: 'people-outline', route: '/users' },
    { label: 'Roles', icon: 'shield-outline', route: '/roles' },
    { label: 'Tenants', icon: 'business-outline', route: '/tenants' },
    { label: 'Audit Logs', icon: 'document-text-outline', route: '/audit-logs' },
    { label: 'Profile', icon: 'person-outline', route: '/profile' },
    { label: 'Settings', icon: 'settings-outline', route: '/settings' },
  ];

  constructor(
    private menu: MenuController,
    private authService: AuthService
  ) {
    addIcons({
      'home-outline': homeOutline,
      'people-outline': peopleOutline,
      'shield-outline': shieldOutline,
      'business-outline': businessOutline,
      'document-text-outline': documentTextOutline,
      'person-outline': personOutline,
      'settings-outline': settingsOutline,
      'log-out-outline': logOutOutline,
    });
  }

  ngOnInit(): void {}

  closeMenu(): void {
    this.menu.close('mainMenu');
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.menu.close('mainMenu');
      },
    });
  }
}
