import { Module } from '@nestjs/common';
import { setDefaultResultOrder } from 'node:dns';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { normalizeDatabaseConnectionString, resolvePgSslConfig } from './pg-ssl-config';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');
export const PG_POOL = Symbol('PG_POOL');

// Railway and some hosts cannot reach Supabase direct `db.*` IPv6 endpoints.
setDefaultResultOrder('ipv4first');

function createPgPool(): Pool {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl?.trim()) {
    throw new Error('DATABASE_URL is not configured.');
  }
  const connectionString = normalizeDatabaseConnectionString(rawUrl.trim());

  const pool = new Pool({
    connectionString,
    ssl: resolvePgSslConfig(connectionString),
    max: Number(process.env.PG_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
    options: '-c search_path=public,extensions,integrations,commercial,internal,ops,crm,gtm',
  });

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
  ],
  exports: [DRIZZLE, PG_POOL],
})
export class DbModule {}