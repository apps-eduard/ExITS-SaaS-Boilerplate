import { addIcons } from 'ionicons';
import {
  cashOutline,
  personOutline,
  lockClosedOutline,
  logInOutline,
  logOutOutline,
  personCircleOutline,
  walletOutline,
  timeOutline,
  checkmarkCircleOutline,
  trendingUpOutline,
  documentTextOutline,
  cardOutline,
  addCircleOutline,
  mapOutline,
  locationOutline,
  callOutline,
  navigateOutline,
  listOutline,
  syncOutline,
  statsChartOutline
} from 'ionicons/icons';

// Centralized Ionicons registration to avoid missing-icon warnings on web
export function registerIcons() {
  addIcons({
    'cash-outline': cashOutline,
    'person-outline': personOutline,
    'lock-closed-outline': lockClosedOutline,
    'log-in-outline': logInOutline,
    'log-out-outline': logOutOutline,
    'person-circle-outline': personCircleOutline,
    'wallet-outline': walletOutline,
    'time-outline': timeOutline,
    'checkmark-circle-outline': checkmarkCircleOutline,
    'trending-up-outline': trendingUpOutline,
    'document-text-outline': documentTextOutline,
    'card-outline': cardOutline,
    'add-circle-outline': addCircleOutline,
    'map-outline': mapOutline,
    'location-outline': locationOutline,
    'call-outline': callOutline,
  'navigation-outline': navigateOutline,
    'list-outline': listOutline,
    'sync-outline': syncOutline,
    'stats-chart-outline': statsChartOutline
  });
}

// Register immediately when module is imported
registerIcons();
