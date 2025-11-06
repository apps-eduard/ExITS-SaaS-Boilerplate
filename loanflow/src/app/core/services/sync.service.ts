// Sync Service - Offline data synchronization for collectors using SQLite
import { Injectable, signal } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { ApiService } from './api.service';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

interface PendingSync {
  id?: number;
  type: 'visit' | 'collection' | 'payment';
  data: any;
  timestamp: number;
  synced: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private readonly DB_NAME = 'loanflow.db';
  private initPromise: Promise<void> | null = null;

  // Reactive state
  public isOnline = signal(true);
  public pendingSyncCount = signal(0);
  public isSyncing = signal(false);

  constructor(private api: ApiService) {
    // Don't initialize immediately - wait for platform to be ready
    this.setupNetworkListener();
  }

  /**
   * Ensure database is initialized (lazy initialization)
   */
  private async ensureInitialized(): Promise<void> {
    if (this.db) return; // Already initialized
    if (this.initPromise) return this.initPromise; // Initialization in progress

    this.initPromise = this.initializeDatabase();
    return this.initPromise;
  }

  /**
   * Initialize SQLite database
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // For web platform, wait a bit to ensure jeep-sqlite is loaded
      if (Capacitor.getPlatform() === 'web') {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if jeep-sqlite element exists
        const jeepEl = document.querySelector('jeep-sqlite');
        if (!jeepEl) {
          console.warn('SyncService: jeep-sqlite element not found, SQLite disabled for this session');
          return;
        }
      }

      // Create connection
      this.db = await this.sqlite.createConnection(
        this.DB_NAME,
        false,
        'no-encryption',
        1,
        false
      );

      // Open database
      await this.db.open();

      // Create pending_sync table
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS pending_sync (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          synced INTEGER DEFAULT 0
        );
      `);

      // Update pending count
      await this.updatePendingCount();

      console.log('SyncService: Database initialized successfully');
    } catch (error) {
      console.error('SyncService: Failed to initialize database', error);
      this.db = null; // Reset on error
    }
  }

  /**
   * Listen for network changes
   */
  private setupNetworkListener(): void {
    Network.addListener('networkStatusChange', async (status: ConnectionStatus) => {
      this.isOnline.set(status.connected);
      console.log('Network status changed:', status.connected ? 'Online' : 'Offline');

      // Auto-sync when coming back online
      if (status.connected) {
        await this.syncPendingData();
      }
    });

    // Check initial network status
    Network.getStatus().then((status: ConnectionStatus) => {
      this.isOnline.set(status.connected);
    });
  }

  /**
   * Queue data for sync
   */
  async queueForSync(type: 'visit' | 'collection' | 'payment', data: any): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.db) {
      console.warn('SyncService: Database not available, data will not be queued');
      return;
    }

    try {
      const timestamp = Date.now();
      await this.db.run(
        'INSERT INTO pending_sync (type, data, timestamp, synced) VALUES (?, ?, ?, ?)',
        [type, JSON.stringify(data), timestamp, 0]
      );

      await this.updatePendingCount();
      console.log(`SyncService: Queued ${type} for sync`);

      // Try to sync immediately if online
      if (this.isOnline()) {
        await this.syncPendingData();
      }
    } catch (error) {
      console.error('SyncService: Failed to queue data', error);
      throw error;
    }
  }

  /**
   * Sync all pending data to server
   */
  async syncPendingData(): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.db || !this.isOnline() || this.isSyncing()) {
      return;
    }

    this.isSyncing.set(true);

    try {
      // Get all pending items
      const result = await this.db.query('SELECT * FROM pending_sync WHERE synced = 0');
      const pendingItems: PendingSync[] = result.values || [];

      console.log(`SyncService: Syncing ${pendingItems.length} items`);

      // Sync each item
      for (const item of pendingItems) {
        try {
          const data = JSON.parse(item.data);

          // Call appropriate API endpoint
          switch (item.type) {
            case 'visit':
              await this.api.recordVisit(data).toPromise();
              break;
            case 'collection':
              await this.api.recordCollection(data).toPromise();
              break;
            case 'payment':
              await this.api.makePayment(data).toPromise();
              break;
          }

          // Mark as synced
          await this.db.run('UPDATE pending_sync SET synced = 1 WHERE id = ?', [item.id]);
          console.log(`SyncService: Synced ${item.type} #${item.id}`);
        } catch (error) {
          console.error(`SyncService: Failed to sync ${item.type} #${item.id}`, error);
          // Continue with next item
        }
      }

      // Clean up synced items older than 7 days
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      await this.db.run('DELETE FROM pending_sync WHERE synced = 1 AND timestamp < ?', [weekAgo]);

      await this.updatePendingCount();
      console.log('SyncService: Sync completed');
    } catch (error) {
      console.error('SyncService: Sync failed', error);
    } finally {
      this.isSyncing.set(false);
    }
  }

  /**
   * Update pending sync count
   */
  private async updatePendingCount(): Promise<void> {
    if (!this.db) return;

    try {
      const result = await this.db.query('SELECT COUNT(*) as count FROM pending_sync WHERE synced = 0');
      const count = result.values?.[0]?.count || 0;
      this.pendingSyncCount.set(count);
    } catch (error) {
      console.error('SyncService: Failed to update pending count', error);
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isOnline: boolean;
    pendingCount: number;
    isSyncing: boolean;
  } {
    return {
      isOnline: this.isOnline(),
      pendingCount: this.pendingSyncCount(),
      isSyncing: this.isSyncing(),
    };
  }

  /**
   * Force sync now
   */
  async forceSyncNow(): Promise<void> {
    await this.syncPendingData();
  }

  /**
   * Clear all pending sync data (use with caution)
   */
  async clearPendingSync(): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.db) return;

    try {
      await this.db.run('DELETE FROM pending_sync');
      await this.updatePendingCount();
      console.log('SyncService: Cleared all pending sync data');
    } catch (error) {
      console.error('SyncService: Failed to clear pending sync', error);
    }
  }
}
