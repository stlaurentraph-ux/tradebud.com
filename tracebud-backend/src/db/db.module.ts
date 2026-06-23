import { Module } from '@nestjs/common';
import { setDefaultResultOrder } from 'node:dns';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { buildPgPoolConfig, collectDatabaseUrlWarnings } from './pg-pool-config';
import { assertProdDatabaseUrl } from './supabase-db-refs';
import { PgPoolShutdownService } from './pg-pool-shutdown.service';

export const DRIZZLE = Symbol('DRIZZLE');
export const PG_POOL = Symbol('PG_POOL');

// Railway and some hosts cannot reach Supabase direct `db.*` IPv6 endpoints.
setDefaultResultOrder('ipv4first');

function createPgPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString?.trim()) {
    throw new Error('DATABASE_URL is not configured.');
  }

  if (process.env.NODE_ENV === 'production') {
    assertProdDatabaseUrl(connectionString);
  }

  for (const warning of collectDatabaseUrlWarnings(connectionString)) {
    console.warn(`[pg] ${warning}`);
  }

  const pool = new Pool(buildPgPoolConfig(connectionString));

  // Idle clients dropped by Supabase pooler must not take down the process.
  pool.on('error', (err) => {
    console.error('[pg] idle client error:', err.message);
  });

  return pool;
}

@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () => createPgPool(),
    },
    {
      provide: DRIZZLE,
      useFactory: (pool: Pool) => {
        return drizzle(pool, { schema });
      },
      inject: [PG_POOL],
    },
    PgPoolShutdownService,
  ],
  exports: [DRIZZLE, PG_POOL],
})
export class DbModule {}
