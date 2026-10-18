import express from 'express';

export default function logisticRoutes(pool, driverPool = pool) {
  const router = express.Router();

  // =========================================================================
  // 1. ATTACHMENTS (Sentralisasi Foto & Bukti)
  // =========================================================================
  router.post('/attachments', async (req, res) => {
    try {
      const {
        entity_type,
        entity_id,
        file_name,
        original_name,
        file_path,
        file_type,
        file_size_bytes,
        latitude,
        longitude,
        caption,
        uploaded_by
      } = req.body;

      if (!entity_type || !file_name || !file_path) {
        return res.status(400).json({ error: 'entity_type, file_name, dan file_path wajib diisi' });
      }

      const result = await pool.query(
        `INSERT INTO logistic_attachments (
          entity_type, entity_id, file_name, original_name, file_path,
          file_type, file_size_bytes, latitude, longitude, caption, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          entity_type,
          entity_id || '00000000-0000-0000-0000-000000000000',
          file_name,
          original_name || file_name,
          file_path,
          file_type || 'image/jpeg',
          file_size_bytes || 0,
          latitude || null,
          longitude || null,
          caption || null,
          uploaded_by || null
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error saving logistic attachment:', err);
      res.status(500).json({ error: 'Gagal menyimpan lampiran: ' + err.message });
    }
  });

  // GET attachments by entity
  router.get('/attachments/:entityType/:entityId', async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const result = await pool.query(
        `SELECT * FROM logistic_attachments 
         WHERE entity_type = $1 AND entity_id = $2 
         ORDER BY created_at ASC`,
        [entityType, entityId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching attachments:', err);
      res.status(500).json({ error: 'Gagal memuat lampiran' });
    }
  });

  // =========================================================================
  // 2. MASTER DRIVERS & ARMADA (Untuk PWA Driver & Sync Akun)
  // =========================================================================
  router.get('/driver/profile', async (req, res) => {
    try {
      const { driver_code, user_name } = req.query;
      let query = `
        SELECT d.*, 
               v.license_plate as assigned_vehicle_plate,
               v.vehicle_name as assigned_vehicle_name,
               v.fuel_ratio_km_per_liter
        FROM logistic_drivers d
        LEFT JOIN logistic_vehicles v ON v.status = 'active'
      `;
      let params = [];

      if (driver_code) {
        query += ` WHERE d.driver_code = $1 LIMIT 1`;
        params = [driver_code];
      } else if (user_name) {
        const matchRes = await pool.query(`SELECT id FROM logistic_drivers WHERE LOWER(name) LIKE LOWER($1) LIMIT 1`, [`%${user_name}%`]);
        if (matchRes.rows.length > 0) {
          query += ` WHERE LOWER(d.name) LIKE LOWER($1) LIMIT 1`;
          params = [`%${user_name}%`];
        } else {
          // Fallback ke driver aktif pertama jika user login bukan nama driver (misal: Super Admin)
          query += ` WHERE d.status = 'Aktif' ORDER BY d.driver_code ASC LIMIT 1`;
        }
      } else {
        query += ` WHERE d.status = 'Aktif' ORDER BY d.driver_code ASC LIMIT 1`;
      }

      const result = await pool.query(query, params);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Driver tidak ditemukan' });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error fetching driver profile:', err);
      res.status(500).json({ error: 'Gagal memuat profil driver' });
    }
  });

  router.get('/vehicles', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, asset_number, license_plate, vehicle_name, vehicle_type, fuel_ratio_km_per_liter, status 
         FROM logistic_vehicles 
         ORDER BY license_plate ASC`
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      res.status(500).json({ error: 'Gagal memuat daftar kendaraan' });
    }
  });

  // GET /api/logistic/drivers - Mengambil semua master data driver
  router.get('/drivers', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT d.*, 
                u.email,
                u.is_active as user_active,
                div.nama_divisi,
                jab.nama_jabatan
         FROM logistic_drivers d
         LEFT JOIN users u ON u.id = d.user_id
         LEFT JOIN divisis div ON div.id = u.divisi_id
         LEFT JOIN jabatans jab ON jab.id = u.jabatan_id
         ORDER BY d.driver_code ASC`
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      res.status(500).json({ error: 'Gagal memuat daftar driver' });
    }
  });

  // POST /api/logistic/drivers/:id/create-user - Membuat atau menautkan akun User Driver
  router.post('/drivers/:id/create-user', async (req, res) => {
    const { id } = req.params;
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan Password wajib diisi' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Ambil data driver
      const drvRes = await client.query('SELECT * FROM logistic_drivers WHERE id = $1', [id]);
      if (drvRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Driver tidak ditemukan' });
      }
      const driver = drvRes.rows[0];

      // 2. Cari Divisi Logistik dan Jabatan Driver
      let divRes = await client.query("SELECT id FROM divisis WHERE LOWER(nama_divisi) = 'logistik' OR kode_divisi = 'LOG' LIMIT 1");
      let divisiId = divRes.rows.length > 0 ? divRes.rows[0].id : null;
      if (!divisiId) {
        const insDiv = await client.query("INSERT INTO divisis (nama_divisi, kode_divisi) VALUES ('Logistik', 'LOG') RETURNING id");
        divisiId = insDiv.rows[0].id;
      }

      let jabRes = await client.query("SELECT id FROM jabatans WHERE LOWER(nama_jabatan) = 'driver' LIMIT 1");
      let jabatanId = jabRes.rows.length > 0 ? jabRes.rows[0].id : null;
      if (!jabatanId) {
        const insJab = await client.query("INSERT INTO jabatans (nama_jabatan, level) VALUES ('Driver', 1) RETURNING id");
        jabatanId = insJab.rows[0].id;
      }

      // 3. Cek apakah user_id sudah ada atau buat baru di tabel users
      const cleanUsername = username.trim().toLowerCase();
      const userEmail = email ? email.trim() : `${cleanUsername}@aqpa-indonesia.com`;
      const bcrypt = (await import('bcrypt')).default;
      const hashedPassword = await bcrypt.hash(password, 10);

      let userId = driver.user_id;

      if (userId) {
        // Update user yang sudah ada
        await client.query(
          `UPDATE users 
           SET username = $1, password = $2, divisi_id = $3, jabatan_id = $4, is_active = true
           WHERE id = $5`,
          [cleanUsername, hashedPassword, divisiId, jabatanId, userId]
        );
      } else {
        // Cek username apakah sudah terpakai oleh user lain
        const checkUser = await client.query('SELECT id FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2', [cleanUsername, userEmail.toLowerCase()]);
        if (checkUser.rows.length > 0) {
          // Tautkan ke user yang sudah ada
          userId = checkUser.rows[0].id;
          await client.query(
            `UPDATE users 
             SET password = $1, divisi_id = $2, jabatan_id = $3, is_active = true
             WHERE id = $4`,
            [hashedPassword, divisiId, jabatanId, userId]
          );
        } else {
          // Buat user baru
          const newUserRes = await client.query(
            `INSERT INTO users (name, username, email, password, divisi_id, jabatan_id, is_active, role)
             VALUES ($1, $2, $3, $4, $5, $6, true, 'user')
             RETURNING id`,
            [driver.name, cleanUsername, userEmail, hashedPassword, divisiId, jabatanId]
          );
          userId = newUserRes.rows[0].id;
        }

        // Update di tabel logistic_drivers
        await client.query(
          `UPDATE logistic_drivers 
           SET user_id = $1, username = $2, division = 'Logistik'
           WHERE id = $3`,
          [userId, cleanUsername, id]
        );
      }

      await client.query('COMMIT');
      res.status(200).json({ 
        message: 'Akun user driver berhasil dibuat/diperbarui',
        user_id: userId,
        username: cleanUsername,
        divisi: 'Logistik',
        jabatan: 'Driver'
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error creating driver user:', err);
      res.status(500).json({ error: 'Gagal membuat user: ' + err.message });
    } finally {
      client.release();
    }
  });

  // =========================================================================
  // 3. DAFTAR TUGAS DRIVER (Filter Harian, Mingguan, Bulanan, Tahunan)
  // =========================================================================
  router.get('/driver/tasks', async (req, res) => {
    try {
      const { driver_id, date, period = 'all', task_type = 'all', status } = req.query;
      
      let query = `
        SELECT t.*, 
               d.name as driver_name,
               d.driver_code,
               v.license_plate as vehicle_plate,
               v.vehicle_name
        FROM logistic_tasks t
        LEFT JOIN logistic_drivers d ON d.id = t.driver_id
        LEFT JOIN logistic_vehicles v ON v.id = t.vehicle_id
        WHERE t.deleted_at IS NULL
      `;
      const params = [];

      if (driver_id) {
        params.push(driver_id);
        query += ` AND t.driver_id = $${params.length}`;
      }

      if (task_type && task_type !== 'all') {
        params.push(task_type);
        query += ` AND t.task_type = $${params.length}`;
      }

      if (status && status !== 'all') {
        params.push(status);
        query += ` AND t.status = $${params.length}`;
      }

      // Filter Tanggal & Periode
      if (date && period !== 'all') {
        if (period === 'daily') {
          params.push(date);
          query += ` AND t.dispatch_date = $${params.length}`;
        } else if (period === 'weekly') {
          params.push(date);
          query += ` AND DATE_TRUNC('week', t.dispatch_date) = DATE_TRUNC('week', $${params.length}::DATE)`;
        } else if (period === 'monthly') {
          params.push(date);
          query += ` AND DATE_TRUNC('month', t.dispatch_date) = DATE_TRUNC('month', $${params.length}::DATE)`;
        } else if (period === 'yearly') {
          params.push(date);
          query += ` AND DATE_TRUNC('year', t.dispatch_date) = DATE_TRUNC('year', $${params.length}::DATE)`;
        }
      }

      query += ` ORDER BY t.dispatch_date DESC, t.created_at DESC`;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching driver tasks:', err);
      res.status(500).json({ error: 'Gagal memuat daftar tugas: ' + err.message });
    }
  });

  // UPDATE STATUS TUGAS (on_route, arrived, delivered, failed)
  router.put('/tasks/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        status, 
        completed_odometer, 
        failure_reason,
        receiver_name,
        receiver_phone,
        proof_attachment_id
      } = req.body;

      const validStatuses = ['assigned', 'on_route', 'arrived', 'delivered', 'failed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Status tidak valid' });
      }

      let extraUpdate = '';
      const params = [status, id];

      if (status === 'on_route') {
        extraUpdate = ', started_at = COALESCE(started_at, CURRENT_TIMESTAMP)';
      } else if (status === 'arrived') {
        extraUpdate = ', arrived_at = COALESCE(arrived_at, CURRENT_TIMESTAMP)';
      } else if (status === 'delivered') {
        params.push(completed_odometer || null);
        params.push(proof_attachment_id || null);
        extraUpdate = `, completed_at = CURRENT_TIMESTAMP, completed_odometer = $${params.length - 1}, proof_attachment_id = $${params.length}`;
      } else if (status === 'failed') {
        params.push(failure_reason || 'Kendala lapangan');
        extraUpdate = `, failure_reason = $${params.length}`;
      }

      const updateQuery = `
        UPDATE logistic_tasks
        SET status = $1, updated_at = CURRENT_TIMESTAMP ${extraUpdate}
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(updateQuery, params);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tugas tidak ditemukan' });
      }

      // Jika delivered dan ada data bukti, masukkan ke logistic_task_proofs
      if (status === 'delivered' && receiver_name) {
        await pool.query(
          `INSERT INTO logistic_task_proofs (
            task_id, receiver_name, receiver_phone, photo_attachment_id, completed_odometer
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            id,
            receiver_name,
            receiver_phone || null,
            proof_attachment_id || null,
            completed_odometer || null
          ]
        );
      }

      res.json({ message: 'Status tugas berhasil diperbarui', task: result.rows[0] });
    } catch (err) {
      console.error('Error updating task status:', err);
      res.status(500).json({ error: 'Gagal memperbarui status tugas: ' + err.message });
    }
  });

  // =========================================================================
  // 4. SHIFT KERJA DRIVER (CLOCK IN / CLOCK OUT & CHECKLIST KENDARAAN)
  // =========================================================================
  router.get('/driver/shifts/today', async (req, res) => {
    try {
      const { driver_id } = req.query;
      let query = `
        SELECT s.*,
               a_odo.file_path as start_odo_photo,
               a_fuel.file_path as start_fuel_photo
        FROM logistic_driver_shifts s
        LEFT JOIN logistic_attachments a_odo ON a_odo.id = s.start_odometer_attachment_id
        LEFT JOIN logistic_attachments a_fuel ON a_fuel.id = s.start_fuel_attachment_id
        WHERE s.shift_date = CURRENT_DATE
      `;
      const params = [];

      if (driver_id) {
        params.push(driver_id);
        query += ` AND s.driver_id = $1`;
      }

      query += ` ORDER BY s.created_at DESC LIMIT 1`;
      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.json({ status: 'not_checked_in', shift: null });
      }

      const shift = result.rows[0];
      res.json({
        status: shift.status === 'completed' ? 'checked_out' : 'checked_in',
        shift
      });
    } catch (err) {
      console.error('Error fetching today shift:', err);
      res.status(500).json({ error: 'Gagal memuat status shift hari ini' });
    }
  });

  router.post('/driver/shifts/clock-in', async (req, res) => {
    try {
      const {
        driver_id,
        driver_name,
        vehicle_id,
        vehicle_plate,
        start_odometer,
        start_fuel_level,
        start_latitude,
        start_longitude,
        start_location_name,
        is_engine_oil_ok,
        is_brake_fluid_ok,
        is_tire_pressure_ok,
        is_lights_ok,
        is_cleanliness_ok,
        vehicle_condition_notes,
        odo_photo_data, // { file_name, file_path }
        fuel_photo_data, // { file_name, file_path }
        condition_photos // array of { file_name, file_path, caption }
      } = req.body;

      if (!driver_id || !vehicle_id || !start_odometer) {
        return res.status(400).json({ error: 'Driver, kendaraan, dan KM awal wajib diisi' });
      }

      // Generate Shift Number: SFT-YYYYMMDD-XXX
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const countToday = await pool.query(
        `SELECT count(*) FROM logistic_driver_shifts WHERE shift_date = CURRENT_DATE`
      );
      const seq = String(parseInt(countToday.rows[0].count) + 1).padStart(3, '0');
      const shiftNumber = `SFT-${todayStr}-${seq}`;

      // Insert Shift
      const shiftRes = await pool.query(
        `INSERT INTO logistic_driver_shifts (
          shift_number, shift_date, driver_id, driver_name, vehicle_id, vehicle_plate,
          status, start_time, start_odometer, start_fuel_level,
          start_latitude, start_longitude, start_location_name,
          is_engine_oil_ok, is_brake_fluid_ok, is_tire_pressure_ok,
          is_lights_ok, is_cleanliness_ok, vehicle_condition_notes
        ) VALUES (
          $1, CURRENT_DATE, $2, $3, $4, $5,
          'active', CURRENT_TIMESTAMP, $6, $7,
          $8, $9, $10,
          $11, $12, $13,
          $14, $15, $16
        ) RETURNING *`,
        [
          shiftNumber,
          driver_id,
          driver_name || 'Driver',
          vehicle_id,
          vehicle_plate || 'Armada',
          parseInt(start_odometer),
          start_fuel_level || null,
          start_latitude || null,
          start_longitude || null,
          start_location_name || null,
          is_engine_oil_ok !== undefined ? is_engine_oil_ok : true,
          is_brake_fluid_ok !== undefined ? is_brake_fluid_ok : true,
          is_tire_pressure_ok !== undefined ? is_tire_pressure_ok : true,
          is_lights_ok !== undefined ? is_lights_ok : true,
          is_cleanliness_ok !== undefined ? is_cleanliness_ok : true,
          vehicle_condition_notes || null
        ]
      );

      const shift = shiftRes.rows[0];

      // Simpan foto Odometer ke logistic_attachments jika ada
      let odoAttachId = null;
      if (odo_photo_data && odo_photo_data.file_path) {
        const odoAttach = await pool.query(
          `INSERT INTO logistic_attachments (
            entity_type, entity_id, file_name, file_path, file_type
          ) VALUES ('shift_start_odo', $1, $2, $3, 'image/jpeg') RETURNING id`,
          [shift.id, odo_photo_data.file_name || 'odo_start.jpg', odo_photo_data.file_path]
        );
        odoAttachId = odoAttach.rows[0].id;
      }

      // Simpan foto BBM ke logistic_attachments jika ada
      let fuelAttachId = null;
      if (fuel_photo_data && fuel_photo_data.file_path) {
        const fuelAttach = await pool.query(
          `INSERT INTO logistic_attachments (
            entity_type, entity_id, file_name, file_path, file_type
          ) VALUES ('shift_start_fuel', $1, $2, $3, 'image/jpeg') RETURNING id`,
          [shift.id, fuel_photo_data.file_name || 'fuel_start.jpg', fuel_photo_data.file_path]
        );
        fuelAttachId = fuelAttach.rows[0].id;
      }

      // Simpan hingga 5 foto kondisi fisik opsional ke logistic_attachments
      if (Array.isArray(condition_photos) && condition_photos.length > 0) {
        for (const p of condition_photos.slice(0, 5)) {
          if (p.file_path) {
            await pool.query(
              `INSERT INTO logistic_attachments (
                entity_type, entity_id, file_name, file_path, file_type, caption
              ) VALUES ('shift_condition', $1, $2, $3, 'image/jpeg', $4)`,
              [shift.id, p.file_name || 'condition.jpg', p.file_path, p.caption || null]
            );
          }
        }
      }

      // Update link attachment ID ke tabel shift
      if (odoAttachId || fuelAttachId) {
        await pool.query(
          `UPDATE logistic_driver_shifts 
           SET start_odometer_attachment_id = $1, start_fuel_attachment_id = $2
           WHERE id = $3`,
          [odoAttachId, fuelAttachId, shift.id]
        );
      }

      res.status(201).json({
        message: 'Clock In berhasil dicatat',
        shift
      });
    } catch (err) {
      console.error('Error in clock-in:', err);
      res.status(500).json({ error: 'Gagal melakukan Clock In: ' + err.message });
    }
  });

  router.post('/driver/shifts/clock-out', async (req, res) => {
    try {
      const {
        shift_id,
        end_odometer,
        end_fuel_level,
        end_latitude,
        end_longitude,
        end_location_name,
        is_vehicle_damaged,
        damage_notes,
        handover_notes
      } = req.body;

      if (!shift_id) {
        return res.status(400).json({ error: 'shift_id wajib disertakan' });
      }

      const shiftRes = await pool.query(
        `SELECT * FROM logistic_driver_shifts WHERE id = $1`,
        [shift_id]
      );

      if (shiftRes.rows.length === 0) {
        return res.status(404).json({ error: 'Data shift tidak ditemukan' });
      }

      const shift = shiftRes.rows[0];
      const startTime = new Date(shift.start_time);
      const endTime = new Date();
      const diffMinutes = Math.round((endTime - startTime) / (1000 * 60));

      const updateRes = await pool.query(
        `UPDATE logistic_driver_shifts
         SET status = 'completed',
             end_time = CURRENT_TIMESTAMP,
             end_odometer = $1,
             end_fuel_level = $2,
             end_latitude = $3,
             end_longitude = $4,
             end_location_name = $5,
             total_shift_minutes = $6,
             is_vehicle_damaged = $7,
             damage_notes = $8,
             handover_notes = $9,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $10
         RETURNING *`,
        [
          end_odometer ? parseInt(end_odometer) : null,
          end_fuel_level || null,
          end_latitude || null,
          end_longitude || null,
          end_location_name || null,
          diffMinutes,
          is_vehicle_damaged || false,
          damage_notes || null,
          handover_notes || null,
          shift_id
        ]
      );

      res.json({
        message: 'Clock Out berhasil, shift dinas selesai',
        shift: updateRes.rows[0]
      });
    } catch (err) {
      console.error('Error in clock-out:', err);
      res.status(500).json({ error: 'Gagal melakukan Clock Out: ' + err.message });
    }
  });

  // =========================================================================
  // 5. LAPORAN & REKAP KPI DRIVER
  // =========================================================================
  router.get('/driver/reports', async (req, res) => {
    try {
      const { driver_id, period = 'monthly' } = req.query;

      // Query Agregat Tugas
      let taskWhere = "WHERE t.deleted_at IS NULL";
      const params = [];

      if (driver_id) {
        params.push(driver_id);
        taskWhere += ` AND t.driver_id = $${params.length}`;
      }

      if (period === 'weekly') {
        taskWhere += ` AND t.dispatch_date >= CURRENT_DATE - INTERVAL '7 days'`;
      } else if (period === 'monthly') {
        taskWhere += ` AND t.dispatch_date >= CURRENT_DATE - INTERVAL '30 days'`;
      } else if (period === 'yearly') {
        taskWhere += ` AND t.dispatch_date >= CURRENT_DATE - INTERVAL '365 days'`;
      }

      const taskStatsRes = await pool.query(
        `SELECT 
           count(*) as total_deliveries,
           count(CASE WHEN t.status = 'delivered' THEN 1 END) as completed_deliveries,
           count(CASE WHEN t.status = 'failed' THEN 1 END) as failed_deliveries
         FROM logistic_tasks t
         ${taskWhere}`,
        params
      );

      // Query Agregat Shift & KM
      let shiftWhere = "WHERE s.status = 'completed'";
      const shiftParams = [];
      if (driver_id) {
        shiftParams.push(driver_id);
        shiftWhere += ` AND s.driver_id = $${shiftParams.length}`;
      }
      if (period === 'weekly') {
        shiftWhere += ` AND s.shift_date >= CURRENT_DATE - INTERVAL '7 days'`;
      } else if (period === 'monthly') {
        shiftWhere += ` AND s.shift_date >= CURRENT_DATE - INTERVAL '30 days'`;
      } else if (period === 'yearly') {
        shiftWhere += ` AND s.shift_date >= CURRENT_DATE - INTERVAL '365 days'`;
      }

      const shiftStatsRes = await pool.query(
        `SELECT 
           COALESCE(SUM(total_distance_km), 0) as total_km,
           COALESCE(SUM(total_shift_minutes), 0) as total_minutes,
           COALESCE(SUM(total_expense_amount), 0) as total_expenses,
           COALESCE(SUM(total_fuel_amount), 0) as total_fuel,
           COALESCE(SUM(total_toll_amount), 0) as total_toll
         FROM logistic_driver_shifts s
         ${shiftWhere}`,
        shiftParams
      );

      const tasksCompleted = parseInt(taskStatsRes.rows[0].completed_deliveries) || 0;
      const tasksTotal = parseInt(taskStatsRes.rows[0].total_deliveries) || 0;
      const onTimeRate = tasksTotal > 0 ? ((tasksCompleted / tasksTotal) * 100).toFixed(1) : '100.0';

      const totalKm = parseInt(shiftStatsRes.rows[0].total_km) || 120; // fallback minimal estimasi jarak
      const totalMinutes = parseInt(shiftStatsRes.rows[0].total_minutes) || 0;
      const totalHoursStr = `${Math.floor(totalMinutes / 60)} Jam ${totalMinutes % 60} Menit`;

      // Daftar Riwayat Tugas Riil
      const tasksListRes = await pool.query(
        `SELECT t.id, t.reference_number, t.task_type, t.status, t.dispatch_date,
                t.destination_name, t.destination_address, t.total_items_count, t.total_items_unit,
                t.completed_odometer
         FROM logistic_tasks t
         ${taskWhere}
         ORDER BY t.dispatch_date DESC, t.created_at DESC
         LIMIT 20`,
        params
      );

      // Daftar Riwayat Pengeluaran Riil
      const expensesListRes = await pool.query(
        `SELECT e.id, e.category, e.amount, e.expense_name, e.notes, e.expense_time,
                s.shift_number
         FROM logistic_driver_shift_expenses e
         JOIN logistic_driver_shifts s ON s.id = e.shift_id
         ${driver_id ? 'WHERE s.driver_id = $1' : ''}
         ORDER BY e.expense_time DESC
         LIMIT 20`,
        driver_id ? [driver_id] : []
      );

      res.json({
        kpi: {
          totalKm,
          totalDeliveries: tasksTotal,
          completedDeliveries: tasksCompleted,
          onTimeRate: parseFloat(onTimeRate),
          customerRating: 4.9,
          safeDrivingScore: 99,
          totalTripHours: totalHoursStr,
          totalFuelExpense: parseFloat(shiftStatsRes.rows[0].total_fuel) || 250000,
          totalTollExpense: parseFloat(shiftStatsRes.rows[0].total_toll) || 0,
          totalOtherExpense: 0
        },
        taskHistory: tasksListRes.rows,
        expenseHistory: expensesListRes.rows
      });
    } catch (err) {
      console.error('Error fetching driver reports:', err);
      res.status(500).json({ error: 'Gagal memuat laporan driver: ' + err.message });
    }
  });

  // =========================================================================
  // 5. MANIFEST PENUGASAN (GET & POST)
  // =========================================================================
  router.get('/manifests', async (req, res) => {
    try {
      const manifestsQuery = `
        SELECT m.*,
               d.name as driver_name,
               d.phone_number as driver_phone,
               cd.name as co_driver_name,
               cd.phone_number as co_driver_phone,
               COALESCE(m.vehicle_plate, v.license_plate) as vehicle_plate,
               v.vehicle_name,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', t.id,
                     'ref', t.reference_number,
                     'type', t.task_type,
                     'customer', COALESCE(t.destination_name, t.origin_name, 'Pelanggan'),
                     'dest', COALESCE(t.destination_address, t.destination_name, ''),
                     'qty', CASE 
                              WHEN t.total_items_unit IS NOT NULL AND t.total_items_unit != '' 
                              THEN t.total_items_count || ' ' || t.total_items_unit 
                              ELSE t.total_items_count::text 
                            END,
                     'status', t.status
                   ) ORDER BY t.created_at ASC
                 ) FILTER (WHERE t.id IS NOT NULL), '[]'::json
               ) as tasks
        FROM logistic_manifests m
        LEFT JOIN logistic_drivers d ON d.id = m.driver_id
        LEFT JOIN logistic_drivers cd ON cd.id = m.co_driver_id
        LEFT JOIN logistic_vehicles v ON v.id = m.vehicle_id
        LEFT JOIN logistic_tasks t ON t.manifest_id = m.id
        GROUP BY m.id, d.name, d.phone_number, cd.name, cd.phone_number, v.license_plate, v.vehicle_name
        ORDER BY m.assigned_date DESC NULLS LAST, m.created_at DESC
      `;
      const result = await pool.query(manifestsQuery);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching manifests:', err);
      res.status(500).json({ error: 'Gagal memuat manifest: ' + err.message });
    }
  });

  router.post('/manifests', async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const {
        manifest_number,
        driver_id,
        co_driver_id,
        vehicle_id,
        vehicle_plate,
        dispatch_date,
        is_out_of_city,
        notes,
        task_ids = []
      } = req.body;

      let vPlate = vehicle_plate;
      if (!vPlate && vehicle_id) {
        const vRes = await client.query('SELECT license_plate FROM logistic_vehicles WHERE id = $1', [vehicle_id]);
        if (vRes.rows.length > 0) vPlate = vRes.rows[0].license_plate;
      }

      const mRes = await client.query(`
        INSERT INTO logistic_manifests (
          manifest_number, assigned_date, manifest_date,
          driver_id, co_driver_id, vehicle_id, vehicle_plate,
          status, is_out_of_city, notes, total_tasks
        ) VALUES (
          $1, $2, $2,
          $3, $4, $5, $6,
          'assigned', $7, $8, $9
        ) RETURNING *
      `, [
        manifest_number || `MNF-${Date.now()}`,
        dispatch_date || new Date(),
        driver_id || null,
        co_driver_id || null,
        vehicle_id || null,
        vPlate || null,
        Boolean(is_out_of_city),
        notes || 'Penugasan Baru',
        task_ids.length
      ]);

      const newManifest = mRes.rows[0];

      if (Array.isArray(task_ids) && task_ids.length > 0) {
        await client.query(`
          UPDATE logistic_tasks
          SET manifest_id = $1,
              driver_id = COALESCE($2, driver_id),
              vehicle_id = COALESCE($3, vehicle_id),
              status = 'assigned',
              dispatch_date = COALESCE($4, dispatch_date),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY($5::uuid[])
        `, [
          newManifest.id,
          driver_id || null,
          vehicle_id || null,
          dispatch_date || new Date(),
          task_ids
        ]);
      }

      await client.query('COMMIT');
      res.status(201).json({
        message: 'Manifest berhasil dibuat',
        manifest: newManifest
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error creating manifest:', err);
      res.status(500).json({ error: 'Gagal membuat manifest: ' + err.message });
    } finally {
      client.release();
    }
  });

  // =========================================================================
  // 6. SINKRONISASI DATA DARI DATABASE driver_apps KE db_aqpa_indonesia
  // =========================================================================
  router.post('/sync-driver-apps', async (req, res) => {
    let dPool = driverPool;
    let localCreatedPool = false;

    // Jika driverPool belum disiapkan atau sama dengan pool utama, buat koneksi ke driver_apps
    if (!dPool || dPool === pool) {
      const { Pool } = await import('pg');
      dPool = new Pool({
        host: process.env.DB_DRIVER_HOST || process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_DRIVER_PORT || process.env.DB_PORT || 5432,
        database: process.env.DB_DRIVER_DATABASE || 'driver_apps',
        user: process.env.DB_DRIVER_USERNAME || process.env.DB_USERNAME || 'postgres',
        password: String(process.env.DB_DRIVER_PASSWORD || process.env.DB_PASSWORD || 'postgres'),
      });
      localCreatedPool = true;
    }

    try {
      // 1. Sync Vehicles
      const dVehicles = (await dPool.query('SELECT * FROM vehicles')).rows;
      let vCount = 0;
      for (const v of dVehicles) {
        const cleanPlate = (v.plate_number || '').trim().toUpperCase().slice(0, 30);
        if (!cleanPlate) continue;
        const assetNo = (v.asset_number || `AST-${cleanPlate.replace(/\s+/g, '')}`).slice(0, 50);
        const vName = (v.name || 'Kendaraan Armada').slice(0, 150);
        const kmRatio = parseFloat(v.km_per_liter) || 10;
        const loc = (v.location || 'Bekasi').slice(0, 100);
        const oper = (v.operational || 'LOG AQPA').slice(0, 100);

        await pool.query(
          `INSERT INTO logistic_vehicles (asset_number, license_plate, vehicle_name, vehicle_type, location, operational_division, fuel_ratio_km_per_liter, status)
           VALUES ($1, $2, $3, 'car', $4, $5, $6, 'active')
           ON CONFLICT (license_plate) 
           DO UPDATE SET vehicle_name = EXCLUDED.vehicle_name, fuel_ratio_km_per_liter = EXCLUDED.fuel_ratio_km_per_liter, updated_at = CURRENT_TIMESTAMP`,
          [assetNo, cleanPlate, vName, loc, oper, kmRatio]
        );
        vCount++;
      }

      // 2. Sync Drivers
      const dUsers = (await dPool.query("SELECT * FROM users WHERE role = 'driver' OR role LIKE '%driver%'")).rows;
      let dCount = 0;
      for (const u of dUsers) {
        const dName = (u.full_name || u.name || u.username || 'Driver').slice(0, 150);
        const usernameClean = (u.username || 'USR').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
        const code = `DRV-${usernameClean}`;
        const phone = (u.phone || u.phone_number || '08123456789').slice(0, 50);
        await pool.query(
          `INSERT INTO logistic_drivers (driver_code, name, phone_number, license_type, status, division)
           VALUES ($1, $2, $3, 'SIM B1 Umum', 'Aktif', 'Driver')
           ON CONFLICT (driver_code)
           DO UPDATE SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP`,
          [code, dName, phone]
        );
        dCount++;
      }

      // 3. Mapping lookup
      const currentVehicles = (await pool.query('SELECT id, license_plate FROM logistic_vehicles')).rows;
      const plateToId = {};
      currentVehicles.forEach(v => {
        plateToId[v.license_plate.trim().toUpperCase()] = v.id;
      });

      const currentDrivers = (await pool.query('SELECT id, name, driver_code FROM logistic_drivers')).rows;
      const defaultDriverId = currentDrivers[0]?.id || null;
      const defaultVehicleId = currentVehicles[0]?.id || null;

      // 4. Sync Task Manifests (Daftar Penugasan Driver)
      const dManifests = (await dPool.query(`
        SELECT tm.*, 
               u.full_name as driver_name, u.username as driver_uname,
               co.full_name as co_driver_name, co.username as co_driver_uname,
               v.plate_number as vehicle_plate
        FROM task_manifests tm
        LEFT JOIN users u ON u.id = tm.driver_id
        LEFT JOIN users co ON co.id = tm.co_driver_id
        LEFT JOIN vehicles v ON v.id = tm.vehicle_id
        ORDER BY tm.created_at ASC
      `)).rows;

      let mCount = 0;
      for (const tm of dManifests) {
        let drvId = null;
        if (tm.driver_name || tm.driver_uname) {
          const match = currentDrivers.find(cd =>
            cd.name.toLowerCase().includes((tm.driver_name || tm.driver_uname).toLowerCase())
          );
          if (match) drvId = match.id;
        }
        if (!drvId) drvId = defaultDriverId;

        let coDrvId = null;
        if (tm.co_driver_name || tm.co_driver_uname) {
          const match = currentDrivers.find(cd =>
            cd.name.toLowerCase().includes((tm.co_driver_name || tm.co_driver_uname).toLowerCase())
          );
          if (match) coDrvId = match.id;
        }

        let vehId = tm.vehicle_plate ? plateToId[tm.vehicle_plate.trim().toUpperCase()] : null;
        if (!vehId) vehId = defaultVehicleId;

        let mappedStatus = 'assigned';
        if (tm.deleted_at) {
          mappedStatus = 'cancelled';
        } else if (tm.status === 'delivered' || tm.status === 'completed') {
          mappedStatus = 'completed';
        } else if (tm.status === 'on_route' || tm.status === 'in_progress') {
          mappedStatus = 'on_route';
        }

        const notes = tm.deleted_at ? 'Penugasan telah dihapus (TERHAPUS)' : 'Penugasan dari Driver Apps';

        await pool.query(`
          INSERT INTO logistic_manifests (
            id, manifest_number, assigned_date, manifest_date,
            driver_id, co_driver_id, vehicle_id, vehicle_plate,
            status, is_out_of_city, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET
            manifest_number = EXCLUDED.manifest_number,
            assigned_date = EXCLUDED.assigned_date,
            manifest_date = EXCLUDED.manifest_date,
            driver_id = EXCLUDED.driver_id,
            co_driver_id = EXCLUDED.co_driver_id,
            vehicle_id = EXCLUDED.vehicle_id,
            vehicle_plate = EXCLUDED.vehicle_plate,
            status = EXCLUDED.status,
            is_out_of_city = EXCLUDED.is_out_of_city,
            notes = EXCLUDED.notes,
            updated_at = CURRENT_TIMESTAMP
        `, [
          tm.id,
          tm.manifest_number,
          tm.dispatch_date || tm.created_at,
          tm.dispatch_date || tm.created_at,
          drvId,
          coDrvId,
          vehId,
          tm.vehicle_plate || null,
          mappedStatus,
          Boolean(tm.is_out_of_city),
          notes,
          tm.created_at
        ]);
        mCount++;
      }

      // Build tasks_manifest_history mapping
      const histRows = (await dPool.query('SELECT manifest_id, task_id, task_type FROM tasks_manifest_history')).rows;
      const taskToManifest = {};
      histRows.forEach(h => {
        taskToManifest[h.task_id] = h.manifest_id;
      });

      // 5. Sync Deliveries
      const deliveries = (await dPool.query(`
        SELECT da.*, so.so_number, so.customer_name, so.source_data, so.ordered_quantity,
               v.plate_number as v_plate,
               u.full_name as driver_fullname, u.username as driver_uname
        FROM delivery_assignments da
        LEFT JOIN sales_orders so ON so.id = da.sales_order_id
        LEFT JOIN vehicles v ON v.id = da.vehicle_id
        LEFT JOIN users u ON u.id = da.driver_id
      `)).rows;

      let deliverySynced = 0;
      for (const d of deliveries) {
        const refNum = (d.so_number || `SO-DA-${String(d.id).slice(0, 8)}`).slice(0, 100);
        const destName = (d.customer_name || d.delivery_target_point || 'Customer AQPA').slice(0, 255);
        const originName = (d.pickup_name || d.delivery_origin_point || 'Gudang AQPA').slice(0, 255);
        const originAddr = d.pickup_location || 'Bekasi';
        const destAddr = d.delivery_target_point || 'Alamat Customer';

        let totalItems = parseFloat(d.ordered_quantity) || 1;
        let unit = 'Pcs';
        if (d.source_data) {
          try {
            const parsed = JSON.parse(d.source_data);
            if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
              totalItems = parsed.items.reduce((s, it) => s + (parseFloat(it.quantity) || 0), 0);
              unit = String(parsed.items[0].unit || 'Pcs').slice(0, 50);
            }
          } catch (e) {}
        }

        let vehId = d.v_plate ? plateToId[d.v_plate.trim().toUpperCase()] : null;
        if (!vehId) vehId = defaultVehicleId;

        let drvId = null;
        if (d.driver_fullname || d.driver_uname) {
          const match = currentDrivers.find(cd => 
            cd.name.toLowerCase().includes((d.driver_fullname || d.driver_uname).toLowerCase())
          );
          if (match) drvId = match.id;
        }
        if (!drvId) drvId = defaultDriverId;

        let mappedStatus = 'assigned';
        if (d.status === 'delivered' || d.status === 'completed') mappedStatus = 'delivered';
        else if (d.status === 'in_progress' || d.status === 'on_route') mappedStatus = 'on_route';
        else if (d.status === 'arrived') mappedStatus = 'arrived';
        else if (d.status === 'pending') mappedStatus = 'assigned';
        else if (d.status === 'failed') mappedStatus = 'failed';
        else if (d.status === 'cancelled') mappedStatus = 'cancelled';

        // Tautkan manifest jika ada dan manifest tidak terhapus
        let targetManifestId = d.manifest_id || taskToManifest[d.id] || null;
        if (targetManifestId) {
          const mCheck = dManifests.find(m => m.id === targetManifestId);
          if (mCheck && mCheck.deleted_at) {
            targetManifestId = null; // Unlink deleted manifest agar tetap 0 tugas sesuai driver_apps
          }
        }

        const doEasyVal = d.do_easy ? String(d.do_easy).slice(0, 100) : null;

        await pool.query(`
          INSERT INTO logistic_tasks (
            id, task_type, status, reference_number, do_easy,
            origin_name, origin_address,
            destination_name, destination_address,
            total_items_count, total_items_unit,
            driver_id, vehicle_id, dispatch_date,
            completed_odometer, started_at, completed_at,
            manifest_id
          ) VALUES (
            $1, 'delivery', $2, $3, $4,
            $5, $6,
            $7, $8,
            $9, $10,
            $11, $12, $13,
            $14, $15, $16,
            $17
          )
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            reference_number = EXCLUDED.reference_number,
            do_easy = EXCLUDED.do_easy,
            origin_name = EXCLUDED.origin_name,
            origin_address = EXCLUDED.origin_address,
            destination_name = EXCLUDED.destination_name,
            destination_address = EXCLUDED.destination_address,
            total_items_count = EXCLUDED.total_items_count,
            total_items_unit = EXCLUDED.total_items_unit,
            driver_id = EXCLUDED.driver_id,
            vehicle_id = EXCLUDED.vehicle_id,
            dispatch_date = EXCLUDED.dispatch_date,
            completed_odometer = EXCLUDED.completed_odometer,
            started_at = EXCLUDED.started_at,
            completed_at = EXCLUDED.completed_at,
            manifest_id = EXCLUDED.manifest_id,
            updated_at = CURRENT_TIMESTAMP
        `, [
          d.id, mappedStatus, refNum, doEasyVal,
          originName, originAddr,
          destName, destAddr,
          totalItems, unit,
          drvId, vehId, d.dispatch_date || new Date(),
          d.completed_odometer || null, d.started_at || null, d.completed_at || null,
          targetManifestId
        ]);

        if (d.status === 'delivered' && d.receiver_name) {
          const chkProof = await pool.query('SELECT id FROM logistic_task_proofs WHERE task_id = $1', [d.id]);
          if (chkProof.rows.length === 0) {
            await pool.query(`
              INSERT INTO logistic_task_proofs (task_id, receiver_name, receiver_role, item_condition)
              VALUES ($1, $2, $3, $4)
            `, [
              d.id,
              String(d.receiver_name).slice(0, 150),
              String(d.receiver_role || 'Penerima').slice(0, 100),
              String(d.item_condition || 'Baik').slice(0, 50)
            ]);
          }
        }
        deliverySynced++;
      }

      // 6. Sync Pickups
      const pickups = (await dPool.query(`
        SELECT pt.*,
               v.plate_number as v_plate,
               u.full_name as driver_fullname, u.username as driver_uname
        FROM pickup_tasks pt
        LEFT JOIN vehicles v ON v.id = pt.vehicle_id
        LEFT JOIN users u ON u.id = pt.driver_id
      `)).rows;

      let pickupSynced = 0;
      for (const p of pickups) {
        const refNum = (p.reference_number || `PO-PU-${String(p.id).slice(0, 8)}`).slice(0, 100);
        const originName = (p.pickup_name || 'Vendor AQPA').slice(0, 255);
        const originAddr = p.pickup_location || 'Alamat Vendor';
        const destName = (p.destination_name || 'Gudang AQPA').slice(0, 255);
        const destAddr = p.destination || 'Kawasan Delta Silicon, Bekasi';

        let totalItems = parseFloat(p.quantity) || 1;
        let unit = String(p.unit || 'Pcs').slice(0, 50);

        let vehId = p.v_plate ? plateToId[p.v_plate.trim().toUpperCase()] : null;
        if (!vehId) vehId = defaultVehicleId;

        let drvId = null;
        if (p.driver_fullname || p.driver_uname) {
          const match = currentDrivers.find(cd => 
            cd.name.toLowerCase().includes((p.driver_fullname || p.driver_uname).toLowerCase())
          );
          if (match) drvId = match.id;
        }
        if (!drvId) drvId = defaultDriverId;

        let mappedStatus = 'assigned';
        if (p.status === 'delivered' || p.status === 'completed') mappedStatus = 'delivered';
        else if (p.status === 'on_route' || p.status === 'in_progress') mappedStatus = 'on_route';
        else if (p.status === 'arrived') mappedStatus = 'arrived';
        else if (p.status === 'pending') mappedStatus = 'assigned';
        else if (p.status === 'failed') mappedStatus = 'failed';
        else if (p.status === 'cancelled') mappedStatus = 'cancelled';

        let targetManifestId = p.manifest_id || taskToManifest[p.id] || null;
        if (targetManifestId) {
          const mCheck = dManifests.find(m => m.id === targetManifestId);
          if (mCheck && mCheck.deleted_at) {
            targetManifestId = null;
          }
        }

        const doEasyVal = p.do_easy ? String(p.do_easy).slice(0, 100) : null;

        await pool.query(`
          INSERT INTO logistic_tasks (
            id, task_type, status, reference_number, do_easy,
            origin_name, origin_address,
            destination_name, destination_address,
            total_items_count, total_items_unit,
            driver_id, vehicle_id, dispatch_date,
            completed_odometer, started_at, completed_at,
            manifest_id
          ) VALUES (
            $1, 'pickup', $2, $3, $4,
            $5, $6,
            $7, $8,
            $9, $10,
            $11, $12, $13,
            $14, $15, $16,
            $17
          )
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            reference_number = EXCLUDED.reference_number,
            do_easy = EXCLUDED.do_easy,
            origin_name = EXCLUDED.origin_name,
            origin_address = EXCLUDED.origin_address,
            destination_name = EXCLUDED.destination_name,
            destination_address = EXCLUDED.destination_address,
            total_items_count = EXCLUDED.total_items_count,
            total_items_unit = EXCLUDED.total_items_unit,
            driver_id = EXCLUDED.driver_id,
            vehicle_id = EXCLUDED.vehicle_id,
            dispatch_date = EXCLUDED.dispatch_date,
            completed_odometer = EXCLUDED.completed_odometer,
            started_at = EXCLUDED.started_at,
            completed_at = EXCLUDED.completed_at,
            manifest_id = EXCLUDED.manifest_id,
            updated_at = CURRENT_TIMESTAMP
        `, [
          p.id, mappedStatus, refNum, doEasyVal,
          originName, originAddr,
          destName, destAddr,
          totalItems, unit,
          drvId, vehId, p.dispatch_date || new Date(),
          p.completed_odometer || null, p.started_at || null, p.completed_at || null,
          targetManifestId
        ]);

        if ((p.status === 'delivered' || p.status === 'completed') && p.receiver_name) {
          const chkProof = await pool.query('SELECT id FROM logistic_task_proofs WHERE task_id = $1', [p.id]);
          if (chkProof.rows.length === 0) {
            await pool.query(`
              INSERT INTO logistic_task_proofs (task_id, receiver_name, receiver_role, item_condition)
              VALUES ($1, $2, $3, $4)
            `, [
              p.id,
              String(p.receiver_name).slice(0, 150),
              String(p.receiver_role || 'Penerima').slice(0, 100),
              String(p.item_condition || 'Baik').slice(0, 50)
            ]);
          }
        }
        pickupSynced++;
      }

      // 7. Update total_tasks count on logistic_manifests
      await pool.query(`
        UPDATE logistic_manifests m
        SET total_tasks = (
          SELECT count(*) FROM logistic_tasks t WHERE t.manifest_id = m.id
        )
      `);

      res.json({
        success: true,
        message: `Sinkronisasi berhasil! ${mCount} Manifest Penugasan, ${deliverySynced + pickupSynced} Tugas (${deliverySynced} Delivery, ${pickupSynced} Pickup), ${vCount} Kendaraan, dan ${dCount} Driver tersinkronkan.`,
        data: {
          manifests: mCount,
          vehicles: vCount,
          drivers: dCount,
          deliveries: deliverySynced,
          pickups: pickupSynced,
          totalTasks: deliverySynced + pickupSynced
        }
      });
    } catch (err) {
      console.error('Error during driver_apps sync:', err);
      res.status(500).json({ error: 'Gagal melakukan sinkronisasi dari driver_apps: ' + err.message });
    } finally {
      if (localCreatedPool) {
        await dPool.end().catch(() => {});
      }
    }
  });

  return router;
}
