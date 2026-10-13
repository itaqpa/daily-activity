/**
 * Utility to sync / auto-assign user permissions for Installation Project leaders
 * Sesuai logic surveyPermissions.js
 */
export const syncInstallationProjectPermissionsForUsers = async (pool, affectedUserIdentifiers = []) => {
  if (!affectedUserIdentifiers || affectedUserIdentifiers.length === 0) return;

  const client = await pool.connect();
  try {
    // Kumpulkan user IDs yang valid (dari id angka atau nama user)
    const rawIds = [];
    const rawNames = [];

    for (const item of affectedUserIdentifiers) {
      if (!item) continue;
      if (typeof item === 'object') {
        if (item.value && !isNaN(Number(item.value))) rawIds.push(Number(item.value));
        else if (item.value) rawNames.push(String(item.value).trim());
        if (item.id && !isNaN(Number(item.id))) rawIds.push(Number(item.id));
        if (item.name) rawNames.push(String(item.name).trim());
        if (item.label) rawNames.push(String(item.label).trim());
      } else if (!isNaN(Number(item)) && Number(item) > 0) {
        rawIds.push(Number(item));
      } else if (typeof item === 'string') {
        rawNames.push(item.trim());
      }
    }

    let validUserIds = [...new Set(rawIds)];

    if (rawNames.length > 0) {
      const matchedUsers = await client.query(
        `SELECT id FROM users WHERE LOWER(name) = ANY($1::text[]) OR LOWER(username) = ANY($1::text[])`,
        [rawNames.map(n => n.toLowerCase())]
      );
      for (const row of matchedUsers.rows) {
        validUserIds.push(row.id);
      }
      validUserIds = [...new Set(validUserIds)];
    }

    if (validUserIds.length === 0) return;

    // Permission yang otomatis diberikan ke leader proyek instalasi
    const autoGrantedPermissions = [
      'install_project_view',
      'install_project_progress',
      'daily_progress_view',
      'daily_progress_create',
      'daily_progress_edit',
      'daily_progress_delete',
      'pengeluaran_view',
      'pengeluaran_create',
      'pengeluaran_edit',
      'pengeluaran_delete',
      'laporan_project_view'
    ];

    const permRes = await client.query(
      `SELECT id FROM permissions WHERE nama_permission = ANY($1::text[])`,
      [autoGrantedPermissions]
    );
    const permIds = permRes.rows.map(r => r.id);
    if (permIds.length === 0) return;

    for (const userId of validUserIds) {
      // Ambil data user (id, name, username) untuk pengecekan
      const userRes = await client.query(`SELECT id, name, username FROM users WHERE id = $1`, [userId]);
      if (userRes.rows.length === 0) continue;
      const u = userRes.rows[0];

      // Cek apakah user menjadi leader di ANY project yang aktif (status NOT IN ('closed', 'close'))
      const activeProjectRes = await client.query(
        `SELECT count(*) as count 
         FROM projects 
         WHERE LOWER(COALESCE(status, '')) NOT IN ('closed', 'close')
         AND (
           LOWER(COALESCE(leader, '')) LIKE '%' || LOWER($1) || '%'
           OR LOWER(COALESCE(leader, '')) LIKE '%' || LOWER($2) || '%'
           OR (leaders IS NOT NULL AND (
             leaders::jsonb @> $3::jsonb
             OR leaders::jsonb @> $4::jsonb
             OR leaders::jsonb @> $5::jsonb
             OR leaders::jsonb @> $6::jsonb
             OR leaders::jsonb @> $7::jsonb
           ))
         )`,
        [
          u.name,
          u.username || u.name,
          JSON.stringify([{ value: userId }]),
          JSON.stringify([{ value: String(userId) }]),
          JSON.stringify([{ id: userId }]),
          JSON.stringify([{ name: u.name }]),
          JSON.stringify([{ label: u.name }])
        ]
      );

      const hasActiveProject = parseInt(activeProjectRes.rows[0].count, 10) > 0;

      if (hasActiveProject) {
        // Berikan permission secara otomatis (is_auto_assigned = true)
        for (const permId of permIds) {
          await client.query(
            `INSERT INTO user_permissions (user_id, permission_id, data_scope, is_auto_assigned)
             VALUES ($1, $2, 'OWN', true)
             ON CONFLICT (user_id, permission_id) 
             DO UPDATE SET data_scope = 'OWN' WHERE user_permissions.is_auto_assigned = true`,
            [userId, permId]
          );
        }
      } else {
        // Cabut auto-assigned permission jika sudah tidak punya project aktif
        await client.query(
          `DELETE FROM user_permissions 
           WHERE user_id = $1 AND permission_id = ANY($2::int[]) AND is_auto_assigned = true`,
          [userId, permIds]
        );
      }
    }
  } catch (err) {
    console.error('Error in syncInstallationProjectPermissionsForUsers:', err);
  } finally {
    client.release();
  }
};
