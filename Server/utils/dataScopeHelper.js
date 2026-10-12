/**
 * Utility to resolve user's data scope for a specific permission.
 * Resolves hierarchy: 'ALL' > 'DIVISION' > 'OWN'
 *
 * @param {object} pool - Database pool
 * @param {object} user - req.user object containing id, divisi_id, jabatan_id, etc.
 * @param {string} permissionName - e.g. 'riwayat_aktivitas_view', 'survey_product_view', 'install_project_view'
 * @returns {Promise<{ scope: 'ALL'|'DIVISION'|'OWN', userId: number, divisiId: number, isSuperAdmin: boolean }>}
 */
export async function getUserPermissionScope(pool, user, permissionName) {
  if (!user || !user.id) {
    return { scope: 'OWN', userId: null, divisiId: null, isSuperAdmin: false };
  }

  // Cek apakah user adalah Super Admin (selalu ALL)
  const userRole = (user.role || '').toLowerCase();
  const jabatanId = Number(user.jabatan_id || 0);

  if (jabatanId === 1 || userRole === 'superadmin' || userRole === 'super admin') {
    return { scope: 'ALL', userId: user.id, divisiId: user.divisi_id || null, isSuperAdmin: true };
  }

  // Ambil detail divisi dan nama jabatan user jika belum lengkap di req.user
  let divisiId = user.divisi_id || null;
  if (divisiId === null || divisiId === undefined) {
    const uRes = await pool.query('SELECT divisi_id, jabatan_id, role FROM users WHERE id = $1', [user.id]);
    if (uRes.rows.length > 0) {
      divisiId = uRes.rows[0].divisi_id;
      const r = (uRes.rows[0].role || '').toLowerCase();
      if (Number(uRes.rows[0].jabatan_id) === 1 || r === 'superadmin' || r === 'super admin') {
        return { scope: 'ALL', userId: user.id, divisiId, isSuperAdmin: true };
      }
    }
  }

  // 1. Cek User direct bypass (Prioritas Tertinggi: Pengecualian Spesifik User)
  try {
    const userDirectRes = await pool.query(
      `SELECT COALESCE(up.data_scope, 'ALL') as data_scope
       FROM user_permissions up
       JOIN permissions p ON p.id = up.permission_id
       WHERE up.user_id = $1 AND p.nama_permission = $2
       LIMIT 1`,
      [user.id, permissionName]
    );

    if (userDirectRes.rows.length > 0) {
      return { scope: userDirectRes.rows[0].data_scope, userId: user.id, divisiId, isSuperAdmin: false };
    }

    // 2. Cek Jabatan & Additional Roles (Prioritas Kedua)
    const jabatanRes = await pool.query(
      `SELECT 
         CASE 
           WHEN bool_or(jp.data_scope = 'ALL') THEN 'ALL'
           WHEN bool_or(jp.data_scope = 'DIVISION') THEN 'DIVISION'
           ELSE 'OWN'
         END as resolved_scope
       FROM jabatan_permissions jp
       JOIN permissions p ON p.id = jp.permission_id
       WHERE (
         jp.jabatan_id = (SELECT jabatan_id FROM users WHERE id = $1)
         OR jp.jabatan_id IN (SELECT jabatan_id FROM user_additional_roles WHERE user_id = $1)
       ) AND (jp.divisi_id = (SELECT divisi_id FROM users WHERE id = $1) OR jp.divisi_id IS NULL) AND p.nama_permission = $2`,
      [user.id, permissionName]
    );

    if (jabatanRes.rows.length > 0 && jabatanRes.rows[0].resolved_scope) {
      return { scope: jabatanRes.rows[0].resolved_scope, userId: user.id, divisiId, isSuperAdmin: false };
    }

    // 3. Fallback jika user punya akses menu via divisi_permissions (lingkup Divisinya sendiri)
    const divisiPermRes = await pool.query(
      `SELECT 1 FROM divisi_permissions dp
       JOIN permissions p ON p.id = dp.permission_id
       WHERE dp.divisi_id = $1 AND p.nama_permission = $2
       LIMIT 1`,
      [divisiId || 0, permissionName]
    );

    if (divisiPermRes.rows.length > 0) {
      return { scope: 'DIVISION', userId: user.id, divisiId, isSuperAdmin: false };
    }

    return { scope: 'OWN', userId: user.id, divisiId, isSuperAdmin: false };
  } catch (err) {
    console.error(`Error resolving permission scope for ${permissionName}:`, err);
    return { scope: 'ALL', userId: user.id, divisiId, isSuperAdmin: false };
  }
}
