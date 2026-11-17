import fs from 'fs';
import path from 'path';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: '192.168.10.204',
  port: 5432,
  user: 'root',
  password: 'gte1122@2026!',
  database: 'daily_activity'
});

const backupDir = path.join(process.cwd(), 'Server', 'backup');
const f1 = JSON.parse(fs.readFileSync(path.join(backupDir, 'aqpa_localstorage_backup.json'), 'utf8'));
const f2 = JSON.parse(fs.readFileSync(path.join(backupDir, 'browser-storage-export.json'), 'utf8'));
const f3 = JSON.parse(fs.readFileSync(path.join(backupDir, 'localStorage-backup.json'), 'utf8'));

async function restoreNewData() {
  const client = await pool.connect();
  console.log('=== MEMULAI RESTORASI 36 CUSTOMER & 8 SURVEY PRODUCT KE DATABASE (192.168.10.204) ===\n');

  try {
    await client.query('BEGIN');

    // ==========================================
    // 1. RESTORE 36 CUSTOMERS
    // ==========================================
    console.log('--- 1. PROSES RESTORE CUSTOMERS BARU ---');
    const dbCustRes = await client.query('SELECT id FROM customers');
    const dbCustIds = new Set(dbCustRes.rows.map(c => Number(c.id)));

    const c1 = f1['offline_cache_https://apps-api.aqpa-indonesia.com/api/customers'] || [];
    const c2 = f2.localStorage?.['offline_cache_https://apps-api.aqpa-indonesia.com/api/customers'] || [];
    const c3 = f3['offline_cache_https://apps-api.aqpa-indonesia.com/api/customers'] || [];

    const allCustMap = new Map();
    [...c1, ...c2, ...c3].forEach(c => {
      if (c && c.id) allCustMap.set(Number(c.id), c);
    });

    let insertedCustomers = 0;
    let salesCustomerLinks = 0;

    for (const [id, c] of allCustMap.entries()) {
      if (!dbCustIds.has(id)) {
        // Format site_kota
        let siteKota = c.site_kota;
        if (Array.isArray(siteKota)) {
          siteKota = siteKota.join(', ');
        }

        // Insert ke tabel customers
        await client.query(`
          INSERT INTO customers (id, no_akun, nama_customer, site_kota, status, note, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::timestamp, NOW()), COALESCE($8::timestamp, NOW()))
          ON CONFLICT (id) DO NOTHING
        `, [
          id,
          c.no_akun || '',
          c.nama_customer,
          siteKota || null,
          c.status || 'pending',
          c.note || 'Not Register',
          c.created_at || null,
          c.updated_at || null
        ]);
        insertedCustomers++;

        // Relasikan ke sales_customers jika ada data assigned_sales
        const salesList = c.assigned_sales || [];
        for (const s of salesList) {
          const sId = s.id || s.sales_id;
          if (sId) {
            await client.query(`
              INSERT INTO sales_customers (sales_id, customer_id)
              VALUES ($1, $2)
              ON CONFLICT DO NOTHING
            `, [sId, id]).catch(() => {});
            salesCustomerLinks++;
          }
        }
      }
    }

    // Set sequence ID customers agar pembuatan customer baru berikutnya tidak bentrok
    await client.query(`
      SELECT setval(pg_get_serial_sequence('customers', 'id'), COALESCE((SELECT MAX(id) FROM customers), 1));
    `);
    console.log(`✓ Berhasil memasukkan ${insertedCustomers} customer baru dan ${salesCustomerLinks} relasi sales.`);

    // ==========================================
    // 2. RESTORE 8 SURVEY PRODUCTS
    // ==========================================
    console.log('\n--- 2. PROSES RESTORE 8 SURVEY PRODUCTS ---');
    const targetSurveyIds = [19, 20, 23, 24, 25, 26, 27, 28];
    let insertedSurveys = 0;

    for (const sId of targetSurveyIds) {
      // Cek apakah sudah ada di database
      const existCheck = await client.query('SELECT id FROM survey_product_data WHERE id = $1', [sId]);
      if (existCheck.rows.length > 0) {
        console.log(`[SKIP] Survey ID ${sId} sudah ada.`);
        continue;
      }

      // Cari payload dari ketiga sumber
      const k = `offline_cache_https://apps-api.aqpa-indonesia.com/api/survey-engine/product-drafts/${sId}`;
      let draftData = f1[k]?.data || f1[k] || f3[k]?.data || f3[k] || f2.localStorage?.[k]?.data || f2.localStorage?.[k];
      let idbDraft = f2.indexedDB?.['aqpa-daily-activity-offline']?.stores?.surveyDrafts?.find(s => Number(s.id) === sId || Number(s.serverId) === sId);

      const d = draftData || idbDraft?.data || {};
      const noSurvey = d.no_survey || idbDraft?.noSurvey || `SVY-1026-${String(sId).padStart(5, '0')}`;
      const status = d.status || idbDraft?.status || 'Draft';

      await client.query(`
        INSERT INTO survey_product_data
          (id, no_survey, nama_client, plant_area, alamat_lokasi, tanggal_mulai,
           nama_surveyor, leader_surveyor_id, leader_surveyor_name, anggota_surveyor,
           leader_surveyor, nama_marketing, pic_client, kontak_pic, no_inquiry,
           tujuan_survey, status, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          nama_client = EXCLUDED.nama_client,
          status = EXCLUDED.status,
          updated_at = NOW()
      `, [
        sId,
        noSurvey,
        d.nama_client || null,
        d.plant_area || null,
        d.alamat_lokasi || null,
        d.tanggal_mulai || null,
        d.nama_surveyor || null,
        d.leader_surveyor_id || null,
        d.leader_surveyor_name || null,
        JSON.stringify(d.anggota_surveyor || []),
        JSON.stringify(d.leader_surveyor || []),
        d.nama_marketing || null,
        d.pic_client || null,
        d.kontak_pic || null,
        d.no_inquiry || null,
        d.tujuan_survey || null,
        status,
        'System Recovery Backup'
      ]);

      // Insert Planned Products jika ada
      const products = d.selectedProducts || d.selected_products || [];
      for (const p of products) {
        const prodName = typeof p === 'string' ? p : (p.name || p.code || p.nama_produk);
        await client.query(`
          INSERT INTO survey_product_planned_items (survey_id, nama_produk, deskripsi, jumlah)
          VALUES ($1, $2, $3, $4)
        `, [sId, prodName, prodName, 1]);
      }

      // Insert Schedules jika ada
      const schedules = d.schedules || [];
      for (const s of schedules) {
        await client.query(`
          INSERT INTO survey_product_schedules (survey_id, hari, tanggal, rencana_area, target_item)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          sId,
          s.hari || null,
          s.tanggal || null,
          s.rencana_area || null,
          s.target_item ? Number(s.target_item) : null
        ]);
      }

      console.log(`✓ Inserted Survey ID ${sId}: ${noSurvey} (${d.nama_client || '-'})`);
      insertedSurveys++;
    }

    // Set sequence ID survey_product_data
    await client.query(`
      SELECT setval(pg_get_serial_sequence('survey_product_data', 'id'), COALESCE((SELECT MAX(id) FROM survey_product_data), 1));
    `);
    console.log(`✓ Berhasil memasukkan ${insertedSurveys} data survey.`);

    await client.query('COMMIT');
    console.log('\n=============================================================');
    console.log('BERHASIL: SELURUH 36 CUSTOMER & 8 SURVEY SELESAI DI-RESTORE!');
    console.log('=============================================================');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('GAGAL merestore data:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

restoreNewData();

