import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
})
export class MenuPage implements OnInit {
  currentUser = this.authService.getCurrentUser();

  menuItems = [
    { label: 'Dashboard', icon: 'home', route: '/dashboard' },
    { label: 'Users', icon: 'people', route: '/users' },
    { label: 'Roles', icon: 'shield', route: '/roles' },
    { label: 'Tenants', icon: 'business', route: '/tenants' },
    { label: 'Audit Logs', icon: 'document-text', route: '/audit-logs' },
    { label: 'Profile', icon: 'person', route: '/profile' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
  ];

  constructor(
    private menu: MenuController,
    private authService: AuthService
  ) {}

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
