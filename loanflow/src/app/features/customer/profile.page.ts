import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButtons,
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
import { DevInfoComponent } from '../../shared/components/dev-info.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonBackButton,
    IonButtons,
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
    DevInfoComponent,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/customer/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Complete Your Profile</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="profile-container">
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
          <ion-card>
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
          <ion-card>
            <ion-card-header>
              <ion-card-title>Address Information</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p class="info-text">
                <ion-icon name="location-outline" color="medium"></ion-icon>
                Address information is optional but recommended for loan applications.
              </p>

              <ion-list [inset]="true">
                <ion-item>
                  <ion-label position="stacked">Street Address</ion-label>
                  <ion-input
                    type="text"
                    [(ngModel)]="addressInfo.streetAddress"
                    placeholder="Enter your street address"
                  ></ion-input>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">City</ion-label>
                  <ion-input
                    type="text"
                    [(ngModel)]="addressInfo.city"
                    placeholder="Enter your city"
                  ></ion-input>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">State/Province</ion-label>
                  <ion-input
                    type="text"
                    [(ngModel)]="addressInfo.state"
                    placeholder="Enter your state/province"
                  ></ion-input>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">ZIP/Postal Code</ion-label>
                  <ion-input
                    type="text"
                    [(ngModel)]="addressInfo.postalCode"
                    placeholder="Enter your ZIP/postal code"
                  ></ion-input>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">Country</ion-label>
                  <ion-input
                    type="text"
                    [(ngModel)]="addressInfo.country"
                    placeholder="Enter your country"
                  ></ion-input>
                </ion-item>
              </ion-list>

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

      <app-dev-info></app-dev-info>
    </ion-content>
  `,
  styles: [`
    .profile-container {
      padding: 16px;
      max-width: 600px;
      margin: 0 auto;
    }

    ion-segment {
      margin-bottom: 16px;
    }

    .tab-content {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .info-text {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      color: var(--ion-color-medium);
      font-size: 14px;
    }

    ion-list {
      margin-bottom: 16px;
    }

    ion-item {
      --padding-start: 0;
      --inner-padding-end: 0;
    }

    .error-input {
      --border-color: var(--ion-color-danger) !important;
      --highlight-color-focused: var(--ion-color-danger) !important;
    }

    .error-message {
      color: var(--ion-color-danger);
      font-size: 12px;
      margin-top: -8px;
      margin-bottom: 12px;
      padding-left: 16px;
    }

    .save-button {
      margin-top: 16px;
      --background: var(--ion-color-primary);
    }

    .skip-button {
      margin-top: 8px;
    }

    ion-card {
      margin-bottom: 16px;
    }

    ion-card-title {
      font-size: 18px;
      font-weight: 600;
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
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  };

  errors: any = {};

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
          this.addressInfo.streetAddress = addr.street_address || addr.streetAddress || '';
          this.addressInfo.city = addr.city || '';
          this.addressInfo.state = addr.state || '';
          this.addressInfo.postalCode = addr.postal_code || addr.postalCode || '';
          this.addressInfo.country = addr.country || '';
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  onTabChange() {
    // Reset errors when switching tabs
    this.errors = {};
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
    // Check if at least one field is filled
    const hasAnyField = Object.values(this.addressInfo).some(val => val && val.trim() !== '');
    
    if (!hasAnyField) {
      await this.showToast('Please fill in at least one address field', 'warning');
      return;
    }

    this.savingAddress = true;

    try {
      const response = await this.http.put<any>(
        `${environment.apiUrl}/customers/auth/profile`,
        {
          address: this.addressInfo,
        }
      ).toPromise();

      console.log('Address update response:', response);

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

  async skipAddress() {
    const alert = await this.alertController.create({
      header: 'Skip Address?',
      message: 'You can always add your address later from the dashboard settings.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Skip',
          handler: () => {
            this.router.navigate(['/customer/dashboard']);
          }
        }
      ]
    });
    await alert.present();
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
