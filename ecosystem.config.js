module.exports = {
  apps: [
    {
      name: 'bot-tugas-sekolah',
      script: 'src/index.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
