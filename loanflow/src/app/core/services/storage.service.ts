// Storage Service - Secure local storage using Capacitor Secure Storage
import { Injectable } from '@angular/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    USER_ROLE: 'user_role',
    TENANT_ID: 'tenant_id',
  };

  /**
   * Store a value securely
   */
  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStoragePlugin.set({ key, value });
    } catch (error) {
      console.error('StorageService: Failed to set value', error);
      // Fallback to localStorage in web
      if (this.isWeb()) {
        localStorage.setItem(key, value);
      }
    }
  }

  /**
   * Retrieve a value
   */
  async get(key: string): Promise<string | null> {
    try {
      const result = await SecureStoragePlugin.get({ key });
      return result.value || null;
    } catch (error) {
      console.error('StorageService: Failed to get value', error);
      // Fallback to localStorage in web
      if (this.isWeb()) {
        return localStorage.getItem(key);
      }
      return null;
    }
  }

  /**
   * Remove a value
   */
  async remove(key: string): Promise<void> {
    try {
      await SecureStoragePlugin.remove({ key });
    } catch (error) {
      console.error('StorageService: Failed to remove value', error);
      if (this.isWeb()) {
        localStorage.removeItem(key);
      }
    }
  }

  /**
   * Clear all stored data
   */
  async clear(): Promise<void> {
    try {
      await SecureStoragePlugin.clear();
    } catch (error) {
      console.error('StorageService: Failed to clear storage', error);
      if (this.isWeb()) {
        localStorage.clear();
      }
    }
  }

  /**
   * Token management helpers
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.set(this.KEYS.ACCESS_TOKEN, accessToken);
    await this.set(this.KEYS.REFRESH_TOKEN, refreshToken);
  }

  async getAccessToken(): Promise<string | null> {
    return await this.get(this.KEYS.ACCESS_TOKEN);
  }

  async getRefreshToken(): Promise<string | null> {
    return await this.get(this.KEYS.REFRESH_TOKEN);
  }

  async setUserData(userData: any): Promise<void> {
    await this.set(this.KEYS.USER_DATA, JSON.stringify(userData));
  }

  async getUserData(): Promise<any> {
    const data = await this.get(this.KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  }

  async setUserRole(role: 'customer' | 'collector'): Promise<void> {
    await this.set(this.KEYS.USER_ROLE, role);
  }

  async getUserRole(): Promise<'customer' | 'collector' | null> {
    return (await this.get(this.KEYS.USER_ROLE)) as 'customer' | 'collector' | null;
  }

  /**
   * Check if running in web environment
   */
  private isWeb(): boolean {
    return !('Capacitor' in window);
  }
}
