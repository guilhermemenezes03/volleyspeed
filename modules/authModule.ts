import { Colors, CustomEvent, Event, Module, Player, Room } from "haxball-extended-room";
import { Database } from "../database/database";
import { getRoleByName, Roles } from "./roles";
import { DiscordConnector } from "../discord/connector";
import { User } from "@prisma/client";
import { DiscordUtil } from "../discord/utils";
import Settings from "../settings.json";
import { prisma } from "../database/prisma";
import { EmbedBuilder } from "discord.js";
import { MessageFormatter } from "./messageFormatter";

@Module
export class AuthModule {
  private discord: DiscordConnector;

  constructor(private $: Room, private settings: ModuleSettings) {
    this.discord = this.settings.discord as DiscordConnector;
    this.customListener();
  }

  private customListener() {
    this.discord.client.on("customOnAuthUpdate", (user: User) => {
      const players = this.$.players.getAll(p => p.auth === user.auth);
      for (const p of players) {
        clearTimeout(p.settings.deadInterval);
        p.settings.playable = true;
        this.$.customEvents.emit("onPlayerAuth", p, user);
      }
    });
    this.discord.client.on("onPlayerBan", (auth: string, ip: string) => {
      const players = this.$.players.getAll(p => p.auth === auth || p.ip == ip);
      for (const p of players) {
        p.ban();
      }
    });
    this.discord.client.on("customOnAccountCreated", (nickname: string) => {
      const players = this.$.players.getAll(p => p.name === nickname);
      for (const p of players) {
        this.checkPlayerAuthentication(p);
      }
    });
    this.discord.client.on("requestRoomInfo", async (channelId: string, authorId: string) => {
      const players = this.$.players.values();
      const embed = new EmbedBuilder({
        color: Colors.LightGoldenRodYellow,
        fields: [
          { name: "🔴 Time vermelho", value: players.filter(p => p.team == 1).map(p => p.name).join("\n") || "Nenhum jogador", inline: true },
          { name: "⚪ Espectadores", value: players.filter(p => p.team == 0).map(p => p.name).join("\n") || "Nenhum jogador", inline: true },
          { name: "🔵 Time azul", value: players.filter(p => p.team == 2).map(p => p.name).join("\n") || "Nenhum jogador", inline: true }
        ]
      });
      await DiscordUtil.sendEmbedInChannel(channelId, embed, `Requisitado por <@${authorId}>`);
    });
  }

  async checkPlayerAuthentication(player: Player) {
    const registredPlayer = await Database.findUserByNickname(player.name);
    if (!registredPlayer) {
      player.settings.playable = true;
      await this.assignRoles(player, null);
      this.$.customEvents.emit("onPlayerAuth", player, null);
    } else if (player.auth != registredPlayer.auth) {
      player.settings.deadInterval = setTimeout(() => {
        player.kick("Conta não confirmada.");
      }, 30000);
      this.sendAuthVerification(player, registredPlayer);
    } else {
      player.settings.playable = true;
      await this.assignRoles(player, registredPlayer);
      this.$.customEvents.emit("onPlayerAuth", player, registredPlayer);
    }
  }

  private async assignRoles(player: Player, account: User | null) {
    player.settings.account = account;
    player.settings.playable = true;
    if (!account) return;
    const isInServer = await DiscordUtil.isUserInServer(account.discordId);
    if (!isInServer) {
      player.kick("Entre no Discord da HR: " + Settings.discordLink);
      return;
    }
    player.addRole(Roles.RegistredRole);
    const integratedRoles = Settings.discordIntegrationRoles;
    for (const r of Object.keys(integratedRoles)) {
      const role = integratedRoles[r as keyof typeof integratedRoles];
      const hasRole = await DiscordUtil.hasRole(account.discordId, role);
      if (hasRole) {
        const roleObject = getRoleByName(r);
        if (roleObject !== null) player.addRole(roleObject);
        if (roleObject?.admin) player.admin = true;
      }
    }
    console.log(`[AuthModule] Papéis de ${player.name}: ${JSON.stringify(player.roles)}`);
  }

  censorIP(ip: string) {
    const parts = ip.split(".");
    return parts
      .map((part: string, index: number) => 
        (index === 0 || index === parts.length - 1 ? part : part.replace(/\d/g, "\\*")))
      .join(".");
  }

  private async sendAuthVerification(player: Player, register: User) {
    const dm = await DiscordUtil.sendDMTo(register.discordId, {
      embeds: [DiscordUtil.embeds.Confirmation(register.nickname, player.auth || "null", this.censorIP(player.ip))],
      components: [DiscordUtil.components.ConfirmationButton(player.auth || "null", player.conn)]
    });
    if (dm) {
      player.reply(MessageFormatter.success("Verificação enviada!", "Confirme por DM no Discord"));
    } else {
      player.reply(MessageFormatter.error("Erro ao enviar DM!", "Habilite mensagens privadas do servidor"));
    }
  }

  @CustomEvent
  async onPlayerAuth(player: Player, account: User | null) {
    if (account) {
      player.reply(MessageFormatter.success(`Bem-vindo de volta, ${player.name}!`, ""));
    } else {
      player.reply(MessageFormatter.info(`Bem-vindo, ${player.name}!`, `Discord: ${Settings.discordLink}`));
      player.reply(MessageFormatter.info(`💡 Dica`, "Digite !ajuda para tutorial ou !discord para se registrar"));
    }
  }

  @Event
  onPlayerTeamChange(changedPlayer: Player, byPlayer: Player | null) {
    if (!changedPlayer.settings.playable && byPlayer) {
      changedPlayer.team = 0;
      this.$.send({ message: `[❌] ${changedPlayer.name} não pode jogar no momento.`, color: Colors.LightGoldenRodYellow });
    }
  }

  async checkForBan(player: Player) {
    const isBan = await prisma.ban.findFirst({
      where: {
        OR: [
          { ip: player.ip },
          { auth: player.auth || "" }
        ]
      }
    });
    if (isBan) player.ban();
  }

  @Event
  onPlayerJoin(player: Player) {
    this.checkForBan(player);
    player.settings.playable = false;
    const equalAuth = this.$.players.getAll(p => p.auth == player.auth && p.id != player.id);
    if (equalAuth.size > 0 && !this.$.state.devMode) {
      equalAuth.kick("Você reentrou na sala.");
    } else {
      const equalName = this.$.players.getAll(p => p.name == player.name && p.id != player.id);
      if (equalName.size > 0) return player.kick("Nome já está sendo utilizado.");
    }
    this.checkPlayerAuthentication(player);
  }
}