# Situs Bidang Angkutan + SIMAU — Dinas Perhubungan Kota Balikpapan

Satu situs di GitHub Pages dengan satu backend Google Apps Script (proyek SIMAU) dan satu Spreadsheet.

| Bagian | Lokasi | Keterangan |
|---|---|---|
| Website publik (profil, berita, pengumuman, regulasi, pengaduan, survei) | `index.html`, `css/`, `js/` | Aplikasi satu halaman (alamat berawalan `#/`) |
| Panel konten website | `index.html#/admin` | Untuk peran ADMINISTRATOR dan ADMIN KONTEN |
| SIMAU (kendaraan, trayek, halte, sanksi, laporan, dst.) | `simau/` | Halaman terpisah; petugas masuk lewat `simau/login.html` |

## Satu-satunya berkas yang diisi
`js/config.js` → `GAS_URL` = alamat `/exec` proyek Apps Script SIMAU. Halaman SIMAU otomatis memakai alamat yang sama.

## Login dan peran (tabel USER di Spreadsheet)
Satu akun berlaku di website dan SIMAU (kunci sesi `simantas_token` / `simantas_session` dipakai bersama).

| Peran | Panel website | SIMAU |
|---|---|---|
| ADMINISTRATOR | semua menu | penuh |
| ADMIN KONTEN | semua menu | tidak ada akses |
| PETUGAS ANGKUTAN | Dashboard dan Pengaduan | penuh (sesuai hak lama) |
| PEMILIK KENDARAAN | tidak ada | data kendaraan miliknya |

Hak akses yang sebenarnya dijaga di server; pengaturan menu di tampilan hanya merapikan.

## Pengaduan
Satu daftar pengaduan (sheet `PENGADUAN`). Form di website dan `simau/lapor.html` sama-sama menghasilkan Kode Tiket (`ADU-XXXXXXXX`) yang dicek di halaman Cek Status Tiket. Status: Diterima, Diproses, Selesai.

Backend (`.gs`) tidak ada di folder ini; ia ditempel ke proyek Google Apps Script. Lihat panduan penggabungan.
