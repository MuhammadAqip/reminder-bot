require('dotenv').config();

// Helper: baca env boolean, default true kalau tidak diset sama sekali
function bacaBoolean(nilaiEnv, defaultValue = true) {
  if (nilaiEnv === undefined || nilaiEnv === '') return defaultValue;
  return nilaiEnv.toLowerCase() === 'true';
}

module.exports = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  reminderCronSchedule: process.env.REMINDER_CRON_SCHEDULE || '0 7 * * *',
  timezone: process.env.TZ || 'Asia/Jakarta',

  // Nyala/matikan platform secara independen lewat .env
  enableWhatsApp: bacaBoolean(process.env.ENABLE_WHATSAPP, true),
  enableTelegram: bacaBoolean(process.env.ENABLE_TELEGRAM, true),

  // Stage reminder dalam "jumlah hari sebelum deadline"
  // Kirim reminder tiap hari mulai H-7 sampai H-1
  reminderStagesDays: [7, 6, 5, 4, 3, 2, 1],

  waAuthFolder: './wa-auth', // tempat menyimpan session login WhatsApp (Baileys)

  // Kalau diisi, bot WhatsApp CUMA merespons pesan dari grup ini (JID diakhiri @g.us).
  // Kosongkan untuk merespons semua chat (perilaku lama).
  allowedWhatsappGroupId: process.env.ALLOWED_WA_GROUP_ID || null,
};
