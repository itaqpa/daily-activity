import express from 'express';

export default function (pool) {
  const router = express.Router();

  // Endpoint untuk mendapatkan form / template survey berdasarkan Product Code (misal: EJR)
  router.get('/template/:productCode', async (req, res) => {
    try {
      const { productCode } = req.params;
      
      const queryTemplate = `
        SELECT 
          tp.id as template_product_id,
          tpq.id as template_product_question_id,
          tq.id as question_id,
          tq.section_code_snapshot as section_code,
          tq.section_label_snapshot as section_name,
          tq.question_key,
          tq.label_snapshot as label,
          tq.input_type,
          tq.is_required,
          tq.helper_instruction as description,
          tq.visibility_rule,
          (
            SELECT json_agg(json_build_object('key', tqo.option_key, 'label', tqo.option_label) ORDER BY tqo.sort_order)
            FROM survey_engine.template_question_options tqo
            WHERE tqo.template_question_id = tq.id
          ) as options,
          (
            SELECT json_agg(json_build_object('key', tci.item_key, 'label', tci.item_label) ORDER BY tci.sort_order)
            FROM survey_engine.template_checklist_items tci
            WHERE tci.template_question_id = tq.id
          ) as checklist_items
        FROM survey_engine.template_products tp
        JOIN survey_engine.products p ON p.id = tp.product_id
        JOIN survey_engine.survey_template_versions v ON v.id = tp.version_id
        JOIN survey_engine.survey_templates st ON st.id = v.template_id
        JOIN survey_engine.template_product_questions tpq ON tpq.template_product_id = tp.id
        JOIN survey_engine.template_questions tq ON tq.id = tpq.template_question_id
        WHERE p.code = $1 
          AND st.code = 'GTE_PRODUCT_SURVEY' 
          AND v.status = 'published'
        ORDER BY tq.sort_order;
      `;

      const result = await pool.query(queryTemplate, [productCode]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Template tidak ditemukan untuk produk ini' });
      }

      const sectionsMap = {};
      
      result.rows.forEach(row => {
        const sectionId = row.section_code;
        if (!sectionsMap[sectionId]) {
          sectionsMap[sectionId] = {
            id: sectionId,
            name: row.section_name || 'General',
            questions: []
          };
        }

        let formattedOptions = [];
        if (row.options) {
          formattedOptions = row.options.map(o => o.label);
        }

        let finalOptions = formattedOptions;
        if (row.input_type === 'checklist' && row.checklist_items) {
           finalOptions = row.checklist_items.map(ci => ({ key: ci.key, label: ci.label }));
        }

        sectionsMap[sectionId].questions.push({
          template_product_question_id: row.template_product_question_id,
          id: row.question_id,
          question_key: row.question_key,
          label: row.label,
          type: row.input_type,
          required: row.is_required,
          description: row.description,
          options: finalOptions,
          visibility_rule: row.visibility_rule
        });
      });

      const templateData = {
        template_product_id: result.rows.length > 0 ? result.rows[0].template_product_id : null,
        product_code: productCode,
        sections: Object.values(sectionsMap)
      };

      res.json(templateData);

    } catch (error) {
      console.error('Error fetching survey template:', error);
      res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
  });

  // Endpoint untuk menyimpan data Step 3 (Lapangan)
  router.post('/submit-lapangan', async (req, res) => {
    const client = await pool.connect();
    try {
      const { survey_id, schedules, products } = req.body;
      
      if (!survey_id) {
        return res.status(400).json({ error: 'survey_id diperlukan' });
      }

      await client.query('BEGIN');

      // 1. Simpan schedules
      // Hapus data lama agar tergantikan
      await client.query('DELETE FROM survey_product_actual_schedules WHERE survey_id = $1', [survey_id]);
      
      if (schedules && schedules.length > 0) {
        for (const s of schedules) {
          await client.query(
            `INSERT INTO survey_product_actual_schedules (survey_id, hari_ke, tanggal, kegiatan) 
             VALUES ($1, $2, $3, $4)`,
            [survey_id, s.hari_ke || null, s.tanggal || null, s.kegiatan || '']
          );
        }
      }

      // 2. Simpan produk (progress & data form dinamis)
      await client.query('DELETE FROM survey_product_progress WHERE survey_id = $1', [survey_id]);

      if (products && products.length > 0) {
        for (const p of products) {
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

      await client.query('COMMIT');
      res.json({ message: 'Data lapangan berhasil disimpan' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving lapangan:', error);
      res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan data lapangan' });
    } finally {
      client.release();
    }
  });

  // Endpoint untuk menyimpan jawaban dinamis per produk (bukan format JSONB, tapi Relational Tabel)
  router.post('/submit-dynamic', async (req, res) => {
    const client = await pool.connect();
    try {
      const { survey_no, product_code, item_no, answers, custom_refs } = req.body;
      
      if (!product_code || !survey_no) {
        return res.status(400).json({ error: 'survey_no dan product_code diperlukan' });
      }

      await client.query('BEGIN');

      // 1. Dapatkan atau buat survey
      let surveyId;
      const checkSurvey = await client.query(`SELECT id FROM survey_engine.surveys WHERE survey_no = $1`, [survey_no]);
      if (checkSurvey.rows.length === 0) {
        const newSurvey = await client.query(
          `INSERT INTO survey_engine.surveys (survey_no, created_by) VALUES ($1, $2) RETURNING id`, 
          [survey_no, 'system']
        );
        surveyId = newSurvey.rows[0].id;
      } else {
        surveyId = checkSurvey.rows[0].id;
      }

      // 2. Dapatkan template_product_id dari product_code
      const checkProduct = await client.query(`
        SELECT tp.id 
        FROM survey_engine.template_products tp
        JOIN survey_engine.products p ON p.id = tp.product_id
        JOIN survey_engine.survey_template_versions v ON v.id = tp.version_id
        WHERE p.code = $1 AND v.status = 'published'
        LIMIT 1
      `, [product_code]);
      
      if (checkProduct.rows.length === 0) {
         throw new Error(`Template product tidak ditemukan untuk ${product_code}`);
      }
      const templateProductId = checkProduct.rows[0].id;

      // 3. Dapatkan atau buat survey_items
      let surveyItemId;
      const checkItem = await client.query(
        `SELECT id FROM survey_engine.survey_items WHERE survey_id = $1 AND template_product_id = $2 AND item_no = $3`,
        [surveyId, templateProductId, item_no || 1]
      );
      if (checkItem.rows.length === 0) {
        const newItem = await client.query(
          `INSERT INTO survey_engine.survey_items (survey_id, template_product_id, item_no) VALUES ($1, $2, $3) RETURNING id`,
          [surveyId, templateProductId, item_no || 1]
        );
        surveyItemId = newItem.rows[0].id;
      } else {
        surveyItemId = checkItem.rows[0].id;
        // Bersihkan jawaban lama (override/update)
        await client.query(`DELETE FROM survey_engine.survey_answers WHERE survey_item_id = $1`, [surveyItemId]);
        await client.query(`DELETE FROM survey_engine.survey_parameter_values WHERE survey_item_id = $1`, [surveyItemId]);
      }

      // 4. Masukkan Answers 
      if (answers) {
        const questionKeys = Object.keys(answers).filter(k => !k.endsWith('_lainnya'));
        for (const key of questionKeys) {
          const val = answers[key];
          if (val === undefined || val === '') continue; // Skip kosong

          const isLainnya = (answers[`${key}_lainnya`] !== undefined && answers[`${key}_lainnya`] !== '');
          let finalVal = val;
          if (isLainnya) {
            finalVal = answers[`${key}_lainnya`]; // Jika ada lainnya, timpa
          }

          // Cari template_product_question_id
          const tpq = await client.query(`
            SELECT tpq.id 
            FROM survey_engine.template_product_questions tpq
            JOIN survey_engine.template_questions tq ON tq.id = tpq.template_question_id
            WHERE tpq.template_product_id = $1 AND tq.question_key = $2
          `, [templateProductId, key]);

          if (tpq.rows.length > 0) {
            const tpqId = tpq.rows[0].id;
            await client.query(`
              INSERT INTO survey_engine.survey_answers (survey_item_id, template_product_question_id, answer_json)
              VALUES ($1, $2, $3)
            `, [surveyItemId, tpqId, JSON.stringify(finalVal)]);
          }
        }
      }

      // 5. Masukkan Custom Refs ke survey_parameter_values
      if (custom_refs && custom_refs.length > 0) {
        for (const ref of custom_refs) {
          if (ref.parameter && ref.value) {
            await client.query(`
              INSERT INTO survey_engine.survey_parameter_values (survey_item_id, parameter_name, value_text, tolerance_text)
              VALUES ($1, $2, $3, $4)
            `, [surveyItemId, ref.parameter, ref.value, ref.tolerance || null]);
          }
        }
      }

      await client.query('COMMIT');
      res.json({ message: 'Data produk berhasil disimpan ke tabel relasional!', surveyItemId });
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
