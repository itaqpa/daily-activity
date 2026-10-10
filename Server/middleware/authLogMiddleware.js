import jwt from 'jsonwebtoken';

export function createAuthLogMiddleware(pool, jwtSecret) {
  return async (req, res, next) => {
    // 1. Ambil token dari header Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    let token = null;
    let decoded = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      try {
        decoded = jwt.verify(token, jwtSecret);
        req.user = decoded; // simpan data user di request
      } catch (err) {
        // Token tidak valid atau expired
      }
    }

    // Lanjut ke handler berikutnya agar proses utama berjalan
    next();

    // 2. Logging secara asynchronous setelah (atau bersamaan) proses (non-blocking)
    res.on('finish', async () => {
      const method = req.method;
      const url = req.originalUrl;
      
      // Jika request adalah options atau bukan ke /api, abaikan (menghindari spam)
      if (method === 'OPTIONS' || !url.startsWith('/api')) return;

      // Ambil IP asli
      let rawIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
      let ip = rawIp === '::1' ? '127.0.0.1' : rawIp;
      if (ip.includes('::ffff:')) {
        ip = ip.split('::ffff:')[1];
      }

      let userId = decoded ? decoded.id : null;
      // Gunakan nama user dari JWT jika ada, jika tidak email, jika tidak 'Sistem/Unauthenticated'
      let username = decoded ? (decoded.name || decoded.email) : 'Unauthenticated'; 
      let module = 'SYSTEM';
      let action = `HTTP ${method}`;
      let description = `Mengakses ${url} (Status: ${res.statusCode})`;

      // Coba cari identitas objek dari body (misal nama_customer, project_name, username, dsb)
      let targetName = '';
      if (req.body && (method === 'POST' || method === 'PUT')) {
        targetName = req.body.nama_customer || 
                     req.body.nama_sales || 
                     req.body.project_name || 
                     req.body.nama_project || 
                     req.body.username || 
                     req.body.email ||
                     req.body.nama_manpower || 
                     req.body.nama_divisi || 
                     req.body.nama_jabatan || 
                     req.body.nama || '';
      }
      const targetDetail = targetName ? `: ${targetName}` : '';

      // Penentuan Modul dan Deskripsi
      if (url.includes('/api/login')) {
        module = 'AUTH';
        if (method === 'POST') {
          username = req.body.email || req.body.username || 'Unauthenticated';
          action = res.statusCode === 200 ? 'LOGIN SUCCESS' : 'LOGIN FAILED';
          description = res.statusCode === 200 ? 'Berhasil masuk ke dalam sistem' : 'Gagal login (kredensial salah)';
        }
      } else if (url.includes('/api/customers')) {
        module = 'MARKETING';
        action = 'MANAGE CUSTOMER';
        if (method === 'GET') description = 'Melihat data Customer';
        if (method === 'POST') description = `Menambahkan Customer baru${targetDetail}`;
        if (method === 'PUT') description = `Memperbarui data Customer${targetDetail}`;
        if (method === 'DELETE') description = 'Menghapus data Customer';
      } else if (url.includes('/api/sales')) {
        module = 'MARKETING';
        action = 'MANAGE SALES';
        if (method === 'GET') description = 'Melihat data Sales';
        if (method === 'POST') description = `Menambahkan Sales baru${targetDetail}`;
        if (method === 'PUT') description = `Memperbarui data Sales${targetDetail}`;
      } else if (url.includes('/api/activities')) {
        module = 'MARKETING';
        action = 'MANAGE ACTIVITY';
        if (method === 'GET') description = 'Melihat Riwayat Aktivitas';
        if (method === 'POST') description = 'Mencatat Aktivitas Harian baru';
      } else if (url.includes('/api/installation')) {
        module = 'INSTALLATION';
        action = 'MANAGE INSTALLATION';
        if (method === 'GET') description = 'Melihat Project Instalasi';
        if (method === 'POST') description = `Membuat Project Instalasi baru${targetDetail}`;
        if (method === 'PUT') description = `Memperbarui data Project Instalasi${targetDetail}`;
      } else if (url.includes('/api/users') || url.includes('/api/roles')) {
        module = 'MASTER DATA';
        action = 'MANAGE USER/AKSES';
        if (method === 'GET') description = 'Melihat data User / Manajemen Akses';
        if (method === 'POST') description = `Menambahkan Data User/Akses baru${targetDetail}`;
        if (method === 'PUT') description = `Memperbarui Data User/Akses${targetDetail}`;
      } else if (url.includes('/api/global-logs')) {
        module = 'SYSTEM';
        action = 'VIEW LOGS';
        description = 'Melihat History & Global Activity Logs';
      } else if (url.includes('/api/report')) {
        module = 'REPORTING';
        action = 'VIEW REPORT';
        description = 'Melihat / Mengakses Laporan Data';
      } else if (url.includes('/api/install-projects') || url.includes('/api/cost-project') || url.includes('/api/daily-progress') || url.includes('/api/manpower')) {
        module = 'INSTALLATION';
        action = 'MANAGE PROJECT';
        if (method === 'GET') description = 'Melihat Data Project / Cost / Daily Progress';
        if (method === 'POST') description = `Menambahkan Data Project/Progress Baru${targetDetail}`;
        if (method === 'PUT') description = `Memperbarui Data Project/Progress${targetDetail}`;
        if (method === 'DELETE') description = 'Menghapus Data Project/Progress';
      }

      // Abaikan request GET yang tidak di-mapping secara spesifik untuk menghindari spam
      if (module === 'SYSTEM' && method === 'GET' && action.startsWith('HTTP')) {
        return;
      }

      // Jika masih unauthenticated dan bukan login, abaikan log untuk menghindari spam dari request gagal
      if (username === 'Unauthenticated' && !url.includes('/api/login')) {
        return;
      }

      try {
        await pool.query(
          `INSERT INTO log_activity_all (user_id, username, action, module, description, ip_address, token_used) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, username, action, module, description, ip, token]
        );
      } catch (err) {
        console.error('Failed to log activity:', err);
      }
    });
  };
}
