/*************************************************************
 * config.js (SIMAU) - TIDAK PERLU DIEDIT.
 * Alamat server (GAS_URL) diambil dari ../js/config.js milik situs induk,
 * supaya cukup diisi SATU kali untuk seluruh situs (website + SIMAU).
 *************************************************************/
(function () {
  var induk = window.APP_CONFIG || {};
  var u = String(induk.GAS_URL || '');
  window.SIMAU_CONFIG = {
    API_URL: (!u || /PASTE|XXXX|GANTI/i.test(u)) ? 'GANTI_DENGAN_URL_EXEC_APPS_SCRIPT' : u
  };
})();
