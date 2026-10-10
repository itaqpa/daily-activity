import express from 'express';

export default function reportRoutes(pool) {
  const router = express.Router();
  router.get('/manpower', async (req, res) => {
    try {
      const { project_id } = req.query;
      if (!project_id) return res.status(400).json({ error: 'project_id is required' });

      // 1. Get manpower (master data could have project_id=null but linked via rosters)
      const manpowerRes = await pool.query(`
        SELECT DISTINCT m.* 
        FROM manpower m
        LEFT JOIN group_roster_members grm ON grm.manpower_id = m.id
        LEFT JOIN group_rosters gr ON gr.id = grm.roster_id
        WHERE m.project_id = $1 OR gr.project_id = $1
      `, [project_id]);
      const manpower = manpowerRes.rows;

      // 2. Get units and areas
      const unitsRes = await pool.query(`
        SELECT u.id, u.nama, u.group_id, a.nama as nama_area 
        FROM units u
        JOIN areas a ON a.id = u.area_id
        WHERE a.project_id = $1
      `, [project_id]);
      const units = unitsRes.rows;

      // 3. Get daily hours
      const hoursRes = await pool.query(`
        SELECT h.unit_id, TO_CHAR(h.tanggal, 'YYYY-MM-DD') as tanggal, h.jam
        FROM daily_hours h
        JOIN units u ON u.id = h.unit_id
        JOIN areas a ON a.id = u.area_id
        WHERE a.project_id = $1
      `, [project_id]);
      const hours = hoursRes.rows;

      // 4. Get rosters
      const rostersRes = await pool.query(`
        SELECT r.id, r.group_id, TO_CHAR(r.tanggal_berlaku, 'YYYY-MM-DD') as tanggal_berlaku,
               m.manpower_id
        FROM group_rosters r
        JOIN group_roster_members m ON m.roster_id = r.id
        WHERE r.project_id = $1
        ORDER BY r.tanggal_berlaku ASC
      `, [project_id]);
      
      const rosters = rostersRes.rows;
      
      // Helper to get members of a group at a specific date
      function getGroupMembersAt(groupId, date) {
        let members = [];
        let latestDate = null;
        for (const r of rosters) {
          if (r.group_id === groupId && r.tanggal_berlaku <= date) {
            if (!latestDate || r.tanggal_berlaku >= latestDate) {
              latestDate = r.tanggal_berlaku;
            }
          }
        }
        if (latestDate) {
          members = rosters.filter(r => r.group_id === groupId && r.tanggal_berlaku === latestDate).map(r => r.manpower_id);
        }
        return members;
      }

      const unitById = (id) => units.find(u => u.id === id);

      // Compute
      const per = {};
      manpower.forEach(m => per[m.id] = { mp: m, dates: new Set(), hours: 0, units: {}, daily: {} });
      const day = {};
      
      hours.forEach(h => {
        const u = unitById(h.unit_id);
        if (!u || !u.group_id) return;
        const hrs = Number(h.jam) || 0;
        if (hrs <= 0) return;
        
        const mem = getGroupMembersAt(u.group_id, h.tanggal);
        if (!mem.length) return;

        if (!day[h.tanggal]) day[h.tanggal] = { units: {}, heads: new Set(), total: 0 };
        
        day[h.tanggal].units[u.id] = (day[h.tanggal].units[u.id] || 0) + hrs * mem.length;
        day[h.tanggal].total += hrs * mem.length;

        mem.forEach(mid => {
          const p = per[mid];
          if (!p) return;
          p.dates.add(h.tanggal);
          p.hours += hrs;
          p.units[u.id] = (p.units[u.id] || 0) + hrs;
          if (!p.daily[h.tanggal]) p.daily[h.tanggal] = { total: 0, units: {} };
          p.daily[h.tanggal].total += hrs;
          p.daily[h.tanggal].units[u.id] = (p.daily[h.tanggal].units[u.id] || 0) + hrs;
          day[h.tanggal].heads.add(mid);
        });
      });

      // Prepare response data
      
      // 1. dataJoinSelesai
      const mpList = Object.values(per).filter(p => p.dates.size > 0); // only show those who worked
      const dataJoinSelesai = mpList.map((p, i) => {
        const ds = [...p.dates].sort();
        const worked = ds.length > 0;
        const uList = Object.keys(p.units)
          .map(id => ({ u: unitById(Number(id)), h: p.units[id] }))
          .sort((a, b) => b.h - a.h)
          .map(x => `${x.u.nama_area} - ${x.u.nama}`)
          .join(', ');

        // Status is active if they are in any current group roster. We'll just say Selesai/Aktif 
        // We can simplify this: if they worked in the last 7 days, "Aktif", else "Selesai" (or better, query the latest roster)
        const today = new Date().toISOString().split('T')[0];
        let status = 'Selesai';
        // Check if this member is in any group's latest roster
        const isCurrent = rosters.filter(r => r.manpower_id === p.mp.id).some(r => {
          // Check if this roster is the latest for its group
          const latestR = rosters.filter(r2 => r2.group_id === r.group_id).reduce((latest, current) => current.tanggal_berlaku > latest.tanggal_berlaku ? current : latest, {tanggal_berlaku: '1970-01-01'});
          return latestR.tanggal_berlaku === r.tanggal_berlaku;
        });
        if (isCurrent) status = 'Aktif';

        const row = {
          id: p.mp.id,
          no: i + 1,
          nama: p.mp.nama,
          posisi: p.mp.posisi,
          mulai: worked ? ds[0] : '-',
          selesai: worked ? ds[ds.length - 1] : '-',
          hari: ds.length,
          jam: p.hours,
          status: status,
          area: uList || '-',
          rate: p.mp.rate_per_jam || 0,
          daily: p.daily
        };
        units.forEach(u => {
          row[`u_${u.id}`] = p.units[u.id] || 0;
        });
        return row;
      });

      // 2. dataManpowerUnit
      const dataManpowerUnit = mpList.map((p, i) => {
        const row = {
          id: p.mp.id,
          nama: p.mp.nama,
          posisi: p.mp.posisi,
          total: p.hours
        };
        units.forEach(u => {
          row[`u_${u.id}`] = p.units[u.id] || 0;
        });
        return row;
      });

      // 3. dataManHour
      const dates = Object.keys(day).sort((a, b) => b.localeCompare(a)); // desc
      const dataManHour = dates.map(d => {
        const row = {
          id: d,
          tanggal: d,
          total: day[d].total,
          hadir: day[d].heads.size
        };
        units.forEach(u => {
          row[`u_${u.id}`] = day[d].units[u.id] || 0;
        });
        return row;
      });

      res.json({
        units: units.map(u => ({ id: u.id, nama: u.nama, area: u.nama_area })),
        dataJoinSelesai,
        dataManpowerUnit,
        dataManHour
      });

    } catch (err) {
      console.error('Error fetching report:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /* ============ GET /api/report/cost ============ */
  router.get('/cost', async (req, res) => {
    try {
      const { project_id } = req.query;
      if (!project_id) return res.status(400).json({ error: 'project_id is required' });

      // 1. Units & Areas
      const unitsRes = await pool.query(`
        SELECT u.id, u.nama, u.group_id, a.id as area_id, a.nama as nama_area, a.bobot as area_weight, u.bobot as unit_weight
        FROM units u
        JOIN areas a ON a.id = u.area_id
        WHERE a.project_id = $1
        ORDER BY a.nama, u.nama
      `, [project_id]);
      const units = unitsRes.rows;
      const unitById = id => units.find(u => u.id === id);

      // 2. Areas distinct
      const areasMap = {};
      units.forEach(u => {
        if (!areasMap[u.area_id]) areasMap[u.area_id] = { id: u.area_id, nama: u.nama_area, units: [] };
        areasMap[u.area_id].units.push(u.id);
      });
      const areas = Object.values(areasMap);

      // 3. Manpower
      const mpRes = await pool.query(`
        SELECT DISTINCT m.id, m.nama, m.posisi, m.rate_per_jam
        FROM manpower m
        LEFT JOIN group_roster_members grm ON grm.manpower_id = m.id
        LEFT JOIN group_rosters gr ON gr.id = grm.roster_id
        WHERE m.project_id = $1 OR gr.project_id = $1
      `, [project_id]);
      const manpower = mpRes.rows;
      const mpById = id => manpower.find(m => m.id === id);

      // 4. Rosters
      const rostersRes = await pool.query(`
        SELECT r.id, r.group_id, TO_CHAR(r.tanggal_berlaku, 'YYYY-MM-DD') as tanggal_berlaku,
               m.manpower_id
        FROM group_rosters r
        JOIN group_roster_members m ON m.roster_id = r.id
        WHERE r.project_id = $1
        ORDER BY r.tanggal_berlaku ASC
      `, [project_id]);
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

      // 5. Daily hours
      const hoursRes = await pool.query(`
        SELECT h.unit_id, TO_CHAR(h.tanggal, 'YYYY-MM-DD') as tanggal, h.jam
        FROM daily_hours h
        JOIN units u ON u.id = h.unit_id
        JOIN areas a ON a.id = u.area_id
        WHERE a.project_id = $1
      `, [project_id]);
      const hours = hoursRes.rows;

      // 6. Project costs (Akomodasi / Hotel / Transportasi / Consumable)
      const costsRes = await pool.query(`
        SELECT pc.id, TO_CHAR(pc.tanggal, 'YYYY-MM-DD') as tanggal, pc.kategori, pc.keterangan,
               pc.jumlah, pc.unit_id as dibebankan_ke
        FROM project_costs pc
        WHERE pc.project_id = $1
        ORDER BY pc.tanggal DESC
      `, [project_id]);
      const costs = costsRes.rows;

      // =========== costByUnit logic (mirrors HTML reference) ===========
      const KATEGORI = ['Akomodasi', 'Hotel', 'Transportasi', 'Consumable'];
      const emptyCost = () => ({ uniqueManpower: 0, manHours: 0, manpower: 0, Akomodasi: 0, Hotel: 0, Transportasi: 0, Consumable: 0, total: 0 });

      const res_unit = {};
      units.forEach(u => {
        res_unit[u.id] = emptyCost();
        res_unit[u.id]._members = new Set();
      });

      hours.forEach(h => {
        const r = res_unit[h.unit_id];
        if (!r) return;
        const u = unitById(h.unit_id);
        const members = getGroupMembersAt(u && u.group_id, h.tanggal);
        const hrs = Number(h.jam) || 0;
        if (hrs <= 0) return;
        const totalRate = members.reduce((s, mid) => s + (Number((mpById(mid) || {}).rate_per_jam) || 0), 0);
        r.manHours += hrs * members.length;
        members.forEach(m => r._members.add(m));
        r.uniqueManpower = r._members.size;
        r.manpower += hrs * totalRate;
      });

      // Pool biaya prorata
      const pool_costs = { Akomodasi: 0, Hotel: 0, Transportasi: 0, Consumable: 0 };
      costs.forEach(c => {
        const amt = Number(c.jumlah) || 0;
        const kat = c.kategori;
        // dibebankan_ke: null/'prorata' = prorata, or unit_id (number)
        const unitId = c.dibebankan_ke && !isNaN(Number(c.dibebankan_ke)) ? Number(c.dibebankan_ke) : null;
        if (!unitId || !res_unit[unitId]) {
          pool_costs[kat] = (pool_costs[kat] || 0) + amt;
        } else {
          res_unit[unitId][kat] = (res_unit[unitId][kat] || 0) + amt;
        }
      });

      // Distribute pool prorata by manHours
      const unitIds = units.map(u => u.id);
      const totalMH = unitIds.reduce((s, id) => s + res_unit[id].manHours, 0);
      const share = {};
      if (totalMH > 0) {
        unitIds.forEach(id => share[id] = res_unit[id].manHours / totalMH);
      } else {
        unitIds.forEach(id => share[id] = unitIds.length > 0 ? 1 / unitIds.length : 0);
      }
      unitIds.forEach(id => {
        KATEGORI.forEach(k => { res_unit[id][k] += (pool_costs[k] || 0) * share[id]; });
        const r = res_unit[id];
        r.total = r.manpower + r.Akomodasi + r.Hotel + r.Transportasi + r.Consumable;
      });

      // sumCost helper
      const sumCost = list => {
        const o = emptyCost();
        const allMembers = new Set();
        list.forEach(c => { 
          Object.keys(o).forEach(k => { if (k !== 'total' && k !== 'uniqueManpower' && k !== '_members') o[k] += c[k] || 0; }); 
          if (c._members) c._members.forEach(m => allMembers.add(m));
        });
        o._members = allMembers;
        o.uniqueManpower = allMembers.size;
        o.total = o.manpower + o.Akomodasi + o.Hotel + o.Transportasi + o.Consumable;
        return o;
      };

      // Build per-unit rows
      const dataPerUnit = units.map(u => ({
        id: u.id,
        scope: `${u.nama_area} - ${u.nama}`,
        area: u.nama_area,
        unit: u.nama,
        ...res_unit[u.id]
      }));

      // Build per-area rows
      const dataPerArea = areas.map(a => {
        const aUnits = units.filter(u => u.area_id === a.id);
        const s = sumCost(aUnits.map(u => res_unit[u.id]));
        return { id: a.id, scope: a.nama, ...s };
      });

      // Total project
      const totalProject = sumCost(Object.values(res_unit));

      // Pengeluaran list (ledger)
      const ledger = costs.map(c => ({
        id: c.id,
        tanggal: c.tanggal,
        kategori: c.kategori,
        keterangan: c.keterangan,
        jumlah: Number(c.jumlah) || 0,
        pembebanan: c.dibebankan_ke && !isNaN(Number(c.dibebankan_ke))
          ? (() => { const u = unitById(Number(c.dibebankan_ke)); return u ? `${u.nama_area} - ${u.nama}` : 'Unit tidak ditemukan'; })()
          : 'Prorata Semua Unit'
      }));

      res.json({
        units: units.map(u => ({ id: u.id, nama: u.nama, area: u.nama_area })),
        dataPerUnit,
        dataPerArea,
        totalProject,
        pool_costs,
        totalMH,
        ledger
      });

    } catch (err) {
      console.error('Error fetching cost report:', err);
      res.status(500).json({ error: err.message });
    }
  });

  
  router.get('/all-costs', async (req, res) => {
    try {
      const userId = req.user ? req.user.id : null;
      let projRes;
      if (userId) {
        projRes = await pool.query(`
          SELECT p.id, p.no_project, p.budget_biaya,
                 TO_CHAR(MIN(dh.tanggal), 'YYYY-MM-DD') as actual_mulai,
                 TO_CHAR(MAX(dh.tanggal), 'YYYY-MM-DD') as actual_selesai
          FROM projects p
          JOIN v_akses_project v ON v.project_id = p.id
          LEFT JOIN areas a ON a.project_id = p.id
          LEFT JOIN units u ON u.area_id = a.id
          LEFT JOIN daily_hours dh ON dh.unit_id = u.id
          WHERE v.user_id = $1
          GROUP BY p.id, p.no_project
          ORDER BY p.id DESC
        `, [userId]);
      } else {
        projRes = await pool.query(`
          SELECT p.id, p.no_project, p.budget_biaya,
                 TO_CHAR(MIN(dh.tanggal), 'YYYY-MM-DD') as actual_mulai,
                 TO_CHAR(MAX(dh.tanggal), 'YYYY-MM-DD') as actual_selesai
          FROM projects p
          LEFT JOIN areas a ON a.project_id = p.id
          LEFT JOIN units u ON u.area_id = a.id
          LEFT JOIN daily_hours dh ON dh.unit_id = u.id
          GROUP BY p.id, p.no_project
          ORDER BY p.id DESC
        `);
      }
      const projects = projRes.rows;

      const result = [];

      for (const proj of projects) {
        const project_id = proj.id;

        const unitsRes = await pool.query(`
          SELECT u.id, u.nama, u.group_id, a.id as area_id, a.nama as nama_area
          FROM units u JOIN areas a ON a.id = u.area_id
          WHERE a.project_id = $1
        `, [project_id]);
        const units = unitsRes.rows;
        const unitById = id => units.find(u => u.id === id);

        const mpRes = await pool.query(`
          SELECT DISTINCT m.id, m.nama, m.posisi, m.rate_per_jam
          FROM manpower m
          LEFT JOIN group_roster_members grm ON grm.manpower_id = m.id
          LEFT JOIN group_rosters gr ON gr.id = grm.roster_id
          WHERE m.project_id = $1 OR gr.project_id = $1
        `, [project_id]);
        const manpower = mpRes.rows;
        const mpById = id => manpower.find(m => m.id === id);

        const rostersRes = await pool.query(`
          SELECT r.id, r.group_id, TO_CHAR(r.tanggal_berlaku, 'YYYY-MM-DD') as tanggal_berlaku, m.manpower_id
          FROM group_rosters r JOIN group_roster_members m ON m.roster_id = r.id
          WHERE r.project_id = $1 ORDER BY r.tanggal_berlaku ASC
        `, [project_id]);
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

        const hoursRes = await pool.query(`
          SELECT h.unit_id, TO_CHAR(h.tanggal, 'YYYY-MM-DD') as tanggal, h.jam
          FROM daily_hours h JOIN units u ON u.id = h.unit_id JOIN areas a ON a.id = u.area_id
          WHERE a.project_id = $1
        `, [project_id]);
        const hours = hoursRes.rows;

        const costsRes = await pool.query(`
          SELECT pc.id, TO_CHAR(pc.tanggal, 'YYYY-MM-DD') as tanggal, pc.kategori, pc.keterangan,
                 pc.jumlah, pc.unit_id as dibebankan_ke
          FROM project_costs pc WHERE pc.project_id = $1 ORDER BY pc.tanggal DESC
        `, [project_id]);
        const costs = costsRes.rows;

        const KATEGORI = ['Akomodasi', 'Hotel', 'Transportasi', 'Consumable'];
        const emptyCost = () => ({ uniqueManpower: 0, manHours: 0, manpower: 0, Akomodasi: 0, Hotel: 0, Transportasi: 0, Consumable: 0, total: 0 });
        const res_unit = {};
        units.forEach(u => {
          res_unit[u.id] = emptyCost();
          res_unit[u.id]._members = new Set();
        });

        // Breakdown harian (aktual) untuk dashboard KPI
        const daily = {};
        const dayRow = d => (daily[d] = daily[d] || { manpower: 0, Akomodasi: 0, Hotel: 0, Transportasi: 0, Consumable: 0, manHours: 0, orgHari: 0, _m: new Set() });

        hours.forEach(h => {
          const r = res_unit[h.unit_id];
          if (!r) return;
          const u = unitById(h.unit_id);
          const members = getGroupMembersAt(u && u.group_id, h.tanggal);
          const hrs = Number(h.jam) || 0;
          if (hrs <= 0) return;
          const totalRate = members.reduce((s, mid) => s + (Number((mpById(mid) || {}).rate_per_jam) || 0), 0);
          const dr = dayRow(h.tanggal);
          dr.manpower += hrs * totalRate;
          dr.manHours += hrs * members.length;
          members.forEach(m => dr._m.add(m));
          dr.orgHari = dr._m.size;
          r.manHours += hrs * members.length;
          members.forEach(m => r._members.add(m));
          r.uniqueManpower = r._members.size;
          r.manpower += hrs * totalRate;
        });

        const pool_costs = { Akomodasi: 0, Hotel: 0, Transportasi: 0, Consumable: 0 };
        costs.forEach(c => {
          const amt = Number(c.jumlah) || 0;
          const kat = c.kategori;
          if (c.tanggal) { const dr = dayRow(c.tanggal); dr[kat] = (dr[kat] || 0) + amt; }
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
          const allMembers = new Set();
          list.forEach(c => { 
            Object.keys(o).forEach(k => { if (k !== 'total' && k !== 'uniqueManpower' && k !== '_members') o[k] += c[k] || 0; }); 
            if (c._members) c._members.forEach(m => allMembers.add(m));
          });
          o._members = allMembers;
          o.uniqueManpower = allMembers.size;
          o.total = o.manpower + o.Akomodasi + o.Hotel + o.Transportasi + o.Consumable;
          return o;
        };

        const dataPerUnit = units.map(u => ({
          id: u.id,
          scope: `${u.nama_area} - ${u.nama}`,
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
            ? (() => { const u = unitById(Number(c.dibebankan_ke)); return u ? `${u.nama_area} - ${u.nama}` : 'Unit tidak ditemukan'; })()
            : 'Prorata Semua Unit'
        }));

        result.push({
          id: proj.id,
          no_project: proj.no_project,
          actual_mulai: proj.actual_mulai,
          actual_selesai: proj.actual_selesai,
          budget_biaya: Number(proj.budget_biaya) || 0,
          deviasi: (Number(proj.budget_biaya) || 0) - totalProject.total,
          daily: Object.entries(daily).map(([tanggal, d]) => {
            const { _m, ...rest } = d;
            return { tanggal, ...rest };
          }).sort((a, b) => a.tanggal.localeCompare(b.tanggal)),
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

  return router;
};
