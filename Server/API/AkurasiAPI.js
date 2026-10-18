import express from 'express';

const router = express.Router();

const AKURASI_API_KEY = process.env.AKURASI_API_KEY || 'Ym95Y29tcG9zaXRpb25leHBsYW5hdGlvbnRob3VnaHRwZWFjZWdpcmxjb2FjaHNlbnM=';
const AKURASI_BASE_URL = process.env.AKURASI_BASE_URL || 'https://akurasi-api.aqpa-indonesia.com/api/integration';

/**
 * GET /api/akurasi/sales-orders
 * Mengambil atau mencari Sales Order dari Akurasi API berdasarkan No SO atau keyword
 */
router.get('/sales-orders', async (req, res) => {
  try {
    const { ref, search, keyword, offset = 0, limit = 50 } = req.query;
    const queryTerm = (ref || search || keyword || '').trim();

    const url = new URL(`${AKURASI_BASE_URL}/penjualan-so`);
    if (queryTerm) {
      url.searchParams.append('search', queryTerm);
    }
    url.searchParams.append('offset', offset);
    url.searchParams.append('limit', limit);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': AKURASI_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: `Gagal memanggil API Akurasi SO (HTTP ${response.status})`
      });
    }

    const json = await response.json();
    let data = json.data || [];

    // Jika ada parameter ref/search, filter tambahan secara case-insensitive & toleran terhadap spasi/tanda hubung
    if (queryTerm) {
      const q = queryTerm.toLowerCase().trim();
      const qClean = q.replace(/[\s\-_]/g, '');
      const filtered = data.filter(item => {
        const noSo = (item.no_so || '').toLowerCase();
        const noSoClean = noSo.replace(/[\s\-_]/g, '');
        const customer = (item.nama_pelanggan || '').toLowerCase();
        const poCustomer = (item.no_po_customer || '').toLowerCase();
        return noSo.includes(q) || noSoClean.includes(qClean) || customer.includes(q) || poCustomer.includes(q);
      });
      if (filtered.length > 0) {
        data = filtered;
      }
    }

    // Kelompokkan data per no_so jika 1 SO memiliki banyak baris item
    const grouped = {};
    for (const item of data) {
      const soNum = item.no_so || 'UNKNOWN';
      if (!grouped[soNum]) {
        grouped[soNum] = {
          no_so: item.no_so,
          tgl_so: item.tgl_so,
          tgl_pengiriman: item.tgl_pengiriman,
          nama_pelanggan: item.nama_pelanggan,
          no_pelanggan: item.no_pelanggan,
          no_po_customer: item.no_po_customer,
          nama_salesman: item.nama_salesman,
          shipto: item.shipto, // Alamat tujuan pengiriman
          deskripsi_so: item.deskripsi_so,
          status: item.status,
          items: []
        };
      }

      grouped[soNum].items.push({
        no_barang: item.no_barang,
        deskripsi_barang: item.deskripsi_barang,
        qty: parseFloat(item.qty) || 0,
        qty_shipped: parseFloat(item.qty_shipped) || 0,
        sisa_kirim: parseFloat(item.sisa_kirim) || 0,
        uom: item.uom || 'Pcs',
        unit_price: item.unit_price || 0
      });
    }

    return res.json({
      success: true,
      count: Object.keys(grouped).length,
      data: Object.values(grouped)
    });
  } catch (error) {
    console.error('Error AkurasiAPI SO:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error saat mengambil data SO Akurasi',
      error: error.message
    });
  }
});

/**
 * GET /api/akurasi/pembelian
 * Mengambil atau mencari Purchase Order (PO) dari Akurasi API untuk tugas Pickup
 */
router.get('/pembelian', async (req, res) => {
  try {
    const { ref, search, keyword, page = 1, limit = 50 } = req.query;
    const queryTerm = (ref || search || keyword || '').trim();

    const url = new URL(`${AKURASI_BASE_URL}/pembelian`);
    if (queryTerm) {
      url.searchParams.append('search', queryTerm);
    }
    url.searchParams.append('page', page);
    url.searchParams.append('limit', limit);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': AKURASI_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: `Gagal memanggil API Akurasi PO (HTTP ${response.status})`
      });
    }

    const json = await response.json();
    let data = json.data || [];

    // Filter jika dicari berdasarkan nomor PO atau nama Vendor (case-insensitive & toleran spasi/dash)
    if (queryTerm) {
      const q = queryTerm.toLowerCase().trim();
      const qClean = q.replace(/[\s\-_]/g, '');
      const filtered = data.filter(item => {
        const rawNoPo = item.no_pembelian || item.no_po || item.po_number || item.no_permintaan || item.so_no || '';
        const noPo = rawNoPo.toLowerCase();
        const noPoClean = noPo.replace(/[\s\-_]/g, '');
        const vendor = (item.nama_pemasok || item.vendor_name || '').toLowerCase();
        return noPo.includes(q) || noPoClean.includes(qClean) || vendor.includes(q);
      });
      if (filtered.length > 0) {
        data = filtered;
      }
    }

    // Kelompokkan data per no_po jika 1 PO memiliki banyak baris barang
    const grouped = {};
    for (const item of data) {
      const poNum = item.no_pembelian || item.no_po || item.po_number || item.no_permintaan || 'UNKNOWN';
      if (!grouped[poNum]) {
        grouped[poNum] = {
          no_po: poNum,
          tgl_po: item.tgl_pembelian || item.tgl_po || item.po_date || item.tgl_permintaan,
          nama_pemasok: item.nama_pemasok || item.vendor_name || 'Vendor',
          alamat_pemasok: item.alamat_pemasok || item.vendor_address || item.shipto || 'Alamat Vendor',
          status: item.status || item.status_pembayaran || '',
          items: []
        };
      }

      grouped[poNum].items.push({
        no_barang: item.no_barang || item.item_code,
        deskripsi_barang: item.deskripsi_barang || item.item_name,
        qty: parseFloat(item.qty || item.quantity) || 0,
        uom: item.uom || item.unit || 'Pcs',
        unit_price: parseFloat(item.price || item.unit_price || item.dpp || 0)
      });
    }

    return res.json({
      success: true,
      count: Object.keys(grouped).length,
      data: Object.values(grouped)
    });
  } catch (error) {
    console.error('Error AkurasiAPI PO:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error saat mengambil data PO Akurasi',
      error: error.message
    });
  }
});

export default router;
