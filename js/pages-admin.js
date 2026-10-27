/* ============================================================
 * PANEL ADMIN (F7 + F8)
 * ============================================================ */
(function () {
  'use strict';
  const esc = UI.esc;
  const icon = UI.icon;
  const MAKS_MB = (window.APP_CONFIG && window.APP_CONFIG.MAKS_UKURAN_MB) || 5;
  const STATUS = ['Diterima', 'Diproses', 'Selesai'];
  const A = {};
  A.rid = 0;
  function adm(action, data) {
    const id = A.rid;
    return Api.admin(action, data).then(function (r) {
      if (id !== A.rid) { const e = new Error('basi'); e.kode = 'BASI'; throw e; }
      return r;
    });
  }

  // Peran (tabel USER): ADMINISTRATOR & ADMIN KONTEN mengelola semua; PETUGAS ANGKUTAN hanya pengaduan.
  // (Hak akses yang sebenarnya dijaga di server; ini hanya untuk merapikan menu.)
  const R_KONTEN = ['ADMINISTRATOR', 'ADMIN KONTEN'];
  const R_ADUAN = ['ADMINISTRATOR', 'ADMIN KONTEN', 'PETUGAS ANGKUTAN'];
  const MENU = [
    { r: 'dashboard', t: 'Dashboard', i: 'dashboard', p: R_ADUAN },
    { r: 'pengaduan', t: 'Pengaduan', i: 'inbox_customize', p: R_ADUAN },
    { r: 'berita', t: 'Berita', i: 'newspaper', p: R_KONTEN },
    { r: 'pengumuman', t: 'Pengumuman', i: 'campaign', p: R_KONTEN },
    { r: 'regulasi', t: 'Regulasi', i: 'gavel', p: R_KONTEN },
    { r: 'pejabat', t: 'Pejabat dan Pegawai', i: 'badge', p: R_KONTEN },
    { r: 'profil-teks', t: 'Profil, Sejarah & Sambutan', i: 'domain', p: R_KONTEN },
    { r: 'visi-misi', t: 'Visi & Misi', i: 'flag', p: R_KONTEN },
    { r: 'tugas-fungsi', t: 'Tugas & Fungsi', i: 'checklist', p: R_KONTEN },
    { r: 'kontak', t: 'Kontak', i: 'call', p: R_KONTEN },
    { r: 'survei', t: 'Hasil Survei', i: 'analytics', p: R_KONTEN },
    { r: 'akun', t: 'Akun', i: 'manage_accounts', p: R_ADUAN }
  ];
  function menuBoleh() {
    const role = Api.role();
    return MENU.filter(function (m) { return m.p.indexOf(role) >= 0; });
  }

  function isi() { return document.getElementById('adm-isi'); }
  function tampil(html) { const e = isi(); e.innerHTML = html; return e; }

  function judul(t, aksi) {
    return '<div class="adm-judul"><h1 id="judul-halaman" tabindex="-1">' + esc(t) + '</h1><div class="adm-aksi">' + (aksi || '') + '</div></div>';
  }

  async function aman(fn, btn, teks) {
    if (btn) UI.sibuk(btn, true, teks);
    try { return await fn(); }
    catch (e) { if (e.kode !== 'SESI_HABIS' && e.kode !== 'BASI') UI.toast(e.message, 'err'); return undefined; }
    finally { if (btn) UI.sibuk(btn, false); }
  }

  function galatKotak(e) {
    isi().innerHTML = '<div class="alert alert-err">' + icon('error') + '<div><p>' + esc(e.message) + '</p><button type="button" class="btn btn-primary" id="adm-ulang">Coba lagi</button></div></div>';
    const b = document.getElementById('adm-ulang');
    if (b) b.addEventListener('click', function () { window.dispatchEvent(new Event('ulang-rute')); });
  }

  // ---------- Kerangka admin ----------
  let kerangkaSiap = false, kerangkaPeran = '';   // kerangka dibangun ulang bila peran pengguna berganti
  function bangunKerangka() {
    const root = document.getElementById('shell-admin');
    root.innerHTML =
      '<div class="adm"><aside class="adm-side" aria-label="Menu admin"><div class="adm-merk">' + icon('directions_bus') + '<div><strong>Panel Admin</strong><small>' + esc(window.APP_CONFIG.NAMA_BIDANG) + '</small></div></div>' +
      '<nav class="adm-nav">' + menuBoleh().map(function (m) { return '<a href="#/admin/' + m.r + '" data-adm="' + m.r + '">' + icon(m.i) + '<span>' + esc(m.t) + '</span></a>'; }).join('') + '</nav>' +
      '<div class="adm-bawah">' + (['ADMINISTRATOR', 'PETUGAS ANGKUTAN'].indexOf(Api.role()) >= 0 ? '<a href="simau/dashboard.html">' + icon('directions_bus') + '<span>Buka SIMAU</span></a>' : '') + '<a href="#/">' + icon('public') + '<span>Lihat situs</span></a><button type="button" id="adm-keluar">' + icon('logout') + '<span>Keluar</span></button></div></aside>' +
      '<div class="adm-main"><header class="adm-top"><span class="muted small">Masuk sebagai <strong id="adm-user"></strong> • <span id="adm-role"></span></span></header>' +
      '<div class="adm-isi" id="adm-isi"></div></div></div>';
    document.getElementById('adm-keluar').addEventListener('click', A.keluar);
    kerangkaSiap = true; kerangkaPeran = Api.role();
  }

  A.keluar = async function () {
    try { await Api.admin('logout', {}); } catch (e) { /* sesi mungkin sudah habis */ }
    Api.hapusToken();
    UI.toast('Anda telah keluar.');
    location.hash = '#/login';
  };

  A.render = async function (ctx) {
    if (!Api.token() || !Api.sesi()) { Api.hapusToken(); location.hash = '#/login'; return; }
    // Peran tanpa akses panel website (mis. pemilik kendaraan) dialihkan ke SIMAU
    if (R_ADUAN.indexOf(Api.role()) < 0) { location.href = Publik.simauUrl('dashboard'); return; }
    if (!kerangkaSiap || kerangkaPeran !== Api.role()) bangunKerangka();
    document.getElementById('adm-user').textContent = Api.userAdmin() || 'admin';
    document.getElementById('adm-role').textContent = Api.role();
    const sub = ctx.parts[1] || 'dashboard';
    if (!menuBoleh().some(function (m) { return m.r === sub; })) {
      tampil(judul('Tidak ada akses') + UI.kosong('Peran Anda (' + Api.role() + ') tidak memiliki akses ke menu ini.', 'lock'));
      return;
    }
    UI.$$('[data-adm]').forEach(function (a) {
      const aktif = a.getAttribute('data-adm') === sub;
      a.classList.toggle('aktif', aktif);
      if (aktif) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    tampil(UI.rangka(4));
    const peta = {
      dashboard: dashboard, pengaduan: pengaduan, berita: function () { return crud('berita'); },
      pengumuman: function () { return crud('pengumuman'); }, regulasi: function () { return crud('regulasi'); },
      pejabat: function () { return crud('pejabat'); }, survei: survei, akun: akun,
      'profil-teks': function () { return crud('profilteks'); }, 'visi-misi': function () { return crud('visimisi'); },
      'tugas-fungsi': function () { return crud('tugasfungsi'); }, kontak: kontak
    };
    if (!peta[sub]) { tampil(judul('Halaman tidak ditemukan') + UI.kosong('Menu tidak tersedia.', 'search_off')); return; }
    try { await peta[sub](ctx); } catch (e) { if (e.kode !== 'SESI_HABIS' && e.kode !== 'BASI') galatKotak(e); }
  };

  // ============================================================
  // DASHBOARD
  // ============================================================
  async function dashboard() {
    const r = await adm('adminDashboard', {});
    const d = r.data, pa = d.statistik.pengaduan, sv = d.statistik.survei;
    const kp = function (ik, nilai, label) {
      return '<div class="kpi"><div class="kpi-ikon">' + icon(ik) + '</div><div><div class="kpi-nilai">' + nilai + '</div><div class="kpi-label">' + esc(label) + '</div></div></div>';
    };
    const e = tampil(judul('Dashboard', '<button type="button" class="btn btn-outline" id="d-rekap">' + icon('picture_as_pdf') + 'Cetak rekap pengaduan</button>') +
      '<div class="grid grid-5">' + kp('inbox', UI.fmtAngka(pa.total), 'Total pengaduan') + kp('schedule', UI.fmtAngka(pa.perStatus.Diterima), 'Menunggu verifikasi') +
      kp('engineering', UI.fmtAngka(pa.perStatus.Diproses), 'Sedang diproses') + kp('task_alt', UI.fmtAngka(pa.perStatus.Selesai), 'Selesai') +
      kp('star', sv.responden ? UI.fmtSkor(sv.rataTotal) : '—', 'Indeks kepuasan (' + UI.fmtAngka(sv.responden) + ' responden)') + '</div>' +
      '<section class="card card-pad"><div class="judul-baris"><h2 class="h3">Pengaduan terbaru</h2><a class="link-baca" href="#/admin/pengaduan">Kelola semua' + icon('chevron_right', 'sm') + '</a></div>' +
      (d.terbaru.length ? '<div class="tabel-bungkus"><table class="tabel"><thead><tr><th>Tiket</th><th>Pelapor</th><th>Kategori</th><th>Status</th><th><span class="sr-only">Aksi</span></th></tr></thead><tbody>' +
        d.terbaru.map(function (x) {
          return '<tr><td><span class="mono">' + esc(x.kode) + '</span><br><span class="muted small">' + esc(UI.fmtTgl(x.tanggal, true)) + '</span></td><td>' + esc(x.nama) + '</td><td>' + esc(x.kategori) + '</td><td>' + UI.badgeStatus(x.status) + '</td>' +
            '<td><a class="btn btn-outline btn-sm" href="#/admin/pengaduan/' + encodeURIComponent(x.kode) + '">Kelola</a></td></tr>';
        }).join('') + '</tbody></table></div>' : UI.kosong('Belum ada pengaduan masuk.', 'inbox')) + '</section>' +
      '<section class="card card-pad"><h2 class="h3">Ringkasan konten</h2><div class="chips"><a class="chip" href="#/admin/berita">' + d.jumlah.berita + ' berita</a><a class="chip" href="#/admin/pengumuman">' + d.jumlah.pengumuman + ' pengumuman</a>' +
      '<a class="chip" href="#/admin/regulasi">' + d.jumlah.regulasi + ' regulasi</a><a class="chip" href="#/admin/pejabat">' + d.jumlah.pejabat + ' pejabat/pegawai</a></div></section>');
    e.querySelector('#d-rekap').addEventListener('click', modalRekap);
  }

  // ============================================================
  // PENGADUAN + REKAP PDF (F8)
  // ============================================================
  function modalRekap() {
    const m = UI.modal({
      judul: 'Cetak rekap pengaduan (PDF)',
      isi: '<form id="f-rekap" class="stack"><p class="muted">PDF akan diunduh dan disimpan juga di Google Drive pada folder <span class="mono">Rekap_PDF</span>.</p>' +
        '<div class="grid grid-2"><div class="field"><label class="label" for="rk-dari">Dari tanggal</label><input id="rk-dari" class="input" type="date"></div>' +
        '<div class="field"><label class="label" for="rk-sampai">Sampai tanggal</label><input id="rk-sampai" class="input" type="date" value="' + UI.hariIni() + '"></div></div>' +
        '<div class="field"><label class="label" for="rk-status">Status</label><select id="rk-status" class="select"><option value="">Semua status</option>' + STATUS.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select></div></form>',
      kaki: '<button type="button" class="btn btn-ghost" data-tutup>Batal</button><button type="button" class="btn btn-primary" id="rk-buat">' + icon('picture_as_pdf') + 'Buat PDF</button>'
    });
    m.$('#rk-buat').addEventListener('click', function () {
      const btn = m.$('#rk-buat');
      aman(async function () {
        const r = await adm('adminRekapPdf', { dari: m.$('#rk-dari').value, sampai: m.$('#rk-sampai').value, status: m.$('#rk-status').value });
        UI.unduhBase64(r.nama, 'application/pdf', r.base64);
        UI.toast('Rekap (' + r.jumlah + ' pengaduan) dibuat dan disimpan di Drive.');
        m.tutup();
      }, btn, 'Membuat PDF…');
    });
  }

  async function pengaduan(ctx) {
    const f = { q: '', status: '', kategori: '', dari: '', sampai: '', hal: 1 };
    let daftar = [];
    const buka = ctx.parts[2] ? decodeURIComponent(ctx.parts[2]) : '';

    const pub = await Api.publik().catch(function () { return { kategoriPengaduan: [] }; });
    const m = tampil(judul('Pengaduan', '<button type="button" class="btn btn-outline" id="p-rekap">' + icon('picture_as_pdf') + 'Cetak rekap (PDF)</button>') +
      '<form class="filter-bar" id="p-filter" onsubmit="return false">' +
      '<div class="field grow"><label class="label" for="pf-q">Cari</label><input id="pf-q" class="input" type="search" placeholder="Kode tiket, nama, kontak, kata kunci"></div>' +
      '<div class="field"><label class="label" for="pf-status">Status</label><select id="pf-status" class="select"><option value="">Semua</option>' + STATUS.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label class="label" for="pf-kat">Kategori</label><select id="pf-kat" class="select"><option value="">Semua</option>' + (pub.kategoriPengaduan || []).map(function (k) { return '<option>' + esc(k) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label class="label" for="pf-dari">Dari</label><input id="pf-dari" class="input" type="date"></div>' +
      '<div class="field"><label class="label" for="pf-sampai">Sampai</label><input id="pf-sampai" class="input" type="date"></div></form>' +
      '<div id="p-hasil" aria-live="polite"></div>');

    function gambar() {
      const p = UI.halaman(daftar, f.hal, 15);
      const box = m.querySelector('#p-hasil');
      box.innerHTML = daftar.length
        ? '<p class="muted small">' + daftar.length + ' pengaduan</p><div class="tabel-bungkus"><table class="tabel"><thead><tr><th>Tiket</th><th>Pelapor</th><th>Kategori dan isi</th><th>Status</th><th><span class="sr-only">Aksi</span></th></tr></thead><tbody>' +
          p.items.map(function (x) {
            return '<tr><td><span class="mono">' + esc(x.Kode_Tiket) + '</span><br><span class="muted small">' + esc(UI.fmtTgl(x.Tanggal, true)) + '</span></td>' +
              '<td>' + esc(x.Nama) + '<br><span class="muted small">' + esc(x.Kontak) + '</span></td>' +
              '<td><span class="badge badge-muted">' + esc(x.Kategori) + '</span><p class="clamp-2 small">' + esc(x.Isi) + '</p></td>' +
              '<td>' + UI.badgeStatus(x.Status) + (x.Tanggapan_Tampil_Publik === 'Ya' ? '<br><span class="muted small">tanggapan publik</span>' : '') + '</td>' +
              '<td><button type="button" class="btn btn-outline btn-sm" data-kelola="' + esc(x.Kode_Tiket) + '">Kelola</button></td></tr>';
          }).join('') + '</tbody></table></div>' + UI.kontrolHalaman(p)
        : UI.kosong('Tidak ada pengaduan yang cocok.', 'inbox');
      UI.$$('[data-hal]', box).forEach(function (b) { b.addEventListener('click', function () { f.hal = +b.getAttribute('data-hal'); gambar(); }); });
      UI.$$('[data-kelola]', box).forEach(function (b) { b.addEventListener('click', function () { kelola(b.getAttribute('data-kelola')); }); });
    }

    async function muatDaftar() {
      const r = await adm('adminPengaduanList', { q: f.q, status: f.status, kategori: f.kategori, dari: f.dari, sampai: f.sampai });
      daftar = r.data;
      f.hal = 1;
      gambar();
    }

    function kelola(kode) {
      const x = daftar.find(function (r) { return r.Kode_Tiket === kode; });
      if (!x) return;
      const md = UI.modal({
        judul: 'Kelola pengaduan', lebar: true, tetap: true,
        isi: '<div class="stack-lg"><dl class="dl dl-rapat">' +
          '<div><dt>Kode tiket</dt><dd class="mono">' + esc(x.Kode_Tiket) + '</dd></div><div><dt>Tanggal masuk</dt><dd>' + esc(UI.fmtTgl(x.Tanggal, true)) + '</dd></div>' +
          '<div><dt>Pelapor</dt><dd>' + esc(x.Nama) + '</dd></div><div><dt>Kontak</dt><dd>' + esc(x.Kontak) + '</dd></div>' +
          '<div><dt>Kategori</dt><dd>' + esc(x.Kategori) + '</dd></div><div><dt>No. kendaraan/trayek</dt><dd>' + esc(x.Plat_Trayek || '-') + '</dd></div>' +
          '<div class="lebar"><dt>Lokasi dan waktu</dt><dd>' + esc(x.Lokasi) + '</dd></div></dl>' +
          '<div><span class="label">Isi pengaduan</span><div class="kotak-isi">' + esc(x.Isi) + '</div></div>' +
          (x.ADA_LAMPIRAN === 'Ya' ? '<div><button type="button" class="btn btn-outline" id="k-lampiran">' + icon('attach_file') + 'Buka lampiran</button></div>' : '') +
          '<hr class="pemisah"><form id="k-form" class="stack">' +
          '<div class="field"><label class="label" for="k-status">Status penanganan</label><select id="k-status" class="select">' + STATUS.map(function (s) { return '<option' + (s === x.Status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label class="label" for="k-catatan">Catatan internal <span class="opsional">(tidak terlihat publik)</span></label><input id="k-catatan" class="input" maxlength="1000" value="' + esc(x.Catatan_Internal) + '"></div>' +
          '<div class="field"><label class="label" for="k-tanggapan">Tanggapan resmi</label><textarea id="k-tanggapan" class="textarea" rows="4" maxlength="2000">' + esc(x.Tanggapan_Admin) + '</textarea></div>' +
          '<label class="check"><input type="checkbox" id="k-publik"' + (x.Tanggapan_Tampil_Publik === 'Ya' ? ' checked' : '') + '> <span>Tampilkan tanggapan ini kepada pelapor di halaman Cek Status</span></label>' +
          '<p class="hint">Jangan menulis data pribadi di tanggapan yang ditampilkan publik: siapa pun yang memegang Kode Tiket dapat membacanya.</p></form></div>',
        kaki: '<button type="button" class="btn btn-danger btn-sm" id="k-hapus">' + icon('delete') + 'Hapus</button><span class="spacer"></span>' +
          '<button type="button" class="btn btn-ghost" data-tutup>Tutup</button><button type="button" class="btn btn-primary" id="k-simpan">' + icon('save') + 'Simpan</button>'
      });
      const lamp = md.$('#k-lampiran');
      if (lamp) lamp.addEventListener('click', function () {
        aman(async function () {
          const r = await adm('adminLampiran', { kode: kode });
          UI.unduhBase64(r.nama, r.mime, r.base64);
        }, lamp, 'Mengambil…');
      });
      md.$('#k-simpan').addEventListener('click', function () {
        aman(async function () {
          await adm('adminPengaduanUpdate', {
            kode: kode, status: md.$('#k-status').value, catatan: md.$('#k-catatan').value,
            tanggapan: md.$('#k-tanggapan').value, tampilPublik: md.$('#k-publik').checked
          });
          UI.toast('Pengaduan diperbarui.');
          md.tutup();
          await muatDaftar();
        }, md.$('#k-simpan'), 'Menyimpan…');
      });
      md.$('#k-hapus').addEventListener('click', async function () {
        if (!(await UI.konfirmasi('Hapus pengaduan ' + kode + ' beserta lampirannya? Tindakan ini tidak dapat dibatalkan.', 'Ya, hapus', true))) return;
        aman(async function () {
          await adm('adminDelete', { tabel: 'Pengaduan', id: kode });
          UI.toast('Pengaduan dihapus.');
          md.tutup();
          await muatDaftar();
        }, md.$('#k-hapus'), 'Menghapus…');
      });
    }

    const cari = UI.debounce(function () { aman(muatDaftar); }, 350);
    m.querySelector('#pf-q').addEventListener('input', function (e) { f.q = e.target.value; cari(); });
    m.querySelector('#pf-status').addEventListener('change', function (e) { f.status = e.target.value; cari(); });
    m.querySelector('#pf-kat').addEventListener('change', function (e) { f.kategori = e.target.value; cari(); });
    m.querySelector('#pf-dari').addEventListener('change', function (e) { f.dari = e.target.value; cari(); });
    m.querySelector('#pf-sampai').addEventListener('change', function (e) { f.sampai = e.target.value; cari(); });
    m.querySelector('#p-rekap').addEventListener('click', modalRekap);

    await muatDaftar();
    if (buka) kelola(buka.toUpperCase());
  }

  // ============================================================
  // CRUD UMUM (berita, pengumuman, regulasi, pejabat)
  // ============================================================
  const TABEL = {
    berita: {
      tabel: 'Berita', judul: 'Berita', satu: 'berita',
      kolom: [['Judul', 'Judul'], ['Kategori', 'Kategori'], ['Tanggal_Terbit', 'Tanggal', 'tgl'], ['Status', 'Status', 'pub']],
      urut: function (a, b) { return (b.Tanggal_Terbit + b.ID).localeCompare(a.Tanggal_Terbit + a.ID); },
      baru: function () { return { Status: 'Terbit', Tanggal_Terbit: UI.hariIni(), Penulis: 'Humas Bidang Angkutan' }; },
      field: [
        { k: 'Judul', l: 'Judul berita', t: 'text', wajib: 1, max: 200 },
        { k: 'Kategori', l: 'Kategori', t: 'text', max: 60, hint: 'Contoh: Keselamatan, Bus Perkotaan, Regulasi' },
        { k: 'Tanggal_Terbit', l: 'Tanggal terbit', t: 'date' },
        { k: 'Status', l: 'Status', t: 'select', opsi: ['Terbit', 'Draft'] },
        { k: 'Penulis', l: 'Penulis / unit', t: 'text', max: 100 },
        { k: 'URL_Foto', l: 'Foto utama', t: 'unggah', folder: 'berita', jenis: 'gambar' },
        { k: 'Ringkasan', l: 'Ringkasan singkat', t: 'textarea', max: 500, hint: 'Tampil di kartu berita. Jika kosong, diambil dari awal isi.' },
        { k: 'Isi', l: 'Isi berita', t: 'rich', wajib: 1 }
      ]
    },
    pengumuman: {
      tabel: 'Pengumuman', judul: 'Pengumuman', satu: 'pengumuman',
      kolom: [['Judul', 'Judul'], ['Tanggal_Mulai', 'Mulai', 'tgl'], ['Tanggal_Berakhir', 'Berakhir', 'tgl'], ['Status', 'Status', 'pub']],
      urut: function (a, b) { return (b.Tanggal_Mulai + b.ID).localeCompare(a.Tanggal_Mulai + a.ID); },
      baru: function () { return { Status: 'Terbit', Tanggal_Mulai: UI.hariIni() }; },
      field: [
        { k: 'Judul', l: 'Judul pengumuman', t: 'text', wajib: 1, max: 200 },
        { k: 'Isi', l: 'Isi pengumuman', t: 'textarea', wajib: 1, max: 3000, baris: 6 },
        { k: 'Tanggal_Mulai', l: 'Berlaku mulai', t: 'date' },
        { k: 'Tanggal_Berakhir', l: 'Berlaku sampai', t: 'date', hint: 'Kosongkan jika tidak ada batas waktu.' },
        { k: 'Status', l: 'Status', t: 'select', opsi: ['Terbit', 'Draft'] }
      ]
    },
    regulasi: {
      tabel: 'Regulasi', judul: 'Regulasi', satu: 'regulasi',
      kolom: [['Jenis', 'Jenis'], ['Nomor', 'Nomor'], ['Tahun', 'Tahun'], ['Tentang', 'Tentang'], ['Status', 'Status', 'pub']],
      urut: function (a, b) { return (b.Tahun + b.Tanggal_Terbit + b.ID).localeCompare(a.Tahun + a.Tanggal_Terbit + a.ID); },
      baru: function () { return { Status: 'Terbit', Tahun: String(new Date().getFullYear()), Tanggal_Terbit: UI.hariIni() }; },
      field: [
        { k: 'Jenis', l: 'Jenis regulasi', t: 'text', wajib: 1, max: 60, hint: 'Contoh: Peraturan Wali Kota, Peraturan Daerah, Keputusan Kepala Dinas' },
        { k: 'Nomor', l: 'Nomor', t: 'text', max: 60 },
        { k: 'Tahun', l: 'Tahun', t: 'text', max: 4 },
        { k: 'Tentang', l: 'Tentang', t: 'textarea', wajib: 1, max: 500, baris: 3 },
        { k: 'URL_PDF', l: 'Berkas PDF', t: 'unggah', folder: 'regulasi', jenis: 'pdf' },
        { k: 'Tanggal_Terbit', l: 'Tanggal ditetapkan', t: 'date' },
        { k: 'Status', l: 'Status', t: 'select', opsi: ['Terbit', 'Draft'] }
      ]
    },
    pejabat: {
      tabel: 'Pejabat_Pegawai', judul: 'Pejabat dan Pegawai', satu: 'data pegawai',
      kolom: [['Urutan', 'Urut'], ['Nama', 'Nama'], ['Jabatan', 'Jabatan'], ['Golongan', 'Golongan'], ['Status_Aktif', 'Aktif']],
      urut: function (a, b) { return (Number(a.Urutan) || 99) - (Number(b.Urutan) || 99); },
      baru: function () { return { Status_Aktif: 'Ya', Urutan: '99' }; },
      field: [
        { k: 'Nama', l: 'Nama lengkap dan gelar', t: 'text', wajib: 1, max: 150 },
        { k: 'Jabatan', l: 'Jabatan', t: 'text', wajib: 1, max: 150 },
        { k: 'Golongan', l: 'Pangkat / golongan', t: 'text', max: 60 },
        { k: 'NIP', l: 'NIP', t: 'text', max: 40, hint: 'Opsional. Bila diisi, NIP tampil di halaman publik.' },
        { k: 'Urutan', l: 'Urutan tampil', t: 'text', max: 3, hint: 'Angka kecil tampil lebih dulu. Urutan 1 tampil di Beranda sebagai pimpinan.' },
        { k: 'URL_Foto', l: 'Foto', t: 'unggah', folder: 'pejabat', jenis: 'gambar' },
        { k: 'Atasan_ID', l: 'Atasan langsung', t: 'pilih', hint: 'Dipakai untuk menyusun Bagan Struktur Organisasi otomatis. Kosongkan untuk pimpinan tertinggi (mis. Kepala Bidang). Staf dipilihkan Kepala Seksinya.' },
        { k: 'Status_Aktif', l: 'Tampilkan di situs', t: 'select', opsi: ['Ya', 'Tidak'] }
      ]
    }
  };

  // ---- Konten profil berbentuk baris (Profil/Sejarah/Sambutan, Visi/Misi, Tugas/Fungsi) ----
  function urutPoin(jenis) {
    return function (a, b) {
      const j = jenis.indexOf(a.Jenis) - jenis.indexOf(b.Jenis);
      return j || ((Number(a.No) || 999) - (Number(b.No) || 999));
    };
  }
  function tabelPoin(judul, jenis) {
    return {
      tabel: 'Konten_Poin', judul: judul, satu: 'poin',
      saring: function (r) { return jenis.indexOf(r.Jenis) >= 0; },
      kolom: [['Jenis', 'Jenis'], ['No', 'No'], ['Isi', 'Isi', 'pot']],
      urut: urutPoin(jenis),
      baru: function () { return { Jenis: jenis[jenis.length - 1] }; },
      field: [
        { k: 'Jenis', l: 'Jenis', t: 'select', opsi: jenis },
        { k: 'No', l: 'Nomor urut', t: 'text', max: 3, hint: 'Kosongkan agar nomor dibuat otomatis (melanjutkan nomor terakhir pada jenis yang sama).' },
        { k: 'Isi', l: 'Isi', t: 'textarea', wajib: 1, max: 1500, baris: 4 }
      ]
    };
  }
  TABEL.visimisi = tabelPoin('Visi & Misi', ['Visi', 'Misi']);
  TABEL.tugasfungsi = tabelPoin('Tugas & Fungsi', ['Tugas', 'Fungsi']);
  TABEL.profilteks = {
    tabel: 'Konten_Teks', judul: 'Profil, Sejarah & Sambutan', satu: 'teks',
    kolom: [['Jenis', 'Jenis'], ['Judul', 'Judul']],
    urut: urutPoin(['Profil', 'Sejarah', 'Sambutan']),
    baru: function () { return { Jenis: 'Profil', Judul: 'Profil Bidang' }; },
    field: [
      { k: 'Jenis', l: 'Jenis', t: 'select', opsi: ['Profil', 'Sejarah', 'Sambutan'], hint: 'Tiap jenis hanya satu baris. Untuk mengubah isinya, pakai tombol Ubah.' },
      { k: 'Judul', l: 'Judul', t: 'text', wajib: 1, max: 200 },
      { k: 'Isi', l: 'Isi', t: 'textarea', wajib: 1, max: 8000, baris: 12, hint: 'Pisahkan paragraf dengan satu baris kosong. Sambutan tampil di Beranda bersama kartu pimpinan.' }
    ]
  };

  function sel(v, opsi) {
    return opsi.map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('');
  }

  function inputField(f, v) {
    const id = 'fld-' + f.k;
    const hint = f.hint ? '<p class="hint">' + esc(f.hint) + '</p>' : '';
    const lab = '<label class="label" for="' + id + '">' + esc(f.l) + (f.wajib ? ' <span class="wajib">*</span>' : '') + '</label>';
    v = v || '';
    if (f.t === 'textarea') return '<div class="field">' + lab + '<textarea id="' + id + '" class="textarea" rows="' + (f.baris || 4) + '" maxlength="' + (f.max || 500) + '">' + esc(v) + '</textarea>' + hint + '</div>';
    if (f.t === 'pilih') return '<div class="field">' + lab + '<select id="' + id + '" class="select"><option value="">— Tidak ada (pimpinan tertinggi) —</option>' +
      (f.pilihan || []).map(function (o) { return '<option value="' + esc(o.v) + '"' + (o.v === v ? ' selected' : '') + '>' + esc(o.l) + '</option>'; }).join('') + '</select>' + hint + '</div>';
    if (f.t === 'select') return '<div class="field">' + lab + '<select id="' + id + '" class="select">' + sel(v, f.opsi) + '</select>' + hint + '</div>';
    if (f.t === 'date') return '<div class="field">' + lab + '<input id="' + id + '" class="input" type="date" value="' + esc(v) + '">' + hint + '</div>';
    if (f.t === 'rich') {
      return '<div class="field"><span class="label" id="' + id + '-l">' + esc(f.l) + (f.wajib ? ' <span class="wajib">*</span>' : '') + '</span>' +
        '<div class="rich"><div class="rich-bar" role="toolbar" aria-label="Pemformatan teks">' +
        [['bold', 'format_bold', 'Tebal'], ['italic', 'format_italic', 'Miring'], ['underline', 'format_underlined', 'Garis bawah'], ['h2', 'format_h2', 'Judul bagian'], ['h3', 'format_h3', 'Sub judul'],
         ['ul', 'format_list_bulleted', 'Daftar poin'], ['ol', 'format_list_numbered', 'Daftar nomor'], ['quote', 'format_quote', 'Kutipan'], ['link', 'link', 'Sisipkan tautan'], ['clear', 'format_clear', 'Hapus format']].map(function (b) {
          return '<button type="button" class="icon-btn" data-fmt="' + b[0] + '" title="' + b[2] + '" aria-label="' + b[2] + '">' + icon(b[1]) + '</button>';
        }).join('') + '</div><div id="' + id + '" class="rich-isi prosa" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="' + id + '-l">' + UI.sanitizeHtml(v) + '</div></div>' + hint + '</div>';
    }
    if (f.t === 'unggah') {
      const pdf = f.jenis === 'pdf';
      return '<div class="field">' + lab + '<div class="unggah-baris" data-unggah="' + f.k + '" data-folder="' + f.folder + '" data-jenis="' + f.jenis + '">' +
        '<input type="hidden" id="' + id + '" value="' + esc(v) + '"><div class="unggah-pratinjau" id="' + id + '-p">' + pratinjau(v, pdf) + '</div>' +
        '<div class="unggah-aksi"><label class="btn btn-outline btn-sm" for="' + id + '-f">' + icon('upload') + (pdf ? 'Pilih PDF' : 'Pilih gambar') + '</label>' +
        '<input id="' + id + '-f" class="sr-only" type="file" accept="' + (pdf ? '.pdf,application/pdf' : '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp') + '">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-hapus-unggah>' + icon('close') + 'Hapus</button></div></div><p class="hint">Maksimal ' + MAKS_MB + ' MB. ' + (pdf ? 'Format PDF.' : 'Format JPG, PNG, atau WebP.') + '</p>' + hint + '</div>';
    }
    return '<div class="field">' + lab + '<input id="' + id + '" class="input" maxlength="' + (f.max || 200) + '" value="' + esc(v) + '">' + hint + '</div>';
  }

  function pratinjau(url, pdf) {
    if (!/^https:\/\//i.test(url || '')) return '<span class="muted small">Belum ada berkas</span>';
    return pdf
      ? icon('picture_as_pdf') + '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" class="small">Buka PDF terunggah</a>'
      : '<img src="' + esc(url) + '" alt="Pratinjau gambar" referrerpolicy="no-referrer">';
  }

  function aktifkanEditor(root) {
    UI.$$('[data-fmt]', root).forEach(function (b) {
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () {
        const k = b.getAttribute('data-fmt');
        const ed = root.querySelector('.rich-isi');
        ed.focus();
        if (k === 'bold') document.execCommand('bold');
        else if (k === 'italic') document.execCommand('italic');
        else if (k === 'underline') document.execCommand('underline');
        else if (k === 'h2') document.execCommand('formatBlock', false, 'h2');
        else if (k === 'h3') document.execCommand('formatBlock', false, 'h3');
        else if (k === 'ul') document.execCommand('insertUnorderedList');
        else if (k === 'ol') document.execCommand('insertOrderedList');
        else if (k === 'quote') document.execCommand('formatBlock', false, 'blockquote');
        else if (k === 'clear') { document.execCommand('removeFormat'); document.execCommand('formatBlock', false, 'p'); }
        else if (k === 'link') {
          const u = window.prompt('Alamat tautan (diawali https://):', 'https://');
          if (u && /^https?:\/\//i.test(u)) document.execCommand('createLink', false, u);
          else if (u) UI.toast('Tautan harus diawali http:// atau https://', 'err');
        }
      });
    });
    // tempel sebagai teks biasa agar format dari Word/web tidak ikut
    const ed = root.querySelector('.rich-isi');
    if (ed) ed.addEventListener('paste', function (e) {
      e.preventDefault();
      const t = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, t);
    });
  }

  function aktifkanUnggah(root) {
    UI.$$('[data-unggah]', root).forEach(function (w) {
      const k = w.getAttribute('data-unggah'), pdf = w.getAttribute('data-jenis') === 'pdf';
      const hid = w.querySelector('#fld-' + k), pre = w.querySelector('#fld-' + k + '-p'), file = w.querySelector('input[type=file]');
      file.addEventListener('change', function () {
        const fl = file.files[0];
        if (!fl) return;
        aman(async function () {
          const b = await UI.bacaBerkas(fl, {
            maksMB: MAKS_MB, label: pdf ? 'PDF' : 'JPG, PNG, atau WebP',
            jenis: pdf ? ['application/pdf'] : ['image/jpeg', 'image/png', 'image/webp']
          });
          pre.innerHTML = '<span class="muted small">Mengunggah ke Google Drive…</span>';
          try {
            const r = await adm('adminUpload', { folder: w.getAttribute('data-folder'), nama: b.nama, mime: b.mime, base64: b.base64 });
            hid.value = r.url;
            pre.innerHTML = pratinjau(r.url, pdf);
            UI.toast('Berkas terunggah.');
          } catch (e) { pre.innerHTML = pratinjau(hid.value, pdf); throw e; }
        });
        file.value = '';
      });
      w.querySelector('[data-hapus-unggah]').addEventListener('click', function () { hid.value = ''; pre.innerHTML = pratinjau('', pdf); });
    });
  }

  function ambilNilai(cfgT, root) {
    const row = {};
    for (let i = 0; i < cfgT.field.length; i++) {
      const f = cfgT.field[i];
      const el = root.querySelector('#fld-' + f.k);
      let v = f.t === 'rich' ? UI.sanitizeHtml(el.innerHTML) : el.value;
      if (f.t === 'rich' && !el.textContent.trim() && !el.querySelector('img')) v = '';
      if (f.wajib && !String(v).trim()) { el.focus(); throw new Error('Kolom "' + f.l + '" wajib diisi.'); }
      row[f.k] = v;
    }
    return row;
  }

  async function crud(nama) {
    const T = TABEL[nama];
    const muatData = async function () { return (await adm('adminList', { tabel: T.tabel })).data.filter(T.saring || function () { return true; }).sort(T.urut); };
    let rows = await muatData();

    const tambahBtn = '<button type="button" class="btn btn-primary" id="c-baru">' + icon('add') + 'Tambah ' + esc(T.satu) + '</button>';
    const e = tampil(judul(T.judul, tambahBtn) + '<div id="c-tabel"></div>');

    function gambar() {
      const box = e.querySelector('#c-tabel');
      box.innerHTML = rows.length
        ? '<div class="tabel-bungkus"><table class="tabel"><thead><tr>' + T.kolom.map(function (k) { return '<th>' + esc(k[1]) + '</th>'; }).join('') + '<th><span class="sr-only">Aksi</span></th></tr></thead><tbody>' +
          rows.map(function (r) {
            return '<tr>' + T.kolom.map(function (k) {
              const v = r[k[0]];
              if (k[2] === 'tgl') return '<td>' + esc(v ? UI.fmtTgl(v) : '-') + '</td>';
              if (k[2] === 'pot') return '<td>' + esc(String(v || '-').length > 140 ? String(v).substr(0, 140).replace(/\s+\S*$/, '') + '…' : (v || '-')) + '</td>';
              if (k[2] === 'pub') return '<td>' + '<span class="badge ' + (v === 'Terbit' ? 'badge-ok' : 'badge-muted') + '">' + esc(v || '-') + '</span></td>';
              return '<td>' + esc(v || '-') + '</td>';
            }).join('') + '<td class="aksi-sel"><button type="button" class="btn btn-outline btn-sm" data-edit="' + esc(r.ID) + '">' + icon('edit') + 'Ubah</button>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-hapus="' + esc(r.ID) + '" aria-label="Hapus">' + icon('delete') + '</button></td></tr>';
          }).join('') + '</tbody></table></div>'
        : UI.kosong('Belum ada data. Klik "Tambah" untuk memulai.', 'inbox');
      UI.$$('[data-edit]', box).forEach(function (b) { b.addEventListener('click', function () { form(rows.find(function (r) { return r.ID === b.getAttribute('data-edit'); })); }); });
      UI.$$('[data-hapus]', box).forEach(function (b) {
        b.addEventListener('click', async function () {
          const id = b.getAttribute('data-hapus');
          if (!(await UI.konfirmasi('Hapus data ini? Tindakan ini tidak dapat dibatalkan.', 'Ya, hapus', true))) return;
          aman(async function () {
            await adm('adminDelete', { tabel: T.tabel, id: id });
            Api.lupakanCache();
            UI.toast('Data dihapus.');
            rows = await muatData(); gambar();
          }, b);
        });
      });
    }

    function form(data) {
      const baru = !data;
      const awal = data || T.baru();
      const md = UI.modal({
        judul: (baru ? 'Tambah ' : 'Ubah ') + T.satu, lebar: true, tetap: true,
        isi: '<form id="c-form" class="stack" novalidate>' + T.field.map(function (f) {
          if (f.t === 'pilih') f = Object.assign({}, f, { pilihan: rows.filter(function (r) { return r.ID !== awal.ID; }).map(function (r) { return { v: r.ID, l: r.Nama + ' — ' + r.Jabatan }; }) });
          return inputField(f, awal[f.k]);
        }).join('') + '</form>',
        kaki: '<button type="button" class="btn btn-ghost" data-tutup>Batal</button><button type="button" class="btn btn-primary" id="c-simpan">' + icon('save') + 'Simpan</button>'
      });
      aktifkanEditor(md.el);
      aktifkanUnggah(md.el);
      md.$('#c-simpan').addEventListener('click', function () {
        aman(async function () {
          const row = ambilNilai(T, md.el);
          if (!baru) row.ID = data.ID;
          await adm('adminSave', { tabel: T.tabel, row: row });
          Api.lupakanCache();
          UI.toast('Data tersimpan.');
          md.tutup();
          rows = await muatData(); gambar();
        }, md.$('#c-simpan'), 'Menyimpan…');
      });
    }

    e.querySelector('#c-baru').addEventListener('click', function () { form(null); });
    gambar();
  }

  // ============================================================
  // KONTAK (satu form; hanya kolom yang berubah yang disimpan)
  // ============================================================
  const FIELD_KONTAK = [
    { k: 'kontak_alamat', l: 'Alamat kantor', t: 'text', max: 200 },
    { k: 'kontak_telepon', l: 'Telepon / Call Center', t: 'text', max: 60 },
    { k: 'kontak_whatsapp', l: 'WhatsApp', t: 'text', max: 25, hint: 'Hanya angka, spasi, +, -, dan tanda kurung.' },
    { k: 'kontak_email', l: 'Email kontak publik', t: 'text', max: 120 },
    { k: 'kontak_jam', l: 'Jam layanan', t: 'text', max: 120, hint: 'Contoh: Senin–Jumat, 08.00–16.00 WITA' },
    { k: 'kontak_peta', l: 'Tautan peta (Google Maps)', t: 'text', max: 300, hint: 'Salin tautan dari Google Maps (diawali https://).' }
  ];

  async function kontak() {
    const r = await adm('adminList', { tabel: 'Konten_Profil' });
    const peta = {};
    r.data.forEach(function (x) { peta[x.Kunci] = x; });
    const e = tampil(judul('Kontak') + '<p class="muted">Tampil di footer, halaman Profil, dan kartu kontak situs. Hanya bagian yang Anda ubah yang disimpan.</p>' +
      '<form id="pr-form" class="card card-pad stack-lg" novalidate>' +
      FIELD_KONTAK.map(function (f) {
        return inputField({ k: 'p_' + f.k, l: f.l, t: f.t, hint: f.hint, max: f.max }, (peta[f.k] || {}).Isi || '');
      }).join('') +
      '<div class="aksi-form"><button type="submit" class="btn btn-primary btn-lg" id="pr-simpan">' + icon('save') + 'Simpan kontak</button></div></form>');
    e.querySelector('#pr-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      aman(async function () {
        let n = 0;
        for (let i = 0; i < FIELD_KONTAK.length; i++) {
          const f = FIELD_KONTAK[i];
          const lama = peta[f.k] || { Isi: '' };
          const v = e.querySelector('#fld-p_' + f.k).value.trim();
          if (v !== (lama.Isi || '')) {
            await adm('adminSave', { tabel: 'Konten_Profil', row: { Kunci: f.k, Isi: v } });
            lama.Isi = v; peta[f.k] = lama;
            n++;
          }
        }
        Api.lupakanCache();
        UI.toast(n ? n + ' isian kontak disimpan.' : 'Tidak ada perubahan.');
      }, e.querySelector('#pr-simpan'), 'Menyimpan…');
    });
  }

  // ============================================================
  // HASIL SURVEI
  // ============================================================
  async function survei() {
    const [dash, list] = await Promise.all([adm('adminDashboard', {}), adm('adminList', { tabel: 'Survei' })]);
    const sv = dash.data.statistik.survei;
    const rows = list.data.sort(function (a, b) { return String(b.Tanggal).localeCompare(String(a.Tanggal)); });
    const e = tampil(judul('Hasil Survei') +
      '<div class="grid grid-5"><div class="kpi"><div class="kpi-ikon">' + icon('star') + '</div><div><div class="kpi-nilai">' + (sv.responden ? UI.fmtSkor(sv.rataTotal) : '—') + '</div><div class="kpi-label">Indeks kepuasan</div></div></div>' +
      [['akses', 'Akses informasi'], ['respons', 'Respons aduan'], ['petugas', 'Sikap petugas'], ['fasilitas', 'Fasilitas']].map(function (a) {
        return '<div class="kpi"><div class="kpi-ikon">' + icon('rate_review') + '</div><div><div class="kpi-nilai">' + (sv.responden ? UI.fmtSkor(sv.rataAspek[a[0]]) : '—') + '</div><div class="kpi-label">' + a[1] + '</div></div></div>';
      }).join('') + '</div>' +
      '<section class="card card-pad"><h2 class="h3">Seluruh tanggapan (' + rows.length + ')</h2><div id="sv-tabel"></div></section>');

    function gambar() {
      const box = e.querySelector('#sv-tabel');
      box.innerHTML = rows.length
        ? '<div class="tabel-bungkus"><table class="tabel"><thead><tr><th>Tanggal</th><th>Akses</th><th>Respons</th><th>Petugas</th><th>Fasilitas</th><th>Saran</th><th><span class="sr-only">Aksi</span></th></tr></thead><tbody>' +
          rows.slice(0, 200).map(function (r) {
            return '<tr><td>' + esc(UI.fmtTgl(r.Tanggal, true)) + '</td><td>' + esc(r.Skor_Akses) + '</td><td>' + esc(r.Skor_Respons) + '</td><td>' + esc(r.Skor_Petugas) + '</td><td>' + esc(r.Skor_Fasilitas) + '</td>' +
              '<td class="small">' + esc(r.Saran || '-') + '</td><td><button type="button" class="btn btn-ghost btn-sm" data-hapus="' + esc(r.ID) + '" aria-label="Hapus tanggapan">' + icon('delete') + '</button></td></tr>';
          }).join('') + '</tbody></table></div>' + (rows.length > 200 ? '<p class="muted small">Menampilkan 200 tanggapan terbaru.</p>' : '')
        : UI.kosong('Belum ada tanggapan survei.', 'rate_review');
      UI.$$('[data-hapus]', box).forEach(function (b) {
        b.addEventListener('click', async function () {
          if (!(await UI.konfirmasi('Hapus tanggapan survei ini?', 'Ya, hapus', true))) return;
          aman(async function () {
            await adm('adminDelete', { tabel: 'Survei', id: b.getAttribute('data-hapus') });
            Api.lupakanCache();
            const id = b.getAttribute('data-hapus');
            rows.splice(rows.findIndex(function (r) { return r.ID === id; }), 1);
            gambar();
            UI.toast('Tanggapan dihapus.');
          }, b);
        });
      });
    }
    gambar();
  }

  // ============================================================
  // AKUN
  // ============================================================
  async function akun() {
    const e = tampil(judul('Akun') +
      '<form id="ak-form" class="card card-pad stack-lg form-sempit" novalidate><h2 class="h3">Ganti kata sandi</h2>' +
      '<div class="field"><label class="label" for="ak-lama">Kata sandi saat ini</label><input id="ak-lama" class="input" type="password" autocomplete="current-password"></div>' +
      '<div class="field"><label class="label" for="ak-baru">Kata sandi baru</label><input id="ak-baru" class="input" type="password" autocomplete="new-password"><p class="hint">Minimal 10 karakter, mengandung huruf dan angka.</p></div>' +
      '<div class="field"><label class="label" for="ak-ulang">Ulangi kata sandi baru</label><input id="ak-ulang" class="input" type="password" autocomplete="new-password"></div>' +
      '<button type="submit" class="btn btn-primary" id="ak-simpan">' + icon('key') + 'Ganti kata sandi</button></form>' +
      '<div class="alert alert-info form-sempit">' + icon('info') + '<div><strong>Lupa kata sandi?</strong> Akun ini sama dengan akun SIMAU. Minta Administrator mengatur ulang kata sandi lewat menu Data User di SIMAU.</div></div>');
    e.querySelector('#ak-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      const lama = e.querySelector('#ak-lama').value, baru = e.querySelector('#ak-baru').value, ulang = e.querySelector('#ak-ulang').value;
      if (baru !== ulang) return UI.toast('Konfirmasi kata sandi baru tidak sama.', 'err');
      aman(async function () {
        await adm('adminGantiPassword', { lama: lama, baru: baru });
        UI.toast('Kata sandi berhasil diganti.');
        e.querySelector('#ak-form').reset();
      }, e.querySelector('#ak-simpan'), 'Menyimpan…');
    });
  }

  window.Admin = A;
})();
