// manager-bot.js - Bot Discord para gerenciar salas via PM2
const { Client, GatewayIntentBits } = require('discord.js');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIX = '!';
const MASTERS = process.env.DISCORD_MASTERS?.split(',') || [];

// Configuração das salas disponíveis
const ROOMS = {
  'sala1': { name: 'RVC Volley #1', script: 'dist/index.js', args: 'TOKEN1' },
  'sala2': { name: 'RVC Volley #2', script: 'dist/index.js', args: 'TOKEN2' },
  'sala3': { name: 'RVC Volley #3', script: 'dist/index.js', args: 'TOKEN3' }
};

function checkPermission(userId) {
  if (MASTERS.length === 0) return true;
  return MASTERS.includes(userId);
}

client.on('ready', () => {
  console.log(`[MANAGER] Bot logado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (!checkPermission(message.author.id)) {
    return message.reply('❌ Você não tem permissão para usar esses comandos.');
  }

  try {
    switch (command) {
      case 'help':
      case 'ajuda':
        return message.reply(
          '**📋 Comandos Disponíveis:**\n' +
          '`!open <sala> <token>` - Abre uma sala (sala1, sala2, sala3)\n' +
          '`!close <sala>` - Fecha uma sala\n' +
          '`!list` - Lista todas as salas e status\n' +
          '`!restart <sala>` - Reinicia uma sala\n' +
          '`!logs <sala>` - Mostra logs de uma sala\n' +
          '`!closeall` - Fecha todas as salas'
        );

      case 'open':
        if (args.length < 2) {
          return message.reply('❌ Use: `!open <sala> <token>`\nExemplo: `!open sala1 thr1.ABC123...`');
        }
        const [roomId, token] = args;
        if (!ROOMS[roomId]) {
          return message.reply(`❌ Sala inválida! Use: ${Object.keys(ROOMS).join(', ')}`);
        }

        await message.reply(`⏳ Abrindo ${ROOMS[roomId].name}...`);
        
        const { stdout: openOutput } = await execPromise(
          `pm2 start ${ROOMS[roomId].script} --name ${roomId} -- ${token}`
        );
        
        return message.reply(`✅ ${ROOMS[roomId].name} aberta com sucesso!\nToken: \`${token.substring(0, 20)}...\``);

      case 'close':
        if (args.length < 1) {
          return message.reply('❌ Use: `!close <sala>`');
        }
        const closeRoom = args[0];
        if (!ROOMS[closeRoom]) {
          return message.reply(`❌ Sala inválida! Use: ${Object.keys(ROOMS).join(', ')}`);
        }

        await execPromise(`pm2 delete ${closeRoom}`);
        return message.reply(`✅ ${ROOMS[closeRoom].name} fechada!`);

      case 'list':
      case 'status':
        const { stdout: listOutput } = await execPromise('pm2 jlist');
        const processes = JSON.parse(listOutput);
        
        let status = '**📊 Status das Salas:**\n\n';
        Object.keys(ROOMS).forEach(roomId => {
          const proc = processes.find(p => p.name === roomId);
          if (proc) {
            const uptime = Math.floor((Date.now() - proc.pm2_env.pm_uptime) / 1000);
            const memory = (proc.monit.memory / 1024 / 1024).toFixed(2);
            status += `✅ **${ROOMS[roomId].name}** (${roomId})\n`;
            status += `   └ Status: ${proc.pm2_env.status} | Uptime: ${uptime}s | RAM: ${memory} MB\n\n`;
          } else {
            status += `⭕ **${ROOMS[roomId].name}** (${roomId})\n`;
            status += `   └ Status: offline\n\n`;
          }
        });
        
        return message.reply(status);

      case 'restart':
        if (args.length < 1) {
          return message.reply('❌ Use: `!restart <sala>`');
        }
        const restartRoom = args[0];
        if (!ROOMS[restartRoom]) {
          return message.reply(`❌ Sala inválida! Use: ${Object.keys(ROOMS).join(', ')}`);
        }

        await execPromise(`pm2 restart ${restartRoom}`);
        return message.reply(`🔄 ${ROOMS[restartRoom].name} reiniciada!`);

      case 'logs':
        if (args.length < 1) {
          return message.reply('❌ Use: `!logs <sala>`');
        }
        const logsRoom = args[0];
        if (!ROOMS[logsRoom]) {
          return message.reply(`❌ Sala inválida! Use: ${Object.keys(ROOMS).join(', ')}`);
        }

        const { stdout: logsOutput } = await execPromise(`pm2 logs ${logsRoom} --lines 20 --nostream`);
        const truncated = logsOutput.substring(0, 1900);
        return message.reply(`\`\`\`\n${truncated}\n\`\`\``);

      case 'closeall':
        await execPromise('pm2 delete all');
        return message.reply('🛑 Todas as salas foram fechadas!');

      default:
        return message.reply('❌ Comando não encontrado. Use `!help` para ver os comandos.');
    }
  } catch (error) {
    console.error('[MANAGER] Erro:', error);
    return message.reply(`❌ Erro ao executar comando: ${error.message}`);
  }
});

client.login(process.env.MANAGER_DISCORD_TOKEN);
