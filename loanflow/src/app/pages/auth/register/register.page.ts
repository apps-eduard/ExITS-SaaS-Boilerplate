import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, 
  IonContent, IonItem, IonLabel, IonInput, IonButton, IonSpinner 
} from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/auth/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Register</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="register-container">
        <h1>Create Account</h1>
        <p>Sign up to get started</p>
        
        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <ion-item>
            <ion-label position="floating">First Name</ion-label>
            <ion-input type="text" [(ngModel)]="firstName" name="firstName" required></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="floating">Last Name</ion-label>
            <ion-input type="text" [(ngModel)]="lastName" name="lastName" required></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="floating">Email</ion-label>
            <ion-input type="email" [(ngModel)]="email" name="email" required></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="floating">Password</ion-label>
            <ion-input type="password" [(ngModel)]="password" name="password" required></ion-input>
          </ion-item>

          <ion-button expand="block" type="submit" [disabled]="loading || !registerForm.valid">
            <ion-spinner *ngIf="loading"></ion-spinner>
            {{ loading ? 'Creating Account...' : 'Register' }}
          </ion-button>
        </form>

        <p class="text-center">
          Already have an account? 
          <a routerLink="/auth/login">Sign in</a>
        </p>
      </div>
    </ion-content>
  `,
  styles: [`
    .register-container {
      max-width: 500px;
      margin: 0 auto;
      padding: 2rem 0;
    }
    .text-center {
      text-align: center;
      margin-top: 1rem;
    }
  `]
})
export class RegisterPage {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    if (!this.email || !this.password || !this.firstName || !this.lastName) {
      return;
    }

    this.loading = true;
    try {
      await this.authService.register(this.email, this.password, this.firstName, this.lastName).toPromise();
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      this.loading = false;
    }
  }
}
