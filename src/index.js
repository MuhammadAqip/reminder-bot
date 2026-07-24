const config = require('./config');
const { startWhatsApp, sendWhatsApp } = require('./whatsapp/bot');
const { startTelegram, sendTelegram } = require('./telegram/bot');
const { jalankanSchedulerReminder } = require('./services/scheduler');

// Kalau platform dimatikan tapi ternyata ada tugas lama yang platform-nya itu,
// jangan sampai error — cukup kasih peringatan di log dan lewati pengiriman.
function buatSenderNonaktif(namaPlatform) {
  return async (chatId) => {
    console.warn(
      `[${namaPlatform}] Dilewati: platform nonaktif (ENABLE_${namaPlatform.toUpperCase()}=false), ` +
        `tapi ada tugas dengan chatId ${chatId} yang perlu reminder.`
    );
  };
}

async function main() {
  console.log('🚀 Menyalakan Bot Tugas Sekolah...\n');

  if (!config.enableWhatsApp && !config.enableTelegram) {
    throw new Error(
      'ENABLE_WHATSAPP dan ENABLE_TELEGRAM dua-duanya "false". Nyalakan minimal salah satu di .env.'
    );
  }

  let kirimWhatsApp = buatSenderNonaktif('whatsapp');
  let kirimTelegram = buatSenderNonaktif('telegram');

  if (config.enableWhatsApp) {
    await startWhatsApp();
    kirimWhatsApp = sendWhatsApp;
  } else {
    console.log('[whatsapp] Dilewati (ENABLE_WHATSAPP=false di .env)');
  }

  if (config.enableTelegram) {
    startTelegram();
    kirimTelegram = sendTelegram;
  } else {
    console.log('[telegram] Dilewati (ENABLE_TELEGRAM=false di .env)');
  }

  jalankanSchedulerReminder({ sendWhatsApp: kirimWhatsApp, sendTelegram: kirimTelegram });

  console.log('\n✅ Semua service berjalan. Bot siap menerima pesan.');
}

main().catch((err) => {
  console.error('Gagal menyalakan bot:', err);
  process.exit(1);
});
