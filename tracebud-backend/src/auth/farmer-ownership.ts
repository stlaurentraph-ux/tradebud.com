import { Pool } from 'pg';

/**
 * True when the authenticated user may act on farmerId in field-app scope.
 * Allows first-time sync when farmerId equals auth uid before farmer_profile exists.
 */
export async function isFarmerProfileOwnedByUser(
  pool: Pool,
  farmerId: string,
  userId: string,
): Promise<boolean> {
  const direct = await pool.query(
    `
      SELECT 1
      FROM farmer_profile
      WHERE id = $1::uuid
        AND user_id = $2::uuid
      LIMIT 1
    `,
    [farmerId, userId],
  );
  if ((direct.rowCount ?? 0) > 0) {
    return true;
  }

  if (farmerId !== userId) {
    return false;
  }

  const otherProfile = await pool.query(
    `
      SELECT 1
      FROM farmer_profile
      WHERE user_id = $1::uuid
        AND id <> $2::uuid
      LIMIT 1
    `,
    [userId, farmerId],
  );
  if ((otherProfile.rowCount ?? 0) > 0) {
    return false;
  }

  return true;
}

/**
 * Links an offline device farmer_profile (user_id = id) to the signed-in Supabase user.
 * Safe to call on every field-app-bootstrap; no-op when already claimed or owned elsewhere.
 */
export async function claimSelfLinkedFarmerProfileForAuthUser(
  pool: Pool,
  farmerId: string,
  authUserId: string,
): Promise<boolean> {
  const trimmedFarmerId = farmerId.trim();
  const trimmedAuthUserId = authUserId.trim();
  if (!trimmedFarmerId || !trimmedAuthUserId) {
    return false;
  }
  if (trimmedFarmerId === trimmedAuthUserId) {
    return false;
  }

  const existing = await pool.query<{ user_id: string }>(
    `
      SELECT user_id::text AS user_id
      FROM farmer_profile
      WHERE id = $1::uuid
      LIMIT 1
    `,
    [trimmedFarmerId],
  );
  if ((existing.rowCount ?? 0) === 0) {
    return false;
  }

  const owner = String(existing.rows[0].user_id ?? '').trim();
  if (owner === trimmedAuthUserId) {
    return false;
  }
  if (owner !== trimmedFarmerId) {
    return false;
  }

  await pool.query(
    `
      INSERT INTO user_account (id, role)
      VALUES ($1::uuid, 'farmer')
      ON CONFLICT (id) DO NOTHING
    `,
    [trimmedAuthUserId],
  );

  const updated = await pool.query(
    `
      UPDATE farmer_profile
      SET user_id = $2::uuid
      WHERE id = $1::uuid
        AND user_id = $1::uuid
    `,
    [trimmedFarmerId, trimmedAuthUserId],
  );
  return (updated.rowCount ?? 0) > 0;
}

/** All farmer_profile ids linked to the signed-in Supabase user (field-app scope). */
export async function listFarmerProfileIdsForUser(
  pool: Pool,
  userId: string,
): Promise<string[]> {
  const trimmedUserId = userId.trim();
  if (!trimmedUserId) {
    return [];
  }
  const res = await pool.query<{ id: string }>(
    `
      SELECT id::text AS id
      FROM farmer_profile
      WHERE user_id = $1::uuid
      ORDER BY id
    `,
    [trimmedUserId],
  );
  return res.rows.map((row) => String(row.id));
}
