import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSpinner,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonToggle,
  IonTextarea,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  callOutline,
  homeOutline,
  locationOutline,
  saveOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { HeaderUtilsComponent } from '../../shared/components/header-utils.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner,
    IonSegment,
    IonSegmentButton,
    IonIcon,
    IonToggle,
    IonTextarea,
    HeaderUtilsComponent
  ],
  template: `
    <ion-content [fullscreen]="true" class="profile-content">
      <!-- Fixed Top Bar -->
      <div class="fixed-top-bar">
        <div class="top-bar-content">
          <div class="top-bar-left">
            <span class="app-emoji">👤</span>
            <span class="app-title">Profile</span>
          </div>
          
          <div class="top-bar-right">
            <app-header-utils />
          </div>
        </div>
      </div>

      <div class="profile-container">
        <div class="profile-hero">
          <div class="hero-body">
            <div class="hero-avatar">
              <span>{{ getUserInitials() }}</span>
            </div>
            <div class="hero-copy">
              <p class="hero-kicker">Keep things current</p>
              <h1 class="hero-title">{{ getHeroName() }}!</h1>
       
              <div class="hero-progress">
                <div class="progress-meta">
                  <span class="progress-label">Profile completion</span>
                  <span class="progress-value">{{ profileCompletion() }}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar" [style.width.%]="profileCompletion()"></div>
                </div>
              </div>
              <div class="hero-tags">
                <span class="hero-tag">
                  <ion-icon name="checkmark-circle-outline"></ion-icon>
                  {{ completedFieldsCount() }}/{{ totalFieldsCount() }} fields updated
                </span>
                <span class="hero-tag soft">
                  <ion-icon name="call-outline"></ion-icon>
                  {{ personalInfo.phone || 'Add a phone number' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Segment for tabs -->
        <ion-segment [(ngModel)]="selectedTab" (ionChange)="onTabChange()">
          <ion-segment-button value="personal">
            <ion-icon name="person-outline"></ion-icon>
            <ion-label>Personal Info</ion-label>
          </ion-segment-button>
          <ion-segment-button value="address">
            <ion-icon name="home-outline"></ion-icon>
            <ion-label>Address</ion-label>
          </ion-segment-button>
        </ion-segment>

        <!-- Personal Info Tab -->
        <div *ngIf="selectedTab === 'personal'" class="tab-content">
          <ion-card class="animated-card delay-1">
            <ion-card-header>
              <ion-card-title>Personal Information</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p class="info-text">
                <ion-icon name="checkmark-circle-outline" color="primary"></ion-icon>
                Please complete your personal information. All fields are required.
              </p>

              <ion-list [inset]="true">
                <ion-item>
                  <ion-label position="stacked">First Name *</ion-label>
                  <ion-input
                    type="text"
                    [(ngModel)]="personalInfo.firstName"
                    placeholder="Enter your first name"
                    [class.error-input]="errors.firstName"
                  ></ion-input>
                </ion-item>
                <div *ngIf="errors.firstName" class="error-message">{{ errors.firstName }}</div>

                <ion-item>
                  <ion-label position="stacked">Last Name *</ion-label>
                  <ion-input
                    type="text"
                    [(ngModel)]="personalInfo.lastName"
                    placeholder="Enter your last name"
                    [class.error-input]="errors.lastName"
                  ></ion-input>
                </ion-item>
                <div *ngIf="errors.lastName" class="error-message">{{ errors.lastName }}</div>

                <ion-item>
                  <ion-label position="stacked">Phone Number *</ion-label>
                  <ion-input
                    type="tel"
                    [(ngModel)]="personalInfo.phone"
                    placeholder="Enter your phone number"
                    [class.error-input]="errors.phone"
                  ></ion-input>
                </ion-item>
                <div *ngIf="errors.phone" class="error-message">{{ errors.phone }}</div>

                <ion-item>
                  <ion-label position="stacked">Email</ion-label>
                  <ion-input
                    type="email"
                    [value]="currentUser?.email"
                    disabled
                  ></ion-input>
                </ion-item>
              </ion-list>

              <ion-button
                expand="block"
                (click)="savePersonalInfo()"
                [disabled]="savingPersonal"
                class="save-button"
              >
                <ion-icon slot="start" name="save-outline"></ion-icon>
                <span *ngIf="!savingPersonal">Save Personal Info</span>
                <ion-spinner *ngIf="savingPersonal" name="crescent"></ion-spinner>
              </ion-button>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Address Tab -->
        <div *ngIf="selectedTab === 'address'" class="tab-content">
          <ion-card class="animated-card delay-2">
            <ion-card-header>
              <ion-card-title>Address Information</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p class="info-text">
                <ion-icon name="location-outline" color="medium"></ion-icon>
                Address information is optional but recommended for loan applications.
              </p>

              <div class="form-section">
                <div class="section-heading">
                  <span>Address Basics</span>
                  <span class="section-hint required">Required</span>
                </div>

                <div class="field-grid two">
                  <div class="field-cell">
                    <ion-item class="field-item">
                      <ion-label position="stacked">Address Type *</ion-label>
                      <ion-input
                        type="text"
                        [(ngModel)]="addressInfo.addressType"
                        placeholder="Home, Work, etc."
                        [class.error-input]="addressErrors.addressType"
                      ></ion-input>
                    </ion-item>
                    <div *ngIf="addressErrors.addressType" class="error-message">{{ addressErrors.addressType }}</div>
                  </div>

                  <div class="field-cell">
                    <ion-item class="field-item">
                      <ion-label position="stacked">Label</ion-label>
                      <ion-input
                        type="text"
                        [(ngModel)]="addressInfo.label"
                        placeholder="e.g. Main Residence"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>

                <div class="field-grid two">
                  <div class="field-cell">
                    <ion-item class="field-item">
                      <ion-label position="stacked">House Number</ion-label>
                      <ion-input
                        type="text"
                        [(ngModel)]="addressInfo.houseNumber"
                        placeholder="House / Building No."
                      ></ion-input>
                    </ion-item>
                  </div>
                  <div class="field-cell">
                    <ion-item class="field-item">
                      <ion-label position="stacked">Unit Number</ion-label>
                      <ion-input
                        type="text"
                        [(ngModel)]="addressInfo.unitNumber"
                        placeholder="Unit, Floor, etc."
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>
              </div>

              <div class="form-section">
                <div class="section-heading">
                  <span>Location Details</span>
                  <span class="section-hint">Key fields *</span>
                </div>

                <div class="field-grid two">
                  <div class="field-cell">
                    <ion-item class="field-item">
                      <ion-label position="stacked">Subdivision</ion-label>
                      <ion-input
                        type="text"
                        [(ngModel)]="addressInfo.subdivision"
                        placeholder="Village / Subdivision (optional)"
                      ></ion-input>
                    </ion-item>
                  </div>
                  <div class="field-cell">
                    <ion-item class="field-item">
                      <ion-label position="stacked">Street *</ion-label>
                      <ion-input
                        type="text"
                        [(ngModel)]="addressInfo.street"
                        placeholder="Street name"
                        [class.error-input]="addressErrors.street"
                      ></ion-input>
                    </ion-item>
                    <div *ngIf="addressErrors.street" class="error-message">{{ addressErrors.street }}</div>
                  </div>
                </div>

                <div class="field-grid two">
                  <div class="field-cell">
                    <ion-item class="field-item">
                      <ion-label position="stacked">Barangay *</ion-label>
                      <ion-input
                        type="text"
                        [(ngModel)]="addressInfo.barangay"
                        [class.error-input]="addressErrors.barangay"
                      ></ion-input>
                    </ion-item>
                    <div *ngIf="addressErrors.barangay" class="error-message">{{ addressErrors.barangay }}</div>
                  </div>
                  <div class="field-cell">
                    <ion-item class="field-item">
                      <ion-label position="stacked">City / Municipality *</ion-label>
                      <ion-input
                        type="text"
                        [(ngModel)]="addressInfo.cityMunicipality"
                        [class.error-input]="addressErrors.cityMunicipality"
                      ></ion-input>
                    </ion-item>
                    <div *ngIf="addressErrors.cityMunicipality" class="error-message">{{ addressErrors.cityMunicipality }}</div>
                  </div>
                </div>

                <div class="field-grid two">
                  <div class="field-cell">
                    <ion-item class="field-item">
                      <ion-label position="stacked">Province *</ion-label>
                      <ion-input
                        type="text"
                        [(ngModel)]="addressInfo.province"
                        [class.error-input]="addressErrors.province"
                      ></ion-input>
                    </ion-item>
                    <div *ngIf="addressErrors.province" class="error-message">{{ addressErrors.province }}</div>
                  </div>
                  <div class="field-cell">
                    <ion-item class="field-item">
                      <ion-label position="stacked">Region *</ion-label>
                      <ion-input
                        type="text"
                        [(ngModel)]="addressInfo.region"
                        [class.error-input]="addressErrors.region"
                      ></ion-input>
                    </ion-item>
                    <div *ngIf="addressErrors.region" class="error-message">{{ addressErrors.region }}</div>
                  </div>
                </div>

                <div class="field-grid two">
                  <div class="field-cell">
                    <ion-item class="field-item">
                      <ion-label position="stacked">ZIP / Postal Code</ion-label>
                      <ion-input
                        type="text"
                        [(ngModel)]="addressInfo.zipCode"
                        placeholder="Optional"
                      ></ion-input>
                    </ion-item>
                  </div>
                  <div class="field-cell">
                    <ion-item class="field-item">
                      <ion-label position="stacked">Country</ion-label>
                      <ion-input
                        type="text"
                        [(ngModel)]="addressInfo.country"
                        placeholder="Country"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>
              </div>

              <div class="form-section">
                <div class="section-heading">
                  <span>Contact & Notes</span>
                  <span class="section-hint">Optional</span>
                </div>

                <div class="field-grid two">
                  <div class="field-cell">
                    <ion-item class="field-item">
                      <ion-label position="stacked">Contact Name</ion-label>
                      <ion-input
                        type="text"
                        [(ngModel)]="addressInfo.contactName"
                        placeholder="Who we can reach"
                      ></ion-input>
                    </ion-item>
                  </div>
                  <div class="field-cell">
                    <ion-item class="field-item">
                      <ion-label position="stacked">Contact Phone</ion-label>
                      <ion-input
                        type="tel"
                        [(ngModel)]="addressInfo.contactPhone"
                        placeholder="Phone for directions"
                      ></ion-input>
                    </ion-item>
                  </div>
                </div>

                <ion-item class="field-item textarea-item">
                  <ion-label position="stacked">Landmark</ion-label>
                  <ion-textarea
                    [autoGrow]="true"
                    rows="2"
                    [(ngModel)]="addressInfo.landmark"
                    placeholder="Nearby landmarks to help locate the address"
                  ></ion-textarea>
                </ion-item>

                <ion-item class="field-item textarea-item">
                  <ion-label position="stacked">Notes</ion-label>
                  <ion-textarea
                    [autoGrow]="true"
                    rows="2"
                    [(ngModel)]="addressInfo.notes"
                    placeholder="Additional delivery instructions or reminders"
                  ></ion-textarea>
                </ion-item>

                <div class="toggle-group">
                  <ion-item lines="none" class="toggle-item">
                    <ion-label>Primary Address</ion-label>
                    <ion-toggle slot="end" [(ngModel)]="addressInfo.isPrimary"></ion-toggle>
                  </ion-item>
                  <ion-item lines="none" class="toggle-item">
                    <ion-label>Verified</ion-label>
                    <ion-toggle slot="end" [(ngModel)]="addressInfo.isVerified"></ion-toggle>
                  </ion-item>
                </div>
              </div>

              <ion-button
                expand="block"
                (click)="saveAddress()"
                [disabled]="savingAddress"
                class="save-button"
              >
                <ion-icon slot="start" name="save-outline"></ion-icon>
                <span *ngIf="!savingAddress">Save Address</span>
                <ion-spinner *ngIf="savingAddress" name="crescent"></ion-spinner>
              </ion-button>

              <ion-button
                expand="block"
                fill="outline"
                (click)="skipAddress()"
                class="skip-button"
              >
                Skip for Now
              </ion-button>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    /* ===== FIXED TOP BAR ===== */
    .fixed-top-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      padding-top: env(safe-area-inset-top);
    }

    .top-bar-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      height: 56px;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .app-emoji {
      font-size: 1.5rem;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }

    .app-title {
      font-size: 1rem;
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
      letter-spacing: -0.02em;
    }

    /* ===== CONTENT ===== */
    .profile-content {
      --background: linear-gradient(160deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.06)) , var(--ion-background-color);
    }

    .profile-container {
      padding: 0 0.75rem 0.75rem 0.75rem;
      padding-top: calc(56px + env(safe-area-inset-top) + 0.75rem);
      padding-bottom: calc(60px + env(safe-area-inset-bottom) + 0.75rem);
      max-width: 600px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .profile-hero {
      position: relative;
      overflow: hidden;
      border-radius: 22px;
      padding: 1.6rem;
      background: linear-gradient(140deg, #4f46e5 0%, #6366f1 45%, #8b5cf6 100%);
      color: rgba(255, 255, 255, 0.96);
      box-shadow: 0 25px 45px rgba(79, 70, 229, 0.28);
      animation: heroReveal 0.55s ease-out forwards;
      isolation: isolate;
    }

    .profile-hero::before,
    .profile-hero::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      filter: blur(0);
      opacity: 0.35;
      z-index: -1;
    }

    .profile-hero::before {
      width: 280px;
      height: 280px;
      top: -140px;
      right: -60px;
      background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0));
      animation: orbDrift 8s ease-in-out infinite;
    }

    .profile-hero::after {
      width: 220px;
      height: 220px;
      bottom: -120px;
      left: -40px;
      background: radial-gradient(circle at 70% 70%, rgba(167, 139, 250, 0.6), rgba(124, 58, 237, 0));
      animation: orbDrift 7s ease-in-out infinite reverse;
    }

    .hero-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    @media (min-width: 520px) {
      .hero-body {
        flex-direction: row;
        align-items: center;
      }
    }

    .hero-avatar {
      position: relative;
      width: 68px;
      height: 68px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.18);
      display: grid;
      place-items: center;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: rgba(255, 255, 255, 0.95);
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.25);
      animation: float 4.5s ease-in-out infinite;
    }

    .hero-avatar::after {
      content: '';
      position: absolute;
      inset: -14px;
      border-radius: 22px;
      background: linear-gradient(140deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0));
      opacity: 0.25;
    }

    .hero-copy {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 0.65rem;
    }

    .hero-kicker {
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.65rem;
      font-weight: 700;
      opacity: 0.75;
      margin: 0;
    }

    .hero-title {
      margin: 0;
      font-size: 1.45rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .hero-subtitle {
      margin: 0;
      font-size: 0.85rem;
      line-height: 1.55;
      max-width: 34rem;
      color: rgba(226, 232, 240, 0.9);
    }

    .hero-progress {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-top: 0.35rem;
    }

    .progress-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .progress-label {
      color: rgba(226, 232, 240, 0.8);
    }

    .progress-value {
      color: white;
    }

    .progress-track {
      position: relative;
      width: 100%;
      height: 6px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.15);
      overflow: hidden;
    }

    .progress-bar {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.85) 0%, rgba(219, 234, 254, 0.95) 50%, rgba(191, 219, 254, 0.9) 100%);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.45);
    }

    .progress-bar::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.45) 45%, rgba(255, 255, 255, 0) 90%);
      animation: shimmer 1.8s linear infinite;
    }

    .hero-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.4rem;
    }

    .hero-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(255, 255, 255, 0.16);
      color: rgba(255, 255, 255, 0.95);
      padding: 0.4rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.2);
      backdrop-filter: blur(4px);
    }

    .hero-tag.soft {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(226, 232, 240, 0.9);
    }

    .hero-tag ion-icon {
      font-size: 1rem;
    }

    ion-segment {
      margin-bottom: 0.2rem;
      --background: rgba(148, 163, 184, 0.12);
      border-radius: 12px;
      padding: 0.3rem;
      box-shadow: 0 12px 28px rgba(102, 126, 234, 0.18);
    }

    ion-segment-button {
      --indicator-color: linear-gradient(135deg, #667eea, #764ba2);
      --color-checked: white;
      --indicator-box-shadow: 0 3px 10px rgba(102, 126, 234, 0.35);
      font-size: 0.8rem;
      min-height: 36px;
      font-weight: 600;
      transition: transform 0.25s ease;
    }

    ion-segment-button.ion-activated {
      transform: translateY(-1px);
    }

    .tab-content {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes heroReveal {
      from {
        opacity: 0;
        transform: translateY(-8px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes cardRise {
      from {
        opacity: 0;
        transform: translateY(18px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-6px);
      }
    }

    @keyframes orbDrift {
      0% {
        transform: translate3d(0, 0, 0) scale(1);
      }
      50% {
        transform: translate3d(12px, -10px, 0) scale(1.05);
      }
      100% {
        transform: translate3d(0, 0, 0) scale(1);
      }
    }

    .animated-card {
      opacity: 0;
      transform: translateY(16px) scale(0.98);
      animation: cardRise 0.5s ease forwards;
    }

    .delay-1 {
      animation-delay: 0.12s;
    }

    .delay-2 {
      animation-delay: 0.22s;
    }

    .info-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      color: var(--ion-color-medium);
      font-size: 0.75rem;
      padding: 0.5rem 0.65rem;
      background: rgba(var(--ion-color-primary-rgb), 0.05);
      border-radius: 10px;
      border-left: 3px solid var(--ion-color-primary);
    }

    ion-list {
      margin-bottom: 0.85rem;
      background: transparent;
    }

    ion-item {
      --padding-start: 0;
      --inner-padding-end: 0;
      --background: var(--ion-card-background);
      --border-radius: 12px;
      margin-bottom: 0.5rem;
      border: 1px solid var(--ion-border-color, rgba(148, 163, 184, 0.15));
      border-radius: 12px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  min-height: 50px;
    }

    ion-item:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transform: translateY(-1px);
    }

    ion-item:focus-within {
      border-color: rgba(102, 126, 234, 0.65);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
      transform: translateY(-1px);
    }

    ion-label {
      font-size: 0.7rem !important;
      font-weight: 600 !important;
      margin-bottom: 0.35rem !important;
      color: var(--ion-color-medium) !important;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      display: block;
  padding-left: 0.8rem;
  padding-right: 0.8rem;
    }

    ion-input {
      font-size: 0.85rem !important;
      font-weight: 500;
      transition: color 0.2s ease;
  --padding-top: 0.55rem;
  --padding-bottom: 0.55rem;
  --padding-start: 0.75rem;
  --padding-end: 0.75rem;
      --background: transparent;
    }

    ion-input::part(native) {
      line-height: 1.4;
    }

    .error-input {
      --border-color: var(--ion-color-danger) !important;
      --highlight-color-focused: var(--ion-color-danger) !important;
      border-color: var(--ion-color-danger) !important;
    }

    .error-message {
      color: var(--ion-color-danger);
      font-size: 0.7rem;
      margin-top: -0.4rem;
      margin-bottom: 0.6rem;
      padding-left: 0.85rem;
      font-weight: 500;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      margin-bottom: 1.05rem;
    }

    .form-section:last-of-type {
      margin-bottom: 0.85rem;
    }

    .section-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.7rem;
      letter-spacing: 0.08em;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--ion-color-medium);
    }

    .section-hint {
      font-size: 0.65rem;
      font-weight: 600;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.18);
      color: #475569;
    }

    .section-hint.required {
      background: rgba(59, 130, 246, 0.18);
      color: #1d4ed8;
    }

    .field-grid {
      display: grid;
      gap: 0.65rem;
    }

    .field-grid.two {
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    }

    .field-cell {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .field-item {
      width: 100%;
    }

    .textarea-item {
      align-items: stretch;
      --min-height: 98px;
    }

    .toggle-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-top: 0.35rem;
    }

    .toggle-item {
      --padding-start: 0.75rem;
      --inner-padding-end: 0.75rem;
      background: rgba(148, 163, 184, 0.12);
      border-radius: 12px;
    }

    .toggle-item ion-label {
      text-transform: none;
      letter-spacing: 0.01em;
      font-size: 0.85rem !important;
      margin-bottom: 0 !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
    }

    .toggle-item:hover,
    .toggle-item:focus-within {
      box-shadow: none;
      transform: none;
    }

    .save-button {
      margin-top: 0.85rem;
      --background: linear-gradient(135deg, #667eea, #764ba2);
      --border-radius: 12px;
      --box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      font-weight: 600;
      height: 44px;
      font-size: 0.85rem;
      text-transform: none;
    }

    .skip-button {
      margin-top: 0.5rem;
      --border-radius: 12px;
      height: 40px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    ion-card {
      margin-bottom: 0.75rem;
      border-radius: 15px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid var(--ion-border-color, rgba(148, 163, 184, 0.15));
      overflow: hidden;
    }

    ion-card-header {
      padding: 0.8rem 0.95rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
    }

    ion-card-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--ion-text-color);
    }

    ion-card-content {
      padding: 0.9rem;
    }

    @media (max-width: 520px) {
      .profile-container {
        padding: 0 0.6rem 0.6rem 0.6rem;
        padding-top: calc(56px + env(safe-area-inset-top) + 0.6rem);
        gap: 0.6rem;
      }

      .profile-hero {
        padding: 1.2rem;
        border-radius: 18px;
      }

      .hero-body {
        gap: 0.75rem;
      }

      .hero-title {
        font-size: 1.25rem;
      }

      .hero-subtitle {
        font-size: 0.8rem;
      }

      .hero-tag {
        padding: 0.35rem 0.6rem;
        font-size: 0.7rem;
      }

      .info-text {
        padding: 0.45rem 0.6rem;
        font-size: 0.7rem;
        margin-bottom: 0.6rem;
      }

      ion-card {
        margin-bottom: 0.6rem;
        border-radius: 14px;
      }

      ion-card-header {
        padding: 0.7rem 0.8rem;
      }

      ion-card-content {
        padding: 0.75rem;
      }

      ion-item {
        margin-bottom: 0.4rem;
        min-height: 46px;
      }

      ion-input {
        --padding-top: 0.5rem;
        --padding-bottom: 0.5rem;
        --padding-start: 0.65rem;
        --padding-end: 0.65rem;
      }

      .form-section {
        gap: 0.55rem;
        margin-bottom: 0.9rem;
      }
    }

    /* Dark mode adjustments */
    body.dark ion-item,
    .dark ion-item {
      --background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark .info-text,
    .dark .info-text {
      background: rgba(var(--ion-color-primary-rgb), 0.12);
    }

    body.dark .section-hint,
    .dark .section-hint {
      background: rgba(148, 163, 184, 0.28);
      color: rgba(226, 232, 240, 0.85);
    }

    body.dark .section-hint.required,
    .dark .section-hint.required {
      background: rgba(59, 130, 246, 0.35);
      color: rgba(191, 219, 254, 0.95);
    }

    body.dark ion-card,
    .dark ion-card {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark ion-card-header,
    .dark ion-card-header {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.12));
    }

    body.dark .toggle-item,
    .dark .toggle-item {
      background: rgba(30, 41, 59, 0.6);
    }

    body.dark .profile-hero,
    .dark .profile-hero {
      background: linear-gradient(145deg, rgba(30, 64, 175, 0.92) 0%, rgba(76, 29, 149, 0.88) 60%, rgba(30, 58, 138, 0.92) 100%);
      box-shadow: 0 25px 50px rgba(15, 23, 42, 0.45);
    }

    body.dark .hero-subtitle,
    .dark .hero-subtitle {
      color: rgba(203, 213, 225, 0.85);
    }

    body.dark .hero-tag,
    .dark .hero-tag {
      background: rgba(255, 255, 255, 0.12);
      color: rgba(226, 232, 240, 0.95);
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.35);
    }

    body.dark .hero-tag.soft,
    .dark .hero-tag.soft {
      background: rgba(148, 163, 184, 0.2);
      color: rgba(226, 232, 240, 0.9);
    }

    body.dark .progress-track,
    .dark .progress-track {
      background: rgba(15, 23, 42, 0.35);
    }
  `],
})
export class ProfilePage implements OnInit {
  selectedTab = 'personal';
  savingPersonal = false;
  savingAddress = false;
  
  currentUser = this.authService.currentUser();

  personalInfo = {
    firstName: '',
    lastName: '',
    phone: '',
  };

  addressInfo = {
    addressType: 'Home',
    label: '',
    houseNumber: '',
    unitNumber: '',
    subdivision: '',
    street: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    region: '',
    zipCode: '',
    country: 'Philippines',
    landmark: '',
    contactPhone: '',
    contactName: '',
    notes: '',
    isPrimary: true,
    isVerified: false,
  };

  errors: any = {};
  addressErrors: Record<string, string> = {};

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private http: HttpClient,
    public themeService: ThemeService
  ) {
    addIcons({
      'person-outline': personOutline,
      'call-outline': callOutline,
      'home-outline': homeOutline,
      'location-outline': locationOutline,
      'save-outline': saveOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
    });
  }

  ngOnInit() {
    this.loadCurrentProfile();
  }

  getHeroName(): string {
    const first = (this.personalInfo.firstName || this.currentUser?.firstName || '').trim();
    if (first) {
      return first.split(' ')[0];
    }
    return 'Explorer';
  }

  getUserInitials(): string {
    const first = (this.personalInfo.firstName || this.currentUser?.firstName || '').trim();
    const last = (this.personalInfo.lastName || this.currentUser?.lastName || '').trim();
    const initials = `${first ? first.charAt(0).toUpperCase() : ''}${last ? last.charAt(0).toUpperCase() : ''}`.trim();
    return initials || '👤';
  }

  profileCompletion(): number {
    const total = this.totalFieldsCount();
    if (total === 0) {
      return 0;
    }
    const filled = this.completedFieldsCount();
    return Math.min(100, Math.round((filled / total) * 100));
  }

  completedFieldsCount(): number {
    return this.allProfileFields().filter((value) => value && value.toString().trim() !== '').length;
  }

  totalFieldsCount(): number {
    return this.allProfileFields().length;
  }

  private normalizeBoolean(value: any, fallback = false): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'y'].includes(normalized)) {
        return true;
      }
      if (['false', '0', 'no', 'n'].includes(normalized)) {
        return false;
      }
    }
    return fallback;
  }

  private allProfileFields(): Array<string | undefined> {
    return [
      this.personalInfo.firstName,
      this.personalInfo.lastName,
      this.personalInfo.phone,
      this.addressInfo.addressType,
      this.addressInfo.street,
      this.addressInfo.barangay,
      this.addressInfo.cityMunicipality,
      this.addressInfo.province,
      this.addressInfo.region,
    ];
  }

  async loadCurrentProfile() {
    try {
      const customerData = localStorage.getItem('customer');
      if (customerData) {
        const customer = JSON.parse(customerData);
        this.personalInfo.firstName = customer.first_name || customer.firstName || '';
        this.personalInfo.lastName = customer.last_name || customer.lastName || '';
        this.personalInfo.phone = customer.phone || '';

        // Load address if exists
        if (customer.addresses && customer.addresses.length > 0) {
          const addr = customer.addresses[0];
          this.addressInfo = {
            ...this.addressInfo,
            addressType: addr.addressType || addr.address_type || this.addressInfo.addressType,
            label: addr.label || '',
            houseNumber: addr.houseNumber || addr.house_number || '',
            unitNumber: addr.unitNumber || addr.unit_number || '',
            subdivision: addr.subdivision || '',
            street: addr.street || addr.streetAddress || addr.street_address || '',
            barangay: addr.barangay || '',
            cityMunicipality: addr.cityMunicipality || addr.city_municipality || addr.city || '',
            province: addr.province || '',
            region: addr.region || '',
            zipCode: addr.zipCode || addr.zip_code || '',
            country: addr.country || this.addressInfo.country,
            landmark: addr.landmark || '',
            contactPhone: addr.contactPhone || addr.contact_phone || this.personalInfo.phone || '',
            contactName:
              addr.contactName ||
              addr.contact_name ||
              [this.personalInfo.firstName, this.personalInfo.lastName].filter(Boolean).join(' '),
            notes: addr.notes || '',
            isPrimary: this.normalizeBoolean(addr.isPrimary ?? addr.is_primary, true),
            isVerified: this.normalizeBoolean(addr.isVerified ?? addr.is_verified, false),
          };
        } else {
          this.addressInfo = {
            ...this.addressInfo,
            contactPhone: this.personalInfo.phone || '',
            contactName: [this.personalInfo.firstName, this.personalInfo.lastName].filter(Boolean).join(' '),
          };
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  onTabChange() {
    // Reset errors when switching tabs
    this.errors = {};
    this.addressErrors = {};
  }

  validatePersonalInfo(): boolean {
    this.errors = {};
    let isValid = true;

    if (!this.personalInfo.firstName || this.personalInfo.firstName.trim() === '') {
      this.errors.firstName = 'First name is required';
      isValid = false;
    }

    if (!this.personalInfo.lastName || this.personalInfo.lastName.trim() === '') {
      this.errors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!this.personalInfo.phone || this.personalInfo.phone.trim() === '') {
      this.errors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^[\d\s\-\+\(\)]+$/.test(this.personalInfo.phone)) {
      this.errors.phone = 'Please enter a valid phone number';
      isValid = false;
    }

    return isValid;
  }

  validateAddress(): boolean {
    this.addressErrors = {};
    let isValid = true;

    const requiredFields: Array<[keyof typeof this.addressInfo, string]> = [
      ['addressType', 'Address type'],
      ['street', 'Street'],
      ['barangay', 'Barangay'],
      ['cityMunicipality', 'City or municipality'],
      ['province', 'Province'],
      ['region', 'Region'],
    ];

    requiredFields.forEach(([key, label]) => {
      const value = this.addressInfo[key];
      const normalized = typeof value === 'string' ? value.trim() : '';
      if (!normalized) {
        this.addressErrors[key] = `${label} is required`;
        isValid = false;
      }
    });

    return isValid;
  }

  async savePersonalInfo() {
    if (!this.validatePersonalInfo()) {
      await this.showToast('Please fill in all required fields', 'warning');
      return;
    }

    this.savingPersonal = true;

    try {
      const response = await this.http.put<any>(
        `${environment.apiUrl}/customers/auth/profile`,
        {
          firstName: this.personalInfo.firstName,
          lastName: this.personalInfo.lastName,
          phone: this.personalInfo.phone,
        }
      ).toPromise();

      console.log('Profile update response:', response);

      // Update local storage
      const customerData = localStorage.getItem('customer');
      if (customerData) {
        const customer = JSON.parse(customerData);
        customer.first_name = this.personalInfo.firstName;
        customer.last_name = this.personalInfo.lastName;
        customer.phone = this.personalInfo.phone;
        localStorage.setItem('customer', JSON.stringify(customer));
      }

      // Update AuthService currentUser signal
      this.authService.updateCurrentUser({
        firstName: this.personalInfo.firstName,
        lastName: this.personalInfo.lastName,
      });

      if (!this.addressInfo.contactPhone) {
        this.addressInfo.contactPhone = this.personalInfo.phone;
      }

      const derivedName = [this.personalInfo.firstName, this.personalInfo.lastName]
        .filter(Boolean)
        .join(' ');
      if (!this.addressInfo.contactName) {
        this.addressInfo.contactName = derivedName;
      }

      await this.showToast('✅ Personal information saved successfully!', 'success');
      
      // Ask if they want to add address
      const alert = await this.alertController.create({
        header: 'Success!',
        message: 'Your personal information has been saved. Would you like to add your address?',
        buttons: [
          {
            text: 'Later',
            handler: () => {
              this.router.navigate(['/customer/dashboard']);
            }
          },
          {
            text: 'Add Address',
            handler: () => {
              this.selectedTab = 'address';
            }
          }
        ]
      });
      await alert.present();

    } catch (error: any) {
      console.error('Error saving profile:', error);
      await this.showToast(
        error.error?.message || 'Failed to save profile. Please try again.',
        'danger'
      );
    } finally {
      this.savingPersonal = false;
    }
  }

  async saveAddress() {
    if (!this.validateAddress()) {
      await this.showToast('Please complete the required address fields', 'warning');
      return;
    }

    this.savingAddress = true;

    try {
      const fullName = [this.personalInfo.firstName, this.personalInfo.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();

      const addressPayload: Record<string, any> = {
        ...this.addressInfo,
        country: (this.addressInfo.country || 'Philippines').trim(),
        contactPhone: (this.addressInfo.contactPhone || this.personalInfo.phone || '').trim(),
        contactName: (this.addressInfo.contactName || fullName).trim(),
      };

      const stringFields: Array<keyof typeof addressPayload> = [
        'addressType',
        'label',
        'houseNumber',
        'unitNumber',
        'subdivision',
        'street',
        'barangay',
        'cityMunicipality',
        'province',
        'region',
        'zipCode',
        'country',
        'contactPhone',
        'contactName',
        'landmark',
        'notes',
      ];

      stringFields.forEach((field) => {
        if (typeof addressPayload[field] === 'string') {
          addressPayload[field] = addressPayload[field].trim();
        }
      });

      if (!addressPayload.country) {
        addressPayload.country = 'Philippines';
      }

      const trimmedNotes = addressPayload.notes;
      addressPayload.notes = trimmedNotes ? trimmedNotes : undefined;
      const trimmedLandmark = addressPayload.landmark;
      addressPayload.landmark = trimmedLandmark ? trimmedLandmark : undefined;

      addressPayload.isPrimary = this.normalizeBoolean(addressPayload.isPrimary, true);
      addressPayload.isVerified = this.normalizeBoolean(addressPayload.isVerified, false);

      const response = await this.http.put<any>(
        `${environment.apiUrl}/customers/auth/profile`,
        {
          address: addressPayload,
        }
      ).toPromise();

      console.log('Address update response:', response);

      const customerData = localStorage.getItem('customer');
      if (customerData) {
        const customer = JSON.parse(customerData);
        const updatedAddress = { ...addressPayload };
        customer.addresses = customer.addresses || [];
        if (customer.addresses.length > 0) {
          customer.addresses[0] = { ...customer.addresses[0], ...updatedAddress };
        } else {
          customer.addresses.push(updatedAddress);
        }
        localStorage.setItem('customer', JSON.stringify(customer));
      }

      this.addressInfo = {
        ...this.addressInfo,
        ...addressPayload,
        landmark: addressPayload.landmark || '',
        notes: addressPayload.notes || '',
        contactPhone: addressPayload.contactPhone || '',
        contactName: addressPayload.contactName || '',
      };

      await this.showToast('✅ Address saved successfully!', 'success');
      
      // Navigate to dashboard
      setTimeout(() => {
        this.router.navigate(['/customer/dashboard']);
      }, 1000);

    } catch (error: any) {
      console.error('Error saving address:', error);
      await this.showToast(
        error.error?.message || 'Failed to save address. Please try again.',
        'danger'
      );
    } finally {
      this.savingAddress = false;
    }
  }

  skipAddress() {
    this.router.navigate(['/customer/dashboard']);
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
