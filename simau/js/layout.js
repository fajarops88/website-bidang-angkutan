/* layout.js - kerangka sidebar & topbar (dibuat dari Sidebar.html) */
window.SIMAU_SIDEBAR_HTML = `<nav class="simantas-sidebar no-print" id="simantasSidebar">
  <div class="brand">
    <img src="https://upload.wikimedia.org/wikipedia/id/thumb/f/f4/Lambang_Kota_Balikpapan.png/120px-Lambang_Kota_Balikpapan.png" alt="Logo" onerror="this.style.display='none'">
    <div style="font-weight:700; font-size:14px; line-height:1.3;">SIMAU</div>
    <small>Dishub Kota Balikpapan</small>
  </div>
  <div class="nav flex-column py-2" id="sidebarMenu">
    <a class="nav-link" href="dashboard.html" data-page="dashboard"><i class="fa-solid fa-gauge-high"></i> Dashboard</a>

    <div class="nav-section">Data Master</div>
    <a class="nav-link" href="trayek.html" data-page="trayek" data-role="ADMINISTRATOR,PETUGAS ANGKUTAN"><i class="fa-solid fa-route"></i> Master Trayek</a>
    <a class="nav-link" href="perusahaan.html" data-page="perusahaan" data-role="ADMINISTRATOR,PETUGAS ANGKUTAN"><i class="fa-solid fa-building"></i> Master Perusahaan</a>

    <div class="nav-section">Prosedur 1: Pendataan &amp; Kelengkapan Kendaraan</div>
    <a class="nav-link" href="kendaraan.html" data-page="kendaraan"><i class="fa-solid fa-bus"></i> Data Kendaraan</a>
    <a class="nav-link" href="laporan-cek.html" data-page="laporan-cek" data-role="ADMINISTRATOR,PETUGAS ANGKUTAN"><i class="fa-solid fa-file-shield"></i> Laporan Perlengkapan Angkutan</a>
    <a class="nav-link" href="laporan-harian.html" data-page="laporan-harian" data-role="ADMINISTRATOR,PETUGAS ANGKUTAN"><i class="fa-solid fa-file-lines"></i> Laporan Harian</a>
    <a class="nav-link" href="laporan-bulanan.html" data-page="laporan-bulanan" data-role="ADMINISTRATOR,PETUGAS ANGKUTAN"><i class="fa-solid fa-calendar-days"></i> Laporan Bulanan</a>

    <div class="nav-section">Pendataan Halte</div>
    <a class="nav-link" href="halte.html" data-page="halte" data-role="ADMINISTRATOR,PETUGAS ANGKUTAN"><i class="fa-solid fa-bus-simple"></i> Fasilitas Halte</a>
    <a class="nav-link" href="laporan-halte.html" data-page="laporan-halte" data-role="ADMINISTRATOR,PETUGAS ANGKUTAN"><i class="fa-solid fa-clipboard-list"></i> Laporan Fasilitas Halte</a>

    <div class="nav-section">Prosedur 2: Pengaduan &amp; Sanksi</div>
    <a class="nav-link" href="data-pengaduan.html" data-page="data-pengaduan" data-role="ADMINISTRATOR,PETUGAS ANGKUTAN"><i class="fa-solid fa-comment-dots"></i> Data Pengaduan</a>
    <a class="nav-link" href="laporan-pengaduan.html" data-page="laporan-pengaduan" data-role="ADMINISTRATOR,PETUGAS ANGKUTAN"><i class="fa-solid fa-file-lines"></i> Rekap Pengaduan</a>
    <a class="nav-link" href="sanksi.html" data-page="sanksi" data-role="ADMINISTRATOR,PETUGAS ANGKUTAN"><i class="fa-solid fa-gavel"></i> Sanksi / Penindakan</a>

    <div class="nav-section">Prosedur 3: Izin Insidentil &amp; Peremajaan</div>
    <a class="nav-link" href="insidentil.html" data-page="insidentil" data-role="ADMINISTRATOR,PETUGAS ANGKUTAN"><i class="fa-solid fa-ticket"></i> Data Izin Insidentil</a>
    <a class="nav-link" href="laporan-insidentil.html" data-page="laporan-insidentil" data-role="ADMINISTRATOR,PETUGAS ANGKUTAN"><i class="fa-solid fa-file-lines"></i> Rekap Izin Insidentil</a>
    <a class="nav-link" href="laporan-peremajaan.html" data-page="laporan-peremajaan" data-role="ADMINISTRATOR,PETUGAS ANGKUTAN"><i class="fa-solid fa-recycle"></i> Laporan Peremajaan</a>

    <div class="nav-section">Administrasi</div>
    <a class="nav-link" href="data-user.html" data-page="data-user" data-role="ADMINISTRATOR"><i class="fa-solid fa-users-gear"></i> Data User</a>

    <div class="nav-section">Website Bidang Angkutan</div>
    <a class="nav-link" href="../index.html#/admin" data-only="ADMINISTRATOR,ADMIN KONTEN"><i class="fa-solid fa-newspaper"></i> Kelola Konten Website</a>
    <a class="nav-link" href="../index.html#/"><i class="fa-solid fa-globe"></i> Lihat Situs Publik</a>

    <hr style="border-color: rgba(255,255,255,.15); margin: 8px 16px;">
    <a class="nav-link" href="#" id="btnDarkMode"><i class="fa-solid fa-moon"></i> Mode Gelap</a>
    <a class="nav-link" href="#" id="btnLogout"><i class="fa-solid fa-right-from-bracket"></i> Keluar</a>
  </div>
</nav>`;
window.SIMAU_TOPBAR_HTML = `<div class="simantas-topbar no-print">
  <div class="d-flex align-items-center gap-2">
    <button class="btn btn-outline-secondary btn-sm sidebar-toggle-btn" id="sidebarToggleBtn" type="button"><i class="fa-solid fa-bars"></i></button>
    <h6 class="mb-0 fw-semibold" id="topbarTitle"></h6>
  </div>
  <div class="text-end">
    <div class="fw-semibold" style="font-size:13.5px;" id="topbarUserName"></div>
    <small class="text-muted" id="topbarUserRole"></small>
  </div>
</div>`;
