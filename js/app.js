/* ============================================================
 * APP — router berbasis hash (#/...) dan perilaku kerangka
 * ============================================================ */
(function () {
  'use strict';
  const cfg = window.APP_CONFIG;

  const PUBLIK = {
    '': 'beranda', profil: 'profil', berita: 'berita', pengumuman: 'pengumuman', regulasi: 'regulasi',
    pengaduan: 'pengaduan', 'cek-status': 'cekStatus', survei: 'survei', statistik: 'statistik', login: 'login'
  };
  const JUDUL = {
    beranda: '', profil: 'Profil Bidang', berita: 'Berita', pengumuman: 'Pengumuman', regulasi: 'Regulasi',
    pengaduan: 'Pengaduan', cekStatus: 'Cek Status Tiket', survei: 'Survei Layanan', statistik: 'Statistik', login: 'Login Admin'
  };
  const AKTIF = { cekStatus: 'cek-status', beranda: 'beranda' };

  function parse() {
    const path = location.hash.replace(/^#/, '').split('?')[0];
    return { parts: path.split('/').filter(Boolean) };
  }

  function setAktif(rute) {
    UI.$$('[data-rute]').forEach(function (el) {
      const aktif = el.getAttribute('data-rute') === rute;
      el.classList.toggle('aktif', aktif);
      if (el.tagName === 'A') { if (aktif) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); }
    });
  }

  // ---------- Menu samping (ponsel) ----------
  function bukaDrawer(buka) {
    const d = document.getElementById('drawer'), b = document.getElementById('drawer-back'), tombol = document.getElementById('btn-menu');
    d.hidden = !buka; b.hidden = !buka;
    d.classList.toggle('buka', buka);
    tombol.setAttribute('aria-expanded', buka ? 'true' : 'false');
    document.body.classList.toggle('no-scroll', buka);
  }

  function pasangKerangka() {
    document.getElementById('btn-menu').addEventListener('click', function () { bukaDrawer(true); });
    document.getElementById('btn-menu-tutup').addEventListener('click', function () { bukaDrawer(false); });
    document.getElementById('drawer-back').addEventListener('click', function () { bukaDrawer(false); });
    UI.$$('#drawer a').forEach(function (a) { a.addEventListener('click', function () { bukaDrawer(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        bukaDrawer(false);
        UI.$$('.dd.open').forEach(function (d) { d.classList.remove('open'); d.querySelector('.dd-btn').setAttribute('aria-expanded', 'false'); });
      }
    });

    // Menu tarik-turun "Profil Bidang"
    UI.$$('.dd').forEach(function (dd) {
      const btn = dd.querySelector('.dd-btn');
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const buka = !dd.classList.contains('open');
        dd.classList.toggle('open', buka);
        btn.setAttribute('aria-expanded', buka ? 'true' : 'false');
      });
      dd.querySelectorAll('.dd-menu a').forEach(function (a) {
        a.addEventListener('click', function () { dd.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); });
      });
    });
    document.addEventListener('click', function () {
      UI.$$('.dd.open').forEach(function (d) { d.classList.remove('open'); d.querySelector('.dd-btn').setAttribute('aria-expanded', 'false'); });
    });

    // Identitas dari konfigurasi
    document.getElementById('brand-bidang').textContent = cfg.NAMA_BIDANG;
    document.getElementById('brand-instansi').textContent = cfg.NAMA_INSTANSI;
    if (/^https:\/\//i.test(cfg.LOGO_URL || '')) {
      const logo = document.getElementById('brand-logo');
      logo.innerHTML = '';
      const img = document.createElement('img');
      img.src = cfg.LOGO_URL; img.alt = 'Logo ' + cfg.NAMA_INSTANSI; img.referrerPolicy = 'no-referrer';
      logo.appendChild(img);
    }
  }

  // ---------- Render ----------
  let hitung = 0;
  async function render() {
    const id = ++hitung;
    Publik.rid = id;
    Admin.rid = id;
    document.getElementById('modal-root').innerHTML = '';
    document.body.classList.remove('no-scroll');
    bukaDrawer(false);

    const ctx = parse();
    const awal = ctx.parts[0] || '';
    const admin = awal === 'admin';

    document.getElementById('shell-publik').hidden = admin;
    document.getElementById('shell-admin').hidden = !admin;

    if (admin) {
      document.title = 'Panel Admin – ' + cfg.NAMA_BIDANG;
      await Admin.render(ctx);
    } else {
      const nama = PUBLIK[awal];
      if (nama === undefined) {
        document.title = 'Halaman tidak ditemukan – ' + cfg.NAMA_BIDANG;
        setAktif('');
        Publik.tidakAda();
      } else {
        document.title = (JUDUL[nama] ? JUDUL[nama] + ' – ' : '') + cfg.NAMA_BIDANG + ' – ' + cfg.NAMA_INSTANSI;
        setAktif(AKTIF[nama] || awal || 'beranda');
        try { await Publik[nama](ctx); }
        catch (e) {
          if (id === hitung) {
            document.getElementById('main').innerHTML = '<div class="container section"><div class="alert alert-err"><div><h2>Terjadi kesalahan</h2><p>' + UI.esc(e.message) + '</p></div></div></div>';
          }
        }
      }
    }

    if (id !== hitung) return;
    window.scrollTo(0, 0);
    const kepala = document.getElementById('judul-halaman');
    const sasaran = kepala || (admin ? document.getElementById('adm-isi') : document.getElementById('main'));
    if (sasaran) { sasaran.setAttribute('tabindex', '-1'); sasaran.focus({ preventScroll: true }); }
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('ulang-rute', render);
  window.addEventListener('sesi-habis', function () {
    UI.toast('Sesi berakhir. Silakan masuk kembali.', 'err');
    location.hash = '#/login';
  });

  document.addEventListener('DOMContentLoaded', function () {
    pasangKerangka();
    render();
  });
})();
