const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const config = require('../config');
const { tanganiPesan } = require('../handlers/messageHandler');

let sock; // socket aktif, dipakai juga oleh sendWhatsApp
let nomorSendiri = null; // cuma bagian nomor dari JID sendiri (tanpa ":device" & tanpa domain @s.whatsapp.net/@lid)
const idPesanTerkirimBot = new Set(); // ID pesan yang bot kirim sendiri, biar tidak dibalas ulang (cegah infinite loop)

// Ambil cuma bagian nomor dari sebuah JID, apapun domainnya (@s.whatsapp.net / @lid / @g.us dst)
// dan apapun device suffix-nya (":12"). Dipakai supaya deteksi self-chat tidak bergantung
// pada format JID spesifik, karena WhatsApp/Baileys punya beberapa variasi JID (PN vs LID).
function ambilNomorDariJid(jid) {
  return (jid || '').split('@')[0].split(':')[0];
}

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(config.waAuthFolder);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }), // biar log Baileys tidak spam terminal
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('[whatsapp] Scan QR code berikut dengan WhatsApp kamu:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const harusReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('[whatsapp] Koneksi terputus, reconnect:', harusReconnect);
      if (harusReconnect) startWhatsApp();
    } else if (connection === 'open') {
      nomorSendiri = ambilNomorDariJid(sock.user.id);
      console.log('[whatsapp] Bot WhatsApp tersambung (nomor:', nomorSendiri, ')');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message) continue;

      const chatId = msg.key.remoteJid;
      const iniGrup = chatId.endsWith('@g.us');
      const iniSelfChat = !iniGrup && ambilNomorDariJid(chatId) === nomorSendiri;

      // Bantu cari tahu JID grup: setiap pesan masuk dari grup manapun, dicetak ke log.
      // Kirim satu pesan apa saja di grup kelasmu, lalu lihat baris ini di terminal
      // buat dapetin ID yang perlu ditempel ke ALLOWED_WA_GROUP_ID di .env.
      if (iniGrup) {
        console.log(`[whatsapp] Pesan masuk dari grup: ${chatId}`);
      }

      // Kalau ALLOWED_WA_GROUP_ID di-set, bot cuma boleh beroperasi di grup itu saja.
      // Pengecualian: self-chat (nomor bot sendiri) selalu boleh, biar pemilik bot
      // tetap bisa akses command dari mana saja lewat chat pribadinya sendiri.
      if (
        config.allowedWhatsappGroupId &&
        chatId !== config.allowedWhatsappGroupId &&
        !iniSelfChat
      ) {
        continue;
      }

      if (msg.key.fromMe) {
        console.log(
          `[whatsapp] Pesan fromMe. chatId=${chatId} idSudahDibalasBot=${idPesanTerkirimBot.has(msg.key.id)}`
        );
        // Satu-satunya alasan skip: ini balasan yang bot sendiri baru saja kirim
        // (mencegah bot membalas balasannya sendiri / infinite loop).
        // Selain itu, pesan fromMe DIPROSES seperti biasa — supaya pemilik nomor bot
        // tetap bisa kirim command dari mana saja bot itu beroperasi (grup atau self-chat).
        if (idPesanTerkirimBot.has(msg.key.id)) continue;
      }

      const teks =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        '';

      if (msg.key.fromMe) {
        console.log(
          `[whatsapp] Debug ekstrak teks. tipeIsiPesan=${Object.keys(msg.message).join(',')} teksTerdeteksi="${teks}"`
        );
      }

      if (!teks) continue;

      try {
        const balasan = await tanganiPesan({
          platform: 'whatsapp',
          chatId,
          text: teks,
        });
        if (!balasan) continue; // bukan command, diamkan (tidak kirim apa-apa)
        const hasil = await sock.sendMessage(chatId, { text: balasan });
        if (hasil?.key?.id) idPesanTerkirimBot.add(hasil.key.id);
      } catch (err) {
        console.error('[whatsapp] Error menangani pesan:', err);
        const hasil = await sock.sendMessage(chatId, {
          text: '⚠️ Terjadi kesalahan, coba lagi nanti.',
        });
        if (hasil?.key?.id) idPesanTerkirimBot.add(hasil.key.id);
      }
    }
  });

  return sock;
}

async function sendWhatsApp(chatId, teks) {
  if (!sock) throw new Error('Socket WhatsApp belum siap');
  const hasil = await sock.sendMessage(chatId, { text: teks });
  if (hasil?.key?.id) idPesanTerkirimBot.add(hasil.key.id);
}

module.exports = { startWhatsApp, sendWhatsApp };
