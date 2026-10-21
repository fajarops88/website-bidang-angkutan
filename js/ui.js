/* ============================================================
 * UI — pembantu tampilan (escape, sanitasi, tanggal, modal, toast)
 * ============================================================ */
(function () {
  'use strict';
  const UI = {};

  UI.$ = function (sel, root) { return (root || document).querySelector(sel); };
  UI.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  UI.esc = function (s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  UI.icon = function (name, cls) {
    return '<span class="material-symbols-outlined ' + (cls || '') + '" aria-hidden="true">' + name + '</span>';
  };

  // ---------- Teks & tanggal ----------
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const pad = function (n) { return (n < 10 ? '0' : '') + n; };

  UI.parseTgl = function (s) {
    const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
  };
  UI.fmtTgl = function (s, denganJam) {
    const d = UI.parseTgl(s);
    if (!d) return '-';
    let out = d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
    if (denganJam && /\d{2}:\d{2}/.test(String(s))) out += ', ' + pad(d.getHours()) + '.' + pad(d.getMinutes()) + ' WITA';
    return out;
  };
  UI.fmtBulan = function (ym) {
    const m = String(ym).match(/^(\d{4})-(\d{2})$/);
    return m ? BULAN_PENDEK[+m[2] - 1] + ' ' + m[1].substr(2) : ym;
  };
  UI.fmtAngka = function (n) { return (Number(n) || 0).toLocaleString('id-ID'); };
  UI.fmtSkor = function (n) { return (Number(n) || 0).toFixed(2).replace('.', ','); };
  UI.hariIni = function () {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };

  // Teks biasa -> paragraf (aman, sudah di-escape)
  UI.paragraf = function (teks) {
    const t = String(teks || '').trim();
    if (!t) return '';
    return t.split(/\n{2,}/).map(function (p) {
      return '<p>' + UI.esc(p.trim()).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  };
  // Satu baris = satu butir daftar
  UI.daftar = function (teks, ordered) {
    const baris = String(teks || '').split(/\n+/).map(function (x) { return x.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim(); }).filter(Boolean);
    if (!baris.length) return '';
    const tag = ordered ? 'ol' : 'ul';
    return '<' + tag + ' class="list">' + baris.map(function (b) { return '<li>' + UI.esc(b) + '</li>'; }).join('') + '</' + tag + '>';
  };

  // ---------- Sanitasi HTML (isi berita dari editor admin) ----------
  const BOLEH = {
    P: [], BR: [], STRONG: [], B: [], EM: [], I: [], U: [], H2: [], H3: [], H4: [], UL: [], OL: [], LI: [],
    BLOCKQUOTE: [], A: ['href'], IMG: ['src', 'alt'], TABLE: [], THEAD: [], TBODY: [], TR: [], TH: [], TD: [],
    SPAN: [], DIV: [], HR: []
  };
  const BUANG = ['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'SVG', 'MATH', 'BASE', 'NOSCRIPT', 'TEMPLATE'];

  UI.sanitizeHtml = function (kotor) {
    const doc = new DOMParser().parseFromString('<body>' + String(kotor || '') + '</body>', 'text/html');
    (function bersih(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) return;
        if (ch.nodeType !== 1) { ch.remove(); return; }
        const tag = ch.tagName.toUpperCase();
        if (!BOLEH[tag]) {
          if (BUANG.indexOf(tag) >= 0) { ch.remove(); return; }
          bersih(ch);
          while (ch.firstChild) node.insertBefore(ch.firstChild, ch);
          ch.remove();
          return;
        }
        Array.prototype.slice.call(ch.attributes).forEach(function (a) {
          if (BOLEH[tag].indexOf(a.name.toLowerCase()) < 0) ch.removeAttribute(a.name);
        });
        if (tag === 'A') {
          const href = ch.getAttribute('href') || '';
          if (!/^(https?:|mailto:)/i.test(href)) ch.removeAttribute('href');
          ch.setAttribute('target', '_blank');
          ch.setAttribute('rel', 'noopener noreferrer');
        }
        if (tag === 'IMG') {
          if (!/^https:\/\//i.test(ch.getAttribute('src') || '')) { ch.remove(); return; }
          ch.setAttribute('loading', 'lazy');
        }
        bersih(ch);
      });
    })(doc.body);
    return doc.body.innerHTML;
  };

  // ---------- Berkas Google Drive ----------
  UI.driveId = function (url) {
    const m = String(url || '').match(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{15,})/);
    return m ? m[1] : '';
  };
  UI.unduhDrive = function (url) {
    const id = UI.driveId(url);
    return id ? 'https://drive.google.com/uc?export=download&id=' + id : url;
  };
  UI.gambarAman = function (url) { return /^https:\/\//i.test(String(url || '')) ? url : ''; };

  // ---------- Notifikasi ----------
  UI.toast = function (pesan, tipe) {
    const box = document.getElementById('toasts');
    if (!box) return;
    const t = document.createElement('div');
    t.className = 'toast toast-' + (tipe || 'ok');
    t.setAttribute('role', tipe === 'err' ? 'alert' : 'status');
    t.innerHTML = UI.icon(tipe === 'err' ? 'error' : 'check_circle') + '<span>' + UI.esc(pesan) + '</span>';
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 300); }, tipe === 'err' ? 6000 : 3500);
  };

  // ---------- Modal ----------
  UI.modal = function (opt) {
    const root = document.getElementById('modal-root');
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML =
      '<div class="modal ' + (opt.lebar ? 'modal-wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + UI.esc(opt.judul || 'Dialog') + '">' +
      '<div class="modal-head"><h2>' + UI.esc(opt.judul || '') + '</h2>' +
      '<button type="button" class="icon-btn" data-tutup aria-label="Tutup">' + UI.icon('close') + '</button></div>' +
      '<div class="modal-body">' + (opt.isi || '') + '</div>' +
      (opt.kaki ? '<div class="modal-foot">' + opt.kaki + '</div>' : '') + '</div>';
    root.appendChild(back);
    document.body.classList.add('no-scroll');
    const sebelum = document.activeElement;

    const api = {
      el: back,
      $: function (s) { return back.querySelector(s); },
      tutup: function () {
        document.removeEventListener('keydown', onKey);
        back.remove();
        if (!root.children.length) document.body.classList.remove('no-scroll');
        if (sebelum && sebelum.focus) { try { sebelum.focus(); } catch (e) { /* abaikan */ } }
        if (opt.onTutup) opt.onTutup();
      }
    };
    function onKey(e) { if (e.key === 'Escape' && root.lastElementChild === back) api.tutup(); }
    document.addEventListener('keydown', onKey);
    back.addEventListener('mousedown', function (e) { if (e.target === back && !opt.tetap) api.tutup(); });
    UI.$$('[data-tutup]', back).forEach(function (b) { b.addEventListener('click', api.tutup); });
    const fokus = back.querySelector('input:not([type=hidden]),textarea,select,button.btn-primary,button');
    if (fokus) setTimeout(function () { fokus.focus(); }, 30);
    return api;
  };

  UI.konfirmasi = function (pesan, labelOk, bahaya) {
    return new Promise(function (resolve) {
      let selesai = false;
      const m = UI.modal({
        judul: 'Konfirmasi',
        isi: '<p>' + UI.esc(pesan) + '</p>',
        kaki: '<button type="button" class="btn btn-ghost" data-batal>Batal</button>' +
              '<button type="button" class="btn ' + (bahaya ? 'btn-danger' : 'btn-primary') + '" data-ok>' + UI.esc(labelOk || 'Ya, lanjutkan') + '</button>',
        onTutup: function () { if (!selesai) { selesai = true; resolve(false); } }
      });
      m.$('[data-batal]').addEventListener('click', function () { m.tutup(); });
      m.$('[data-ok]').addEventListener('click', function () { selesai = true; m.tutup(); resolve(true); });
    });
  };

  // ---------- Status sibuk pada tombol ----------
  UI.sibuk = function (btn, aktif, teks) {
    if (!btn) return;
    if (aktif) {
      btn.dataset.asli = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spin" aria-hidden="true"></span><span>' + UI.esc(teks || 'Memproses...') + '</span>';
    } else {
      btn.disabled = false;
      if (btn.dataset.asli) btn.innerHTML = btn.dataset.asli;
    }
  };

  // ---------- Berkas ----------
  UI.bacaBerkas = function (file, opt) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('Berkas tidak dipilih.'));
      if (opt.jenis && opt.jenis.indexOf(file.type) < 0) return reject(new Error('Jenis berkas tidak didukung. Gunakan: ' + opt.label + '.'));
      if (file.size > opt.maksMB * 1024 * 1024) return reject(new Error('Ukuran berkas melebihi ' + opt.maksMB + ' MB.'));
      const fr = new FileReader();
      fr.onload = function () {
        const s = String(fr.result);
        resolve({ nama: file.name, mime: file.type, base64: s.substr(s.indexOf(',') + 1) });
      };
      fr.onerror = function () { reject(new Error('Gagal membaca berkas.')); };
      fr.readAsDataURL(file);
    });
  };

  UI.unduhBase64 = function (nama, mime, b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    const a = document.createElement('a');
    a.href = url; a.download = nama;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  };

  UI.bukaBase64 = function (mime, b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    window.open(url, '_blank', 'noopener');
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  };

  // ---------- Lain-lain ----------
  UI.salin = function (teks) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(teks).then(function () { return true; }, function () { return false; });
    }
    return new Promise(function (resolve) {
      const ta = document.createElement('textarea');
      ta.value = teks; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove(); resolve(ok);
    });
  };

  UI.debounce = function (fn, ms) {
    let t;
    return function () {
      const a = arguments, c = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(c, a); }, ms || 250);
    };
  };

  UI.badgeStatus = function (status) {
    const kelas = { Diterima: 'badge-warn', Diproses: 'badge-info', Selesai: 'badge-ok' }[status] || 'badge-muted';
    return '<span class="badge ' + kelas + '">' + UI.esc(status || '-') + '</span>';
  };

  UI.inisial = function (nama) {
    const p = String(nama || '?').replace(/[.,]/g, ' ').trim().split(/\s+/).filter(function (x) { return /^[A-Za-z]/.test(x); });
    return ((p[0] || '?').charAt(0) + (p[1] ? p[1].charAt(0) : '')).toUpperCase();
  };

  // Paginasi sederhana: kembalikan potongan data + HTML kontrol
  UI.halaman = function (data, hal, per) {
    const total = Math.max(1, Math.ceil(data.length / per));
    const h = Math.min(Math.max(1, hal || 1), total);
    return { items: data.slice((h - 1) * per, h * per), hal: h, total: total, jumlah: data.length };
  };
  UI.kontrolHalaman = function (p) {
    if (p.total <= 1) return '';
    let out = '<nav class="pager" aria-label="Navigasi halaman">';
    out += '<button type="button" class="btn btn-outline btn-sm" data-hal="' + (p.hal - 1) + '"' + (p.hal <= 1 ? ' disabled' : '') + '>' + UI.icon('chevron_left') + 'Sebelumnya</button>';
    out += '<span class="pager-info">Halaman <strong>' + p.hal + '</strong> dari ' + p.total + '</span>';
    out += '<button type="button" class="btn btn-outline btn-sm" data-hal="' + (p.hal + 1) + '"' + (p.hal >= p.total ? ' disabled' : '') + '>Berikutnya' + UI.icon('chevron_right') + '</button></nav>';
    return out;
  };

  UI.kosong = function (pesan, ikon) {
    return '<div class="empty">' + UI.icon(ikon || 'inbox') + '<p>' + UI.esc(pesan) + '</p></div>';
  };

  UI.rangka = function (n) {
    let out = '<div class="stack">';
    for (let i = 0; i < (n || 3); i++) out += '<div class="skeleton"></div>';
    return out + '</div>';
  };

  window.UI = UI;
})();
