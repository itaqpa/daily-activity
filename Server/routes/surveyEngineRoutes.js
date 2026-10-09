import express from 'express';

export default function (pool) {
  const router = express.Router();

  // ─── GET /template/:productCode ───────────────────────────────────────────
  // Kembalikan seluruh konfigurasi template yang dibutuhkan frontend:
  // sections, questions, options, checklist items, unit, visibility rule, dll.
  router.get('/template/:productCode', async (req, res) => {
    try {
      const { productCode } = req.params;

      const queryTemplate = `
        SELECT
          tp.id                          AS template_product_id,
          v.id                           AS version_id,
          v.version_no,
          tpq.id                         AS template_product_question_id,
          tq.id                          AS question_id,
          tq.section_code_snapshot       AS section_code,
          tq.section_label_snapshot      AS section_name,
          tq.question_no,
          tq.question_key,
          tq.label_snapshot              AS label,
          tq.input_type,
          tq.unit_snapshot               AS unit,
          tq.is_required,
          tq.is_visible_default,
          tq.helper_instruction,
          tq.visibility_rule,
          tq.validation_rule,
          tq.note_config,
          tq.photo_config,
          tq.sort_order,
          COALESCE(tpq.is_required_override, tq.is_required)              AS effective_required,
          COALESCE(tpq.visibility_rule_override, tq.visibility_rule)      AS effective_visibility_rule,
          (
            SELECT json_agg(
              json_build_object(
                'key',   tqo.option_key,
                'label', tqo.option_label,
                'value', tqo.option_value
              ) ORDER BY tqo.sort_order
            )
            FROM survey_engine.template_question_options tqo
            WHERE tqo.template_question_id = tq.id
          ) AS options,
          (
            SELECT json_agg(
              json_build_object(
                'key',                  tci.item_key,
                'label',                tci.item_label,
                'sort_order',           tci.sort_order,
                'is_required',          tci.is_required,
                'condition_options',    tci.condition_options,
                'has_visibility_field', tci.has_visibility_field,
                'note_config',          tci.note_config,
                'photo_config',         tci.photo_config
              ) ORDER BY tci.sort_order
            )
            FROM survey_engine.template_checklist_items tci
            WHERE tci.template_question_id = tq.id
          ) AS checklist_items
        FROM survey_engine.template_products tp
        JOIN survey_engine.products p                ON p.id  = tp.product_id
        JOIN survey_engine.survey_template_versions v ON v.id = tp.version_id
        JOIN survey_engine.survey_templates st        ON st.id = v.template_id
        JOIN survey_engine.template_product_questions tpq ON tpq.template_product_id = tp.id
        JOIN survey_engine.template_questions tq      ON tq.id = tpq.template_question_id
        WHERE p.code  = $1
          AND st.code = 'GTE_PRODUCT_SURVEY'
          AND v.status = 'published'
        ORDER BY tq.sort_order, tq.id;
      `;

      const result = await pool.query(queryTemplate, [productCode]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: `Template tidak ditemukan untuk produk ${productCode}`
        });
      }

      // Build section map — preserve insertion order for sort
      const sectionsMap = new Map();

      result.rows.forEach(row => {
        const sectionCode = row.section_code || 'general';
        if (!sectionsMap.has(sectionCode)) {
          sectionsMap.set(sectionCode, {
            id:        sectionCode,
            name:      row.section_name || 'General',
            questions: []
          });
        }

        // Parse options (label-only array, or key-label objects)
        let options = [];
        if (row.options) {
          options = row.options.map(o => ({ key: o.key, label: o.label }));
        }

        // Checklist items — return full config, not merged into options
        let checklistItems = null;
        if (row.input_type === 'checklist' && row.checklist_items) {
          checklistItems = row.checklist_items;
        }

        sectionsMap.get(sectionCode).questions.push({
          template_product_question_id: row.template_product_question_id,
          id:               row.question_id,
          question_key:     row.question_key,
          question_no:      row.question_no,
          label:            row.label,
          type:             row.input_type,
          unit:             row.unit || null,
          required:         row.effective_required,
          is_visible_default: row.is_visible_default,
          helper_instruction: row.helper_instruction || null,
          visibility_rule:  row.effective_visibility_rule || {},
          validation_rule:  row.validation_rule || {},
          note_config:      row.note_config || { enabled: true, required: false },
          photo_config:     row.photo_config || { enabled: false, required: false, max_files: 0 },
          options:          options,
          checklist_items:  checklistItems
        });
      });

      const firstRow = result.rows[0];
      const templateData = {
        template_product_id: firstRow.template_product_id,
        version_id:          firstRow.version_id,
        version_no:          firstRow.version_no,
        product_code:        productCode,
        sections:            Array.from(sectionsMap.values())
      };

      res.json(templateData);

    } catch (error) {
      console.error('Error fetching survey template:', error);
      res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
  });

  // ─── POST /surveys ─────────────────────────────────────────────────────────
  // Buat survei baru. Menggantikan dummy SURVEY-001.
  router.post('/surveys', async (req, res) => {
    const client = await pool.connect();
    try {
      const { client_name, project_info, created_by } = req.body;

      await client.query('BEGIN');

      // Generate survey_no unik
      const surveyNo = `GTE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

      const result = await client.query(
        `INSERT INTO survey_engine.surveys
           (survey_no, created_by, status)
         VALUES ($1, $2, 'in_progress')
         RETURNING id, survey_no, created_at`,
        [surveyNo, created_by || 'system']
      );

      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating survey:', error);
      res.status(500).json({ error: 'Terjadi kesalahan saat membuat survei' });
    } finally {
      client.release();
    }
  });

  // Simpan Step Data sebagai draft di tabel utama survey product.
  router.post('/product-drafts', async (req, res) => {
    const client = await pool.connect();
    try {
      const {
        survey_id,
        data = {},
        selected_products = [],
        schedules = [],
        status = 'Draft'
      } = req.body;

      await client.query('BEGIN');

      const normalizedStatus = status === 'draft' ? 'Draft' : status;
      const allowedStatuses = new Set(['Draft', 'Persiapan', 'Lapangan', 'Selesai', 'Batal']);
      if (!allowedStatuses.has(normalizedStatus)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Status survey product tidak valid' });
      }

      let surveyId = survey_id || null;
      let surveyNo = data.no_survey || null;

      if (surveyId) {
        const existing = await client.query(
          'SELECT no_survey FROM survey_product_data WHERE id = $1',
          [surveyId]
        );
        if (existing.rows.length === 0) {
          throw new Error(`Draft survey product dengan id ${surveyId} tidak ditemukan`);
        }
        surveyNo = surveyNo || existing.rows[0].no_survey;

        await client.query(
          `UPDATE survey_product_data
           SET nama_client = $1,
               plant_area = $2,
               alamat_lokasi = $3,
               tanggal_mulai = $4,
               nama_surveyor = $5,
               leader_surveyor_id = $6,
               leader_surveyor_name = $7,
               anggota_surveyor = $8,
               leader_surveyor = $9,
               nama_marketing = $10,
               pic_client = $11,
               kontak_pic = $12,
               no_inquiry = $13,
               tujuan_survey = $14,
               status = $15,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $16`,
          [
            data.nama_client || null,
            data.plant_area || null,
            data.alamat_lokasi || null,
            data.tanggal_mulai || null,
            data.nama_surveyor || null,
            data.leader_surveyor_id || null,
            data.leader_surveyor_name || null,
            JSON.stringify(data.anggota_surveyor || []),
            JSON.stringify(data.leader_surveyor || []),
            data.nama_marketing || null,
            data.pic_client || null,
            data.kontak_pic || null,
            data.no_inquiry || null,
            data.tujuan_survey || null,
            normalizedStatus,
            surveyId
          ]
        );
      } else {
        surveyNo = surveyNo || `SP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
        const inserted = await client.query(
          `INSERT INTO survey_product_data
             (no_survey, nama_client, plant_area, alamat_lokasi, tanggal_mulai,
              nama_surveyor, leader_surveyor_id, leader_surveyor_name, anggota_surveyor,
              leader_surveyor, nama_marketing, pic_client, kontak_pic, no_inquiry,
              tujuan_survey, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
           RETURNING id, no_survey`,
          [
            surveyNo,
            data.nama_client || null,
            data.plant_area || null,
            data.alamat_lokasi || null,
            data.tanggal_mulai || null,
            data.nama_surveyor || null,
            data.leader_surveyor_id || null,
            data.leader_surveyor_name || null,
            JSON.stringify(data.anggota_surveyor || []),
            JSON.stringify(data.leader_surveyor || []),
            data.nama_marketing || null,
            data.pic_client || null,
            data.kontak_pic || null,
            data.no_inquiry || null,
            data.tujuan_survey || null,
            normalizedStatus
          ]
        );
        surveyId = inserted.rows[0].id;
        surveyNo = inserted.rows[0].no_survey;
      }

      await client.query('DELETE FROM survey_product_planned_items WHERE survey_id = $1', [surveyId]);
      for (const product of selected_products) {
        await client.query(
          `INSERT INTO survey_product_planned_items
             (survey_id, nama_produk, deskripsi, jumlah)
           VALUES ($1, $2, $3, $4)`,
          [
            surveyId,
            product.name || product.code || product.nama_produk || '',
            product.code || product.deskripsi || null,
            product.jumlah || 1
          ]
        );
      }

      await client.query('DELETE FROM survey_product_schedules WHERE survey_id = $1', [surveyId]);
      for (const schedule of schedules) {
        const hasValue = schedule.hari || schedule.tanggal || schedule.rencana_area || schedule.target_item;
        if (!hasValue) continue;
        await client.query(
          `INSERT INTO survey_product_schedules
             (survey_id, hari, tanggal, rencana_area, target_item)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            surveyId,
            schedule.hari || null,
            schedule.tanggal || null,
            schedule.rencana_area || null,
            schedule.target_item || null
          ]
        );
      }

      await client.query('COMMIT');
      res.json({
        survey_id: surveyId,
        no_survey: surveyNo,
        status: normalizedStatus
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving survey product draft:', error);
      res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan draft survey product' });
    } finally {
      client.release();
    }
  });

  router.get('/product-drafts', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          spd.id,
          spd.no_survey,
          spd.nama_client,
          spd.plant_area,
          spd.alamat_lokasi,
          spd.tanggal_mulai,
          spd.status,
          COALESCE(progress.jumlah_item, 0)::int AS jumlah_item,
          COALESCE(progress.jumlah_jenis_product, 0)::int AS jumlah_jenis_product,
          COALESCE(progress.percent_kelengkapan, 0)::int AS percent_kelengkapan
        FROM survey_product_data spd
        LEFT JOIN (
          SELECT
            survey_id,
            COUNT(*)::int AS jumlah_item,
            COUNT(DISTINCT product_code)::int AS jumlah_jenis_product,
            COALESCE(ROUND(AVG(percent)), 0)::int AS percent_kelengkapan
          FROM survey_product_progress
          GROUP BY survey_id
        ) progress ON progress.survey_id = spd.id
        ORDER BY spd.updated_at DESC, spd.created_at DESC, spd.id DESC
      `);

      res.json({
        data: result.rows.map(row => ({
          id: row.id,
          no_survey: row.no_survey,
          lokasi: [row.nama_client, row.plant_area, row.alamat_lokasi].filter(Boolean).join(' - '),
          tanggal: row.tanggal_mulai,
          status: row.status,
          jumlah_item: Number(row.jumlah_item || 0),
          jumlah_jenis_product: Number(row.jumlah_jenis_product || 0),
          percent_kelengkapan: Number(row.percent_kelengkapan || 0)
        }))
      });
    } catch (error) {
      console.error('Error fetching survey product drafts:', error);
      res.status(500).json({ error: 'Terjadi kesalahan saat mengambil daftar survey product' });
    }
  });

  router.get('/product-drafts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const surveyResult = await pool.query(
        `SELECT
           id,
           no_survey,
           nama_client,
           plant_area,
           alamat_lokasi,
           to_char(tanggal_mulai, 'YYYY-MM-DD') AS tanggal_mulai,
           nama_surveyor,
           leader_surveyor_id,
           leader_surveyor_name,
           leader_surveyor,
           anggota_surveyor,
           nama_marketing,
           pic_client,
           kontak_pic,
           no_inquiry,
           tujuan_survey,
           status
         FROM survey_product_data
         WHERE id = $1`,
        [id]
      );

      if (surveyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Survey product tidak ditemukan' });
      }

      const productsResult = await pool.query(
        `SELECT nama_produk, deskripsi, jumlah
         FROM survey_product_planned_items
         WHERE survey_id = $1
         ORDER BY id`,
        [id]
      );

      const schedulesResult = await pool.query(
        `SELECT id, hari, to_char(tanggal, 'YYYY-MM-DD') AS tanggal, rencana_area, target_item
         FROM survey_product_schedules
         WHERE survey_id = $1
         ORDER BY id`,
        [id]
      );

      const persiapanResult = await pool.query(
        `SELECT sp.master_persiapan_id, sp.digunakan, sp.qty, 
                mp.label, mp.jenis, mp.ket_tambahan
         FROM survey_product_persiapan sp
         JOIN master_survey_persiapan mp ON mp.id = sp.master_persiapan_id
         WHERE sp.survey_id = $1`,
        [id]
      );

      const actualSchedulesResult = await pool.query(
        `SELECT id, hari_ke, to_char(tanggal, 'YYYY-MM-DD') AS tanggal, kegiatan
         FROM survey_product_actual_schedules
         WHERE survey_id = $1
         ORDER BY id`,
        [id]
      );

      const productProgressResult = await pool.query(
        `SELECT id, product_name, product_code, percent, form_data, hari_ke, display_id, lokasi
         FROM survey_product_progress
         WHERE survey_id = $1
         ORDER BY id`,
        [id]
      );

      const row = surveyResult.rows[0];
      res.json({
        survey_id: row.id,
        data: {
          no_survey: row.no_survey || '',
          nama_client: row.nama_client || '',
          plant_area: row.plant_area || '',
          alamat_lokasi: row.alamat_lokasi || '',
          tanggal_mulai: row.tanggal_mulai || '',
          nama_surveyor: row.nama_surveyor || '',
          leader_surveyor_id: row.leader_surveyor_id || '',
          leader_surveyor_name: row.leader_surveyor_name || '',
          leader_surveyor: row.leader_surveyor || [],
          anggota_surveyor: row.anggota_surveyor || [],
          nama_marketing: row.nama_marketing || '',
          no_inquiry: row.no_inquiry || '',
          pic_client: row.pic_client || '',
          kontak_pic: row.kontak_pic || '',
          tujuan_survey: row.tujuan_survey || '',
          status: row.status || 'Draft',
          selectedProducts: productsResult.rows
            .map(product => product.deskripsi || product.nama_produk)
            .filter(Boolean),
          schedules: schedulesResult.rows.length
            ? schedulesResult.rows.map(schedule => ({
                id: schedule.id,
                hari: schedule.hari || '',
                tanggal: schedule.tanggal || '',
                rencana_area: schedule.rencana_area || '',
                target_item: schedule.target_item || ''
              }))
            : [{ id: 1, hari: '', tanggal: '', rencana_area: '', target_item: '' }]
        },
        persiapan: {
          items: persiapanResult.rows.map(item => ({
            id: item.master_persiapan_id,
            label: item.label,
            jenis: item.jenis,
            ket_tambahan: item.ket_tambahan
          })),
          state: persiapanResult.rows.reduce((acc, item) => {
            acc[item.master_persiapan_id] = {
              digunakan: item.digunakan,
              qty: item.qty || 1
            };
            return acc;
          }, {})
        },
        lapangan: {
          actualSchedules: actualSchedulesResult.rows.length
            ? actualSchedulesResult.rows.map(schedule => ({
                id: schedule.id,
                hari_ke: schedule.hari_ke || '',
                tanggal: schedule.tanggal || '',
                kegiatan: schedule.kegiatan || ''
              }))
            : [{ id: 1, hari_ke: '', tanggal: '', kegiatan: '' }],
          productProgress: productProgressResult.rows.map(product => ({
            id: product.id,
            code: product.product_code || '',
            name: product.product_name || '',
            displayId: product.display_id || product.product_code || '',
            lokasi: product.lokasi || '',
            hari_ke: product.hari_ke || 1,
            percent: Number(product.percent || 0),
            formData: product.form_data || {}
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching survey product draft:', error);
      res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data survey product' });
    }
  });

  router.post('/product-drafts/:id/persiapan', async (req, res) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { items = [], status = 'Draft' } = req.body;
      const normalizedStatus = status === 'draft' ? 'Draft' : status;

      await client.query('BEGIN');

      const existing = await client.query(
        'SELECT id FROM survey_product_data WHERE id = $1',
        [id]
      );
      if (existing.rows.length === 0) {
        throw new Error(`Draft survey product dengan id ${id} tidak ditemukan`);
      }

      await client.query('DELETE FROM survey_product_persiapan WHERE survey_id = $1', [id]);

      for (const item of items) {
        if (!item.master_persiapan_id) continue;
        
        let actualMasterId = item.master_persiapan_id;
        
        // If it's a custom item created on the frontend
        if (item.is_custom) {
          const insertMaster = await client.query(
            `INSERT INTO master_survey_persiapan (jenis, label, ket_tambahan)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [item.jenis, item.label, item.ket_tambahan]
          );
          actualMasterId = insertMaster.rows[0].id;
        }

        await client.query(
          `INSERT INTO survey_product_persiapan
             (survey_id, master_persiapan_id, digunakan, qty)
           VALUES ($1, $2, $3, $4)`,
          [
            id,
            actualMasterId,
            Boolean(item.digunakan),
            item.qty || 0
          ]
        );
      }

      await client.query(
        `UPDATE survey_product_data
         SET status = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [normalizedStatus, id]
      );

      await client.query('COMMIT');
      res.json({ survey_id: Number(id), status: normalizedStatus });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving survey product persiapan:', error);
      res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan draft persiapan' });
    } finally {
      client.release();
    }
  });

  // ─── GET /surveys/:surveyId/items ──────────────────────────────────────────
  // Ambil semua item dan jawaban untuk reload survei yang sudah ada.
  router.get('/surveys/:surveyId/items', async (req, res) => {
    try {
      const { surveyId } = req.params;

      const itemsResult = await pool.query(`
        SELECT
          si.id                  AS survey_item_id,
          si.item_no,
          si.status,
          p.code                 AS product_code,
          p.name                 AS product_name,
          tp.id                  AS template_product_id,
          v.version_no
        FROM survey_engine.survey_items si
        JOIN survey_engine.template_products tp ON tp.id = si.template_product_id
        JOIN survey_engine.products p           ON p.id  = tp.product_id
        JOIN survey_engine.survey_template_versions v ON v.id = tp.version_id
        WHERE si.survey_id = $1
        ORDER BY si.item_no
      `, [surveyId]);

      const items = [];
      for (const item of itemsResult.rows) {
        const answersResult = await pool.query(`
          SELECT
            tq.question_key,
            sa.answer_json
          FROM survey_engine.survey_answers sa
          JOIN survey_engine.template_product_questions tpq ON tpq.id = sa.template_product_question_id
          JOIN survey_engine.template_questions tq          ON tq.id  = tpq.template_question_id
          WHERE sa.survey_item_id = $1
        `, [item.survey_item_id]);

        const answers = {};
        answersResult.rows.forEach(row => {
          try { answers[row.question_key] = JSON.parse(row.answer_json); }
          catch { answers[row.question_key] = row.answer_json; }
        });

        items.push({
          survey_item_id:      item.survey_item_id,
          item_no:             item.item_no,
          status:              item.status,
          product_code:        item.product_code,
          product_name:        item.product_name,
          template_product_id: item.template_product_id,
          version_no:          item.version_no,
          answers
        });
      }

      res.json({ survey_id: parseInt(surveyId), items });
    } catch (error) {
      console.error('Error fetching survey items:', error);
      res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data survei' });
    }
  });

  // Endpoint untuk menyimpan data Step 3 (Lapangan)
  router.post('/submit-lapangan', async (req, res) => {

    const client = await pool.connect();
    try {
      const { survey_id, schedules = [], products = [], status = 'Draft' } = req.body;
      
      if (!survey_id) {
        return res.status(400).json({ error: 'survey_id diperlukan' });
      }

      await client.query('BEGIN');

      const normalizedStatus = status === 'draft' ? 'Draft' : status;
      const allowedStatuses = new Set(['Draft', 'Persiapan', 'Lapangan', 'Selesai', 'Batal']);
      if (!allowedStatuses.has(normalizedStatus)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Status survey product tidak valid' });
      }

      const existing = await client.query(
        'SELECT id FROM survey_product_data WHERE id = $1',
        [survey_id]
      );
      if (existing.rows.length === 0) {
        throw new Error(`Draft survey product dengan id ${survey_id} tidak ditemukan`);
      }

      // 1. Simpan schedules
      // Hapus data lama agar tergantikan
      await client.query('DELETE FROM survey_product_actual_schedules WHERE survey_id = $1', [survey_id]);
      
      if (schedules.length > 0) {
        for (const s of schedules) {
          const hasValue = s.hari_ke || s.tanggal || s.kegiatan;
          if (!hasValue) continue;
          await client.query(
            `INSERT INTO survey_product_actual_schedules (survey_id, hari_ke, tanggal, kegiatan) 
             VALUES ($1, $2, $3, $4)`,
            [survey_id, s.hari_ke || null, s.tanggal || null, s.kegiatan || '']
          );
        }
      }

      // 2. Simpan produk (progress & data form dinamis)
      await client.query('DELETE FROM survey_product_progress WHERE survey_id = $1', [survey_id]);

      if (products.length > 0) {
        for (const p of products) {
          if (!p.code && !p.name) continue;
          await client.query(
            `INSERT INTO survey_product_progress 
             (survey_id, product_name, product_code, percent, form_data, hari_ke, display_id, lokasi)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              survey_id, 
              p.name, 
              p.code, 
              p.percent || 0, 
              p.formData ? JSON.stringify(p.formData) : '{}',
              p.hari_ke || 1,
              p.displayId || p.code,
              p.lokasi || ''
            ]
          );
        }
      }

      await client.query(
        `UPDATE survey_product_data
         SET status = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [normalizedStatus, survey_id]
      );

      await client.query('COMMIT');
      res.json({
        message: 'Data lapangan berhasil disimpan',
        survey_id: Number(survey_id),
        status: normalizedStatus
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving lapangan:', error);
      res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan data lapangan' });
    } finally {
      client.release();
    }
  });

  // Endpoint untuk menyimpan jawaban dinamis per produk (tabel relasional, bukan JSONB)
  router.post('/submit-dynamic', async (req, res) => {
    const client = await pool.connect();
    try {
      const {
        survey_id,
        product_code,
        item_no,
        template_product_id: tpIdFromClient, // opsional — untuk mengunci versi
        answers,
        custom_refs
      } = req.body;

      if (!survey_id || !product_code) {
        return res.status(400).json({ error: 'survey_id dan product_code diperlukan' });
      }

      await client.query('BEGIN');

      // 1. Verifikasi survey ada
      const surveyCheck = await client.query(
        `SELECT id FROM survey_engine.surveys WHERE id = $1`,
        [survey_id]
      );
      if (surveyCheck.rows.length === 0) {
        throw new Error(`Survei dengan id ${survey_id} tidak ditemukan`);
      }

      // 2. Dapatkan template_product_id dari product_code (published)
      let templateProductId = tpIdFromClient;
      if (!templateProductId) {
        const checkProduct = await client.query(`
          SELECT tp.id
          FROM survey_engine.template_products tp
          JOIN survey_engine.products p ON p.id = tp.product_id
          JOIN survey_engine.survey_template_versions v ON v.id = tp.version_id
          JOIN survey_engine.survey_templates st ON st.id = v.template_id
          WHERE p.code = $1
            AND st.code = 'GTE_PRODUCT_SURVEY'
            AND v.status = 'published'
          LIMIT 1
        `, [product_code]);

        if (checkProduct.rows.length === 0) {
          throw new Error(`Template product tidak ditemukan untuk ${product_code}`);
        }
        templateProductId = checkProduct.rows[0].id;
      }

      // 3. Dapatkan atau buat survey_items
      let surveyItemId;
      const checkItem = await client.query(
        `SELECT id FROM survey_engine.survey_items
         WHERE survey_id = $1 AND template_product_id = $2 AND item_no = $3`,
        [survey_id, templateProductId, item_no || 1]
      );
      if (checkItem.rows.length === 0) {
        const newItem = await client.query(
          `INSERT INTO survey_engine.survey_items
             (survey_id, template_product_id, item_no, status)
           VALUES ($1, $2, $3, 'in_progress')
           RETURNING id`,
          [survey_id, templateProductId, item_no || 1]
        );
        surveyItemId = newItem.rows[0].id;
      } else {
        surveyItemId = checkItem.rows[0].id;
        // Bersihkan jawaban lama (full replace per save)
        await client.query(`DELETE FROM survey_engine.survey_answers WHERE survey_item_id = $1`, [surveyItemId]);
        await client.query(`DELETE FROM survey_engine.survey_parameter_values WHERE survey_item_id = $1`, [surveyItemId]);
      }

      // 4. Pre-fetch semua question_key → tpq_id mapping dalam 1 query (efisien)
      if (answers && typeof answers === 'object') {
        const tpqMap = await client.query(`
          SELECT tpq.id, tq.question_key
          FROM survey_engine.template_product_questions tpq
          JOIN survey_engine.template_questions tq ON tq.id = tpq.template_question_id
          WHERE tpq.template_product_id = $1
        `, [templateProductId]);

        const keyToTpqId = {};
        tpqMap.rows.forEach(r => { keyToTpqId[r.question_key] = r.id; });

        const processedKeys = new Set();
        for (const [key, val] of Object.entries(answers)) {
          if (key.endsWith('_lainnya') || key === 'custom_refs') continue;
          if (processedKeys.has(key)) continue;
          processedKeys.add(key);
          if (val === undefined || val === null || val === '') continue;

          // Gabungkan nilai "Lainnya" / "Custom" jika ada
          let finalVal = val;
          const lainnyaKey = `${key}_lainnya`;
          if (
            answers[lainnyaKey] !== undefined &&
            answers[lainnyaKey] !== '' &&
            typeof val === 'string' &&
            (val.toLowerCase().includes('lainnya') || val.toLowerCase().includes('custom'))
          ) {
            finalVal = answers[lainnyaKey];
          }

          const tpqId = keyToTpqId[key];
          if (!tpqId) continue; // Pertanyaan tidak ada di template ini

          await client.query(
            `INSERT INTO survey_engine.survey_answers
               (survey_item_id, template_product_question_id, answer_json)
             VALUES ($1, $2, $3)`,
            [surveyItemId, tpqId, JSON.stringify(finalVal)]
          );
        }
      }

      // 5. Simpan custom_refs ke survey_parameter_values
      if (custom_refs && Array.isArray(custom_refs)) {
        for (const ref of custom_refs) {
          if (ref.parameter && ref.value !== undefined && ref.value !== '') {
            await client.query(`
              INSERT INTO survey_engine.survey_parameter_values
                (survey_item_id, parameter_name, value_text, tolerance_text)
              VALUES ($1, $2, $3, $4)
            `, [surveyItemId, ref.parameter, String(ref.value), ref.tolerance || null]);
          }
        }
      }

      await client.query('COMMIT');
      res.json({
        message:        'Data produk berhasil disimpan',
        survey_item_id: surveyItemId,
        survey_id
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving dynamic survey:', error);
      res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan data dinamis' });
    } finally {
      client.release();
    }
  });

  return router;
}
