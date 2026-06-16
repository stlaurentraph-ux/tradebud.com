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
