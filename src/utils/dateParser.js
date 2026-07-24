const BULAN_ID = {
  januari: 0, jan: 0,
  februari: 1, feb: 1,
  maret: 2, mar: 2,
  april: 3, apr: 3,
  mei: 4,
  juni: 5, jun: 5,
  juli: 6, jul: 6,
  agustus: 7, agu: 7, ags: 7,
  september: 8, sep: 8, sept: 8,
  oktober: 9, okt: 9,
  november: 10, nov: 10,
  desember: 11, des: 11,
};

/**
 * Parse berbagai format tanggal jadi objek Date (jam diset 23:59 di hari itu,
 * karena deadline tugas biasanya "sampai akhir hari").
 *
 * Format yang didukung:
 *  - "30-08-2026" atau "30/08/2026" (dd-mm-yyyy)
 *  - "30-08" atau "30/08" (dd-mm, tahun otomatis: tahun ini, atau tahun depan kalau tanggalnya sudah lewat)
 *  - "30 agustus 2026" (nama bulan Indonesia, boleh disingkat)
 *  - "30 agustus" (tahun otomatis)
 *
 * Return null kalau tidak berhasil di-parse.
 */
function parseTanggalDeadline(input) {
  if (!input) return null;
  const teks = input.trim().toLowerCase();

  // Format numerik: dd-mm-yyyy / dd/mm/yyyy / dd-mm / dd/mm
  const numerikMatch = teks.match(/^(\d{1,2})[-/](\d{1,2})(?:[-/](\d{4}))?$/);
  if (numerikMatch) {
    const tanggal = parseInt(numerikMatch[1], 10);
    const bulan = parseInt(numerikMatch[2], 10) - 1;
    let tahun = numerikMatch[3] ? parseInt(numerikMatch[3], 10) : new Date().getFullYear();
    return buatTanggalDenganAutoTahun(tanggal, bulan, tahun, !numerikMatch[3]);
  }

  // Format nama bulan: "30 agustus 2026" atau "30 agustus"
  const namaBulanMatch = teks.match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/);
  if (namaBulanMatch) {
    const tanggal = parseInt(namaBulanMatch[1], 10);
    const namaBulan = namaBulanMatch[2];
    const bulan = BULAN_ID[namaBulan];
    if (bulan === undefined) return null;
    let tahun = namaBulanMatch[3] ? parseInt(namaBulanMatch[3], 10) : new Date().getFullYear();
    return buatTanggalDenganAutoTahun(tanggal, bulan, tahun, !namaBulanMatch[3]);
  }

  return null;
}

function buatTanggalDenganAutoTahun(tanggal, bulan, tahun, autoTahun) {
  let hasil = new Date(tahun, bulan, tanggal, 23, 59, 0, 0);
  if (isNaN(hasil.getTime())) return null;

  // Kalau tahun tidak disebutkan dan tanggalnya udah lewat hari ini, majukan ke tahun depan
  if (autoTahun && hasil.getTime() < Date.now()) {
    hasil = new Date(tahun + 1, bulan, tanggal, 23, 59, 0, 0);
  }
  return hasil;
}

module.exports = { parseTanggalDeadline };
