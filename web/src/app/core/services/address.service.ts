import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Address {
  id: string;
  userId: string;
  tenantId: string;
  addressType: 'home' | 'work' | 'billing' | 'shipping' | 'other';
  street: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  region: string;
  zipCode?: string;
  country: string;
  landmark?: string;
  isPrimary: boolean;
  isVerified: boolean;
  contactPhone?: string;
  contactName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddressCreatePayload {
  userId: number; // Backend expects number
  addressType: 'home' | 'work' | 'billing' | 'shipping' | 'other';
  street: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  region: string;
  zipCode?: string;
  country?: string;
  landmark?: string;
  isPrimary?: boolean;
  contactPhone?: string;
  contactName?: string;
  notes?: string;
}

export interface AddressUpdatePayload {
  addressType?: 'home' | 'work' | 'billing' | 'shipping' | 'other';
  street?: string;
  barangay?: string;
  cityMunicipality?: string;
  province?: string;
  region?: string;
  zipCode?: string;
  landmark?: string;
  isPrimary?: boolean;
  contactPhone?: string;
  contactName?: string;
  notes?: string;
}

export interface Region {
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = 'http://localhost:3000/api/addresses';

  // Signals for state management
  loadingSignal = signal(false);
  errorSignal = signal<string | null>(null);
  addressesSignal = signal<Address[]>([]);
  regionsSignal = signal<Region[]>([]);

  constructor(private http: HttpClient) {
    this.loadRegions();
  }

  /**
   * Load all Philippine regions
   */
  async loadRegions(): Promise<void> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: Region[] }>(`${this.apiUrl}/regions`)
      );

      if (response.success) {
        this.regionsSignal.set(response.data);
      }
    } catch (error) {
      console.error('Error loading regions:', error);
      this.errorSignal.set('Failed to load regions');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Get all addresses for a specific user
   */
  async getAddressesByUserId(userId: string | number): Promise<Address[]> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: Address[] }>(`${this.apiUrl}?userId=${userId}`)
      );

      if (response.success) {
        this.addressesSignal.set(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error loading addresses:', error);
      this.errorSignal.set('Failed to load addresses');
      return [];
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Get a single address by ID
   */
  async getAddress(id: string): Promise<Address | null> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: Address }>(`${this.apiUrl}/${id}`)
      );

      return response.success ? response.data : null;
    } catch (error) {
      console.error('Error loading address:', error);
      this.errorSignal.set('Failed to load address');
      return null;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Create a new address
   */
  async createAddress(payload: AddressCreatePayload): Promise<Address | null> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response = await firstValueFrom(
        this.http.post<{ success: boolean; data: Address }>(`${this.apiUrl}`, payload)
      );

      if (response.success) {
        // Reload addresses for the user
        await this.getAddressesByUserId(payload.userId);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error creating address:', error);
      this.errorSignal.set('Failed to create address');
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Update an existing address
   */
  async updateAddress(id: string, payload: AddressUpdatePayload): Promise<Address | null> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response = await firstValueFrom(
        this.http.put<{ success: boolean; data: Address }>(`${this.apiUrl}/${id}`, payload)
      );

      return response.success ? response.data : null;
    } catch (error) {
      console.error('Error updating address:', error);
      this.errorSignal.set('Failed to update address');
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Delete an address
   */
  async deleteAddress(id: string): Promise<boolean> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response = await firstValueFrom(
        this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`)
      );

      return response.success;
    } catch (error) {
      console.error('Error deleting address:', error);
      this.errorSignal.set('Failed to delete address');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Set an address as primary
   */
  async setPrimaryAddress(id: string): Promise<boolean> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response = await firstValueFrom(
        this.http.patch<{ success: boolean }>(`${this.apiUrl}/${id}/set-primary`, {})
      );

      return response.success;
    } catch (error) {
      console.error('Error setting primary address:', error);
      this.errorSignal.set('Failed to set primary address');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Verify an address
   */
  async verifyAddress(id: string): Promise<boolean> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response = await firstValueFrom(
        this.http.patch<{ success: boolean }>(`${this.apiUrl}/${id}/verify`, {})
      );

      return response.success;
    } catch (error) {
      console.error('Error verifying address:', error);
      this.errorSignal.set('Failed to verify address');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Get the primary address for a user
   */
  getPrimaryAddress(addresses: Address[]): Address | null {
    return addresses.find(addr => addr.isPrimary) || null;
  }

  /**
   * Format address as Philippine standard
   */
  formatAddress(address: Address): string {
    const parts = [
      address.street,
      address.barangay,
      address.cityMunicipality,
      address.province,
      address.region,
      address.country || 'Philippines'
    ].filter(Boolean);

    if (address.zipCode) {
      parts.splice(-1, 0, address.zipCode);
    }

    return parts.join(', ');
  }
}
