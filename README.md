# Website Bidang Angkutan – Dinas Perhubungan Kota Balikpapan

Situs statis (HTML/CSS/JavaScript murni) yang tayang di **GitHub Pages**. Data disimpan di **Google Sheets** dan dilayani oleh **Google Apps Script** sebagai REST API.

## Struktur folder (folder ini = akar repository)

```
index.html          halaman utama (satu-satunya HTML)
css/style.css       gaya tampilan
js/config.js        PENGATURAN – isi GAS_URL di sini
js/ui.js            pembantu tampilan
js/api.js           komunikasi ke Google Apps Script
js/pages-publik.js  halaman publik
js/pages-admin.js   panel admin
js/app.js           router
```

Berkas backend `Kode.gs` **tidak** ada di folder ini; ia ditempel ke Google Apps Script.

## Langkah singkat
1. Pasang backend (lihat `PANDUAN-INSTALASI.md`, Bagian A) lalu salin URL `/exec`.
2. Buka `js/config.js`, ganti `PASTE_URL_EXEC_DI_SINI` dengan URL tersebut.
3. Jalankan `git init` **di dalam folder ini**, lalu push ke GitHub dan aktifkan Pages.
