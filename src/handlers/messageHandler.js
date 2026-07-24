const { parseTugasCommand } = require('../utils/commandParser');
const {
  buatTugas,
  daftarTugasAktif,
  tandaiSelesai,
  hapusTugasPermanen,
  hitungSisaHari,
} = require('../services/taskService');

const PESAN_HELP =
  '📚 *Bot Tugas Sekolah*\n\n' +
  'Perintah yang tersedia:\n\n' +
  '➕ Tambah tugas:\n' +
  '/tugas <mapel>; <judul tugas>; <deadline>\n' +
  'Contoh: /tugas Matematika; Kerjakan LKS hal 20-25; 30-08-2026\n\n' +
  '📋 Lihat semua tugas aktif:\n/listtugas\n\n' +
  '✅ Tandai tugas selesai (tugas tetap tersimpan, cuma tidak muncul lagi di /listtugas):\n/hapustugas <id>\n\n' +
  '🗑️ Hapus tugas permanen dari database (misal salah input):\n/hapus <id>\n\n' +
  'Format deadline yang didukung: dd-mm-yyyy, dd-mm, atau "30 agustus 2026"';

/**
 * Menangani satu pesan masuk dari WhatsApp atau Telegram, dan mengembalikan
 * teks balasan yang harus dikirim. Platform-agnostic — tidak tahu-menahu
 * soal Baileys atau Telegraf.
 *
 * @param {Object} params
 * @param {'whatsapp'|'telegram'} params.platform
 * @param {string} params.chatId
 * @param {string} params.text
 * @returns {Promise<string>} teks balasan
 */
async function tanganiPesan({ platform, chatId, text }) {
  const teks = (text || '').trim();

  // Diamkan pesan yang bukan command (tidak diawali "/") — biar bot tidak
  // ikut nyaut obrolan biasa di grup. Return null = tidak kirim balasan sama sekali.
  if (!teks.startsWith('/')) return null;

  if (/^\/(help|start)/i.test(teks)) {
    return PESAN_HELP;
  }

  if (/^\/tugas/i.test(teks)) {
    const hasil = parseTugasCommand(teks);
    if (!hasil.valid) return `⚠️ ${hasil.error}`;

    const tugas = await buatTugas({
      subject: hasil.subject,
      title: hasil.title,
      deadline: hasil.deadline,
      platform,
      chatId,
    });

    const deadlineStr = tugas.deadline.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return (
      `✅ Tugas berhasil disimpan (ID: ${tugas.id})\n\n` +
      `📚 Mapel: ${tugas.subject}\n` +
      `📝 Tugas: ${tugas.title}\n` +
      `📅 Deadline: ${deadlineStr}\n\n` +
      `Kamu akan diingatkan tiap hari mulai H-7 sebelum deadline.`
    );
  }

  if (/^\/listtugas/i.test(teks)) {
    const daftar = await daftarTugasAktif(chatId);
    if (daftar.length === 0) return '📭 Belum ada tugas aktif.';

    const baris = daftar.map((t) => {
      const sisaHari = hitungSisaHari(t.deadline);
      const deadlineStr = new Date(t.deadline).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return (
        `#${t.id} • ${t.subject}\n` +
        `${t.title}\n` +
        `Deadline: ${deadlineStr} (${sisaHari} hari lagi)`
      );
    });

    return `📋 *Daftar Tugas Aktif*\n\n${baris.join('\n\n')}`;
  }

  if (/^\/hapustugas/i.test(teks)) {
    const id = parseInt(teks.replace(/^\/hapustugas/i, '').trim(), 10);
    if (isNaN(id)) return '⚠️ Format: /hapustugas <id>';

    const hasil = await tandaiSelesai(id, chatId);
    if (!hasil) return `⚠️ Tugas dengan ID ${id} tidak ditemukan.`;
    return `✅ Tugas #${id} ditandai selesai.`;
  }

  // \b (word boundary) penting di sini supaya tidak ikut cocok dengan "/hapustugas"
  if (/^\/hapus\b/i.test(teks)) {
    const id = parseInt(teks.replace(/^\/hapus/i, '').trim(), 10);
    if (isNaN(id)) return '⚠️ Format: /hapus <id>';

    const hasil = await hapusTugasPermanen(id, chatId);
    if (!hasil) return `⚠️ Tugas dengan ID ${id} tidak ditemukan.`;
    return (
      `🗑️ Tugas #${id} (${hasil.subject} - ${hasil.title}) sudah dihapus permanen.`
    );
  }

  return (
    'Perintah tidak dikenali. Ketik /help untuk melihat daftar perintah.'
  );
}

module.exports = { tanganiPesan };
