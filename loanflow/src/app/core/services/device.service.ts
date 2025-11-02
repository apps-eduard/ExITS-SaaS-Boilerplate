import { Injectable } from '@angular/core';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import { Observable, of } from 'rxjs';

export interface DeviceInfo {
  platform: string;
  osVersion: string;
  manufacturer: string;
  model: string;
  appVersion: string;
  appBuild: string;
  deviceId: string;
}

@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  private deviceInfo: DeviceInfo | null = null;

  constructor() {
    this.initializeDeviceInfo();
  }

  async initializeDeviceInfo(): Promise<void> {
    try {
      const info = await Device.getInfo();
      const appInfo = await App.getInfo();
      const deviceId = await Device.getId();

      this.deviceInfo = {
        platform: info.platform,
        osVersion: info.osVersion,
        manufacturer: info.manufacturer || 'Unknown',
        model: info.model || 'Unknown',
        appVersion: appInfo.version,
        appBuild: appInfo.build,
        deviceId: deviceId.identifier || '',
      };
    } catch (error) {
      console.error('Error getting device info:', error);
    }
  }

  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  getPlatform(): string {
    return this.deviceInfo?.platform || 'web';
  }

  isAndroid(): boolean {
    return this.getPlatform() === 'android';
  }

  isIOS(): boolean {
    return this.getPlatform() === 'ios';
  }

  isWeb(): boolean {
    return this.getPlatform() === 'web';
  }

  getAppVersion(): string {
    return this.deviceInfo?.appVersion || '1.0.0';
  }

  async getDeviceName(): Promise<string> {
    try {
      const info = await Device.getInfo();
      return `${info.manufacturer} ${info.model}`;
    } catch (error) {
      return 'Unknown Device';
    }
  }

  async getLanguageCode(): Promise<string> {
    try {
      const lang = await Device.getLanguageCode();
      return lang.value;
    } catch (error) {
      return 'en';
    }
  }
}
