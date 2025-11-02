import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    await this.authService.checkAuth();
    const isAuthenticated = await firstValueFrom(this.authService.isAuthenticated$);

    if (isAuthenticated) {
      return true;
    }

    // Store the intended destination for redirect after login
    localStorage.setItem('returnUrl', state.url);
    this.router.navigate(['/auth/login']);
    return false;
  }
}
