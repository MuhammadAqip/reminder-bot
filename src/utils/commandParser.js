const { parseTanggalDeadline } = require('./dateParser');

/**
 * Format command yang didukung (dipisah titik koma ";"):
 *   /tugas <mapel>; <judul tugas>; <deadline>
 *
 * Contoh:
 *   /tugas Matematika; Kerjakan LKS halaman 20-25; 30-08-2026
 *   /tugas Fisika; Laporan praktikum; 12 september
 *
 * Command lain:
 *   /listtugas          -> daftar tugas yang masih aktif
 *   /hapustugas <id>     -> hapus/tandai selesai tugas tertentu
 *   /help atau /start    -> bantuan format
 */
function parseTugasCommand(teks) {
  const isi = teks.replace(/^\/tugas/i, '').trim();
  const bagian = isi.split(';').map((b) => b.trim()).filter(Boolean);

  if (bagian.length < 3) {
    return {
      valid: false,
      error:
        'Format kurang lengkap. Gunakan:\n' +
        '/tugas <mapel>; <judul tugas>; <deadline>\n\n' +
        'Contoh:\n/tugas Matematika; Kerjakan LKS hal 20-25; 30-08-2026',
    };
  }

  const [subject, title, deadlineText] = bagian;
  const deadline = parseTanggalDeadline(deadlineText);

  if (!deadline) {
    return {
      valid: false,
      error:
        `Format tanggal "${deadlineText}" tidak dikenali.\n` +
        'Gunakan format: dd-mm-yyyy (contoh 30-08-2026) atau "30 agustus 2026".',
    };
  }

  return { valid: true, subject, title, deadline };
}

module.exports = { parseTugasCommand };
