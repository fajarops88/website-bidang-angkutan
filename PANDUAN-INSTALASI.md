# Panduan Instalasi – Website Bidang Angkutan

Ada dua bagian: **A. Backend** (Google Apps Script + Google Sheets) dan **B. Frontend** (GitHub Pages). Kerjakan A dulu.

## Isi paket
| Berkas | Fungsi |
|---|---|
| `Kode.gs` (diserahkan terpisah) | Backend. Ditempel di Google Apps Script. |
| `bidang-angkutan.zip` | Frontend. Hasil ekstrak = isi folder yang akan di-`git init`. |
| `PANDUAN-INSTALASI.md` | Panduan ini. |

---
## A. Pasang backend

1. Buka https://script.google.com → **Proyek baru**. Beri nama `Bidang Angkutan API`.
2. Hapus isi `Code.gs`, tempel seluruh isi `Kode.gs`, tekan **Simpan**.
3. Di menu pilih fungsi (atas), pilih **`setupAppEnvironment`** → **Jalankan**. Setujui izin Google (Lanjutan → Buka proyek → Izinkan). Fungsi ini membuat folder Drive, Spreadsheet (10 sheet), dan akun admin.
4. Buka **Eksekusi / Execution log**. Catat **Username** dan **Password** admin yang tampil. Password hanya tampil sekali.
5. **Terapkan → Deployment baru → jenis: Aplikasi web.**
   - Jalankan sebagai: **Saya**
   - Yang memiliki akses: **Siapa saja**
   Klik **Terapkan**, lalu salin **URL aplikasi web** (berakhiran `/exec`).
6. Uji: tempel `URL/exec?action=ping` di browser. Harus muncul `{"success":true,...}`.

Catatan:
- Setiap kali `Kode.gs` diubah, buat **Deployment baru / Kelola deployment → Versi baru**. URL `/exec` tetap sama bila memakai "Kelola deployment".
- Lupa password admin: jalankan `resetPasswordAdmin()` dari editor, lihat password baru di Execution log.
- Akun Google Workspace dapat melarang berbagi tautan Drive. Bila unggah foto/PDF gagal dengan pesan berbagi, minta admin Workspace mengizinkan.

## B. Pasang frontend (GitHub Pages)

1. Buat folder kosong bernama **`bidang-angkutan`**, lalu ekstrak ZIP ke dalamnya (klik kanan → Extract All, pilih folder itu). Isinya langsung `index.html`, `css/`, `js/`.
2. Buka `bidang-angkutan/js/config.js`, ganti `PASTE_URL_EXEC_DI_SINI` dengan URL `/exec` dari langkah A.5. Simpan.
3. **Folder yang di-`git init` adalah `bidang-angkutan`** (folder yang langsung berisi `index.html`), bukan folder di atasnya.
4. Ikuti panduan GitHub langkah demi langkah (dipandu di chat): install Git, buat repository, `git init`, `git add .`, `git commit`, `git push`, lalu Settings → Pages → Branch `main` / folder `/ (root)`.
5. Alamat situs: `https://NAMA-AKUN.github.io/NAMA-REPO/`.
6. Update berikutnya: ubah berkas → `git add .` → `git commit -m "pesan"` → `git push`.

## C. Pemakaian pertama oleh admin
1. Buka situs → footer/menu **Login Admin** (atau `#/login`).
2. Masuk dengan username/password dari Execution log. **Segera ganti password** di menu Akun.
3. Isi **Profil dan Kontak** (sejarah, visi-misi, tugas-fungsi, kontak resmi). Situs tidak berisi data pribadi bawaan.
4. Isi **Pejabat dan Pegawai**, lalu tambah Berita/Pengumuman/Regulasi (status *Terbit* agar tampil publik). Satu berita contoh berstatus *Draft* sudah ada; hapus bila tidak perlu.
5. Pengaduan masuk dikelola di menu **Pengaduan** (ubah status Diterima/Diproses/Selesai, tanggapan, rekap PDF).

## C2. Bagan Struktur Organisasi otomatis
Halaman *Profil Bidang → Struktur Organisasi* menyusun bagan dari menu **Pejabat dan Pegawai**. Di tiap data ada kolom **Atasan langsung**: kosongkan untuk pimpinan tertinggi (Kepala Bidang), pilih Kepala Bidang untuk Kepala Seksi, pilih Kepala Seksi untuk stafnya. Tanpa pengisian atasan, orang dengan Urutan terkecil menjadi pimpinan dan lainnya di bawahnya.

Bila Spreadsheet sudah terlanjur dibuat sebelum pembaruan ini, ketik `Atasan_ID` di sel **I1** sheet `Pejabat_Pegawai` (hanya label; kode membaca kolom menurut posisi). Setelah itu terapkan **Versi baru** pada Deployment Apps Script.

## D. Hal yang perlu diketahui
- **Kecepatan:** Google Apps Script kadang lambat 2–5 detik pada akses pertama ("cold start"). Data publik di-cache 5 menit.
- **Kuota:** akun Gmail gratis dibatasi (± 20.000 pemanggilan URL/hari). Cukup untuk target kunjungan yang direncanakan.
- **Cek Status Tiket:** keamanannya bertumpu pada kerahasiaan kode tiket 8 karakter acak. Halaman ini hanya menampilkan kode, kategori, tanggal, status, dan tanggapan yang admin tandai publik.
- **Foto & PDF** di Drive dibuat "siapa pun dengan tautan dapat melihat" agar tampil di situs. Jangan unggah dokumen rahasia.
- **Lampiran pengaduan** tidak publik; hanya admin yang dapat membukanya lewat panel.
- **Tidak ada** notifikasi email/WhatsApp otomatis (sesuai PRD). Pelapor wajib menyimpan kode tiket.
- Satu admin saja. Pemulihan akun lewat editor Apps Script (`resetPasswordAdmin`).
