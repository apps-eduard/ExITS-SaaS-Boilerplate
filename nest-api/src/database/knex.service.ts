import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import knex, { Knex } from 'knex';
import knexConfig from '../../knexfile';

@Injectable()
export class KnexService implements OnModuleInit, OnModuleDestroy {
  private knexInstance: Knex;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const environment = this.configService.get('NODE_ENV') || 'development';
    const config = knexConfig[environment];

    this.knexInstance = knex(config);

    // Test the connection
    try {
      await this.knexInstance.raw('SELECT 1');
      console.log('✅ Database connection established successfully');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.knexInstance.destroy();
    console.log('🔌 Database connection closed');
  }

  // Return the Knex instance for use in services
  get instance(): Knex {
    return this.knexInstance;
  }

  // Convenience method to get a query builder
  query(tableName: string): Knex.QueryBuilder {
    return this.knexInstance(tableName);
  }

  // Raw query method
  raw(sql: string, bindings?: any): Knex.Raw {
    return this.knexInstance.raw(sql, bindings);
  }

  // Transaction method
  async transaction<T>(
    callback: (trx: Knex.Transaction) => Promise<T>,
  ): Promise<T> {
    return this.knexInstance.transaction(callback);
  }
}
