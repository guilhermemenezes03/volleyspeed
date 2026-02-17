// src/modules/furaModule.ts
import { Colors, CommandExecInfo, Module, ModuleCommand, Room } from "haxball-extended-room";
import { RoomState } from "../roomState";
import { Roles } from "./roles";
import { prisma } from "../database/prisma";
import { MessageFormatter } from "./messageFormatter";

type TCache = {
  [key: string]: {
    lastUse: Date;
    usedToday: number;
    day: string;
  };
}

const MS_IN_MINUTE = 1000 * 60;
const COOLDOWN_MINUTES = 90; // 1 hora e meia
const DAILY_LIMIT_VIP = 3;

@Module
export class FuraModule {
  private cache: TCache = {};

  constructor(private $: Room<RoomState>) {}

  /**
   * Verifica se o jogador tem furafila comprado na loja (usa consumível)
   */
  private async hasPurchasedFurafila(discordId: string): Promise<boolean> {
    const purchase = await prisma.purchase.findFirst({
      where: {
        economy: { discordId },
        item: { category: "fila" },
        isActive: true,
        usesLeft: { gt: 0 },
      },
    });
    return !!purchase;
  }

  /**
   * Consome um uso do furafila comprado
   */
  private async consumeFurafila(discordId: string): Promise<boolean> {
    const purchase = await prisma.purchase.findFirst({
      where: {
        economy: { discordId },
        item: { category: "fila" },
        isActive: true,
        usesLeft: { gt: 0 },
      },
      orderBy: { createdAt: "asc" },
    });
    if (!purchase) return false;

    const newUsesLeft = purchase.usesLeft - 1;
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        usesLeft: newUsesLeft,
        isActive: newUsesLeft > 0,
      },
    });
    return true;
  }

  @ModuleCommand({
    aliases: ["furarfila"],
  })
  async furaFila(command: CommandExecInfo) {
    const player = command.player;

    // Verificar se o jogador está nos spectators
    if (player.team !== 0) {
      command.player.reply(MessageFormatter.error("Você deve estar nos spectators!"));
      return;
    }

    const isVip = player.hasRole("vip");
    const discordId = player.settings.account?.discordId;
    const hasPurchased = discordId ? await this.hasPurchasedFurafila(discordId) : false;

    // Precisa ser VIP ou ter comprado na loja
    if (!isVip && !hasPurchased) {
      command.player.reply(MessageFormatter.error("Sem acesso!", "Seja VIP ou compre na !loja"));
      return;
    }

    // Inicializar o cache
    const now = new Date();
    const today = now.toDateString();
    if (!this.cache[player.name]) {
      this.cache[player.name] = { lastUse: new Date(0), usedToday: 0, day: today };
    }

    // Resetar o contador se o dia mudou
    if (this.cache[player.name].day !== today) {
      this.cache[player.name] = { lastUse: new Date(0), usedToday: 0, day: today };
    }

    // VIP: limite diário de 3 usos grátis
    if (isVip) {
      if (this.cache[player.name].usedToday >= DAILY_LIMIT_VIP) {
        command.player.reply(MessageFormatter.error(`Limite atingido!`, `${DAILY_LIMIT_VIP} usos/dia`));
        return;
      }
    }

    // Verificar cooldown
    const lastUse = this.cache[player.name].lastUse;
    const diffInMinutes = (now.getTime() - lastUse.getTime()) / MS_IN_MINUTE;
    if (diffInMinutes < COOLDOWN_MINUTES) {
      const remainingMinutes = Math.ceil(COOLDOWN_MINUTES - diffInMinutes);
      command.player.reply(MessageFormatter.warning(`Aguarde ${remainingMinutes} min`));
      return;
    }

    // Se não é VIP, consumir o uso da compra (sem limite diário — usa os usos comprados)
    if (!isVip && hasPurchased && discordId) {
      const consumed = await this.consumeFurafila(discordId);
      if (!consumed) {
        command.player.reply(MessageFormatter.error("Furafila esgotado!", "Compre mais na !loja"));
        return;
      }
    }

    // Executar o furarfila
    this.cache[player.name].lastUse = now;
    if (isVip) {
      this.cache[player.name].usedToday++;
    }
    this.cache[player.name].day = today;

    this.$.reorderPlayers([player.id], true);

    // Mensagem de sucesso
    if (isVip) {
      const remaining = DAILY_LIMIT_VIP - this.cache[player.name].usedToday;
      command.player.reply(MessageFormatter.success(`Fila furada!`, `${remaining} usos restantes hoje`));
    } else {
      const purchase = await prisma.purchase.findFirst({
        where: { economy: { discordId }, item: { category: "fila" }, isActive: true, usesLeft: { gt: 0 } },
      });
      const usesLeft = purchase?.usesLeft || 0;
      command.player.reply(MessageFormatter.success(`Fila furada!`, `${usesLeft} usos restantes`));
    }
    this.$.send({
      message: `[⭐] ${player.name} furou a fila!`,
      color: Colors.GreenYellow,
      style: "bold"
    });
  }
}