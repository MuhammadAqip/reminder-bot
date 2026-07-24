const { Telegraf } = require('telegraf');
const config = require('../config');
const { tanganiPesan } = require('../handlers/messageHandler');

const bot = new Telegraf(config.telegramBotToken);

bot.on('text', async (ctx) => {
  try {
    const balasan = await tanganiPesan({
      platform: 'telegram',
      chatId: String(ctx.chat.id),
      text: ctx.message.text,
    });
    if (!balasan) return; // bukan command, diamkan (tidak kirim apa-apa)
    await ctx.reply(balasan, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[telegram] Error menangani pesan:', err);
    await ctx.reply('⚠️ Terjadi kesalahan, coba lagi nanti.');
  }
});

async function sendTelegram(chatId, teks) {
  await bot.telegram.sendMessage(chatId, teks, { parse_mode: 'Markdown' });
}

function startTelegram() {
  bot.launch();
  console.log('[telegram] Bot Telegram berjalan');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = { startTelegram, sendTelegram };
