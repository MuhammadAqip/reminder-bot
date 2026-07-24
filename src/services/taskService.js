const prisma = require('../db/client');

async function buatTugas({ subject, title, deadline, platform, chatId }) {
  return prisma.task.create({
    data: { subject, title, deadline, platform, chatId },
  });
}

async function daftarTugasAktif(chatId) {
  return prisma.task.findMany({
    where: { chatId, isDone: false },
    orderBy: { id: 'asc' },
  });
}

async function tandaiSelesai(id, chatId) {
  // chatId disertakan supaya user cuma bisa hapus tugas miliknya sendiri
  const tugas = await prisma.task.findFirst({ where: { id, chatId } });
  if (!tugas) return null;
  return prisma.task.update({ where: { id }, data: { isDone: true } });
}

async function hapusTugasPermanen(id, chatId) {
  // Beda dari tandaiSelesai: ini benar-benar menghapus baris dari database,
  // dipakai kalau tugas salah input / dibuat keliru, bukan buat tugas yang sudah dikerjakan.
  // chatId disertakan supaya user cuma bisa hapus tugas miliknya sendiri.
  const tugas = await prisma.task.findFirst({ where: { id, chatId } });
  if (!tugas) return null;
  await prisma.task.delete({ where: { id } });
  return tugas;
}

async function ambilTugasUntukReminder() {
  // Ambil semua tugas yang belum selesai dan deadline-nya belum lewat
  return prisma.task.findMany({
    where: { isDone: false, deadline: { gte: new Date() } },
  });
}

async function tandaiStageTerkirim(id, stage, notifiedStagesSaatIni) {
  const stagesBaru = notifiedStagesSaatIni
    ? `${notifiedStagesSaatIni},${stage}`
    : `${stage}`;
  return prisma.task.update({
    where: { id },
    data: { notifiedStages: stagesBaru },
  });
}

function hitungSisaHari(deadline) {
  const msPerHari = 1000 * 60 * 60 * 24;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / msPerHari);
}

module.exports = {
  buatTugas,
  daftarTugasAktif,
  tandaiSelesai,
  hapusTugasPermanen,
  ambilTugasUntukReminder,
  tandaiStageTerkirim,
  hitungSisaHari,
};
