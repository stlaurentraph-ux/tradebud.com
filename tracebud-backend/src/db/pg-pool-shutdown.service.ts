import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from './db.module';

@Injectable()
export class PgPoolShutdownService implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
