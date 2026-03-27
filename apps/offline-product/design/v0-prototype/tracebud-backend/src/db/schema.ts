import {
  boolean,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('user_role', ['farmer', 'agent', 'exporter', 'viewer']);

export const userAccount = pgTable('user_account', {
  id: uuid('id').primaryKey().defaultRandom(),
  role: roleEnum('role').notNull(),
  ihcafeId: text('ihcafe_id'),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const farmerProfile = pgTable('farmer_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => userAccount.id)
    .notNull(),
  countryCode: text('country_code').notNull(),
  selfDeclared: boolean('self_declared').notNull().default(false),
  selfDeclaredAt: timestamp('self_declared_at', { withTimezone: true }),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const plotStatusEnum = pgEnum('plot_status', [
  'pending_check',
  'compliant',
  'degradation_risk',
  'deforestation_detected',
]);

export const plotKindEnum = pgEnum('plot_kind', ['point', 'polygon']);

export const plot = pgTable('plot', {
  id: uuid('id').primaryKey().defaultRandom(),
  farmerId: uuid('farmer_id')
    .references(() => farmerProfile.id)
    .notNull(),
  name: text('name').notNull(),
  kind: plotKindEnum('kind').notNull(),
  areaHa: numeric('area_ha', { precision: 12, scale: 4 }).notNull(),
  declaredAreaHa: numeric('declared_area_ha', { precision: 12, scale: 4 }),
  areaDiscrepancyPct: numeric('area_discrepancy_pct', { precision: 5, scale: 2 }),
  precisionMetersAtCapture: numeric('precision_m_at_capture', { precision: 6, scale: 2 }),
  hdopAtCapture: numeric('hdop_at_capture', { precision: 4, scale: 2 }),
  sinaphOverlap: boolean('sinaph_overlap').notNull().default(false),
  indigenousOverlap: boolean('indigenous_overlap').notNull().default(false),
  status: plotStatusEnum('status').notNull().default('pending_check'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  userId: uuid('user_id'),
  deviceId: text('device_id'),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
});

