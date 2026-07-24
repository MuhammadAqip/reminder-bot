# Bot Tugas Sekolah (WhatsApp + Telegram)

Bot untuk mencatat tugas sekolah lewat WhatsApp atau Telegram, dengan reminder
otomatis tiap hari mulai H-7 sampai H-1 sebelum deadline.

## Fitur saat ini

- Input tugas via WhatsApp maupun Telegram, tersimpan di database yang sama
- Reminder otomatis tiap hari, mulai H-7 sampai H-1 sebelum deadline
- Lihat daftar tugas aktif & tandai tugas selesai
- Siap dijalankan 24/7 di VPS pakai PM2

> Fitur translate "kode guru" untuk jadwal harian akan menyusul di iterasi berikutnya.

## Persiapan

### 1. Install dependency

```bash
npm install
```

### 2. Siapkan PostgreSQL

Kalau belum ada PostgreSQL di VPS:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo -u postgres createuser --interactive   # buat user, misal "tugasbot"
sudo -u postgres createdb tugas_bot -O tugasbot
sudo -u postgres psql -c "ALTER USER tugasbot WITH PASSWORD 'password_kamu';"
```

### 3. Konfigurasi environment

```bash
cp .env.example .env
```

Lalu edit `.env`:
- `DATABASE_URL` — sesuaikan user/password/nama database PostgreSQL
- `TELEGRAM_BOT_TOKEN` — dapatkan dari chat dengan [@BotFather](https://t.me/BotFather) di Telegram (`/newbot`)
- `ENABLE_WHATSAPP` / `ENABLE_TELEGRAM` — set `"true"`/`"false"` untuk nyalakan atau matikan tiap platform secara independen. Minimal salah satu harus `"true"`. Berguna kalau HP belum ada dan mau jalan Telegram-only dulu (atau sebaliknya).

### 4. Setup database (Prisma)

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Jalankan bot (mode development)

```bash
npm run dev
```

Saat pertama kali jalan, akan muncul **QR code di terminal** — scan pakai
WhatsApp di HP kamu (Menu → Perangkat Tertaut → Tautkan Perangkat). Setelah
discan, sesi tersimpan di folder `wa-auth/` jadi tidak perlu scan ulang tiap
restart (selama folder itu tidak dihapus).

### 6. Jalankan permanen di VPS pakai PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # ikuti instruksi yang muncul, biar auto-start saat VPS reboot
```

Cek log:
```bash
pm2 logs bot-tugas-sekolah
```

## Cara pakai (perintah bot)

Kirim pesan ini ke bot lewat WhatsApp maupun Telegram:

```
/help
```
Menampilkan semua perintah.

```
/tugas Matematika; Kerjakan LKS hal 20-25; 30-08-2026
```
Menambah tugas baru. Format: `/tugas <mapel>; <judul>; <deadline>`

Format deadline yang didukung:
- `30-08-2026` atau `30/08/2026`
- `30-08` (tahun otomatis dipilih tahun ini/tahun depan)
- `30 agustus 2026` atau `30 agustus`

```
/listtugas
```
Menampilkan semua tugas yang masih aktif beserta sisa harinya.

```
/hapustugas 3
```
Menandai tugas dengan ID 3 sebagai selesai (tugas tetap ada di database, cuma tidak muncul lagi di `/listtugas` dan tidak dapat reminder lagi).

```
/hapus 3
```
Menghapus tugas dengan ID 3 **secara permanen** dari database (misal karena salah input). Beda dari `/hapustugas` — ini tidak bisa dibatalkan.

## Struktur proyek

```
src/
  config.js              -> konfigurasi dari .env
  index.js               -> entry point, menyalakan semua service
  db/client.js            -> koneksi Prisma
  handlers/messageHandler.js -> logic command, dipakai bareng WA & Telegram
  services/taskService.js     -> CRUD tugas ke database
  services/scheduler.js       -> cron job pengecekan & pengiriman reminder
  utils/dateParser.js         -> parsing berbagai format tanggal
  utils/commandParser.js      -> parsing command /tugas
  whatsapp/bot.js             -> koneksi & handler pesan WhatsApp (Baileys)
  telegram/bot.js             -> koneksi & handler pesan Telegram (Telegraf)
prisma/schema.prisma           -> skema database
ecosystem.config.js            -> konfigurasi PM2
```

## Langkah selanjutnya

Iterasi berikutnya: fitur translate "kode guru" — upload file Excel tabel
kode guru + jadwal, lalu bot bisa menerjemahkan jadwal harian otomatis
(termasuk menangani kelas yang di-"moving"/dipecah beberapa sub-kelompok).
