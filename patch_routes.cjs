const fs = require('fs');

let code = fs.readFileSync('Server/routes/reportRoutes.js', 'utf8');

const allCostsCode = `
  router.get('/all-costs', async (req, res) => {
    try {
      const projRes = await pool.query(\`
        SELECT p.id, p.no_project,
               TO_CHAR(MIN(dh.tanggal), 'YYYY-MM-DD') as actual_mulai,
               TO_CHAR(MAX(dh.tanggal), 'YYYY-MM-DD') as actual_selesai
        FROM installation_projects p
        LEFT JOIN areas a ON a.project_id = p.id
        LEFT JOIN units u ON u.area_id = a.id
        LEFT JOIN daily_hours dh ON dh.unit_id = u.id
        GROUP BY p.id, p.no_project
        ORDER BY p.id DESC
      \`);
      const projects = projRes.rows;

      const result = [];

      for (const proj of projects) {
        const project_id = proj.id;

        const unitsRes = await pool.query(\`
          SELECT u.id, u.nama, u.group_id, a.id as area_id, a.nama as nama_area
          FROM units u JOIN areas a ON a.id = u.area_id
          WHERE a.project_id = $1
        \`, [project_id]);
        const units = unitsRes.rows;
        const unitById = id => units.find(u => u.id === id);

        const mpRes = await pool.query(\`
          SELECT DISTINCT m.id, m.nama, m.posisi, m.rate_per_jam
          FROM manpower m
          LEFT JOIN group_roster_members grm ON grm.manpower_id = m.id
          LEFT JOIN group_rosters gr ON gr.id = grm.roster_id
          WHERE m.project_id = $1 OR gr.project_id = $1
        \`, [project_id]);
        const manpower = mpRes.rows;
        const mpById = id => manpower.find(m => m.id === id);

        const rostersRes = await pool.query(\`
          SELECT r.id, r.group_id, TO_CHAR(r.tanggal_berlaku, 'YYYY-MM-DD') as tanggal_berlaku, m.manpower_id
          FROM group_rosters r JOIN group_roster_members m ON m.roster_id = r.id
          WHERE r.project_id = $1 ORDER BY r.tanggal_berlaku ASC
        \`, [project_id]);
        const rosters = rostersRes.rows;

        function getGroupMembersAt(groupId, date) {
          if (!groupId || !date) return [];
          let latestDate = null;
          for (const r of rosters) {
            if (r.group_id === groupId && r.tanggal_berlaku <= date) {
              if (!latestDate || r.tanggal_berlaku >= latestDate) latestDate = r.tanggal_berlaku;
            }
          }
          if (!latestDate) return [];
          return rosters.filter(r => r.group_id === groupId && r.tanggal_berlaku === latestDate).map(r => r.manpower_id);
        }

        const hoursRes = await pool.query(\`
          SELECT h.unit_id, TO_CHAR(h.tanggal, 'YYYY-MM-DD') as tanggal, h.jam
          FROM daily_hours h JOIN units u ON u.id = h.unit_id JOIN areas a ON a.id = u.area_id
          WHERE a.project_id = $1
        \`, [project_id]);
        const hours = hoursRes.rows;

        const costsRes = await pool.query(\`
          SELECT pc.id, TO_CHAR(pc.tanggal, 'YYYY-MM-DD') as tanggal, pc.kategori, pc.keterangan,
                 pc.jumlah, pc.unit_id as dibebankan_ke
          FROM project_costs pc WHERE pc.project_id = $1 ORDER BY pc.tanggal DESC
        \`, [project_id]);
        const costs = costsRes.rows;

        const KATEGORI = ['Akomodasi', 'Hotel', 'Transportasi', 'Consumable'];
        const emptyCost = () => ({ manDays: 0, manHours: 0, manpower: 0, Akomodasi: 0, Hotel: 0, Transportasi: 0, Consumable: 0, total: 0 });
        const res_unit = {};
        units.forEach(u => res_unit[u.id] = emptyCost());

        hours.forEach(h => {
          const r = res_unit[h.unit_id];
          if (!r) return;
          const u = unitById(h.unit_id);
          const members = getGroupMembersAt(u && u.group_id, h.tanggal);
          const hrs = Number(h.jam) || 0;
          if (hrs <= 0) return;
          const totalRate = members.reduce((s, mid) => s + (Number((mpById(mid) || {}).rate_per_jam) || 0), 0);
          r.manHours += hrs * members.length;
          r.manDays += members.length;
          r.manpower += hrs * totalRate;
        });

        const pool_costs = { Akomodasi: 0, Hotel: 0, Transportasi: 0, Consumable: 0 };
        costs.forEach(c => {
          const amt = Number(c.jumlah) || 0;
          const kat = c.kategori;
          const unitId = c.dibebankan_ke && !isNaN(Number(c.dibebankan_ke)) ? Number(c.dibebankan_ke) : null;
          if (!unitId || !res_unit[unitId]) pool_costs[kat] = (pool_costs[kat] || 0) + amt;
          else res_unit[unitId][kat] = (res_unit[unitId][kat] || 0) + amt;
        });

        const unitIds = units.map(u => u.id);
        const totalMH = unitIds.reduce((s, id) => s + res_unit[id].manHours, 0);
        const share = {};
        if (totalMH > 0) unitIds.forEach(id => share[id] = res_unit[id].manHours / totalMH);
        else unitIds.forEach(id => share[id] = unitIds.length > 0 ? 1 / unitIds.length : 0);

        unitIds.forEach(id => {
          KATEGORI.forEach(k => { res_unit[id][k] += (pool_costs[k] || 0) * share[id]; });
          const r = res_unit[id];
          r.total = r.manpower + r.Akomodasi + r.Hotel + r.Transportasi + r.Consumable;
        });

        const sumCost = list => {
          const o = emptyCost();
          list.forEach(c => { Object.keys(o).forEach(k => { if (k !== 'total') o[k] += c[k] || 0; }); });
          o.total = o.manpower + o.Akomodasi + o.Hotel + o.Transportasi + o.Consumable;
          return o;
        };

        const dataPerUnit = units.map(u => ({
          id: u.id,
          scope: \`\${u.nama_area} - \${u.nama}\`,
          ...res_unit[u.id]
        }));

        const totalProject = sumCost(Object.values(res_unit));

        const ledger = costs.map(c => ({
          id: c.id,
          tanggal: c.tanggal,
          kategori: c.kategori,
          keterangan: c.keterangan,
          jumlah: Number(c.jumlah) || 0,
          pembebanan: c.dibebankan_ke && !isNaN(Number(c.dibebankan_ke))
            ? (() => { const u = unitById(Number(c.dibebankan_ke)); return u ? \`\${u.nama_area} - \${u.nama}\` : 'Unit tidak ditemukan'; })()
            : 'Prorata Semua Unit'
        }));

        result.push({
          id: proj.id,
          no_project: proj.no_project,
          actual_mulai: proj.actual_mulai,
          actual_selesai: proj.actual_selesai,
          deviasi: '-', 
          grand_total: totalProject.total,
          dataPerUnit,
          ledger
        });
      }

      res.json(result);
    } catch (err) {
      console.error('Error fetching all costs report:', err);
      res.status(500).json({ error: err.message });
    }
  });
`;

if (!code.includes('/all-costs')) {
  code = code.replace(/return router;/g, allCostsCode + '\n  return router;');
  fs.writeFileSync('Server/routes/reportRoutes.js', code);
  console.log('Added /all-costs');
} else {
  console.log('Already exists');
}
