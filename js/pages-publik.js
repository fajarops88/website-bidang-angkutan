/* ============================================================
 * HALAMAN PUBLIK
 * ============================================================ */
(function () {
  'use strict';
  const esc = UI.esc;
  const icon = UI.icon;
  const cfg = window.APP_CONFIG;
  const P = {};
  P.rid = 0;
  let DATA = null;

  const MAKS_MB = cfg.MAKS_UKURAN_MB || 5;
  const JENIS_LAMPIRAN = ['image/jpeg', 'image/png', 'application/pdf'];

  // ---------- Dasar ----------
  function main() { return document.getElementById('main'); }
  function tampil(html) { const m = main(); m.innerHTML = html; return m; }

  function tampilError(e) {
    const tanpaUrl = e && e.kode === 'NO_URL';
    const m = tampil(
      '<div class="container section"><div class="alert alert-err">' + icon('error') + '<div>' +
      (tanpaUrl
        ? '<h2>Situs belum tersambung ke server</h2><p>Buka berkas <code>js/config.js</code>, lalu isi <code>GAS_URL</code> dengan URL aplikasi web Google Apps Script (berakhiran <code>/exec</code>), simpan, dan unggah ulang ke GitHub.</p>'
        : '<h2>Data belum dapat dimuat</h2><p>' + esc(e && e.message) + '</p><button type="button" class="btn btn-primary" id="btn-ulang">Coba lagi</button>') +
      '</div></div></div>');
    const b = m.querySelector('#btn-ulang');
    if (b) b.addEventListener('click', function () { Api.lupakanCache(); window.dispatchEvent(new Event('ulang-rute')); });
  }

  async function muat() {
    const rid = P.rid;
    try {
      const d = await Api.publik();
      if (rid !== P.rid) return null;
      DATA = d;
      dekorasi(DATA);
      return DATA;
    } catch (e) {
      if (rid === P.rid) tampilError(e);
      return null;
    }
  }

  // Muat data hanya untuk mengisi footer/kontak, tanpa menimpa halaman bila gagal
  function muatDiam() {
    Api.publik().then(dekorasi).catch(function () { /* abaikan */ });
  }

  function persen(v) {
    return UI.fmtSkor(v).replace(/,00$/, '').replace(/(,\d)0$/, '$1') + '%';
  }

  function pv(key) {
    const p = DATA && DATA.profil && DATA.profil[key];
    return p ? String(p.isi || '').trim() : '';
  }
  // Teks (Profil/Sejarah/Sambutan) dan poin (Visi/Misi/Tugas/Fungsi) dari tabel baris di panel admin
  function teks(jenis) {
    const t = DATA && DATA.teks && DATA.teks[jenis];
    return t && String(t.isi || '').trim() ? { judul: String(t.judul || '').trim(), isi: String(t.isi).trim() } : null;
  }
  function poin(jenis) {
    const a = DATA && DATA.poin && DATA.poin[jenis];
    return (a || []).map(function (x) { return String(x.isi || '').trim(); }).filter(Boolean);
  }
  function daftarPoin(arr, ordered) {
    const tag = ordered ? 'ol' : 'ul';
    return '<' + tag + ' class="list">' + arr.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</' + tag + '>';
  }
  function waTautan(no) {
    let d = String(no || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.charAt(0) === '0') d = '62' + d.substr(1);
    return 'https://wa.me/' + d;
  }

  function pg(key) {
    const p = DATA && DATA.profil && DATA.profil[key];
    return p ? UI.gambarAman(p.gambar) : '';
  }

  function kepala(jejak, judul, desk, eyebrow) {
    let c = '<nav class="crumb" aria-label="Jejak halaman"><a href="#/">Beranda</a>';
    jejak.forEach(function (j) {
      c += icon('chevron_right', 'sm') + (j.href ? '<a href="' + j.href + '">' + esc(j.t) + '</a>' : '<span aria-current="page">' + esc(j.t) + '</span>');
    });
    c += '</nav>';
    return '<section class="page-head"><div class="container">' + c +
      (eyebrow ? '<span class="eyebrow">' + esc(eyebrow) + '</span>' : '') +
      '<h1 id="judul-halaman" tabindex="-1">' + esc(judul) + '</h1>' +
      (desk ? '<p class="lead">' + esc(desk) + '</p>' : '') + '</div></section>';
  }

  P.tidakAda = function () {
    tampil(kepala([{ t: 'Tidak ditemukan' }], 'Halaman tidak ditemukan') +
      '<div class="container section">' + UI.kosong('Alamat yang Anda tuju tidak tersedia.', 'search_off') +
      '<p class="center"><a class="btn btn-primary" href="#/">Kembali ke Beranda</a></p></div>');
  };

  // ---------- Header kontak & footer (diisi dari data profil) ----------
  function dekorasi(d) {
    DATA = d;
    const tel = pv('kontak_telepon');
    const tk = document.getElementById('topbar-kontak');
    if (tk) tk.innerHTML = tel ? icon('support_agent') + ' ' + esc(tel) : '';

    const alamat = pv('kontak_alamat'), email = pv('kontak_email'), jam = pv('kontak_jam');
    const baris = [];
    if (alamat) baris.push(icon('location_on') + '<span>' + esc(alamat) + '</span>');
    if (tel) baris.push(icon('call') + '<span>' + esc(tel) + '</span>');
    if (email) baris.push(icon('mail') + '<span>' + esc(email) + '</span>');
    const wa = pv('kontak_whatsapp'), petaUrl = pv('kontak_peta');
    if (wa && waTautan(wa)) baris.push(icon('chat') + '<span><a href="' + esc(waTautan(wa)) + '" target="_blank" rel="noopener noreferrer">WhatsApp ' + esc(wa) + '</a></span>');
    if (jam) baris.push(icon('schedule') + '<span>' + esc(jam) + '</span>');
    if (/^https:\/\//i.test(petaUrl)) baris.push(icon('map') + '<span><a href="' + esc(petaUrl) + '" target="_blank" rel="noopener noreferrer">Lihat lokasi di peta</a></span>');

    const f = document.getElementById('footer');
    if (!f) return;
    f.innerHTML =
      '<div class="container footer-grid">' +
      '<div><strong class="foot-judul">' + esc(cfg.NAMA_INSTANSI) + '</strong><p class="foot-teks">' + esc(cfg.NAMA_BIDANG) +
      ' — informasi, regulasi, pengaduan masyarakat, dan survei layanan angkutan di Kota Balikpapan.</p></div>' +
      '<div><strong class="foot-judul">Kontak</strong>' +
      (baris.length ? '<ul class="foot-kontak">' + baris.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul>'
                    : '<p class="foot-teks">Informasi kontak belum diisi.</p>') + '</div>' +
      '<div><strong class="foot-judul">Layanan</strong><ul class="foot-link">' +
      '<li><a href="#/pengaduan">Formulir Pengaduan</a></li><li><a href="#/cek-status">Cek Status Tiket</a></li>' +
      '<li><a href="#/regulasi">Regulasi</a></li><li><a href="#/statistik">Statistik Layanan</a></li>' +
      '</ul></div>' +
      '</div><div class="footer-bawah"><div class="container footer-bawah-in"><span>© ' + new Date().getFullYear() +
      ' Pemerintah Kota Balikpapan • Dinas Perhubungan • ' + esc(cfg.NAMA_BIDANG) + '</span>' +
      '<span class="foot-login"><a href="' + esc(simauUrl()) + '">' + icon('badge') + ' Login Petugas SIMAU</a>' +
      (Api.etlWeb() ? '<a href="' + esc(Api.etlWeb().replace(/\/+$/, '') + '/#/login') + '" rel="noopener">' + icon('badge') + ' Login Petugas E-Tilang</a>' : '') +
      '<a href="#/login">' + icon('shield_person') + ' Login Admin</a></span></div></div>';
    const dr = document.getElementById('drawer-etl');
    if (dr && Api.etlWeb()) { dr.href = Api.etlWeb().replace(/\/+$/, '') + '/#/login'; dr.style.display = ''; }
  }

  // ---------- Komponen bersama ----------
  function avatar(foto, nama, kelas) {
    const g = UI.gambarAman(foto);
    return g
      ? '<img class="' + (kelas || 'avatar') + '" src="' + esc(g) + '" alt="Foto ' + esc(nama) + '" loading="lazy" referrerpolicy="no-referrer">'
      : '<span class="' + (kelas || 'avatar') + ' avatar-ph" aria-hidden="true">' + esc(UI.inisial(nama)) + '</span>';
  }

  function kartuBerita(b) {
    const g = UI.gambarAman(b.foto);
    const url = '#/berita/' + encodeURIComponent(b.id);
    return '<article class="card news-card">' +
      '<a class="news-img" href="' + url + '" tabindex="-1" aria-hidden="true">' +
      (g ? '<img src="' + esc(g) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '<span class="news-ph">' + icon('newspaper') + '</span>') + '</a>' +
      '<div class="card-pad"><div class="meta">' + (b.kategori ? '<span class="badge badge-muted">' + esc(b.kategori) + '</span>' : '') +
      '<time class="muted small">' + esc(UI.fmtTgl(b.tanggal)) + '</time></div>' +
      '<h3><a href="' + url + '">' + esc(b.judul) + '</a></h3><p class="muted clamp-3">' + esc(b.ringkasan) + '</p>' +
      '<a class="link-baca" href="' + url + '">Baca selengkapnya' + icon('arrow_forward', 'sm') + '</a></div></article>';
  }

  function kpi(ikon, nilai, label, ket) {
    return '<div class="kpi"><div class="kpi-ikon">' + icon(ikon) + '</div><div><div class="kpi-nilai">' + nilai +
      '</div><div class="kpi-label">' + esc(label) + '</div>' + (ket ? '<div class="kpi-ket">' + esc(ket) + '</div>' : '') + '</div></div>';
  }

  // Tiket yang pernah dikirim dari perangkat ini (hanya disimpan di peramban pengguna)
  const KUNCI_TIKET = 'tiket_saya';
  function tiketSaya() {
    try {
      const a = JSON.parse(localStorage.getItem(KUNCI_TIKET) || '[]');
      return Array.isArray(a) ? a.filter(function (x) { return x && /^ADU-[A-Z0-9]{8}$/.test(x.kode); }) : [];
    } catch (e) { return []; }
  }
  function simpanTiket(kode) {
    try {
      const a = tiketSaya().filter(function (x) { return x.kode !== kode; });
      a.unshift({ kode: kode, waktu: new Date().toISOString() });
      localStorage.setItem(KUNCI_TIKET, JSON.stringify(a.slice(0, 8)));
    } catch (e) { /* penyimpanan dinonaktifkan: abaikan */ }
  }

  // ============================================================
  // BERANDA
  // ============================================================
  P.beranda = async function () {
    // Tahap 1: gambar bagian atas SEKARANG (tanpa menunggu server) supaya cepat terlihat
    tampil(
      '<div id="b-ticker" class="ticker ticker-tunggu" aria-hidden="true"></div>' +
      '<section class="hero"><div class="container hero-in">' +
      '<div class="hero-teks"><span class="eyebrow eyebrow-light">' + icon('verified') + ' Portal Layanan Resmi</span>' +
      '<h1 id="judul-halaman" tabindex="-1">' + esc(cfg.NAMA_BIDANG) + '<br><span>' + esc(cfg.NAMA_INSTANSI) + '</span></h1>' +
      '<p class="lead">Sampaikan pengaduan, pantau status tindak lanjutnya, dan akses informasi serta regulasi angkutan di Kota Balikpapan. Tanpa perlu membuat akun.</p>' +
      '<div class="hero-cta"><a class="btn btn-amber" href="#/pengaduan">' + icon('campaign') + 'Ajukan Pengaduan</a>' +
      '<a class="btn btn-light" href="#/cek-status">' + icon('track_changes') + 'Lacak Tiket</a>' +
      '<a class="btn btn-light" href="#/cek-status/kendaraan">' + icon('directions_bus') + 'Cek Kendaraan</a></div></div>' +
      '<div id="b-kartu" class="hero-kartu hero-kartu-tunggu" aria-hidden="true"></div>' +
      '</div></section>' +
      '<div id="b-sisa"></div>'   // sengaja kosong: kerangka di bawah hero ikut bergeser saat kartu pimpinan terisi (layout shift)
    );
    const d = await muat();
    if (!d) return;
    // Tahap 2: isi bagian yang bergantung pada data
    const st = d.statistik;
    const pj = d.pejabat[0];
    const peng = d.pengumuman[0];
    const sambutan = (teks('sambutan') && teks('sambutan').isi) || pv('sambutan');
    const nilai = st.survei.responden ? UI.fmtSkor(st.survei.rataTotal) + ' / 5' : '—';
    const selesai = st.pengaduan.total ? persen(st.pengaduan.persenSelesai) : '—';
    const el = function (id) { return document.getElementById(id); };
    if (!el('b-sisa')) return;   // pengguna sudah pindah halaman

    const tk = el('b-ticker');
    if (peng) {
      tk.className = 'ticker'; tk.removeAttribute('aria-hidden'); tk.setAttribute('aria-label', 'Pengumuman terkini');
      tk.innerHTML = '<div class="container ticker-in">' + icon('campaign') +
        '<span class="badge badge-amber">Pengumuman</span><a href="#/pengumuman">' + esc(peng.judul) + '</a></div>';
    } else { tk.remove(); }

    const kt = el('b-kartu');
    if (pj) {
      kt.className = 'hero-kartu'; kt.removeAttribute('aria-hidden');
      kt.innerHTML = avatar(pj.foto, pj.nama, 'avatar avatar-lg') +
        '<div><strong>' + esc(pj.nama) + '</strong><span>' + esc(pj.jabatan) + '</span>' +
        (sambutan ? '<p>' + esc(sambutan.length > 200 ? sambutan.substr(0, 200).replace(/\s+\S*$/, '') + '…' : sambutan) + '</p>' : '') + '</div>';
    } else { kt.remove(); }

    const htmlSisa = (
      '<section class="section"><div class="container"><div class="grid grid-svc">' +
      layananKartu('#/pengaduan', 'edit_note', 'Form Pengaduan', 'Laporkan masalah angkutan tanpa login. Anda akan mendapat Kode Tiket.', 'Buat laporan') +
      layananKartu('#/cek-status', 'manage_search', 'Cek Status Tiket', 'Pantau perkembangan pengaduan dengan memasukkan Kode Tiket.', 'Lacak progres') +
      layananKartu('#/regulasi', 'gavel', 'Regulasi', 'Cari dan unduh peraturan serta keputusan terkait angkutan.', 'Lihat dokumen') +
      layananKartu('#/survei', 'rate_review', 'Survei Layanan', 'Beri penilaian layanan Bidang Angkutan untuk perbaikan mutu.', 'Isi survei') +
      '</div></div></section>' +

      blokCekCepat() +

      blokDataAngkutan() +

      '<section class="band"><div class="container"><h2 class="band-judul">' + icon('query_stats') + ' Transparansi Layanan</h2><div class="grid grid-4">' +
      kpi('inbox', UI.fmtAngka(st.pengaduan.total), 'Pengaduan masuk') +
      kpi('task_alt', selesai, 'Pengaduan selesai', st.pengaduan.total ? UI.fmtAngka(st.pengaduan.perStatus.Selesai) + ' dari ' + UI.fmtAngka(st.pengaduan.total) : '') +
      kpi('star', esc(nilai), 'Indeks kepuasan') +
      kpi('groups', UI.fmtAngka(st.survei.responden), 'Responden survei') +
      '</div><p class="center small"><a class="link-terang" href="#/statistik">Lihat statistik lengkap' + icon('arrow_forward', 'sm') + '</a></p></div></section>' +

      '<section class="section"><div class="container"><div class="judul-baris"><h2>Berita Terbaru</h2><a class="link-baca" href="#/berita">Semua berita' + icon('chevron_right', 'sm') + '</a></div>' +
      (d.berita.length ? '<div class="grid grid-3">' + d.berita.slice(0, 3).map(kartuBerita).join('') + '</div>' : UI.kosong('Belum ada berita yang diterbitkan.', 'newspaper')) +
      '</div></section>' +

      '<section class="section section-alt"><div class="container cek-cepat"><div><h2>Lacak Status Pengaduan Anda</h2>' +
      '<p class="muted">Masukkan Kode Tiket yang Anda terima saat mengirim pengaduan.</p></div>' +
      '<form id="form-cepat" class="cek-form" novalidate><label class="sr-only" for="kode-cepat">Kode tiket</label>' +
      '<input id="kode-cepat" class="input mono" placeholder="Contoh: ADU-7K3Q9XMB" autocomplete="off" autocapitalize="characters" maxlength="14" required>' +
      '<button class="btn btn-primary" type="submit">Periksa' + icon('arrow_forward') + '</button></form></div></section>'
    );

    // Ganti pembungkus dengan elemen BARU (bukan menulis ulang isinya): elemen lama yang bergeser terhitung layout shift
    const baru = document.createElement('div');
    baru.id = 'b-sisa';
    baru.innerHTML = htmlSisa;
    el('b-sisa').replaceWith(baru);

    isiDataAngkutan(main());
    pasangCekCepat(main());

    document.getElementById('form-cepat').addEventListener('submit', function (e) {
      e.preventDefault();
      const k = document.getElementById('kode-cepat').value.trim().toUpperCase();
      location.hash = k ? '#/cek-status/' + encodeURIComponent(k) : '#/cek-status';
    });
  };

  // Tampilan hasil cek (dipakai halaman Cek Status dan kotak Cek Cepat di Beranda)
  function hasilKendaraan(x) {
    if (!x) return '<div class="alert alert-warn" role="status">' + icon('warning') + '<div>Nomor polisi tidak ditemukan di database. Pastikan penulisannya sudah benar.</div></div>';
    const aktif = x.STATUS_AKTIF === 'AKTIF';
    const label = x.DIBLOKIR ? 'DIBLOKIR' : String(x.STATUS_AKTIF || '-');
    const tgl = x.MASA_BERLAKU ? UI.fmtTgl(x.MASA_BERLAKU) : '-';
    return '<div class="card card-pad stack-lg"><div class="center"><span class="badge ' + (x.DIBLOKIR ? 'badge-warn' : (aktif ? 'badge-ok' : 'badge-warn')) + '">' +
      icon(x.DIBLOKIR ? 'block' : (aktif ? 'check_circle' : 'cancel')) + esc(label) + '</span></div>' +
      (x.DIBLOKIR ? '<div class="alert alert-err" role="alert">' + icon('error') + '<div>Kendaraan ini sedang dikenakan sanksi: <strong>' + esc(x.JENIS_SANKSI) + '</strong></div></div>' : '') +
      '<dl class="dl">' + barisData('Nomor polisi', x.NOMOR_POLISI) + barisData('Trayek', x.NAMA_TRAYEK) +
      barisData('Perusahaan', x.NAMA_PERUSAHAAN) + barisData('Masa berlaku', tgl) + '</dl>' +
      '<p class="muted small">Melihat kendaraan bermasalah? <a href="#/pengaduan">Sampaikan pengaduan</a>.</p></div>';
  }
  function hasilSurat(x) {
    const st = String(x.status || '-');
    const sanksi = x.sanksi_dikenakan || x.sanksi || '';
    return '<div class="card card-pad stack-lg"><div class="center"><span class="badge ' + (st === 'Selesai' ? 'badge-ok' : (st === 'Dibatalkan' ? 'badge-warn' : 'badge-info')) + '">' + esc(st) + '</span></div>' +
      (x.keterangan ? '<p class="center">' + esc(x.keterangan) + '</p>' : '') +
      '<dl class="dl">' + barisData('Nomor surat', x.nomor_surat) +
      barisData('Tanggal terbit', x.tanggal ? UI.fmtTgl(x.tanggal) : '-') +
      barisData('Jenis pelanggaran', x.jenis || '-') +
      (sanksi ? barisData('Sanksi', sanksi) : '') + '</dl></div>';
  }
  function galatCek(err) {
    return '<div class="alert alert-err" role="alert">' + icon('error') + '<div>' + esc(err.message) + '</div></div>';
  }

  // Kotak "Cek Cepat" di Beranda: Kendaraan, dan Surat Tilang bila E-Tilang sudah dinyalakan di config.js
  function blokCekCepat() {
    const surat = Api.etlSiap();
    return '<section class="section"><div class="container"><div class="card card-pad stack-lg" id="cc-kotak">' +
      '<div><h2>' + (surat ? 'Cek Kendaraan dan Surat Tilang' : 'Cek Kendaraan Angkutan') + '</h2>' +
      '<p class="muted">' + (surat ? 'Periksa izin kendaraan angkutan atau status surat penindakan. Tanpa login.' : 'Periksa apakah angkutan umum berizin aktif dengan nomor polisi. Tanpa login.') + '</p></div>' +
      (surat ? '<nav class="chips" role="tablist" aria-label="Jenis pengecekan">' +
        '<button type="button" class="chip aktif" role="tab" aria-selected="true" data-cc="kendaraan">Kendaraan Angkutan</button>' +
        '<button type="button" class="chip" role="tab" aria-selected="false" data-cc="surat">Surat Tilang</button></nav>' : '') +
      '<form id="cc-form-kendaraan" class="cek-form" novalidate><label class="sr-only" for="cc-nopol">Nomor polisi</label>' +
      '<input id="cc-nopol" class="input mono input-besar" maxlength="15" placeholder="Contoh: KT 1234 BC" autocomplete="off" autocapitalize="characters" spellcheck="false">' +
      '<button type="submit" class="btn btn-primary">' + icon('search') + 'Cek</button></form>' +
      (surat ? '<form id="cc-form-surat" class="stack" novalidate hidden>' +
        '<label class="label" for="cc-nomor">Nomor surat penindakan</label>' +
        '<input id="cc-nomor" class="input mono input-besar" maxlength="60" placeholder="Contoh: 0012/ETL/DISHUB/X/2026" autocomplete="off" autocapitalize="characters" spellcheck="false">' +
        '<label class="label" for="cc-nopol-s">Nomor polisi kendaraan</label>' +
        '<div class="cek-form"><input id="cc-nopol-s" class="input mono input-besar" maxlength="15" placeholder="Contoh: KT 1234 BC" autocomplete="off" autocapitalize="characters" spellcheck="false">' +
        '<button type="submit" class="btn btn-primary">' + icon('search') + 'Cek</button></div>' +
        '<p class="hint">Nomor surat dan nomor polisi harus cocok. Nama dan alamat tidak ditampilkan.</p></form>' : '') +
      '<div id="cc-hasil" aria-live="polite"></div></div></div></section>';
  }

  function pasangCekCepat(root) {
    const kotak = root.querySelector('#cc-kotak');
    if (!kotak) return;
    const hasil = kotak.querySelector('#cc-hasil');
    const fk = kotak.querySelector('#cc-form-kendaraan'), fs = kotak.querySelector('#cc-form-surat');

    async function jalankan(form, kerja) {
      const btn = form.querySelector('button[type="submit"]');
      UI.sibuk(btn, true, 'Mencari…');
      hasil.innerHTML = '';
      try { hasil.innerHTML = await kerja(); }
      catch (err) { hasil.innerHTML = galatCek(err); }
      finally { UI.sibuk(btn, false); }
    }
    fk.addEventListener('submit', function (e) {
      e.preventDefault();
      const nopol = kotak.querySelector('#cc-nopol').value.trim().toUpperCase();
      if (nopol.length < 3) { hasil.innerHTML = '<div class="alert alert-err" role="alert">' + icon('error') + '<div>Masukkan nomor polisi kendaraan.</div></div>'; return; }
      jalankan(fk, async function () { return hasilKendaraan(await Api.simau('api_publicCekStatusNopol', [nopol])); });
    });
    if (fs) {
      fs.addEventListener('submit', function (e) {
        e.preventDefault();
        const nomor = kotak.querySelector('#cc-nomor').value.trim();
        const nopol = kotak.querySelector('#cc-nopol-s').value.trim().toUpperCase();
        if (!nomor || nopol.length < 3) { hasil.innerHTML = '<div class="alert alert-err" role="alert">' + icon('error') + '<div>Isi nomor surat dan nomor polisi.</div></div>'; return; }
        jalankan(fs, async function () { return hasilSurat(await Api.etl('publik.cek', { nomor_surat: nomor, nopol: nopol })); });
      });
      UI.$$('[data-cc]', kotak).forEach(function (t) {
        t.addEventListener('click', function () {
          const surat = t.getAttribute('data-cc') === 'surat';
          UI.$$('[data-cc]', kotak).forEach(function (x) { const on = x === t; x.classList.toggle('aktif', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
          fk.hidden = surat; fs.hidden = !surat; hasil.innerHTML = '';
        });
      });
    }
  }

  // Data angkutan umum dan fasilitas halte (dari SIMAU), tampil di Beranda
  function blokDataAngkutan() {
    return '<section class="section section-alt"><div class="container stack-lg">' +
      '<div><div class="judul-baris"><h2>Data Angkutan Umum</h2></div><div id="s-angkutan" class="grid grid-3">' +
      kpi('directions_bus', '…', 'Kendaraan aktif') + kpi('route', '…', 'Trayek') + kpi('business', '…', 'Perusahaan angkutan') + '</div></div>' +
      '<div class="card card-pad"><h2 class="h3">Fasilitas Halte</h2><div id="s-halte" class="halte-daftar"><p class="muted">Memuat data halte…</p></div></div>' +
      '</div></section>';
  }

  // Diambil terpisah dari data website agar kegagalannya tidak merusak bagian lain
  function isiDataAngkutan(root) {
    const rid = P.rid;
    const pasang = function (id, html) { const el = root.querySelector(id); if (el && rid === P.rid) el.innerHTML = html; };
    Api.simau('api_publicDashboardStats').then(function (s) {
      pasang('#s-angkutan',
        kpi('directions_bus', UI.fmtAngka(s.totalKendaraanAktif), 'Kendaraan aktif') +
        kpi('route', UI.fmtAngka(s.totalTrayek), 'Trayek') +
        kpi('business', UI.fmtAngka(s.totalPerusahaan), 'Perusahaan angkutan'));
    }).catch(function () {
      pasang('#s-angkutan', '<div class="alert alert-warn" role="status">' + icon('warning') + '<div>Data angkutan belum dapat dimuat. Muat ulang halaman untuk mencoba lagi.</div></div>');
    });
    Api.simau('api_publicHalteList').then(function (rows) {
      rows = rows || [];
      pasang('#s-halte', rows.length
        ? rows.map(function (r) {
          const lat = Number(r.LATITUDE), lng = Number(r.LONGITUDE);
          const peta = (r.LATITUDE !== '' && r.LONGITUDE !== '' && isFinite(lat) && isFinite(lng))
            ? '<a class="btn btn-outline btn-sm" href="https://www.google.com/maps?q=' + lat + ',' + lng + '" target="_blank" rel="noopener noreferrer">' + icon('location_on', 'sm') + 'Lihat lokasi</a>' : '';
          return '<div class="kode-baris"><div><strong>' + esc(r.NAMA_HALTE) + '</strong><div class="meta">' +
            '<span class="badge badge-ok">' + esc(r.baik) + ' baik</span><span class="badge badge-warn">' + esc(r.buruk) + ' buruk</span>' +
            '<span class="badge badge-muted">' + esc(r.tidakAda) + ' tidak ada</span></div></div>' + peta + '</div>';
        }).join('<hr class="pemisah">')
        : '<p class="muted">Belum ada data fasilitas halte.</p>');
    }).catch(function () {
      pasang('#s-halte', '<p class="muted">Data halte belum dapat dimuat.</p>');
    });
  }

  // Alamat halaman SIMAU: berada di folder simau/ pada situs yang sama (halaman bawaannya login)
  function simauUrl(halaman) {
    return 'simau/' + (halaman || 'login') + '.html';
  }
  P.simauUrl = simauUrl;

  // Setelah login: admin/admin konten ke panel website; petugas dan pemilik ke SIMAU
  P.setelahLogin = function (role) {
    if (role === 'ADMINISTRATOR' || role === 'ADMIN KONTEN') location.hash = '#/admin';
    else location.href = simauUrl('dashboard');
  };

  function layananKartu(href, ikon, judul, teks, aksi) {
    const luar = /^https:/.test(href);
    return '<a class="card svc" href="' + href + '"' + (luar ? ' target="_blank" rel="noopener noreferrer"' : '') + '><span class="svc-ikon">' + icon(ikon) + '</span><h3>' + esc(judul) + '</h3><p>' + esc(teks) +
      '</p><span class="link-baca">' + esc(aksi) + icon(luar ? 'open_in_new' : 'arrow_forward', 'sm') + '</span></a>';
  }

  // ============================================================
  // PROFIL BIDANG
  // ============================================================
  const SUB_PROFIL = {
    sejarah: 'Sejarah', 'visi-misi': 'Visi dan Misi', 'tugas-fungsi': 'Tugas dan Fungsi',
    struktur: 'Struktur Organisasi', pejabat: 'Pejabat dan Pegawai'
  };

  function teksAtauDaftar(t, ordered) {
    const baris = String(t || '').split(/\n+/).filter(function (x) { return x.trim(); });
    return baris.length > 1 ? UI.daftar(t, ordered) : UI.paragraf(t);
  }

  // Bagan struktur: pohon dari kolom Atasan; bila belum ada atasan terisi, pejabat pertama menjadi pimpinan
  function baganStruktur(daftar, kolPeta) {
    if (!daftar || !daftar.length) return '';
    kolPeta = kolPeta || {};
    const ada = {}; daftar.forEach(function (p) { ada[p.id] = p; });
    const anak = {}; const akar = [];
    const adaAtasan = daftar.some(function (p) { return p.atasan && ada[p.atasan] && p.atasan !== p.id; });
    daftar.forEach(function (p, i) {
      let a = adaAtasan ? p.atasan : (i === 0 ? '' : daftar[0].id);
      if (!a || !ada[a] || a === p.id) { akar.push(p); return; }
      (anak[a] = anak[a] || []).push(p);
    });
    const dipakai = {};
    function simpul(p, kedalaman) {
      dipakai[p.id] = true;
      const ks = (anak[p.id] || []).filter(function (c) { return !dipakai[c.id]; });
      return '<li><div class="org-node' + (kedalaman === 0 ? ' org-atas' : '') + '">' + avatar(p.foto, p.nama, 'avatar avatar-sm') +
        '<strong>' + esc(p.nama) + '</strong><span>' + esc(p.jabatan) + '</span>' + (p.golongan ? '<em>' + esc(p.golongan) + '</em>' : '') + '</div>' +
        (ks.length && kedalaman < 8 ? daftarAnak(ks, kedalaman, kolPeta[p.id] || 3) : '') + '</li>';
    }
    // Bawahan tanpa anak yang jumlahnya melebihi 'kol' dipecah menjadi baris-baris (maks. 'kol' per baris),
    // baris berikutnya tersambung ke tengah baris di atasnya, sehingga bagan tidak melebar ke kanan.
    function daftarAnak(ks, kedalaman, kol) {
      kol = Math.min(kol, 2);
      const semuaDaun = ks.every(function (c) { return !(anak[c.id] || []).length; });
      if (semuaDaun && ks.length > kol) {
        let baris = '';
        for (let i = 0; i < ks.length; i += kol) {
          baris += '<ul>' + ks.slice(i, i + kol).map(function (c) { return simpul(c, kedalaman + 1); }).join('') + '</ul>';
        }
        return '<div class="org-lanjut">' + baris + '</div>';
      }
      return '<ul>' + ks.map(function (c) { return simpul(c, kedalaman + 1); }).join('') + '</ul>';
    }
    let html = akar.map(function (p) { return simpul(p, 0); }).join('');
    // pengaman bila ada rantai atasan yang berputar
    daftar.forEach(function (p) { if (!dipakai[p.id]) html += simpul(p, 0); });
    return '<div class="org"><ul>' + html + '</ul></div>';
  }

  // Menentukan jumlah bawahan per baris untuk tiap cabang di bawah pimpinan, sesuai lebar yang tersedia:
  // semua cabang mulai dari 1 kolom, kolom sisa diberikan ke cabang yang paling panjang (maks. 2 per baris).
  function kolomMuat(daftar, lebar) {
    const ada = {}; daftar.forEach(function (p) { ada[p.id] = true; });
    const akar = daftar.filter(function (p) { return !p.atasan || !ada[p.atasan] || p.atasan === p.id; })[0] || daftar[0];
    const cabang = daftar.filter(function (p) { return p.atasan === akar.id && p.id !== akar.id; });
    const n = {}; cabang.forEach(function (c) { n[c.id] = daftar.filter(function (x) { return x.atasan === c.id && x.id !== c.id; }).length; });
    const lebarPakai = Math.min(lebar, window.innerWidth);
    const kolom = Math.max(1, Math.floor((lebarPakai - 16) / 188));
    const hasil = {}; cabang.forEach(function (c) { hasil[c.id] = 1; });
    if (window.innerWidth <= 640) {            // cabang ditumpuk ke bawah: tiap cabang boleh memakai seluruh lebar
      cabang.forEach(function (c) { hasil[c.id] = Math.max(1, Math.min(2, n[c.id], kolom)); });
      return hasil;
    }
    let sisa = kolom - cabang.length;
    while (sisa > 0) {
      let pilih = null, terbanyak = 1;
      cabang.forEach(function (c) {
        const k = hasil[c.id];
        const baris = Math.ceil(n[c.id] / k);
        if (k < 2 && k < n[c.id] && baris > terbanyak) { pilih = c; terbanyak = baris; }
      });
      if (!pilih) break;
      hasil[pilih.id]++; sisa--;
    }
    return hasil;
  }

  P.profil = async function (ctx) {
    const sub = ctx.parts[1] || 'sejarah';
    if (!SUB_PROFIL[sub]) return P.tidakAda();
    tampil(kepala([{ t: 'Profil Bidang' }, { t: SUB_PROFIL[sub] }], SUB_PROFIL[sub]) + '<div class="container section">' + UI.rangka(3) + '</div>');
    const d = await muat();
    if (!d) return;

    let isi = '';
    const kosong = UI.kosong('Konten ini belum diisi oleh admin.', 'edit_note');
    if (sub === 'sejarah') {
      const pf = teks('profil'), sj = teks('sejarah');
      const lama = pv('sejarah');
      isi = (pf || sj || lama)
        ? '<div class="stack-lg">' +
          (pf ? '<section><h2>' + esc(pf.judul || 'Profil Bidang') + '</h2><div class="prosa">' + UI.paragraf(pf.isi) + '</div></section>' : '') +
          ((sj || lama) ? '<section>' + (pf ? '<h2>' + esc((sj && sj.judul) || 'Sejarah') + '</h2>' : '') + '<div class="prosa">' + UI.paragraf(sj ? sj.isi : lama) + '</div></section>' : '') + '</div>'
        : kosong;
    } else if (sub === 'visi-misi') {
      const vs = poin('visi'), ms = poin('misi');
      const adaBaru = vs.length || ms.length;
      const visiHtml = adaBaru ? (vs.length > 1 ? daftarPoin(vs, true) : (vs.length ? UI.paragraf(vs[0]) : '')) : (pv('visi') ? UI.paragraf(pv('visi')) : '');
      const misiHtml = adaBaru ? (ms.length ? daftarPoin(ms, true) : '') : (pv('misi') ? UI.daftar(pv('misi'), true) : '');
      isi = (visiHtml || misiHtml)
        ? '<div class="stack-lg">' +
          (visiHtml ? '<div class="card card-visi"><span class="eyebrow eyebrow-light">Visi</span><div class="prosa prosa-terang">' + visiHtml + '</div></div>' : '') +
          (misiHtml ? '<div class="card card-pad"><h2>Misi</h2><div class="prosa">' + misiHtml + '</div></div>' : '') + '</div>'
        : kosong;
    } else if (sub === 'tugas-fungsi') {
      const tg = poin('tugas'), fg = poin('fungsi');
      if (tg.length || fg.length) {
        isi = '<div class="stack-lg">' +
          (tg.length ? '<section><h2>Tugas</h2><div class="prosa">' + daftarPoin(tg, true) + '</div></section>' : '') +
          (fg.length ? '<section><h2>Fungsi</h2><div class="prosa">' + daftarPoin(fg, true) + '</div></section>' : '') + '</div>';
      } else {
        isi = pv('tugas_fungsi') ? '<div class="prosa">' + teksAtauDaftar(pv('tugas_fungsi')) + '</div>' : kosong;
      }
    } else if (sub === 'struktur') {
      const g = pg('struktur_organisasi');
      const bagan = baganStruktur(d.pejabat, {});
      isi = (bagan || g)
        ? (bagan ? '<div class="org-bungkus" tabindex="0" role="region" aria-label="Bagan struktur organisasi, dapat digulir">' + bagan + '</div><p class="muted small">Bagan disusun otomatis dari data Pejabat dan Pegawai. Geser ke samping bila bagan melebihi layar.</p>' : '') +
          (g ? '<figure class="figur"><a href="' + esc(g) + '" target="_blank" rel="noopener noreferrer"><img src="' + esc(g) + '" alt="Bagan struktur organisasi ' + esc(cfg.NAMA_BIDANG) + '" loading="lazy" referrerpolicy="no-referrer"></a><figcaption class="muted small">Bagan resmi (gambar). Ketuk atau klik untuk memperbesar.</figcaption></figure>' : '')
        : kosong;
    } else {
      isi = '<div class="filter-bar"><div class="field grow"><label class="label" for="cari-pj">Cari nama atau jabatan</label>' +
        '<input id="cari-pj" class="input" type="search" placeholder="Ketik nama, jabatan, atau NIP"></div></div>' +
        (d.pejabat.length
          ? '<div class="grid grid-3" id="grid-pj">' + d.pejabat.map(function (p) {
            return '<article class="card pj-card" data-cari="' + esc((p.nama + ' ' + p.jabatan + ' ' + p.nip).toLowerCase()) + '">' +
              avatar(p.foto, p.nama, 'avatar avatar-lg') + '<h3>' + esc(p.nama) + '</h3><p class="pj-jab">' + esc(p.jabatan) + '</p>' +
              (p.golongan ? '<p class="muted small">' + esc(p.golongan) + '</p>' : '') +
              (p.nip ? '<p class="mono small">NIP. ' + esc(p.nip) + '</p>' : '') + '</article>';
          }).join('') + '</div><div id="pj-kosong" hidden>' + UI.kosong('Tidak ada yang cocok dengan pencarian Anda.', 'person_search') + '</div>'
          : UI.kosong('Data pejabat dan pegawai belum diisi.', 'badge'));
    }

    const nav = Object.keys(SUB_PROFIL).map(function (k) {
      return '<a href="#/profil/' + k + '"' + (k === sub ? ' class="aktif" aria-current="page"' : '') + '>' + esc(SUB_PROFIL[k]) + '</a>';
    }).join('');

    const m = tampil(kepala([{ t: 'Profil Bidang' }, { t: SUB_PROFIL[sub] }], SUB_PROFIL[sub], '', cfg.NAMA_BIDANG) +
      '<div class="container section"><div class="layout-samping' + (sub === 'struktur' ? ' layout-penuh' : '') + '"><nav class="subnav" aria-label="Sub halaman profil">' + nav + '</nav><div>' + isi + '</div></div></div>');

    // Bagan: jumlah bawahan per baris menyesuaikan lebar layar; digambar ulang bila ukuran jendela berubah
    const bungkus = m.querySelector('.org-bungkus');
    if (bungkus) {
      let kolSekarang = '';
      const atur = function () {
        if (!document.body.contains(bungkus)) { window.removeEventListener('resize', atur); return; }
        const k = kolomMuat(d.pejabat, bungkus.clientWidth || 900);
        const kunci = JSON.stringify(k);
        if (kunci === kolSekarang) return;
        kolSekarang = kunci;
        bungkus.innerHTML = baganStruktur(d.pejabat, k);
      };
      atur();
      window.addEventListener('resize', atur);
    }

    const cari = m.querySelector('#cari-pj');
    if (cari) {
      cari.addEventListener('input', function () {
        const q = cari.value.toLowerCase().trim();
        let n = 0;
        UI.$$('#grid-pj .pj-card', m).forEach(function (c) {
          const cocok = !q || c.getAttribute('data-cari').indexOf(q) >= 0;
          c.hidden = !cocok;
          if (cocok) n++;
        });
        m.querySelector('#pj-kosong').hidden = n > 0;
      });
    }
  };

  // ============================================================
  // BERITA
  // ============================================================
  P.berita = async function (ctx) {
    if (ctx.parts[1]) return beritaDetail(ctx.parts[1]);

    tampil(kepala([{ t: 'Berita' }], 'Berita Bidang Angkutan', 'Informasi dan kegiatan terbaru.') + '<div class="container section">' + UI.rangka(3) + '</div>');
    const d = await muat();
    if (!d) return;

    const kategori = Array.from(new Set(d.berita.map(function (b) { return b.kategori; }).filter(Boolean))).sort();
    const f = { q: '', kat: '', dari: '', sampai: '', hal: 1 };

    const m = tampil(kepala([{ t: 'Berita' }], 'Berita Bidang Angkutan', 'Informasi dan kegiatan terbaru.') +
      '<div class="container section"><form class="filter-bar" onsubmit="return false">' +
      '<div class="field grow"><label class="label" for="f-q">Cari berita</label><input id="f-q" class="input" type="search" placeholder="Kata kunci judul atau isi ringkas"></div>' +
      '<div class="field"><label class="label" for="f-kat">Kategori</label><select id="f-kat" class="select"><option value="">Semua kategori</option>' +
      kategori.map(function (k) { return '<option>' + esc(k) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label class="label" for="f-dari">Dari tanggal</label><input id="f-dari" class="input" type="date"></div>' +
      '<div class="field"><label class="label" for="f-sampai">Sampai tanggal</label><input id="f-sampai" class="input" type="date"></div>' +
      '</form><div id="hasil-berita" aria-live="polite"></div></div>');

    function gambar() {
      const q = f.q.toLowerCase();
      const hasil = d.berita.filter(function (b) {
        const tgl = String(b.tanggal).substr(0, 10);
        return (!q || (b.judul + ' ' + b.ringkasan).toLowerCase().indexOf(q) >= 0) &&
          (!f.kat || b.kategori === f.kat) && (!f.dari || tgl >= f.dari) && (!f.sampai || tgl <= f.sampai);
      });
      const p = UI.halaman(hasil, f.hal, 9);
      const box = m.querySelector('#hasil-berita');
      box.innerHTML = hasil.length
        ? '<p class="muted small">Menampilkan ' + hasil.length + ' berita</p><div class="grid grid-3">' + p.items.map(kartuBerita).join('') + '</div>' + UI.kontrolHalaman(p)
        : UI.kosong('Tidak ada berita yang cocok.', 'newspaper');
      UI.$$('[data-hal]', box).forEach(function (b) {
        b.addEventListener('click', function () { f.hal = +b.getAttribute('data-hal'); gambar(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      });
    }
    const baru = function () { f.hal = 1; gambar(); };
    m.querySelector('#f-q').addEventListener('input', UI.debounce(function (e) { f.q = e.target.value; baru(); }, 250));
    m.querySelector('#f-kat').addEventListener('change', function (e) { f.kat = e.target.value; baru(); });
    m.querySelector('#f-dari').addEventListener('change', function (e) { f.dari = e.target.value; baru(); });
    m.querySelector('#f-sampai').addEventListener('change', function (e) { f.sampai = e.target.value; baru(); });
    gambar();
  };

  async function beritaDetail(id) {
    tampil(kepala([{ t: 'Berita', href: '#/berita' }, { t: 'Memuat…' }], 'Memuat berita…') + '<div class="container section">' + UI.rangka(3) + '</div>');
    let b;
    const rid = P.rid;
    try { b = await Api.get('berita', { id: id }); }
    catch (e) {
      if (rid !== P.rid) return;
      tampil(kepala([{ t: 'Berita', href: '#/berita' }, { t: 'Tidak ditemukan' }], 'Berita tidak ditemukan') +
        '<div class="container section"><div class="alert alert-err">' + icon('error') + '<div><p>' + esc(e.message) + '</p><a class="btn btn-primary" href="#/berita">Kembali ke daftar berita</a></div></div></div>');
      return;
    }
    if (rid !== P.rid) return;
    muatDiam();
    const g = UI.gambarAman(b.foto);
    const m = tampil(kepala([{ t: 'Berita', href: '#/berita' }, { t: 'Detail' }], b.judul) +
      '<div class="container section"><article class="artikel">' +
      '<div class="meta">' + (b.kategori ? '<span class="badge badge-muted">' + esc(b.kategori) + '</span>' : '') +
      '<time class="muted small">' + esc(UI.fmtTgl(b.tanggal)) + '</time>' + (b.penulis ? '<span class="muted small">oleh ' + esc(b.penulis) + '</span>' : '') + '</div>' +
      (g ? '<figure class="figur"><img src="' + esc(g) + '" alt="" referrerpolicy="no-referrer"></figure>' : '') +
      '<div class="prosa">' + UI.sanitizeHtml(b.isi) + '</div>' +
      '<div class="artikel-aksi"><a class="btn btn-outline" href="#/berita">' + icon('arrow_back') + 'Semua berita</a>' +
      '<button type="button" class="btn btn-outline" id="btn-salin-tautan">' + icon('link') + 'Salin tautan</button></div></article></div>');
    m.querySelector('#btn-salin-tautan').addEventListener('click', function () {
      UI.salin(location.href).then(function (ok) { UI.toast(ok ? 'Tautan disalin.' : 'Tautan tidak dapat disalin.', ok ? 'ok' : 'err'); });
    });
  }

  // ============================================================
  // PENGUMUMAN
  // ============================================================
  P.pengumuman = async function () {
    tampil(kepala([{ t: 'Pengumuman' }], 'Pengumuman Resmi', 'Pengumuman yang sedang berlaku.') + '<div class="container section">' + UI.rangka(3) + '</div>');
    const d = await muat();
    if (!d) return;
    tampil(kepala([{ t: 'Pengumuman' }], 'Pengumuman Resmi', 'Pengumuman yang sedang berlaku.') +
      '<div class="container section">' +
      (d.pengumuman.length
        ? '<div class="stack-lg">' + d.pengumuman.map(function (p) {
          const rentang = p.mulai || p.berakhir
            ? 'Berlaku ' + (p.mulai ? UI.fmtTgl(p.mulai) : 'sekarang') + (p.berakhir ? ' s.d. ' + UI.fmtTgl(p.berakhir) : '')
            : '';
          return '<article class="card card-pad pengumuman"><div class="meta"><span class="badge badge-amber">' + icon('campaign', 'sm') + ' Pengumuman</span>' +
            (rentang ? '<span class="muted small">' + esc(rentang) + '</span>' : '') + '</div><h2>' + esc(p.judul) + '</h2><div class="prosa">' + UI.paragraf(p.isi) + '</div></article>';
        }).join('') + '</div>'
        : UI.kosong('Tidak ada pengumuman yang sedang berlaku.', 'campaign')) + '</div>');
  };

  // ============================================================
  // REGULASI
  // ============================================================
  P.regulasi = async function () {
    tampil(kepala([{ t: 'Regulasi' }], 'Regulasi dan Dokumen Hukum') + '<div class="container section">' + UI.rangka(3) + '</div>');
    const d = await muat();
    if (!d) return;
    const jenis = Array.from(new Set(d.regulasi.map(function (r) { return r.jenis; }).filter(Boolean))).sort();
    const tahun = Array.from(new Set(d.regulasi.map(function (r) { return r.tahun; }).filter(Boolean))).sort().reverse();
    const f = { q: '', jenis: '', tahun: '', hal: 1 };

    const m = tampil(kepala([{ t: 'Regulasi' }], 'Regulasi dan Dokumen Hukum', 'Peraturan dan keputusan terkait penyelenggaraan angkutan. Berkas dapat dibuka atau diunduh dalam format PDF.') +
      '<div class="container section"><form class="filter-bar" onsubmit="return false">' +
      '<div class="field grow"><label class="label" for="r-q">Cari regulasi</label><input id="r-q" class="input" type="search" placeholder="Nomor, tahun, atau judul regulasi"></div>' +
      '<div class="field"><label class="label" for="r-jenis">Jenis</label><select id="r-jenis" class="select"><option value="">Semua jenis</option>' +
      jenis.map(function (j) { return '<option>' + esc(j) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label class="label" for="r-tahun">Tahun</label><select id="r-tahun" class="select"><option value="">Semua tahun</option>' +
      tahun.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></div></form>' +
      '<div id="hasil-reg" aria-live="polite"></div></div>');

    function gambar() {
      const q = f.q.toLowerCase();
      const hasil = d.regulasi.filter(function (r) {
        return (!q || (r.jenis + ' ' + r.nomor + ' ' + r.tahun + ' ' + r.tentang).toLowerCase().indexOf(q) >= 0) &&
          (!f.jenis || r.jenis === f.jenis) && (!f.tahun || r.tahun === f.tahun);
      });
      const p = UI.halaman(hasil, f.hal, 10);
      const box = m.querySelector('#hasil-reg');
      box.innerHTML = hasil.length
        ? '<p class="muted small">Menampilkan ' + hasil.length + ' dokumen</p><div class="stack">' + p.items.map(function (r) {
          const aman = /^https:\/\//i.test(r.url);
          return '<article class="card card-pad reg-card"><div><div class="meta"><span class="badge badge-primary">' + esc(r.jenis) + '</span>' +
            '<span class="mono small">' + esc((r.nomor ? 'No. ' + r.nomor : '') + (r.tahun ? ' / ' + r.tahun : '')) + '</span></div>' +
            '<h3>' + esc(r.tentang) + '</h3></div>' +
            (aman ? '<div class="reg-aksi"><a class="btn btn-outline btn-sm" href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + icon('visibility') + 'Lihat</a>' +
              '<a class="btn btn-primary btn-sm" href="' + esc(UI.unduhDrive(r.url)) + '" rel="noopener noreferrer">' + icon('download') + 'Unduh PDF</a></div>' : '') + '</article>';
        }).join('') + '</div>' + UI.kontrolHalaman(p)
        : UI.kosong(d.regulasi.length ? 'Tidak ada regulasi yang cocok.' : 'Belum ada regulasi yang diterbitkan.', 'gavel');
      UI.$$('[data-hal]', box).forEach(function (b) {
        b.addEventListener('click', function () { f.hal = +b.getAttribute('data-hal'); gambar(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      });
    }
    const baru = function () { f.hal = 1; gambar(); };
    m.querySelector('#r-q').addEventListener('input', UI.debounce(function (e) { f.q = e.target.value; baru(); }, 250));
    m.querySelector('#r-jenis').addEventListener('change', function (e) { f.jenis = e.target.value; baru(); });
    m.querySelector('#r-tahun').addEventListener('change', function (e) { f.tahun = e.target.value; baru(); });
    gambar();
  };

  // ============================================================
  // PENGADUAN (F4)
  // ============================================================
  P.pengaduan = async function () {
    tampil(kepala([{ t: 'Pengaduan' }], 'Layanan Pengaduan Masyarakat') + '<div class="container section">' + UI.rangka(3) + '</div>');
    const d = await muat();
    if (!d) return;
    const waktuMulai = Date.now();
    let lampiran = null;

    const m = tampil(kepala([{ t: 'Pengaduan' }], 'Layanan Pengaduan Masyarakat',
      'Laporkan masalah angkutan umum di Kota Balikpapan. Tidak perlu login. Setelah terkirim, Anda akan mendapat Kode Tiket untuk memantau tindak lanjut.', 'Formulir Pengaduan') +
      '<div class="container section"><div class="layout-form"><form id="form-aduan" class="card card-pad stack-lg" novalidate>' +

      '<div class="alert alert-info">' + icon('info') + '<div><strong>Simpan Kode Tiket Anda.</strong> Kode ini satu-satunya cara memantau status pengaduan. Kami tidak mengirim email atau pesan otomatis.</div></div>' +

      '<fieldset class="stack"><legend>Data pelapor</legend>' +
      '<div class="field"><div class="label-baris"><label class="label" for="a-nama">Nama pelapor <span class="wajib">*</span></label>' +
      '<label class="check"><input type="checkbox" id="a-anonim"> <span>Kirim sebagai anonim</span></label></div>' +
      '<input id="a-nama" class="input" autocomplete="name" maxlength="100" placeholder="Nama lengkap Anda"></div>' +
      '<div class="field"><label class="label" for="a-kontak">Kontak aktif (WhatsApp, telepon, atau email) <span class="wajib">*</span></label>' +
      '<input id="a-kontak" class="input" autocomplete="tel" maxlength="80" placeholder="08xxxxxxxxxx atau nama@email.com" required>' +
      '<p class="hint">Hanya dilihat petugas untuk klarifikasi. Tidak ditampilkan di halaman publik.</p></div></fieldset>' +

      '<fieldset class="stack"><legend>Detail kejadian</legend>' +
      '<div class="field"><label class="label" for="a-kategori">Kategori <span class="wajib">*</span></label><select id="a-kategori" class="select" required><option value="">Pilih kategori</option>' +
      d.kategoriPengaduan.map(function (k) { return '<option>' + esc(k) + '</option>'; }).join('') + '</select></div>' +
      '<div class="grid grid-2"><div class="field"><label class="label" for="a-plat">Nomor kendaraan / trayek <span class="opsional">(opsional)</span></label>' +
      '<input id="a-plat" class="input" maxlength="40" placeholder="Contoh: KT 1234 AB / Trayek 3"></div>' +
      '<div class="field"><label class="label" for="a-lokasi">Lokasi dan waktu kejadian <span class="wajib">*</span></label>' +
      '<input id="a-lokasi" class="input" maxlength="200" placeholder="Contoh: Halte Jl. Sudirman, pukul 14.30 WITA" required></div></div>' +
      '<div class="field"><label class="label" for="a-isi">Isi pengaduan <span class="wajib">*</span></label>' +
      '<textarea id="a-isi" class="textarea" rows="6" maxlength="3000" placeholder="Jelaskan kronologi kejadian secara runtut dan jelas." required></textarea>' +
      '<p class="hint"><span id="a-hitung">0</span> / 3000 karakter</p></div></fieldset>' +

      '<fieldset class="stack"><legend>Lampiran <span class="opsional">(opsional)</span></legend>' +
      '<div class="field"><label class="unggah" for="a-berkas">' + icon('cloud_upload') + '<strong>Pilih foto atau dokumen bukti</strong><span>JPG, PNG, atau PDF. Maksimal ' + MAKS_MB + ' MB.</span></label>' +
      '<input id="a-berkas" class="sr-only" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf">' +
      '<div id="a-berkas-info" class="berkas-info" hidden></div></div></fieldset>' +

      '<div class="hp" aria-hidden="true"><label for="a-web">Jangan diisi</label><input id="a-web" tabindex="-1" autocomplete="off"></div>' +
      '<div id="a-galat" class="alert alert-err" role="alert" hidden></div>' +
      '<div class="aksi-form"><button type="submit" class="btn btn-primary btn-lg" id="a-kirim">' + icon('send') + 'Kirim Pengaduan</button></div>' +
      '</form>' +

      '<aside class="stack"><div class="card card-pad"><h2 class="h3">' + icon('lightbulb') + ' Tips pelaporan</h2><ul class="list">' +
      '<li><strong>Nomor kendaraan/trayek</strong> memudahkan petugas menemukan armada.</li>' +
      '<li><strong>Foto yang jelas</strong> membantu verifikasi.</li>' +
      '<li><strong>Lokasi spesifik</strong>: nama jalan, halte, atau patokan terdekat.</li></ul></div>' +
      '<div class="alert alert-warn">' + icon('emergency') + '<div><strong>Keadaan darurat?</strong> Untuk kecelakaan atau gangguan mendesak, hubungi ' +
      (pv('kontak_telepon') ? 'Call Center ' + esc(pv('kontak_telepon')) + ' atau ' : '') + 'layanan darurat setempat. Formulir ini tidak untuk laporan darurat.</div></div></aside></div></div>');

    const q = function (s) { return m.querySelector(s); };
    const galat = function (t) { const b = q('#a-galat'); b.textContent = t; b.hidden = !t; if (t) b.scrollIntoView({ block: 'center', behavior: 'smooth' }); };

    q('#a-anonim').addEventListener('change', function (e) {
      const n = q('#a-nama');
      n.disabled = e.target.checked;
      if (e.target.checked) n.value = '';
    });
    q('#a-isi').addEventListener('input', function (e) { q('#a-hitung').textContent = e.target.value.length; });

    function resetBerkas() { lampiran = null; q('#a-berkas').value = ''; q('#a-berkas-info').hidden = true; }
    q('#a-berkas').addEventListener('change', async function (e) {
      const file = e.target.files[0];
      if (!file) return resetBerkas();
      try {
        lampiran = await UI.bacaBerkas(file, { maksMB: MAKS_MB, jenis: JENIS_LAMPIRAN, label: 'JPG, PNG, atau PDF' });
        const info = q('#a-berkas-info');
        info.hidden = false;
        info.innerHTML = icon('description') + '<span class="berkas-nama">' + esc(file.name) + ' <span class="muted">(' + (file.size / 1024 / 1024).toFixed(2).replace('.', ',') + ' MB)</span></span>' +
          '<button type="button" class="icon-btn" id="a-hapus-berkas" aria-label="Hapus lampiran">' + icon('close') + '</button>';
        q('#a-hapus-berkas').addEventListener('click', resetBerkas);
      } catch (err) { resetBerkas(); galat(err.message); }
    });

    q('#form-aduan').addEventListener('submit', async function (e) {
      e.preventDefault();
      galat('');
      const anonim = q('#a-anonim').checked;
      const data = {
        anonim: anonim, nama: q('#a-nama').value, kontak: q('#a-kontak').value, kategori: q('#a-kategori').value,
        plat: q('#a-plat').value, lokasi: q('#a-lokasi').value, isi: q('#a-isi').value,
        website: q('#a-web').value, waktuIsiMs: Date.now() - waktuMulai, lampiran: lampiran
      };
      if (!anonim && data.nama.trim().length < 2) return galat('Nama pelapor wajib diisi, atau centang "Kirim sebagai anonim".');
      if (data.kontak.trim().length < 6) return galat('Kontak aktif wajib diisi (WhatsApp, telepon, atau email).');
      if (!data.kategori) return galat('Pilih kategori pengaduan.');
      if (data.lokasi.trim().length < 3) return galat('Lokasi dan waktu kejadian wajib diisi.');
      if (data.isi.trim().length < 10) return galat('Isi pengaduan terlalu singkat (minimal 10 karakter).');

      const btn = q('#a-kirim');
      UI.sibuk(btn, true, 'Mengirim…');
      try {
        const r = await Api.post('kirimPengaduan', data);
        Api.lupakanCache();
        simpanTiket(r.kode);
        modalBerhasil(r.kode);
        q('#form-aduan').reset();
        resetBerkas();
        q('#a-nama').disabled = false;
        q('#a-hitung').textContent = '0';
      } catch (err) {
        galat(err.message);
      } finally {
        UI.sibuk(btn, false);
      }
    });
  };

  function modalBerhasil(kode) {
    const m = UI.modal({
      judul: 'Pengaduan terkirim', tetap: true,
      isi: '<div class="sukses">' + icon('check_circle', 'sukses-ikon') + '<p>Terima kasih. Laporan Anda telah tercatat.</p>' +
        '<div class="kode-besar" aria-live="polite"><span class="label">Kode Tiket Anda</span><strong class="mono" id="kode-hasil">' + esc(kode) + '</strong></div>' +
        '<div class="alert alert-warn">' + icon('warning') + '<div><strong>Simpan kode ini sekarang.</strong> Tanpa kode, status pengaduan tidak dapat dilacak.</div></div></div>',
      kaki: '<button type="button" class="btn btn-outline" id="m-salin">' + icon('content_copy') + 'Salin kode</button>' +
        '<a class="btn btn-primary" href="#/cek-status/' + encodeURIComponent(kode) + '" data-tutup>' + icon('track_changes') + 'Lacak tiket</a>'
    });
    m.$('#m-salin').addEventListener('click', function () {
      UI.salin(kode).then(function (ok) { UI.toast(ok ? 'Kode tiket disalin.' : 'Salin manual kode di layar.', ok ? 'ok' : 'err'); });
    });
  }

  // ============================================================
  // CEK STATUS (F4b)
  // ============================================================
  const LANGKAH = [
    { s: 'Diterima', t: 'Laporan diterima', k: 'Pengaduan tercatat dan menunggu verifikasi petugas.' },
    { s: 'Diproses', t: 'Sedang diproses', k: 'Petugas menindaklanjuti laporan Anda.' },
    { s: 'Selesai', t: 'Selesai', k: 'Penanganan pengaduan telah selesai.' }
  ];

  // Tab pada halaman Cek Status: tiket pengaduan, kendaraan angkutan, dan (bila ETL_URL diisi) surat tilang
  function tabCek(aktif) {
    function chip(kunci, href, teks) {
      return '<a class="chip' + (aktif === kunci ? ' aktif' : '') + '" href="' + href + '"' + (aktif === kunci ? ' aria-current="page"' : '') + '>' + teks + '</a>';
    }
    return '<nav class="chips" aria-label="Jenis pengecekan">' +
      chip('tiket', '#/cek-status', 'Tiket Pengaduan') +
      chip('kendaraan', '#/cek-status/kendaraan', 'Kendaraan Angkutan') +
      (Api.etlSiap() ? chip('surat', '#/cek-status/surat', 'Surat Tilang') : '') + '</nav>';
  }

  function barisData(label, nilai) {
    return '<div><dt>' + esc(label) + '</dt><dd>' + esc(nilai) + '</dd></div>';
  }

  function cekKendaraan() {
    const m = tampil(kepala([{ t: 'Cek Status' }, { t: 'Kendaraan' }], 'Cek Status Kendaraan', 'Periksa apakah angkutan umum berizin aktif dengan memasukkan nomor polisi.', 'Tanpa login') +
      '<div class="container section"><div class="cek-wrap">' + tabCek('kendaraan') +
      '<form id="form-nopol" class="card card-pad" novalidate>' +
      '<label class="label" for="k-nopol">Nomor polisi</label><div class="cek-form"><input id="k-nopol" class="input mono input-besar" maxlength="15" placeholder="Contoh: KT 1234 BC" autocomplete="off" autocapitalize="characters" spellcheck="false">' +
      '<button type="submit" class="btn btn-primary" id="k-btn">' + icon('search') + 'Cek</button></div></form>' +
      '<div id="k-hasil" aria-live="polite"></div></div></div>');

    const box = m.querySelector('#k-hasil');
    async function cari() {
      const nopol = m.querySelector('#k-nopol').value.trim().toUpperCase();
      if (nopol.length < 3) {
        box.innerHTML = '<div class="alert alert-err" role="alert">' + icon('error') + '<div>Masukkan nomor polisi kendaraan.</div></div>';
        return;
      }
      const btn = m.querySelector('#k-btn');
      UI.sibuk(btn, true, 'Mencari…');
      box.innerHTML = '';
      try {
        const x = await Api.simau('api_publicCekStatusNopol', [nopol]);
        box.innerHTML = hasilKendaraan(x);
      } catch (err) {
        box.innerHTML = '<div class="alert alert-err" role="alert">' + icon('error') + '<div>' + esc(err.message) + '</div></div>';
      } finally {
        UI.sibuk(btn, false);
      }
    }
    m.querySelector('#form-nopol').addEventListener('submit', function (e) { e.preventDefault(); cari(); });
    m.querySelector('#k-nopol').focus();
  }

  // Cek surat penindakan E-Tilang Dishub (data diambil dari aplikasi E-Tilang; hanya tampil bila ETL_URL diisi)
  function cekSurat() {
    const m = tampil(kepala([{ t: 'Cek Status' }, { t: 'Surat Tilang' }], 'Cek Status Surat Tilang', 'Periksa status surat penindakan dengan nomor surat dan nomor polisi.', 'Tanpa login') +
      '<div class="container section"><div class="cek-wrap">' + tabCek('surat') +
      '<form id="form-surat" class="card card-pad" novalidate>' +
      '<label class="label" for="s-nomor">Nomor surat penindakan</label>' +
      '<input id="s-nomor" class="input mono input-besar" maxlength="60" placeholder="Contoh: 0012/ETL/DISHUB/X/2026" autocomplete="off" autocapitalize="characters" spellcheck="false">' +
      '<label class="label" for="s-nopol" style="margin-top:12px">Nomor polisi kendaraan</label>' +
      '<div class="cek-form"><input id="s-nopol" class="input mono input-besar" maxlength="15" placeholder="Contoh: KT 1234 BC" autocomplete="off" autocapitalize="characters" spellcheck="false">' +
      '<button type="submit" class="btn btn-primary" id="s-btn">' + icon('search') + 'Cek</button></div>' +
      '<p class="hint">Nomor surat dan nomor polisi harus cocok. Nama dan alamat tidak ditampilkan.</p></form>' +
      '<div id="s-hasil" aria-live="polite"></div></div></div>');

    const box = m.querySelector('#s-hasil');
    async function cari() {
      const nomor = m.querySelector('#s-nomor').value.trim();
      const nopol = m.querySelector('#s-nopol').value.trim().toUpperCase();
      if (!nomor || nopol.length < 3) {
        box.innerHTML = '<div class="alert alert-err" role="alert">' + icon('error') + '<div>Isi nomor surat dan nomor polisi.</div></div>';
        return;
      }
      const btn = m.querySelector('#s-btn');
      UI.sibuk(btn, true, 'Memeriksa…');
      box.innerHTML = '';
      try {
        const x = await Api.etl('publik.cek', { nomor_surat: nomor, nopol: nopol });
        box.innerHTML = hasilSurat(x);
      } catch (err) {
        box.innerHTML = '<div class="alert alert-err" role="alert">' + icon('error') + '<div>' + esc(err.message) + '</div></div>';
      } finally {
        UI.sibuk(btn, false);
      }
    }
    m.querySelector('#form-surat').addEventListener('submit', function (e) { e.preventDefault(); cari(); });
    m.querySelector('#s-nomor').focus();
  }

  P.cekStatus = async function (ctx) {
    if (decodeURIComponent(ctx.parts[1] || '').toLowerCase() === 'kendaraan') return cekKendaraan();
    if (decodeURIComponent(ctx.parts[1] || '').toLowerCase() === 'surat') return Api.etlSiap() ? cekSurat() : (location.replace('#/cek-status'), undefined);
    const awal = decodeURIComponent(ctx.parts[1] || '').toUpperCase();
    const m = tampil(kepala([{ t: 'Cek Status' }, { t: 'Tiket' }], 'Cek Status Pengaduan', 'Masukkan Kode Tiket untuk melihat perkembangan tindak lanjut pengaduan Anda.', 'Tanpa login') +
      '<div class="container section"><div class="cek-wrap">' + tabCek('tiket') + '<form id="form-cek" class="card card-pad" novalidate>' +
      '<label class="label" for="c-kode">Kode Tiket</label><div class="cek-form"><input id="c-kode" class="input mono input-besar" maxlength="14" placeholder="ADU-XXXXXXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" value="' + esc(awal) + '">' +
      '<button type="submit" class="btn btn-primary" id="c-btn">' + icon('search') + 'Cari status</button></div>' +
      '<div id="c-saya"></div></form><div id="c-hasil" aria-live="polite"></div>' +
      '<div class="alert alert-info">' + icon('help') + '<div><strong>Kode tiket hilang?</strong> Hubungi ' +
      (pv('kontak_telepon') ? 'Call Center <strong>' + esc(pv('kontak_telepon')) + '</strong>' : 'kantor kami') +
      ' dengan menyebutkan nama atau kontak yang Anda pakai saat melapor dan perkiraan tanggalnya. Petugas dapat mencarinya.</div></div></div></div>');

    const tiket = tiketSaya();
    if (tiket.length) {
      m.querySelector('#c-saya').innerHTML = '<p class="hint">Tiket yang pernah Anda kirim dari perangkat ini:</p><div class="chips">' +
        tiket.map(function (t) { return '<button type="button" class="chip mono" data-kode="' + esc(t.kode) + '">' + esc(t.kode) + '</button>'; }).join('') + '</div>';
      UI.$$('[data-kode]', m).forEach(function (b) {
        b.addEventListener('click', function () { m.querySelector('#c-kode').value = b.getAttribute('data-kode'); cari(); });
      });
    }

    async function cari() {
      const kode = m.querySelector('#c-kode').value.trim().toUpperCase();
      const box = m.querySelector('#c-hasil');
      if (!/^ADU-[A-Z0-9]{8}$/.test(kode)) {
        box.innerHTML = '<div class="alert alert-err" role="alert">' + icon('error') + '<div>Format kode tidak sesuai. Contoh: <span class="mono">ADU-7K3Q9XMB</span></div></div>';
        return;
      }
      const btn = m.querySelector('#c-btn');
      UI.sibuk(btn, true, 'Mencari…');
      box.innerHTML = '';
      try {
        const r = await Api.post('cekStatus', { kode: kode });
        const x = r.data;
        const idx = Math.max(0, LANGKAH.findIndex(function (l) { return l.s === x.status; }));
        box.innerHTML =
          '<div class="card hasil-status"><div class="ribbon ribbon-' + esc(x.status.toLowerCase()) + '">' + icon(x.status === 'Selesai' ? 'task_alt' : 'autorenew') + '<strong>' + esc(x.status) + '</strong></div>' +
          '<div class="card-pad stack-lg"><div class="kode-baris"><div><span class="label">Kode Tiket</span><strong class="mono kode-teks">' + esc(x.kode) + '</strong></div>' +
          '<button type="button" class="btn btn-outline btn-sm" id="c-salin">' + icon('content_copy') + 'Salin</button></div>' +
          '<dl class="dl"><div><dt>Kategori</dt><dd>' + esc(x.kategori) + '</dd></div><div><dt>Tanggal masuk</dt><dd>' + esc(UI.fmtTgl(x.tanggal, true)) + '</dd></div></dl>' +
          '<ol class="stepper" aria-label="Tahapan penanganan">' + LANGKAH.map(function (l, i) {
            const kelas = i < idx || (x.status === 'Selesai' && i === idx) ? 'selesai' : (i === idx ? 'aktif' : '');
            return '<li class="' + kelas + '"' + (i === idx ? ' aria-current="step"' : '') + '><span class="langkah-titik">' + (kelas === 'selesai' ? icon('check') : (i + 1)) + '</span><div><strong>' + esc(l.t) + '</strong><span>' + esc(l.k) + '</span></div></li>';
          }).join('') + '</ol>' +
          (x.tanggapan ? '<div class="tanggapan"><div class="tanggapan-kepala">' + icon('badge') + '<strong>Tanggapan resmi ' + esc(cfg.NAMA_BIDANG) + '</strong>' +
            (x.tanggalTanggapan ? '<span class="muted small">' + esc(UI.fmtTgl(x.tanggalTanggapan, true)) + '</span>' : '') + '</div><div class="prosa">' + UI.paragraf(x.tanggapan) + '</div></div>'
            : '<p class="muted">Belum ada tanggapan resmi yang ditampilkan untuk tiket ini.</p>') +
          '<div class="alert alert-info">' + icon('lock') + '<div>Demi privasi, nama, kontak, isi laporan, dan lampiran pelapor tidak ditampilkan di halaman ini.</div></div></div></div>';
        m.querySelector('#c-salin').addEventListener('click', function () {
          UI.salin(x.kode).then(function (ok) { UI.toast(ok ? 'Kode tiket disalin.' : 'Gagal menyalin.', ok ? 'ok' : 'err'); });
        });
      } catch (err) {
        box.innerHTML = '<div class="alert alert-err" role="alert">' + icon('error') + '<div>' + esc(err.message) + '</div></div>';
      } finally {
        UI.sibuk(btn, false);
      }
    }

    m.querySelector('#form-cek').addEventListener('submit', function (e) { e.preventDefault(); cari(); });
    if (awal) cari();
  };

  // ============================================================
  // SURVEI (F5)
  // ============================================================
  const ASPEK = [
    { k: 'akses', t: 'Kemudahan akses informasi dan regulasi', d: 'Kemudahan mencari informasi, regulasi, dan kanal pengaduan angkutan.' },
    { k: 'respons', t: 'Kecepatan respons tindak lanjut pengaduan', d: 'Ketepatan waktu petugas menindaklanjuti keluhan dan kejelasan status tiket.' },
    { k: 'petugas', t: 'Keramahan dan profesionalitas petugas', d: 'Sikap petugas dalam melayani masyarakat.' },
    { k: 'fasilitas', t: 'Kondisi fasilitas dan kenyamanan angkutan', d: 'Kebersihan, kenyamanan, dan kelayakan halte, rambu, serta armada.' }
  ];
  const LABEL_SKOR = { 1: 'Sangat kurang', 2: 'Kurang', 3: 'Cukup', 4: 'Baik', 5: 'Sangat baik' };

  P.survei = async function () {
    muatDiam();
    const waktuMulai = Date.now();
    const m = tampil(kepala([{ t: 'Survei' }], 'Survei Kepuasan Layanan', 'Penilaian Anda membantu kami meningkatkan mutu layanan. Survei bersifat anonim dan hanya memerlukan sekitar 2 menit.', 'Indeks Kepuasan Masyarakat') +
      '<div class="container section"><form id="form-survei" class="card card-pad stack-lg" novalidate>' +
      '<p class="muted">Skala: 1 = Sangat kurang, 5 = Sangat baik.</p>' +
      ASPEK.map(function (a, i) {
        let radios = '';
        for (let n = 5; n >= 1; n--) {
          radios += '<input type="radio" id="s-' + a.k + '-' + n + '" name="' + a.k + '" value="' + n + '"><label for="s-' + a.k + '-' + n + '" title="' + n + ' — ' + LABEL_SKOR[n] + '"><span class="sr-only">' + n + ' bintang, ' + LABEL_SKOR[n] + '</span>' + icon('star') + '</label>';
        }
        return '<fieldset class="aspek"><legend><span class="eyebrow">Aspek ' + (i + 1) + '</span>' + esc(a.t) + '</legend><p class="muted small">' + esc(a.d) + '</p>' +
          '<div class="rating-baris"><div class="rating" role="radiogroup" aria-label="' + esc(a.t) + '">' + radios + '</div><span class="rating-label" id="l-' + a.k + '">Belum dinilai</span></div></fieldset>';
      }).join('') +
      '<div class="field"><label class="label" for="s-saran">Saran dan masukan <span class="opsional">(opsional)</span></label>' +
      '<textarea id="s-saran" class="textarea" rows="4" maxlength="1000" placeholder="Tuliskan pengalaman, kritik, atau saran perbaikan."></textarea></div>' +
      '<div class="hp" aria-hidden="true"><label for="s-web">Jangan diisi</label><input id="s-web" tabindex="-1" autocomplete="off"></div>' +
      '<div id="s-galat" class="alert alert-err" role="alert" hidden></div>' +
      '<div class="aksi-form"><button type="submit" class="btn btn-primary btn-lg" id="s-kirim">' + icon('send') + 'Kirim Penilaian</button>' +
      '<a class="btn btn-ghost" href="#/statistik">Lihat hasil survei</a></div></form></div>');

    ASPEK.forEach(function (a) {
      UI.$$('input[name=' + a.k + ']', m).forEach(function (r) {
        r.addEventListener('change', function () { m.querySelector('#l-' + a.k).textContent = r.value + ' — ' + LABEL_SKOR[r.value]; });
      });
    });

    m.querySelector('#form-survei').addEventListener('submit', async function (e) {
      e.preventDefault();
      const box = m.querySelector('#s-galat');
      box.hidden = true;
      const data = { saran: m.querySelector('#s-saran').value, website: m.querySelector('#s-web').value, waktuIsiMs: Date.now() - waktuMulai };
      for (let i = 0; i < ASPEK.length; i++) {
        const c = m.querySelector('input[name=' + ASPEK[i].k + ']:checked');
        if (!c) { box.textContent = 'Mohon beri penilaian untuk aspek "' + ASPEK[i].t + '".'; box.hidden = false; return; }
        data[ASPEK[i].k] = +c.value;
      }
      const btn = m.querySelector('#s-kirim');
      UI.sibuk(btn, true, 'Mengirim…');
      try {
        await Api.post('kirimSurvei', data);
        Api.lupakanCache();
        tampil(kepala([{ t: 'Survei' }], 'Terima kasih!') + '<div class="container section"><div class="card card-pad sukses">' + icon('check_circle', 'sukses-ikon') +
          '<h2>Penilaian Anda sudah kami terima</h2><p class="muted">Masukan Anda akan dipakai untuk meningkatkan layanan angkutan di Kota Balikpapan.</p>' +
          '<div class="aksi-form"><a class="btn btn-primary" href="#/statistik">Lihat statistik layanan</a><a class="btn btn-outline" href="#/">Kembali ke Beranda</a></div></div></div>');
      } catch (err) {
        box.textContent = err.message; box.hidden = false;
      } finally {
        UI.sibuk(btn, false);
      }
    });
  };

  // ============================================================
  // STATISTIK (F6) — grafik SVG buatan sendiri, tanpa pustaka
  // ============================================================
  function grafikBatang(data) {
    if (!data.length) return UI.kosong('Belum ada data pengaduan.', 'bar_chart');
    const W = 640, H = 250, ml = 38, mb = 28, mt = 12, mr = 8;
    const maks = Math.max(4, Math.max.apply(null, data.map(function (x) { return x.masuk; })));
    const langkah = Math.ceil(maks / 4);
    const batas = langkah * 4;
    const pw = W - ml - mr, ph = H - mt - mb;
    const gw = pw / data.length;
    const bw = Math.min(22, gw / 3);
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="grafik" role="img" aria-label="Grafik batang jumlah pengaduan masuk dan selesai per bulan">';
    for (let i = 0; i <= 4; i++) {
      const y = mt + ph - (ph * i / 4);
      s += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + y + '" y2="' + y + '" class="g-garis"/><text x="' + (ml - 6) + '" y="' + (y + 4) + '" text-anchor="end" class="g-teks">' + (langkah * i) + '</text>';
    }
    data.forEach(function (x, i) {
      const cx = ml + gw * i + gw / 2;
      const h1 = ph * x.masuk / batas, h2 = ph * x.selesai / batas;
      s += '<rect x="' + (cx - bw - 1) + '" y="' + (mt + ph - h1) + '" width="' + bw + '" height="' + h1 + '" rx="3" class="g-batang1"><title>' + esc(UI.fmtBulan(x.bulan)) + ': ' + x.masuk + ' masuk</title></rect>';
      s += '<rect x="' + (cx + 1) + '" y="' + (mt + ph - h2) + '" width="' + bw + '" height="' + h2 + '" rx="3" class="g-batang2"><title>' + esc(UI.fmtBulan(x.bulan)) + ': ' + x.selesai + ' selesai</title></rect>';
      s += '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle" class="g-teks">' + esc(UI.fmtBulan(x.bulan)) + '</text>';
    });
    return s + '</svg>';
  }

  function grafikGaris(data) {
    if (!data.length) return UI.kosong('Belum ada data survei.', 'show_chart');
    const W = 640, H = 220, ml = 38, mb = 28, mt = 14, mr = 14;
    const pw = W - ml - mr, ph = H - mt - mb;
    const x = function (i) { return data.length === 1 ? ml + pw / 2 : ml + (pw * i / (data.length - 1)); };
    const y = function (v) { return mt + ph - ph * (v - 1) / 4; };
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="grafik" role="img" aria-label="Grafik garis rata-rata nilai survei per bulan">';
    for (let v = 1; v <= 5; v++) s += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + y(v) + '" y2="' + y(v) + '" class="g-garis"/><text x="' + (ml - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end" class="g-teks">' + v + '</text>';
    s += '<polyline fill="none" class="g-garis-data" points="' + data.map(function (d, i) { return x(i) + ',' + y(d.rata); }).join(' ') + '"/>';
    data.forEach(function (d, i) {
      s += '<circle cx="' + x(i) + '" cy="' + y(d.rata) + '" r="4.5" class="g-titik"><title>' + esc(UI.fmtBulan(d.bulan)) + ': ' + UI.fmtSkor(d.rata) + ' (' + d.n + ' responden)</title></circle>';
      s += '<text x="' + x(i) + '" y="' + (y(d.rata) - 9) + '" text-anchor="middle" class="g-teks g-tebal">' + UI.fmtSkor(d.rata) + '</text>';
      s += '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle" class="g-teks">' + esc(UI.fmtBulan(d.bulan)) + '</text>';
    });
    return s + '</svg>';
  }

  function barHorizontal(label, nilai, maks, teks, kelas) {
    const persen = maks ? Math.max(0, Math.min(100, nilai / maks * 100)) : 0;
    return '<div class="hbar"><div class="hbar-atas"><span>' + esc(label) + '</span><strong class="mono">' + esc(teks) + '</strong></div>' +
      '<div class="hbar-trek" role="presentation"><div class="hbar-isi ' + (kelas || '') + '" style="width:' + persen.toFixed(1) + '%"></div></div></div>';
  }

  // ============================================================
  // SIMAU (tautan ke halaman publik aplikasi SIMAU)
  // ============================================================
  // Halaman SIMAU sudah dihapus; tautan lama (#/simau) dialihkan ke Beranda
  P.simau = function () { location.replace('#/'); };

  P.statistik = async function () {
    tampil(kepala([{ t: 'Statistik' }], 'Statistik Layanan') + '<div class="container section">' + UI.rangka(4) + '</div>');
    const d = await muat();
    if (!d) return;
    const st = d.statistik, pa = st.pengaduan, sv = st.survei;
    const kat = Object.keys(pa.perKategori).sort(function (a, b) { return pa.perKategori[b] - pa.perKategori[a]; });
    const maksKat = kat.length ? pa.perKategori[kat[0]] : 0;
    const label = { akses: 'Kemudahan akses informasi dan regulasi', respons: 'Kecepatan respons tindak lanjut pengaduan', petugas: 'Keramahan dan profesionalitas petugas', fasilitas: 'Kondisi fasilitas dan kenyamanan angkutan' };

    tampil(kepala([{ t: 'Statistik' }], 'Statistik Layanan', 'Data agregat pengaduan dan kepuasan masyarakat. Identitas pelapor tidak pernah ditampilkan.', 'Transparansi') +
      '<div class="container section stack-xl"><div class="grid grid-4">' +
      kpi('inbox', UI.fmtAngka(pa.total), 'Total pengaduan') +
      kpi('task_alt', pa.total ? persen(pa.persenSelesai) : '—', 'Pengaduan selesai') +
      kpi('star', sv.responden ? UI.fmtSkor(sv.rataTotal) : '—', 'Indeks kepuasan (skala 5)') +
      kpi('groups', UI.fmtAngka(sv.responden), 'Responden survei') + '</div>' +

      '<section class="card card-pad"><h2 class="h3">Pengaduan per bulan</h2>' +
      '<div class="legenda"><span><i class="kotak k1"></i>Masuk</span><span><i class="kotak k2"></i>Selesai</span></div>' + grafikBatang(pa.perBulan) + '</section>' +

      '<div class="grid grid-2"><section class="card card-pad"><h2 class="h3">Pengaduan per status</h2>' +
      (pa.total ? ['Diterima', 'Diproses', 'Selesai'].map(function (s) {
        return barHorizontal(s, pa.perStatus[s], pa.total, pa.perStatus[s] + ' (' + Math.round(pa.perStatus[s] / pa.total * 100) + '%)', s === 'Selesai' ? 'h-ok' : (s === 'Diproses' ? 'h-info' : 'h-warn'));
      }).join('') : UI.kosong('Belum ada data.', 'pie_chart')) + '</section>' +
      '<section class="card card-pad"><h2 class="h3">Pengaduan per kategori</h2>' +
      (kat.length ? kat.map(function (k) { return barHorizontal(k, pa.perKategori[k], maksKat, String(pa.perKategori[k])); }).join('') : UI.kosong('Belum ada data.', 'category')) + '</section></div>' +

      '<div class="grid grid-2"><section class="card card-pad"><h2 class="h3">Nilai survei per aspek</h2>' +
      (sv.responden ? Object.keys(label).map(function (k) { return barHorizontal(label[k], sv.rataAspek[k], 5, UI.fmtSkor(sv.rataAspek[k]) + ' / 5', 'h-primary'); }).join('') : UI.kosong('Belum ada data survei.', 'rate_review')) + '</section>' +
      '<section class="card card-pad"><h2 class="h3">Rata-rata nilai survei per bulan</h2>' + grafikGaris(sv.perBulan) + '</section></div>' +
      '<p class="muted small center">Data diperbarui otomatis dari sistem. Terakhir dimuat: ' + esc(UI.fmtTgl(d.dibuat, true)) + '</p></div>');
  };

  // ============================================================
  // LOGIN ADMIN
  // ============================================================
  P.login = async function () {
    if (Api.token()) { P.setelahLogin(Api.role()); return; }
    muatDiam();
    const m = tampil('<div class="container section"><div class="login-wrap"><form id="form-login" class="card card-pad stack-lg" novalidate>' +
      '<div class="center">' + icon('admin_panel_settings', 'login-ikon') + '<h1 class="h2" id="judul-halaman" tabindex="-1">Login Admin</h1><p class="muted">Satu akun untuk panel website dan SIMAU.</p></div>' +
      '<div class="field"><label class="label" for="l-user">Username</label><input id="l-user" class="input" autocomplete="username" autocapitalize="none" required></div>' +
      '<div class="field"><label class="label" for="l-pass">Kata sandi</label><input id="l-pass" class="input" type="password" autocomplete="current-password" required></div>' +
      '<div id="l-galat" class="alert alert-err" role="alert" hidden></div>' +
      '<button class="btn btn-primary btn-block" type="submit" id="l-btn">' + icon('login') + 'Masuk</button>' +
      '<p class="center small"><a href="#/">← Kembali ke situs</a></p></form></div></div>');

    m.querySelector('#form-login').addEventListener('submit', async function (e) {
      e.preventDefault();
      const box = m.querySelector('#l-galat');
      box.hidden = true;
      const u = m.querySelector('#l-user').value.trim(), p = m.querySelector('#l-pass').value;
      if (!u || !p) { box.textContent = 'Username dan kata sandi wajib diisi.'; box.hidden = false; return; }
      const btn = m.querySelector('#l-btn');
      UI.sibuk(btn, true, 'Memeriksa…');
      try {
        const r = await Api.post('login', { username: u, password: p });
        Api.simpanToken(r.token, { username: r.username, nama: r.nama, role: r.role, idPemilik: r.idPemilik || '' });
        P.setelahLogin(r.role);
      } catch (err) {
        box.textContent = err.message; box.hidden = false;
      } finally {
        UI.sibuk(btn, false);
      }
    });
  };

  window.Publik = P;
})();
