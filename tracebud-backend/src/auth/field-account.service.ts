import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { createSupabaseServerClient } from './supabase-server.client';

export const MIN_FIELD_ACCOUNT_PASSWORD_LENGTH = 8;

function userHasEmailIdentity(user: User | null | undefined): boolean {
  return (user?.identities ?? []).some((identity) => identity.provider === 'email');
}

@Injectable()
export class FieldAccountService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async setPasswordForAuthUser(userId: string, password: string): Promise<void> {
    const trimmed = password.trim();
    if (!trimmed || trimmed.length < MIN_FIELD_ACCOUNT_PASSWORD_LENGTH) {
      throw new BadRequestException(
        `Password must be at least ${MIN_FIELD_ACCOUNT_PASSWORD_LENGTH} characters.`,
      );
    }

    const supabase = this.createServiceRoleClient();
    const { data: before, error: beforeError } = await supabase.auth.admin.getUserById(userId);
    if (beforeError || !before.user) {
      throw new BadRequestException(beforeError?.message ?? 'Authenticated user not found.');
    }

    const email = before.user.email?.trim();
    if (!email) {
      throw new BadRequestException('This account has no email address for password sign-in.');
    }

    // Password-only admin updates do not create an email identity for OAuth-only users.
    // Include email + email_confirm so GoTrue creates the email provider identity.
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: trimmed,
      email,
      email_confirm: true,
    });
    if (error) {
      throw new BadRequestException(error.message);
    }

    await this.enablePasswordSignInForAuthUser(userId);

    const { data: after, error: afterError } = await supabase.auth.admin.getUserById(userId);
    if (afterError || !after.user) {
      throw new InternalServerErrorException('Password saved but account verification failed.');
    }
    if (!userHasEmailIdentity(after.user)) {
      throw new InternalServerErrorException(
        'Password saved but email sign-in is not ready yet. Try again in a moment.',
      );
    }

    await this.verifyPasswordSignIn(email, trimmed);
  }

  /** Repair OAuth-only accounts that already have a password hash but no email identity. */
  async ensureEmailIdentityForAuthUser(userId: string): Promise<void> {
    const supabase = this.createServiceRoleClient();
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data.user) {
      throw new BadRequestException(error?.message ?? 'Authenticated user not found.');
    }

    const email = data.user.email?.trim();
    if (!email) {
      throw new BadRequestException('This account has no email address for password sign-in.');
    }
    if (userHasEmailIdentity(data.user)) {
      await this.enablePasswordSignInForAuthUser(userId);
      return;
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    });
    if (updateError) {
      throw new BadRequestException(updateError.message);
    }

    await this.enablePasswordSignInForAuthUser(userId);

    const { data: after, error: afterError } = await supabase.auth.admin.getUserById(userId);
    if (afterError || !after.user || !userHasEmailIdentity(after.user)) {
      throw new InternalServerErrorException(
        'Could not enable email sign-in for this account yet. Try again in a moment.',
      );
    }
  }

  /**
   * Supabase marks Google/Apple-first users as SSO-only; password grant ignores them until cleared.
   */
  private async enablePasswordSignInForAuthUser(userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE auth.users
       SET is_sso_user = false
       WHERE id = $1::uuid
         AND encrypted_password IS NOT NULL
         AND length(encrypted_password) > 0`,
      [userId],
    );
  }

  private async verifyPasswordSignIn(email: string, password: string): Promise<void> {
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
    if (!supabaseUrl || !anonKey) {
      return;
    }

    const supabase = createSupabaseServerClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new InternalServerErrorException(
        'Password saved but email sign-in verification failed. Try again or contact support.',
      );
    }
  }

  private createServiceRoleClient() {
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!supabaseUrl || !serviceRoleKey) {
      throw new InternalServerErrorException(
        'Account password updates are temporarily unavailable.',
      );
    }
    return createSupabaseServerClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
}
