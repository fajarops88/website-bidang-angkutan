/* ============================================================
 * API — komunikasi dengan Google Apps Script lewat fetch()
 * (POST wajib text/plain agar tidak memicu CORS preflight)
 * ============================================================ */
(function () {
  'use strict';
  const cfg = window.APP_CONFIG;

  function ApiError(pesan, kode) {
    const e = new Error(pesan);
    e.name = 'ApiError';
    e.kode = kode || 'ERR';
    return e;
  }

  const Api = {};

  Api.siap = function () {
    return !!cfg.GAS_URL && !/PASTE|XXXX/i.test(cfg.GAS_URL) && /^https:\/\/script\.google(usercontent)?\.com\//.test(cfg.GAS_URL);
  };

  function pastikanSiap() {
    if (!Api.siap()) {
      throw ApiError('Alamat server (GAS_URL) belum diisi dengan benar di js/config.js.', 'NO_URL');
    }
  }

  async function minta(url, opsi) {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 45000);
    try {
      const res = await fetch(url, Object.assign({ signal: ctrl.signal, redirect: 'follow' }, opsi));
      if (!res.ok) throw ApiError('Server membalas HTTP ' + res.status + '.', 'HTTP');
      const teks = await res.text();
      let json;
      try { json = JSON.parse(teks); }
      catch (e) { throw ApiError('Balasan server bukan JSON. Pastikan URL /exec benar dan akses aplikasi web diatur ke "Anyone".', 'BUKAN_JSON'); }
      return json;
    } catch (e) {
      if (e.name === 'ApiError') throw e;
      if (e.name === 'AbortError') throw ApiError('Server terlalu lama merespons. Silakan coba lagi.', 'TIMEOUT');
      throw ApiError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.', 'JARINGAN');
    } finally {
      clearTimeout(timer);
    }
  }

  function periksa(json) {
    if (!json || json.success !== true) {
      throw ApiError((json && json.message) || 'Permintaan gagal.', (json && json.code) || 'ERR');
    }
    return json;
  }

  // GET (data publik). Dicoba ulang sekali bila gagal karena jaringan.
  Api.get = async function (action, params) {
    pastikanSiap();
    const qs = new URLSearchParams(Object.assign({ action: action }, params || {})).toString();
    const url = cfg.GAS_URL + '?' + qs;
    let json;
    try { json = await minta(url); }
    catch (e) {
      if (e.kode === 'JARINGAN' || e.kode === 'TIMEOUT') json = await minta(url);
      else throw e;
    }
    return periksa(json).data;
  };

  // POST (kirim data). Tidak diulang otomatis agar tidak terjadi data ganda.
  Api.post = async function (action, data, token) {
    pastikanSiap();
    const json = await minta(cfg.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, data: data || {}, token: token || '' })
    });
    return periksa(json);
  };

  // ---------- Sesi admin (hanya hidup selama tab terbuka) ----------
  let tokenMemori = '';
  Api.token = function () {
    try { return sessionStorage.getItem('adm_token') || tokenMemori; } catch (e) { return tokenMemori; }
  };
  Api.simpanToken = function (t, user) {
    tokenMemori = t;
    try { sessionStorage.setItem('adm_token', t); sessionStorage.setItem('adm_user', user || ''); } catch (e) { /* abaikan */ }
  };
  Api.hapusToken = function () {
    tokenMemori = '';
    try { sessionStorage.removeItem('adm_token'); sessionStorage.removeItem('adm_user'); } catch (e) { /* abaikan */ }
  };
  Api.userAdmin = function () {
    try { return sessionStorage.getItem('adm_user') || ''; } catch (e) { return ''; }
  };

  Api.admin = async function (action, data) {
    try {
      return await Api.post(action, data, Api.token());
    } catch (e) {
      if (e.kode === 'SESI_HABIS') {
        Api.hapusToken();
        window.dispatchEvent(new CustomEvent('sesi-habis'));
      }
      throw e;
    }
  };

  // ---------- Data publik: tampil instan dari salinan lokal, lalu diperbarui di latar belakang ----------
  const KUNCI = 'pub_v1';
  const KADALUARSA = 24 * 3600 * 1000;   // salinan lokal dipakai maksimal 24 jam
  const SEGAR = 60 * 1000;               // dalam 1 menit tidak perlu tanya server lagi
  let memo = null;
  let memoWaktu = 0;
  let sedangMuat = null;

  function bacaLokal() {
    try {
      const o = JSON.parse(localStorage.getItem(KUNCI) || 'null');
      if (o && o.data && Date.now() - o.waktu < KADALUARSA) return o;
    } catch (e) { /* abaikan */ }
    return null;
  }
  function tulisLokal(data) {
    try { localStorage.setItem(KUNCI, JSON.stringify({ waktu: Date.now(), data: data })); } catch (e) { /* penyimpanan penuh/diblokir */ }
  }

  function ambilBaru() {
    if (sedangMuat) return sedangMuat;
    sedangMuat = Api.get('publik').then(function (data) {
      const beda = !memo || JSON.stringify(data) !== JSON.stringify(memo);
      memo = data; memoWaktu = Date.now(); tulisLokal(data);
      return { data: data, beda: beda };
    }).finally(function () { sedangMuat = null; });
    return sedangMuat;
  }

  Api.publik = async function (paksa) {
    const now = Date.now();
    if (!paksa && memo && now - memoWaktu < SEGAR) return memo;
    if (!paksa) {
      const lokal = bacaLokal();
      if (lokal) {
        // Tampilkan salinan lama SEKARANG, perbarui diam-diam; beri tahu halaman bila isinya berubah.
        if (!memo) { memo = lokal.data; memoWaktu = lokal.waktu; }
        ambilBaru().then(function (r) {
          if (r.beda) window.dispatchEvent(new CustomEvent('data-publik-baru'));
        }).catch(function () { /* tetap pakai salinan lama */ });
        return memo;
      }
    }
    const r = await ambilBaru();
    return r.data;
  };
  Api.lupakanCache = function () {
    memo = null; memoWaktu = 0;
    try { localStorage.removeItem(KUNCI); } catch (e) { /* abaikan */ }
  };

  // Mulai mengunduh data sedini mungkin (sebelum halaman selesai digambar)
  Api.panaskan = function () { if (Api.siap()) Api.publik().catch(function () { /* ditangani halaman */ }); };

  window.Api = Api;
})();
