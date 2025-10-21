/**
 * App Component
 * Root component with layout structure
 */

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { MenuService } from './core/services/menu.service';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'ExITS-SaaS';
  sidenavOpen = true;
  isDarkMode$ = this.themeService.isDarkMode$;
  isAuthenticated$ = this.authService.isAuthenticated$;
  currentUser$ = this.authService.currentUser$;
  menuItems$: Observable<MenuItem[]>;

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private menuService: MenuService,
    private router: Router,
  ) {
    this.menuItems$ = this.menuService.getMenuItems();
  }

  ngOnInit(): void {
    this.authService.checkAuth();
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }

  toggleSidenav(): void {
    this.sidenavOpen = !this.sidenavOpen;
  }

  logout(): void {
    this.authService.logout().subscribe(
      () => {
        this.router.navigate(['/auth/login']);
      },
      (error) => console.error('Logout failed', error),
    );
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
