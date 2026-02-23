// ecosystem.config.js - Configuração PM2 para múltiplas salas
module.exports = {
  apps: [
    {
      name: 'manager-bot',
      script: 'manager-bot.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        MANAGER_DISCORD_TOKEN: process.env.MANAGER_DISCORD_TOKEN,
        DISCORD_MASTERS: process.env.DISCORD_MASTERS
      }
    }
    // As salas serão iniciadas individualmente via Discord commands
    // Elas não precisam estar no ecosystem.config.js
  ]
};
