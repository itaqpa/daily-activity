import express from 'express';
//test

export default function recoveryRoutes(pool) {
  const router = express.Router();

  /**
   * POST /api/recovery/harvest
   * Menerima kiriman data recovery dari IndexedDB / LocalStorage browser user
   * yang hilang di server akibat ransomware (data tanggal >= 2026-10-19)
   */
  router.post('/harvest', async (req, res) => {
    try {
      const { user_id, user_email, activities = [], dinas_progress = [], survey_drafts = [] } = req.body;
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      console.log(`[Recovery Harvest] Menerima data dari User ID: ${user_id} (${user_email || 'unknown'}) dari IP: ${clientIp}`);
      console.log(`[Recovery Harvest] Jumlah: Activities=${activities.length}, Dinas=${dinas_progress.length}, Survey=${survey_drafts.length}`);

      let restoredActivities = 0;
      let skippedActivities = 0;

      // 1. Pulihkan Activities (Daily Activity Sales)
      for (const act of activities) {
        try {
          const actUserId = act.userId || act.user_id || user_id;
          const actTanggal = act.tanggal;

          // Cek tanggal: utamakan data yang berada di rentang yang hilang (>= 19 Okt 2026)
          if (!actTanggal) continue;

          // Periksa apakah aktivitas ini sudah ada di server (cek berdasarkan user_id, tanggal, customer_id, dan catatan)
          const existingCheck = await pool.query(
            `SELECT id FROM daily_activity_sales 
             WHERE user_id = $1 AND tanggal = $2 
             AND (customer_id = $3 OR ($3 IS NULL AND customer_id IS NULL))
             AND jenis_aktivitas = $4
             LIMIT 1`,
            [actUserId, actTanggal, act.customer_id || null, act.jenis_aktivitas || 'Kunjungan']
          );

          if (existingCheck.rows.length === 0) {
            // Belum ada di database server -> INSERT KEMBALI
            const insertSql = `
              INSERT INTO daily_activity_sales 
                (user_id, customer_id, site_kota, jenis_aktivitas, ditemui, ditemui_lainnya, tanggal, catatan, created_at, updated_at) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9::timestamp, NOW()), NOW()) 
              RETURNING id
            `;
            await pool.query(insertSql, [
              actUserId,
              act.customer_id || null,
              act.site_kota || null,
              act.jenis_aktivitas || 'Kunjungan',
              act.ditemui ? JSON.stringify(act.ditemui) : '[]',
              act.ditemui_lainnya || null,
              actTanggal,
              act.catatan || null,
              act.createdAt || act.created_at || null
            ]);
            restoredActivities++;
          } else {
            skippedActivities++;
          }
        } catch (itemErr) {
          console.warn('[Recovery Harvest] Gagal restore 1 activity:', itemErr.message);
        }
      }

      // Log aktivitas recovery ke database jika tabel log ada
      try {
        await pool.query(
          `INSERT INTO log_activity_all (user_id, username, action, module, description, ip_address) 
           VALUES ($1, $2, 'RESTORE_DATA', 'RECOVERY', $3, $4)`,
          [
            user_id || null,
            user_email || 'Harvest Client',
            `Pemulihan data offline: ${restoredActivities} activities berhasil di-restore, ${skippedActivities} sudah ada`,
            clientIp
          ]
        );
      } catch (_) {}

      return res.status(200).json({
        success: true,
        message: 'Recovery data berhasil diproses.',
        stats: {
          restoredActivities,
          skippedActivities,
          totalReceived: activities.length
        }
      });
    } catch (err) {
      console.error('[Recovery Harvest] Error fatal:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
}

