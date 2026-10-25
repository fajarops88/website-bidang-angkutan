/*************************************************************
 * app.js - Inti bersama semua halaman SIMAU (versi GitHub Pages)
 * - Memanggil backend Apps Script lewat fetch() (bukan google.script.run)
 * - Sesi login (token) disimpan di sessionStorage
 * - Navigasi antarhalaman memakai berkas .html biasa
 *************************************************************/
const SIMANTAS = {
  token: sessionStorage.getItem('simantas_token') || '',
  session: JSON.parse(sessionStorage.getItem('simantas_session') || 'null')
};

/* ---------- Konfigurasi & utilitas dasar ---------- */
function apiUrl_() {
  const u = (window.SIMAU_CONFIG && window.SIMAU_CONFIG.API_URL) || '';
  if (!u || /GANTI|XXXX/.test(u)) throw new Error('Alamat API belum diisi. Edit js/config.js lalu isi API_URL.');
  return u;
}

function showLoading() { const el = document.getElementById('globalLoading'); if (el) el.style.display = 'flex'; }
function hideLoading() { const el = document.getElementById('globalLoading'); if (el) el.style.display = 'none'; }

// Helper aman untuk penyimpanan lokal (jika browser membatasi, pakai memori)
let __memStore = {};
function localStorage_set(k, v) { try { localStorage.setItem(k, v); } catch (e) { __memStore[k] = v; } }
function localStorage_get(k) { try { return localStorage.getItem(k); } catch (e) { return __memStore[k]; } }

/* ---------- Navigasi ----------
   gotoPage('kendaraan')                 -> kendaraan.html
   gotoPage('kartu&id=KND-0001')         -> kartu.html?id=KND-0001               */
function gotoPage(page) {
  const i = String(page).indexOf('&');
  let name = i < 0 ? String(page) : String(page).slice(0, i);
  const qs = i < 0 ? '' : '?' + String(page).slice(i + 1);
  if (name === 'riwayat') name = 'riwayat-kendaraan';
  window.location.href = name + '.html' + qs;
}

// Peran yang boleh memakai halaman SIMAU. ADMIN KONTEN hanya untuk panel website -> dialihkan ke sana.
const PANEL_WEBSITE_URL = '../index.html#/admin';

function requireLogin() {
  if (!SIMANTAS.token || !SIMANTAS.session) {
    gotoPage('login');
    return false;
  }
  if (SIMANTAS.session.role === 'ADMIN KONTEN') {
    window.location.replace(PANEL_WEBSITE_URL);
    return false;
  }
  return true;
}

// Escape HTML untuk teks dari pengguna yang disisipkan lewat innerHTML
function escHtml_(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function clearSession_() {
  sessionStorage.removeItem('simantas_token');
  sessionStorage.removeItem('simantas_session');
  SIMANTAS.token = '';
  SIMANTAS.session = null;
}

/* ---------- Pemanggilan API ---------- */
const READ_PREFIX = /^api_(list|get|dashboardStats|laporan|riwayat|public|cek|statistik|validate)/;
const __inflight = {};
let __writeEpoch = 0;

function apiRaw_(action, args, withToken) {
  const body = JSON.stringify({ action: action, token: withToken ? SIMANTAS.token : '', args: args || [] });
  const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
  const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 90000) : null;
  return fetch(apiUrl_(), {
    method: 'POST',
    // text/plain menghindari preflight CORS yang tidak didukung Apps Script
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: body,
    signal: ctrl ? ctrl.signal : undefined
  }).then(function (r) {
    return r.text();
  }).then(function (t) {
    if (timer) clearTimeout(timer);
    let j;
    try { j = JSON.parse(t); } catch (e) { throw new Error('Jawaban server tidak dikenali. Pastikan API_URL benar dan deployment Web App berakses "Anyone".'); }
    if (!j.ok) throw new Error(j.message || 'Terjadi kesalahan di server.');
    return j.data;
  }).catch(function (err) {
    if (timer) clearTimeout(timer);
    if (err && err.name === 'AbortError') throw new Error('Server terlalu lama menjawab. Coba lagi.');
    if (err && /Failed to fetch|NetworkError|Load failed/i.test(String(err.message))) {
      throw new Error('Tidak dapat terhubung ke server. Periksa internet atau alamat API.');
    }
    throw err;
  });
}

// Panggilan baca yang identik dan sedang berjalan digabung menjadi satu
function apiCall_(action, args, withToken) {
  if (!READ_PREFIX.test(action)) { __writeEpoch++; return apiRaw_(action, args, withToken); }
  const key = __writeEpoch + '|' + action + '|' + (withToken ? SIMANTAS.token : '') + '|' + JSON.stringify(args || []);
  if (__inflight[key]) return __inflight[key];
  const p = apiRaw_(action, args, withToken);
  __inflight[key] = p;
  const clear = function () { delete __inflight[key]; };
  p.then(clear, clear);
  return p;
}

// Wrapper pemanggilan fungsi server dengan token otomatis + error handling seragam
function callServer(fnName) {
  const args = Array.prototype.slice.call(arguments, 1);
  showLoading();
  return apiCall_(fnName, args, true).then(function (res) {
    hideLoading();
    return res;
  }).catch(function (err) {
    hideLoading();
    const msg = (err && err.message) || String(err);
    if (/Sesi Anda telah berakhir/i.test(msg)) {
      clearSession_();
      Swal.fire({ icon: 'info', title: 'Sesi berakhir', text: 'Silakan login kembali.' }).then(function () { gotoPage('login'); });
    } else {
      Swal.fire({ icon: 'error', title: 'Terjadi Kesalahan', text: msg });
    }
    throw err;
  });
}

// Pemanggilan PUBLIK (tanpa token), dipakai halaman tanpa login
function callPublic(fnName) {
  const args = Array.prototype.slice.call(arguments, 1);
  return apiCall_(fnName, args, false);
}

// Kompatibilitas: halaman publik lama memakai google.script.run.withSuccessHandler(...).api_xxx(...)
(function () {
  function runner(onOk, onFail) {
    return new Proxy({}, {
      get: function (_t, name) {
        if (name === 'withSuccessHandler') return function (f) { return runner(f, onFail); };
        if (name === 'withFailureHandler') return function (f) { return runner(onOk, f); };
        return function () {
          const args = Array.prototype.slice.call(arguments);
          apiCall_(String(name), args, false).then(
            function (d) { if (onOk) onOk(d); },
            function (e) { if (onFail) onFail(e); else console.error(e); }
          );
        };
      }
    });
  }
  window.google = window.google || {};
  window.google.script = { run: runner(null, null) };
})();

/* ---------- Logout, sidebar, topbar ---------- */
function doLogout() {
  Swal.fire({
    title: 'Keluar dari SIMAU?', icon: 'question', showCancelButton: true,
    confirmButtonText: 'Ya, Keluar', cancelButtonText: 'Batal', confirmButtonColor: '#0d3b66'
  }).then(function (r) {
    if (r.isConfirmed) {
      callServer('api_logout').catch(function () {}).finally(function () {
        clearSession_();
        gotoPage('login');
      });
    }
  });
}

function setupSidebar(activePage) {
  // Tautan khusus peran (di luar halaman SIMAU), mis. menuju panel konten website
  document.querySelectorAll('#sidebarMenu .nav-link[data-only]').forEach(function (a) {
    const roles = a.getAttribute('data-only').split(',');
    if (!SIMANTAS.session || roles.indexOf(SIMANTAS.session.role) === -1) a.style.display = 'none';
  });
  const links = document.querySelectorAll('#sidebarMenu .nav-link[data-page]');
  links.forEach(function (a) {
    const allowedRoles = a.getAttribute('data-role');
    if (allowedRoles && SIMANTAS.session && allowedRoles.split(',').indexOf(SIMANTAS.session.role) === -1) {
      a.style.display = 'none';
      return;
    }
    if (a.dataset.page === activePage) a.classList.add('active');
    a.addEventListener('click', function (e) {
      e.preventDefault();
      gotoPage(a.dataset.page);
    });
  });
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) btnLogout.addEventListener('click', function (e) { e.preventDefault(); doLogout(); });

  const btnDark = document.getElementById('btnDarkMode');
  if (btnDark) {
    btnDark.addEventListener('click', function (e) {
      e.preventDefault();
      const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
      document.documentElement.setAttribute('data-bs-theme', isDark ? 'light' : 'dark');
      localStorage_set('simantas_dark', isDark ? '0' : '1');
    });
  }
}

function initTopbar(pageTitle) {
  const nameEl = document.getElementById('topbarUserName');
  const roleEl = document.getElementById('topbarUserRole');
  if (nameEl && SIMANTAS.session) nameEl.textContent = SIMANTAS.session.nama;
  if (roleEl && SIMANTAS.session) roleEl.textContent = SIMANTAS.session.role;
  const titleEl = document.getElementById('topbarTitle');
  if (titleEl) titleEl.textContent = pageTitle;
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  if (toggleBtn) toggleBtn.addEventListener('click', function () {
    document.getElementById('simantasSidebar').classList.toggle('show');
  });
}

function toastSukses(msg) {
  Swal.fire({ icon: 'success', title: msg, timer: 1600, showConfirmButton: false });
}

/* ---------- Pemasangan kerangka halaman (dijalankan segera) ---------- */
(function () {
  if (localStorage_get('simantas_dark') === '1') document.documentElement.setAttribute('data-bs-theme', 'dark');

  // Lapisan "Memproses..."
  if (!document.getElementById('globalLoading') && document.body) {
    const d = document.createElement('div');
    d.id = 'globalLoading';
    d.innerHTML = '<div class="spinner-border" role="status"></div><div class="mt-2 fw-semibold text-primary">Memproses...</div>';
    document.body.appendChild(d);
  }
  // Sidebar & topbar (HTML-nya ada di layout.js)
  const sm = document.getElementById('sidebarMount');
  if (sm && window.SIMAU_SIDEBAR_HTML) sm.outerHTML = window.SIMAU_SIDEBAR_HTML;
  const tm = document.getElementById('topbarMount');
  if (tm && window.SIMAU_TOPBAR_HTML) tm.outerHTML = window.SIMAU_TOPBAR_HTML;

  // Bangunkan server lebih awal (mengurangi lambat saat login pertama), maks. 1x / 4 menit
  try {
    const last = Number(sessionStorage.getItem('simau_warm') || 0);
    if (Date.now() - last > 240000) {
      sessionStorage.setItem('simau_warm', String(Date.now()));
      fetch(apiUrl_() + '?w=1', { mode: 'no-cors' }).catch(function () {});
    }
  } catch (e) { /* abaikan: config belum diisi atau storage dibatasi */ }
})();
