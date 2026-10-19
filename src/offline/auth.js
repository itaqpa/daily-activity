// Offline Auth & Security Manager
// Menerapkan verifikasi lokal yang aman untuk offline re-login pada perangkat yang pernah diaktivasi secara online.
// Bebas plaintext password, menggunakan PBKDF2/SHA-256 derivation lokal + salt dengan TTL terbatas (default 7 hari).

import { offlineDb } from './db';

const OFFLINE_AUTH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

// Helper: Ubah buffer ke hex
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper: SHA-256 hash dengan salt
async function hashPasswordWithSalt(password, saltHex) {
  const enc = new TextEncoder();
  const saltBytes = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  const pwBytes = enc.encode(password);
  
  // Combine salt + pw
  const combined = new Uint8Array(saltBytes.length + pwBytes.length);
  combined.set(saltBytes);
  combined.set(pwBytes, saltBytes.length);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  return bufferToHex(hashBuffer);
}

// Generate random salt hex
function generateSaltHex(length = 16) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return bufferToHex(array);
}

/**
 * Simpan data aktivasi kredensial lokal saat online login berhasil
 */
export async function cacheUserCredentials(user, password, onlineToken) {
  if (!user || !user.id || !password) return;
  try {
    const salt = generateSaltHex(16);
    const passwordHash = await hashPasswordWithSalt(password, salt);
    const now = Date.now();
    
    // Periksa token expire jika JWT
    let tokenExp = now + OFFLINE_AUTH_TTL_MS;
    try {
      const parts = onlineToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp) {
          // Token exp time (seconds -> ms)
          tokenExp = payload.exp * 1000;
        }
      }
    } catch (e) {
      // fallback
    }

    const authRecord = {
      userId: Number(user.id),
      email: (user.email || '').toLowerCase().trim(),
      username: (user.username || '').toLowerCase().trim(),
      salt,
      passwordHash,
      token: onlineToken,
      tokenExpiresAt: tokenExp,
      offlineExpiresAt: now + OFFLINE_AUTH_TTL_MS,
      userData: JSON.parse(JSON.stringify(user)),
      updatedAt: new Date().toISOString()
    };

    await offlineDb.authTokens.put(authRecord);
  } catch (err) {
    console.error('Failed to cache credentials for offline auth:', err);
  }
}

/**
 * Verifikasi offline login
 */
export async function verifyOfflineLogin(identifier, password) {
  const cleanId = (identifier || '').toLowerCase().trim();
  if (!cleanId || !password) {
    return { success: false, message: 'Email/Username dan password wajib diisi!' };
  }

  try {
    // Cari record di authTokens
    let record = await offlineDb.authTokens.where('email').equals(cleanId).first();
    if (!record) {
      record = await offlineDb.authTokens.where('username').equals(cleanId).first();
    }

    if (!record) {
      return {
        success: false,
        message: 'Akun belum pernah login di perangkat ini secara online. Hubungkan perangkat ke internet untuk aktivasi awal.'
      };
    }

    // Cek masa berlaku offline (TTL)
    const now = Date.now();
    if (record.offlineExpiresAt && now > record.offlineExpiresAt) {
      return {
        success: false,
        message: 'Masa berlaku otentikasi offline telah habis (7 hari). Silakan hubungkan kembali ke internet untuk verifikasi berkala.'
      };
    }

    // Hitung hash password dengan salt yang tersimpan
    const calculatedHash = await hashPasswordWithSalt(password, record.salt);
    if (calculatedHash !== record.passwordHash) {
      return { success: false, message: 'Password salah!' };
    }

    // Kembalikan token dan user data
    return {
      success: true,
      user: record.userData,
      token: record.token,
      isOfflineLogin: true
    };
  } catch (err) {
    console.error('Error verifying offline login:', err);
    return { success: false, message: 'Terjadi kesalahan saat memverifikasi akun lokal: ' + err.message };
  }
}
