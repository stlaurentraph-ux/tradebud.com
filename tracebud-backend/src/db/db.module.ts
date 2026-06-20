import { Module } from '@nestjs/common';
import { setDefaultResultOrder } from 'node:dns';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');
export const PG_POOL = Symbol('PG_POOL');

// Railway and some hosts cannot reach Supabase direct `db.*` IPv6 endpoints.
setDefaultResultOrder('ipv4first');

@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () => {
        return new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false,
          },
          options: '-c search_path=public,integrations,commercial,internal,ops,crm,gtm',
        });
      },
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