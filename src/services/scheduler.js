const cron = require('node-cron');
const config = require('../config');
const {
  ambilTugasUntukReminder,
  tandaiStageTerkirim,
  hitungSisaHari,
} = require('./taskService');

function formatPesanReminder(tugas, sisaHari) {
  const deadlineStr = new Date(tugas.deadline).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    `⏰ *Reminder Tugas* (H-${sisaHari})\n\n` +
    `📚 Mapel: ${tugas.subject}\n` +
    `📝 Tugas: ${tugas.title}\n` +
    `📅 Deadline: ${deadlineStr}\n` +
    `⌛ Sisa waktu: ${sisaHari} hari lagi`
  );
}

/**
 * Menjalankan cron job harian yang mengecek semua tugas aktif,
 * dan mengirim reminder kalau sisa harinya pas di salah satu stage
 * (H-7 sampai H-1) dan belum pernah dikirim sebelumnya.
 *
 * @param {Object} sender - objek berisi fungsi pengirim pesan per platform
 * @param {(chatId: string, teks: string) => Promise<void>} sender.sendWhatsApp
 * @param {(chatId: string, teks: string) => Promise<void>} sender.sendTelegram
 */
function jalankanSchedulerReminder({ sendWhatsApp, sendTelegram }) {
  cron.schedule(
    config.reminderCronSchedule,
    async () => {
      try {
        const daftarTugas = await ambilTugasUntukReminder();

        for (const tugas of daftarTugas) {
          try {
            const sisaHari = hitungSisaHari(tugas.deadline);
            const stageSudahDikirim = (tugas.notifiedStages || '')
              .split(',')
              .filter(Boolean)
              .map(Number);

            const stageCocok = config.reminderStagesDays.find(
              (stage) => stage === sisaHari && !stageSudahDikirim.includes(stage)
            );

            if (!stageCocok) continue;

            const pesan = formatPesanReminder(tugas, sisaHari);

            if (tugas.platform === 'whatsapp') {
              await sendWhatsApp(tugas.chatId, pesan);
            } else if (tugas.platform === 'telegram') {
              await sendTelegram(tugas.chatId, pesan);
            }

            await tandaiStageTerkirim(tugas.id, stageCocok, tugas.notifiedStages);
          } catch (err) {
            // Gagal kirim satu tugas (misal koneksi putus/ECONNRESET) tidak boleh
            // menghentikan pengecekan tugas lain. Stage belum ditandai terkirim,
            // jadi otomatis dicoba lagi di siklus cron berikutnya.
            console.error(
              `[scheduler] Gagal kirim reminder untuk tugas #${tugas.id}:`,
              err.message || err
            );
          }
        }
      } catch (err) {
        console.error('[scheduler] Gagal menjalankan reminder:', err);
      }
    },
    { timezone: config.timezone }
  );

  console.log(
    `[scheduler] Reminder aktif, jadwal cron: "${config.reminderCronSchedule}" (${config.timezone})`
  );
}

module.exports = { jalankanSchedulerReminder, formatPesanReminder };
