import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UserService } from '../../../../core/services/user.service';
import { MenuService, MenuItem } from '../../../../core/services/menu.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss']
})
export class DashboardLayoutComponent implements OnInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  menuItems$: Observable<MenuItem[]>;
  currentUser$: Observable<any>;
  isLoading = false;

  constructor(
    private userService: UserService,
    private menuService: MenuService,
    private authService: AuthService,
    private router: Router
  ) {
    this.menuItems$ = this.menuService.getMenuItems();
    this.currentUser$ = this.userService.getCurrentUser();
  }

  ngOnInit(): void {
    // Menu items are loaded through the observable
  }

  toggleSidenav(): void {
    this.sidenav.toggle();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    // Close sidenav on mobile after navigation
    if (window.innerWidth < 768) {
      this.sidenav.close();
    }
  }

  logout(): void {
    this.isLoading = true;
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
