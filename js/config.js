/* ============================================================
 * KONFIGURASI — satu-satunya berkas yang perlu Anda edit
 * ============================================================ */
window.APP_CONFIG = {
  // WAJIB: tempel URL aplikasi web Google Apps Script (berakhiran /exec) di antara tanda kutip.
  // Cukup diisi di SINI: halaman SIMAU (folder simau/) otomatis memakai alamat yang sama.
  // Gunakan URL /exec milik proyek SIMAU yang sudah digabung (URL yang sama dengan yang dulu dipakai SIMAU).
  GAS_URL: 'https://script.google.com/macros/s/AKfycbzD802sxbEdUu8kbovmsUGzfc5gCshaKvT4g0TXKJ1wKCJX4oORHTx23a6wHoVKwA7T5w/exec',

  // E-Tilang Dishub (aplikasi terpisah). Selama dua baris ini ada, tab "Surat Tilang" dan tautan
  // "Login Petugas E-Tilang" tampil di website. Hapus kedua baris untuk menyembunyikannya lagi.
  ETL_URL: 'https://script.google.com/macros/s/AKfycbwsyWXdzudchrpmsNv-LyKRY3xP_hdEkWk0-RLLKIN6L5mc2RaiEUm9kid3RVxj1IEI7A/exec',
  ETL_WEB: 'https://etle-dishub.vercel.app',

  // Identitas yang tampil di header dan footer
  NAMA_INSTANSI: 'Dinas Perhubungan Kota Balikpapan',
  NAMA_BIDANG: 'Bidang Angkutan',

  // Opsional: alamat gambar logo (harus https://). Kosongkan jika belum ada.
  LOGO_URL: '',

  // Batas ukuran unggahan di sisi tampilan (harus sama atau lebih kecil dari batas server: 5 MB)
  MAKS_UKURAN_MB: 5
};