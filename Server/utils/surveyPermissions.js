export const syncSurveyPermissionsForUsers = async (pool, affectedUserIds = []) => {
  if (!affectedUserIds || affectedUserIds.length === 0) return;

  const client = await pool.connect();
  try {
    // Basic survey permissions that are automatically granted
    const autoGrantedPermissions = [
      'survey_product_view',
      'survey_product_edit',
      'survey_product_fill_lapangan',
      'survey_product_fill_summary'
    ];

    const permRes = await client.query(
      `SELECT id FROM permissions WHERE nama_permission = ANY($1::text[])`,
      [autoGrantedPermissions]
    );
    const permIds = permRes.rows.map(r => r.id);

    if (permIds.length === 0) return;

    for (const userId of affectedUserIds) {
      if (!userId) continue;

      // Check if user is involved in ANY active survey
      // status NOT IN ('Selesai', 'Batal', 'Draft')
      const activeSurveyRes = await client.query(
        `SELECT count(*) as count 
         FROM survey_product_data 
         WHERE status NOT IN ('Selesai', 'Batal', 'Draft')
         AND (
           leader_surveyor_id = $1 
           OR (leader_surveyor::jsonb @> $2::jsonb)
           OR (anggota_surveyor::jsonb @> $2::jsonb)
           OR (leader_surveyor::jsonb @> $3::jsonb)
           OR (anggota_surveyor::jsonb @> $3::jsonb)
         )`,
        [userId, JSON.stringify([{ value: userId }]), JSON.stringify([{ id: userId }])]
      );

      const hasActiveSurvey = parseInt(activeSurveyRes.rows[0].count, 10) > 0;

      if (hasActiveSurvey) {
        // Grant permissions as auto-assigned (if not already granted manually)
        for (const permId of permIds) {
          await client.query(
            `INSERT INTO user_permissions (user_id, permission_id, is_auto_assigned)
             VALUES ($1, $2, true)
             ON CONFLICT (user_id, permission_id) DO NOTHING`,
            [userId, permId]
          );
        }
      } else {
        // Revoke auto-assigned permissions
        await client.query(
          `DELETE FROM user_permissions 
           WHERE user_id = $1 AND permission_id = ANY($2::int[]) AND is_auto_assigned = true`,
          [userId, permIds]
        );
      }
    }
  } catch (err) {
    console.error('Error in syncSurveyPermissionsForUsers:', err);
  } finally {
    client.release();
  }
};
