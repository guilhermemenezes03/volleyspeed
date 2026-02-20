import { Colors, CommandExecInfo, CustomEvent, Event, Module, ModuleCommand, Player, Room } from "haxball-extended-room";
import { prisma } from "../database/prisma";
import { Roles } from "./roles";
import { MessageFormatter } from "./messageFormatter";
import Settings from "../settings.json";

// ========================
//  CONFIGURAÇÃO
// ========================
const ECONOMY_CONFIG = {
  earnings: {
    win: 150,
    lose: 30,
    corte: 20,
    levant: 15,
    block: 25,
    mvp: 100,
    streak: 50,
    participation: 10,
  },
  daily: {
    base: 200,
    streakBonus: 50,
    maxStreakBonus: 500,
  },
  taxes: {
    transfer: 0.10,
    sellBack: 0.50,
  },
  bet: {
    minBet: 50,
    maxBet: 10000,
    houseFee: 0.05,
  },
  tigrinho: {
    minBet: 20,
    maxBet: 3000,
    cooldownSeconds: 30,
    symbols: [
      { emoji: "🍒", weight: 30, multiplier: 1.5 },
      { emoji: "🍋", weight: 25, multiplier: 2.0 },
      { emoji: "🍊", weight: 20, multiplier: 2.5 },
      { emoji: "🍇", weight: 15, multiplier: 3.0 },
      { emoji: "💎", weight: 7, multiplier: 5.0 },
      { emoji: "🐯", weight: 3, multiplier: 10.0 },
    ],
  },
  // Categorias da loja
  shopCategories: {
    avatar: { emoji: "🎭", label: "AVATARES" },
    boost: { emoji: "⚡", label: "BOOSTS" },
    lootbox: { emoji: "📦", label: "LOOTBOX" },
    fila: { emoji: "🚀", label: "FURAR FILA" },
  } as Record<string, { emoji: string; label: string }>,
  // Raridades
  rarities: {
    common: { emoji: "⚪", label: "Comum", color: 0xAAAAAA },
    rare: { emoji: "🔵", label: "Raro", color: 0x3498db },
    epic: { emoji: "🟣", label: "Épico", color: 0x9b59b6 },
    legendary: { emoji: "🟡", label: "Lendário", color: 0xFFD700 },
  } as Record<string, { emoji: string; label: string; color: number }>,
  // Lootbox: chances por raridade (soma 100)
  lootboxChances: {
    common: 50,
    rare: 30,
    epic: 15,
    legendary: 5,
  } as Record<string, number>,
  wealthTitles: [
    { min: 0, title: "🪙 Falido", color: 0x808080 },
    { min: 500, title: "🥉 Classe Baixa", color: 0xCD7F32 },
    { min: 2000, title: "🥈 Classe Média", color: 0xC0C0C0 },
    { min: 5000, title: "🥇 Classe Alta", color: 0xFFD700 },
    { min: 15000, title: "💰 Rico", color: 0x00FF00 },
    { min: 50000, title: "💎 Milionário", color: 0x00BFFF },
    { min: 150000, title: "👑 Magnata", color: 0xFF4500 },
    { min: 500000, title: "🏛️ Oligarca", color: 0xFF0000 },
    { min: 1000000, title: "🌍 Dono do Servidor", color: 0xFFD700 },
  ],
};

const LEGACY_GEM_TO_COINS_RATE = 1000;

function getWealthTitle(coins: number) {
  let title = ECONOMY_CONFIG.wealthTitles[0];
  for (const t of ECONOMY_CONFIG.wealthTitles) {
    if (coins >= t.min) title = t;
  }
  return title;
}

function formatCoins(amount: number): string {
  return amount.toLocaleString("pt-BR");
}

function getRankingName(elo: number): string {
  if (elo < 1000) return "🟤 Bronze";
  if (elo < 1100) return "⚪ Prata I";
  if (elo < 1200) return "⚪ Prata II";
  if (elo < 1300) return "⚪ Prata III";
  if (elo < 1400) return "🟡 Ouro I";
  if (elo < 1500) return "🟡 Ouro II";
  if (elo < 1600) return "🟡 Ouro III";
  if (elo < 1700) return "🔵 Platina I";
  if (elo < 1800) return "🔵 Platina II";
  if (elo < 1900) return "🔵 Platina III";
  if (elo < 2000) return "💎 Diamante I";
  if (elo < 2100) return "💎 Diamante II";
  if (elo < 2200) return "💎 Diamante III";
  if (elo < 2300) return "💎 Diamante IV";
  return "👑 Mestre";
}

// Calcula odds baseado no ELO médio dos times
function calculateOdds(redElo: number, blueElo: number): { redOdd: number; blueOdd: number } {
  const totalElo = redElo + blueElo;
  const redWinProb = redElo / totalElo;
  const blueWinProb = blueElo / totalElo;

  const houseCut = 1 - ECONOMY_CONFIG.bet.houseFee;
  const redOdd = Math.max(1.05, parseFloat(((1 / redWinProb) * houseCut).toFixed(2)));
  const blueOdd = Math.max(1.05, parseFloat(((1 / blueWinProb) * houseCut).toFixed(2)));

  return { redOdd, blueOdd };
}

// Tigrinho: sortear símbolo baseado em peso
function spinSymbol(): typeof ECONOMY_CONFIG.tigrinho.symbols[0] {
  const symbols = ECONOMY_CONFIG.tigrinho.symbols;
  const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  for (const s of symbols) {
    random -= s.weight;
    if (random <= 0) return s;
  }
  return symbols[0];
}

/**
 * Sorteia uma raridade para lootbox baseado nos pesos configurados
 */
function rollRarity(): string {
  const chances = ECONOMY_CONFIG.lootboxChances;
  const total = Object.values(chances).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(chances)) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return "common";
}

// ========================
//  MÓDULO DE ECONOMIA
// ========================
@Module
export class EconomyModule {
  private matchEarnings: { [discordId: string]: number } = {};
  private betPool: { [playerId: number]: { amount: number; team: 1 | 2; discordId: string } } = {};
  private betsOpen: boolean = false;
  private currentOdds: { redOdd: number; blueOdd: number } = { redOdd: 2.0, blueOdd: 2.0 };

  constructor(private $: Room) {}

  // ---- HELPERS ----
  private async getOrCreateEconomy(discordId: string) {
    let eco = await prisma.economy.findUnique({ where: { discordId } });
    if (!eco) {
      eco = await prisma.economy.create({ data: { discordId } });
    }
    if (eco.gems > 0) {
      const gemAmount = eco.gems;
      const converted = gemAmount * LEGACY_GEM_TO_COINS_RATE;
      eco = await prisma.economy.update({
        where: { id: eco.id },
        data: { coins: { increment: converted }, gems: 0 },
      });
      await prisma.transaction.create({
        data: {
          economyId: eco.id,
          type: "earn",
          amount: converted,
          description: `Conversao de saldo antigo (${gemAmount}x)`,
        },
      });
    }
    return eco;
  }

  private async addCoins(discordId: string, amount: number, description: string) {
    const eco = await this.getOrCreateEconomy(discordId);
    const multiplier = eco.multiplierExp && eco.multiplierExp > new Date() ? eco.multiplier : 1.0;
    const finalAmount = Math.floor(amount * multiplier);

    const updated = await prisma.economy.update({
      where: { discordId },
      data: {
        coins: { increment: finalAmount },
        totalEarned: { increment: finalAmount },
      },
    });

    await prisma.transaction.create({
      data: {
        economyId: eco.id,
        type: "earn",
        amount: finalAmount,
        description,
      },
    });

    return updated;
  }

  private async removeCoins(discordId: string, amount: number, description: string, type: string = "spend") {
    const eco = await this.getOrCreateEconomy(discordId);
    if (eco.coins < amount) return null;

    const updated = await prisma.economy.update({
      where: { discordId },
      data: {
        coins: { decrement: amount },
        totalSpent: { increment: amount },
      },
    });

    await prisma.transaction.create({
      data: {
        economyId: eco.id,
        type,
        amount,
        description,
      },
    });

    return updated;
  }


  // ---- CALCULAR ELO MÉDIO DOS TIMES ----
  private async getTeamAvgElo(team: 1 | 2): Promise<number> {
    const players = this.$.players.getAll(p => p.team === team).values();
    const elos: number[] = [];
    for (const p of players) {
      if (p.settings.account?.discordId) {
        const status = await prisma.status.findFirst({ where: { discordId: p.settings.account.discordId } });
        elos.push(status?.elo || 1000);
      } else {
        elos.push(1000);
      }
    }
    if (elos.length === 0) return 1000;
    return Math.round(elos.reduce((a, b) => a + b, 0) / elos.length);
  }

  // ---- GANHOS POR PARTIDA ----
  private addMatchEarning(player: Player, amount: number) {
    const discordId = player.settings.account?.discordId;
    if (!discordId) return;
    if (!this.matchEarnings[discordId]) this.matchEarnings[discordId] = 0;
    this.matchEarnings[discordId] += amount;
  }

  @CustomEvent
  onPlayerCorte(player: Player) {
    this.addMatchEarning(player, ECONOMY_CONFIG.earnings.corte);
  }

  @CustomEvent
  onPlayerLevant(player: Player) {
    this.addMatchEarning(player, ECONOMY_CONFIG.earnings.levant);
  }

  @CustomEvent
  onPlayerBlock(player: Player) {
    this.addMatchEarning(player, ECONOMY_CONFIG.earnings.block);
  }

  @Event
  async onGameStart() {
    this.matchEarnings = {};
    this.betPool = {};

    // Só abre apostas em 3x3
    const red = this.$.players.red().size;
    const blue = this.$.players.blue().size;
    if (red === Settings.mapPlayers && blue === Settings.mapPlayers) {
      this.betsOpen = true;

      const redElo = await this.getTeamAvgElo(1);
      const blueElo = await this.getTeamAvgElo(2);
      this.currentOdds = calculateOdds(redElo, blueElo);

      this.$.send({
        message: `━━━━ 🎰 CASA DE APOSTAS ━━━━`,
        color: 0xFFD700,
      });
      this.$.send({
        message: `[📊] Odds: 🔴 Red ${this.currentOdds.redOdd}x | 🔵 Blue ${this.currentOdds.blueOdd}x`,
        color: 0xFFD700,
      });
      this.$.send({
        message: `[📊] ELO Médio: 🔴 ${redElo} | 🔵 ${blueElo}`,
        color: 0xAAAAAA,
      });
      this.$.send({
        message: `[💰] Use !apostar <valor> <red/blue> em 20s!`,
        color: 0xFFD700,
      });

      setTimeout(() => {
        if (this.betsOpen) {
          this.betsOpen = false;
          const totalPool = Object.values(this.betPool).reduce((sum, b) => sum + b.amount, 0);
          this.$.send({
            message: `[🔒] Apostas encerradas! Pool total: ${formatCoins(totalPool)} moedas.`,
            color: 0xFF6600,
          });
        }
      }, 20000);
    } else {
      this.betsOpen = false;
    }
  }

  @CustomEvent
  async onTeamVictory() {
    // Só conta economia em 3x3
    if (this.$.players.teams().size < Settings.mapPlayers * 2) {
      this.matchEarnings = {};
      this.betPool = {};
      this.betsOpen = false;
      return;
    }

    const scores = this.$.scores;
    if (!scores) return;

    const winnerTeam: 1 | 2 = scores.red > scores.blue ? 1 : 2;
    const players = this.$.players.teams().values();

    for (const p of players) {
      const discordId = p.settings.account?.discordId;
      if (!discordId) continue;

      const isWinner = p.team === winnerTeam;
      let earnings = ECONOMY_CONFIG.earnings.participation;
      earnings += isWinner ? ECONOMY_CONFIG.earnings.win : ECONOMY_CONFIG.earnings.lose;
      earnings += this.matchEarnings[discordId] || 0;

      const eco = await this.addCoins(discordId, earnings, isWinner ? "Vitória na partida" : "Derrota na partida");

      const wealth = getWealthTitle(eco.coins);
      p.reply({
        message: `[💰] +${formatCoins(earnings)} moedas! Saldo: ${formatCoins(eco.coins)} (${wealth.title})`,
        color: wealth.color,
      });
    }

    await this.resolveBets(winnerTeam);

    this.matchEarnings = {};
    this.betsOpen = false;
  }

  private async resolveBets(winnerTeam: 1 | 2) {
    if (Object.keys(this.betPool).length === 0) return;

    this.$.send({ message: `━━━━ 🎰 RESULTADO DAS APOSTAS ━━━━`, color: 0xFFD700 });

    for (const [playerIdStr, bet] of Object.entries(this.betPool)) {
      const playerId = Number(playerIdStr);
      const player = this.$.players[playerId];

      const odd = bet.team === 1 ? this.currentOdds.redOdd : this.currentOdds.blueOdd;

      if (bet.team === winnerTeam) {
        const winnings = Math.floor(bet.amount * odd);
        const profit = winnings - bet.amount;

        await prisma.economy.update({
          where: { discordId: bet.discordId },
          data: {
            coins: { increment: winnings },
            totalBetWon: { increment: profit },
            betsWon: { increment: 1 },
          },
        });

        await prisma.transaction.create({
          data: {
            economyId: (await this.getOrCreateEconomy(bet.discordId)).id,
            type: "bet_win",
            amount: winnings,
            description: `Aposta ganha (${odd}x) - +${formatCoins(profit)} lucro`,
          },
        });

        if (player) {
          player.reply({
            message: `[🎰] GANHOU! Apostou ${formatCoins(bet.amount)} a ${odd}x → +${formatCoins(winnings)} moedas! (lucro: ${formatCoins(profit)}) 🤑`,
            color: Colors.GreenYellow,
          });
        }
      } else {
        await prisma.economy.update({
          where: { discordId: bet.discordId },
          data: {
            totalBetLost: { increment: bet.amount },
            betsLost: { increment: 1 },
          },
        });

        await prisma.transaction.create({
          data: {
            economyId: (await this.getOrCreateEconomy(bet.discordId)).id,
            type: "bet_lose",
            amount: bet.amount,
            description: `Aposta perdida (${odd}x)`,
          },
        });

        if (player) {
          player.reply({
            message: `[🎰] PERDEU! -${formatCoins(bet.amount)} moedas. A casa sempre ganha... 💀`,
            color: Colors.Red,
          });
        }
      }
    }
    this.betPool = {};
  }

  // ========================
  //  COMANDOS IN-GAME
  // ========================

  @ModuleCommand({
    aliases: ["coins", "saldo", "carteira", "wallet"],
    deleteMessage: true,
  })
  async checkBalance(command: CommandExecInfo) {
    if (!command.player.settings.account) {
      command.player.reply(MessageFormatter.error("Registre-se primeiro! Use !discord"));
      return;
    }
    const discordId = command.player.settings.account.discordId;
    const eco = await this.getOrCreateEconomy(discordId);
    const status = await prisma.status.findFirst({ where: { discordId } });
    const wealth = getWealthTitle(eco.coins);
    const multiplierActive = eco.multiplierExp && eco.multiplierExp > new Date();
    const elo = status?.elo || 1000;
    const wins = status?.wins || 0;
    const loses = status?.loses || 0;
    const total = wins + loses;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";
    const betProfit = eco.totalBetWon - eco.totalBetLost;

    // Header
    command.player.reply(MessageFormatter.header(`💳 ${command.player.name}`));
    // Moedas
    command.player.reply({
      message: `🪙 ${formatCoins(eco.coins)} moedas`,
      color: 0xFFD700,
    });
    // ELO e WR
    command.player.reply({
      message: `⭐ ${elo} ELO (${getRankingName(elo)}) • 🏆 ${winRate}% WR`,
      color: 0xAAAAAA,
    });
    // Apostas
    command.player.reply({
      message: `🎰 ${eco.betsWon}V / ${eco.betsLost}D | Lucro: ${formatCoins(betProfit)}`,
      color: 0xAAAAAA,
    });
    if (multiplierActive) {
      command.player.reply(MessageFormatter.success(`Multiplicador ativo: ${eco.multiplier}x!`));
    }
  }

  @ModuleCommand({
    aliases: ["odds"],
    deleteMessage: true,
  })
  async oddsCommand(command: CommandExecInfo) {
    if (!this.betsOpen) {
      command.player.reply(MessageFormatter.warning("Apostas não estão abertas no momento"));
      return;
    }
    command.player.reply(MessageFormatter.betting(`Red ${this.currentOdds.redOdd}x • Blue ${this.currentOdds.blueOdd}x`));
  }

  @ModuleCommand({
    aliases: ["daily", "diario"],
    deleteMessage: true,
  })
  async dailyReward(command: CommandExecInfo) {
    if (!command.player.settings.account) {
      command.player.reply(MessageFormatter.error("Registre-se primeiro!", "Use !discord"));
      return;
    }
    const discordId = command.player.settings.account.discordId;
    const eco = await this.getOrCreateEconomy(discordId);

    const now = new Date();
    if (eco.lastDaily) {
      const lastDaily = new Date(eco.lastDaily);
      const hoursSince = (now.getTime() - lastDaily.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 20) {
        const hoursLeft = Math.ceil(20 - hoursSince);
        command.player.reply({
          message: `[⏰] Você já coletou seu diário! Volte em ${hoursLeft}h.`,
          color: Colors.Red,
        });
        return;
      }
      if (hoursSince > 48) {
        await prisma.economy.update({ where: { discordId }, data: { dailyStreak: 0 } });
        eco.dailyStreak = 0;
      }
    }

    const newStreak = eco.dailyStreak + 1;
    const streakBonus = Math.min(newStreak * ECONOMY_CONFIG.daily.streakBonus, ECONOMY_CONFIG.daily.maxStreakBonus);
    const totalCoins = ECONOMY_CONFIG.daily.base + streakBonus;

    await prisma.economy.update({
      where: { discordId },
      data: { dailyStreak: newStreak, lastDaily: now },
    });

    await this.addCoins(discordId, totalCoins, `Recompensa diária (streak ${newStreak})`);

    const dailyMsg = MessageFormatter.economy(`🎁 Diário coletado!`, `+${formatCoins(totalCoins)} moedas`);
    command.player.reply(dailyMsg);
    
    const streakMsg = MessageFormatter.stat(`🔥 Streak: ${newStreak} dias`, `Bônus: +${formatCoins(streakBonus)}`);
    command.player.reply(streakMsg);

  }

  // ========================
  //  APOSTAS POR ODD
  // ========================
  @ModuleCommand({
    aliases: ["apostar", "bet"],
    deleteMessage: true,
  })
  async betCommand(command: CommandExecInfo) {
    if (!command.player.settings.account) {
      command.player.reply(MessageFormatter.error("Registre-se primeiro!", "Use !discord"));
      return;
    }
    if (!this.betsOpen) {
      command.player.reply(MessageFormatter.error("Apostas fechadas!", "Só funciona em 3x3 nos primeiros 15s"));
      return;
    }
    if (this.betPool[command.player.id]) {
      command.player.reply(MessageFormatter.error("Aposta duplicada!", "Você já apostou nesta partida"));
      return;
    }

    const args = command.arguments;
    if (args.length < 2) {
      command.player.reply(MessageFormatter.warning("Uso: !apostar <valor> <red/blue>", ""));
      command.player.reply(MessageFormatter.betting(`🔴 Red: ${this.currentOdds.redOdd}x`, `🔵 Blue: ${this.currentOdds.blueOdd}x`));
      return;
    }

    const amount = parseInt(args[0].toString());
    const teamStr = args[1].toString().toLowerCase();
    const team: 1 | 2 | null = teamStr === "red" || teamStr === "vermelho" || teamStr === "r" ? 1
      : teamStr === "blue" || teamStr === "azul" || teamStr === "b" ? 2
      : null;

    if (!team) {
      command.player.reply(MessageFormatter.error("Time inválido!", "Use: red ou blue"));
      return;
    }
    if (isNaN(amount) || amount < ECONOMY_CONFIG.bet.minBet) {
      command.player.reply(MessageFormatter.error(`Aposta mínima: ${formatCoins(ECONOMY_CONFIG.bet.minBet)}`, ""));
      return;
    }
    if (amount > ECONOMY_CONFIG.bet.maxBet) {
      command.player.reply(MessageFormatter.error(`Aposta máxima: ${formatCoins(ECONOMY_CONFIG.bet.maxBet)}`, ""));
      return;
    }

    const discordId = command.player.settings.account.discordId;
    const result = await this.removeCoins(discordId, amount, `Aposta: ${amount} no ${team === 1 ? "Red" : "Blue"} (odd ${team === 1 ? this.currentOdds.redOdd : this.currentOdds.blueOdd}x)`, "bet");
    if (!result) {
      command.player.reply(MessageFormatter.error("Saldo insuficiente!", ""));
      return;
    }

    await prisma.economy.update({
      where: { discordId },
      data: { totalBets: { increment: 1 } },
    });

    this.betPool[command.player.id] = { amount, team, discordId };
    const odd = team === 1 ? this.currentOdds.redOdd : this.currentOdds.blueOdd;
    const potentialWin = Math.floor(amount * odd);

    const betAnnounce = MessageFormatter.betting(
      `${command.player.name} apostou ${formatCoins(amount)}`,
      `${team === 1 ? "🔴 Red" : "🔵 Blue"} (${odd}x) → ${formatCoins(potentialWin)}`
    );
    this.$.send(betAnnounce);
  }

  // ========================
  //  🐯 TIGRINHO (SLOT MACHINE)
  // ========================
  @ModuleCommand({
    aliases: ["tigrinho", "tiger", "slot", "slots"],
    deleteMessage: true,
  })
  async tigrinhoCommand(command: CommandExecInfo) {
    if (!command.player.settings.account) {
      command.player.reply(MessageFormatter.error("Registre-se primeiro!", "Use !discord"));
      return;
    }

    const args = command.arguments;
    if (args.length < 1) {
      command.player.reply(MessageFormatter.warning("Uso: !tigrinho <valor>", ""));
      command.player.reply(MessageFormatter.betting(`Mín: ${ECONOMY_CONFIG.tigrinho.minBet}`, `Máx: ${formatCoins(ECONOMY_CONFIG.tigrinho.maxBet)}`));
      return;
    }

    const amount = parseInt(args[0].toString());
    if (isNaN(amount) || amount < ECONOMY_CONFIG.tigrinho.minBet) {
      command.player.reply(MessageFormatter.error(`Aposta mínima: ${ECONOMY_CONFIG.tigrinho.minBet}`, ""));
      return;
    }
    if (amount > ECONOMY_CONFIG.tigrinho.maxBet) {
      command.player.reply(MessageFormatter.error(`Aposta máxima: ${formatCoins(ECONOMY_CONFIG.tigrinho.maxBet)}`, ""));
      return;
    }

    const discordId = command.player.settings.account.discordId;
    const eco = await this.getOrCreateEconomy(discordId);

    // Cooldown
    if (eco.lastTigrinho) {
      const secsSince = (Date.now() - new Date(eco.lastTigrinho).getTime()) / 1000;
      if (secsSince < ECONOMY_CONFIG.tigrinho.cooldownSeconds) {
        const secsLeft = Math.ceil(ECONOMY_CONFIG.tigrinho.cooldownSeconds - secsSince);
        command.player.reply(MessageFormatter.warning(`Aguarde ${secsLeft}s`, ""));
        return;
      }
    }

    const removeResult = await this.removeCoins(discordId, amount, `Tigrinho: ${amount}`, "bet");
    if (!removeResult) {
      command.player.reply(MessageFormatter.error("Saldo insuficiente!", ""));
      return;
    }

    await prisma.economy.update({ where: { discordId }, data: { lastTigrinho: new Date() } });

    // Girar 3 slots
    const s1 = spinSymbol();
    const s2 = spinSymbol();
    const s3 = spinSymbol();

    const line = `[ ${s1.emoji} | ${s2.emoji} | ${s3.emoji} ]`;

    if (s1.emoji === s2.emoji && s2.emoji === s3.emoji) {
      // JACKPOT - 3 iguais
      const multiplier = s1.multiplier;
      const winnings = Math.floor(amount * multiplier);
      const profit = winnings - amount;
      await this.addCoins(discordId, winnings, `Tigrinho JACKPOT (${multiplier}x)`);

      await prisma.economy.update({
        where: { discordId },
        data: { totalBetWon: { increment: profit }, betsWon: { increment: 1 }, totalBets: { increment: 1 } },
      });

      this.$.send(MessageFormatter.betting(`🐯 ${command.player.name} GANHOU!`, line));
      const result = MessageFormatter.economy(`🤑 JACKPOT ${multiplier}x!`, `+${formatCoins(winnings)} (lucro: ${formatCoins(profit)})`);
      this.$.send(result);

      if (s1.emoji === "🐯") {
        const legendaryMsg = MessageFormatter.success(`🐯🐯🐯 TIGRINHO TRIPLO!!!`, `${command.player.name} ganhou ${formatCoins(winnings)}`);
        this.$.send(legendaryMsg);
      }
    } else if (s1.emoji === s2.emoji || s2.emoji === s3.emoji || s1.emoji === s3.emoji) {
      // 2 iguais - retorna a aposta
      await this.addCoins(discordId, amount, `Tigrinho: 2 iguais (devolução)`);

      await prisma.economy.update({
        where: { discordId },
        data: { totalBets: { increment: 1 } },
      });

      const almostMsg = MessageFormatter.info(`${line}`, "Quase! Aposta devolvida");
      command.player.reply(almostMsg);
    } else {
      // Nada - perdeu tudo
      await prisma.economy.update({
        where: { discordId },
        data: { totalBetLost: { increment: amount }, betsLost: { increment: 1 }, totalBets: { increment: 1 } },
      });

      const lostMsg = MessageFormatter.error(`${line}`, `-${formatCoins(amount)}`);
      command.player.reply(lostMsg);
    }
  }

  // ========================
  //  TRANSFERÊNCIA
  // ========================
  @ModuleCommand({
    aliases: ["transferir", "pagar", "pay", "transfer"],
    deleteMessage: true,
  })
  async transferCommand(command: CommandExecInfo) {
    if (!command.player.settings.account) {
      command.player.reply(MessageFormatter.error("Registre-se primeiro!", "Use !discord"));
      return;
    }

    const args = command.arguments;
    if (args.length < 2) {
      command.player.reply(MessageFormatter.warning("Uso: !transferir <valor> @jogador", ""));
      return;
    }

    const amount = parseInt(args[0].toString());
    if (isNaN(amount) || amount <= 0) {
      command.player.reply(MessageFormatter.error("Valor inválido!", ""));
      return;
    }

    const targetName = args.slice(1).map(a => a.toString()).join(" ").replace("@", "");
    const targetPlayer = this.$.players.values().find(p => p.name.toLowerCase() === targetName.toLowerCase());
    if (!targetPlayer || !targetPlayer.settings.account) {
      command.player.reply(MessageFormatter.error("Jogador não encontrado!", "Ou não registrado"));
      return;
    }

    if (targetPlayer.id === command.player.id) {
      command.player.reply(MessageFormatter.error("Não pode transferir para si mesmo!", ""));
      return;
    }

    const tax = Math.floor(amount * ECONOMY_CONFIG.taxes.transfer);
    const netAmount = amount - tax;
    const senderDiscordId = command.player.settings.account.discordId;
    const receiverDiscordId = targetPlayer.settings.account.discordId;

    const result = await this.removeCoins(senderDiscordId, amount, `Transferência para ${targetPlayer.name} (taxa: ${tax})`, "transfer_out");
    if (!result) {
      command.player.reply(MessageFormatter.error("Saldo insuficiente!", ""));
      return;
    }

    await this.addCoins(receiverDiscordId, netAmount, `Transferência de ${command.player.name}`);

    const senderMsg = MessageFormatter.economy(`💸 Transferência enviada`, `${formatCoins(amount)} → ${targetPlayer.name}\nTaxa: ${formatCoins(tax)}`);
    command.player.reply(senderMsg);
    
    const receiverMsg = MessageFormatter.success(`💸 Moedas recebidas!`, `+${formatCoins(netAmount)} de ${command.player.name}`);
    targetPlayer.reply(receiverMsg);
  }

  // ========================
  //  RANKINGS
  // ========================
  @ModuleCommand({
    aliases: ["ranking", "ricos", "top", "leaderboard"],
    deleteMessage: true,
  })
  async rankingCommand(command: CommandExecInfo) {
    const args = command.arguments;
    const category = args.length > 0 ? args[0].toString().toLowerCase() : "coins";

    switch (category) {
      case "coins":
      case "moedas":
      case "ricos":
        await this.showRanking(command.player, "coins", "🪙 TOP MAIS RICOS");
        break;
      case "elo":
      case "rank":
        await this.showEloRanking(command.player);
        break;
      case "cortes":
      case "corte":
        await this.showStatusRanking(command.player, "cortes", "⚽ TOP CORTES");
        break;
      case "levants":
      case "levant":
      case "levantamentos":
        await this.showStatusRanking(command.player, "levants", "🏌️ TOP LEVANTAMENTOS");
        break;
      case "blocks":
      case "block":
      case "bloqueios":
        await this.showStatusRanking(command.player, "blocks", "🛡️ TOP BLOQUEIOS");
        break;
      case "wins":
      case "vitorias":
        await this.showStatusRanking(command.player, "wins", "✅ TOP VITÓRIAS");
        break;
      case "apostas":
      case "bets":
        await this.showBetRanking(command.player);
        break;
      default:
        command.player.reply({
          message: `[🏆] Categorias: coins, elo, cortes, levants, blocks, wins, apostas`,
          color: 0xFFD700,
        });
        break;
    }
  }

  private async showRanking(player: Player, field: string, title: string) {
    const topPlayers = await prisma.economy.findMany({
      orderBy: { [field]: "desc" },
      take: 5,
    });
    player.reply(MessageFormatter.header(title));
    for (let i = 0; i < topPlayers.length; i++) {
      const eco = topPlayers[i];
      const user = await prisma.user.findFirst({ where: { discordId: eco.discordId } });
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
      const wealth = getWealthTitle(eco.coins);
      player.reply({
        message: `${medal} ${user?.nickname || "???"} - ${formatCoins(eco.coins)} moedas (${wealth.title})`,
        color: wealth.color,
      });
    }
  }

  private async showEloRanking(player: Player) {
    const topPlayers = await prisma.status.findMany({
      orderBy: { elo: "desc" },
      take: 5,
    });
    player.reply(MessageFormatter.header("⭐ TOP ELO"));
    for (let i = 0; i < topPlayers.length; i++) {
      const st = topPlayers[i];
      const user = await prisma.user.findFirst({ where: { discordId: st.discordId } });
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
      const rank = getRankingName(st.elo);
      player.reply({
        message: `${medal} ${user?.nickname || "???"} - ${st.elo} ELO (${rank})`,
        color: 0x00BFFF,
      });
    }
  }

  private async showStatusRanking(player: Player, field: string, title: string) {
    const topPlayers = await prisma.status.findMany({
      orderBy: { [field]: "desc" },
      take: 5,
    });
    player.reply(MessageFormatter.header(title));
    for (let i = 0; i < topPlayers.length; i++) {
      const st = topPlayers[i];
      const user = await prisma.user.findFirst({ where: { discordId: st.discordId } });
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
      const value = (st as any)[field] || 0;
      player.reply({
        message: `${medal} ${user?.nickname || "???"} - ${value}`,
        color: 0x00BFFF,
      });
    }
  }

  private async showBetRanking(player: Player) {
    const topPlayers = await prisma.economy.findMany({
      orderBy: { totalBetWon: "desc" },
      take: 5,
    });
    player.reply(MessageFormatter.header("🎰 TOP APOSTADORES"));
    for (let i = 0; i < topPlayers.length; i++) {
      const eco = topPlayers[i];
      const user = await prisma.user.findFirst({ where: { discordId: eco.discordId } });
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
      const profit = eco.totalBetWon - eco.totalBetLost;
      const wr = eco.totalBets > 0 ? ((eco.betsWon / eco.totalBets) * 100).toFixed(0) : "0";
      player.reply({
        message: `${medal} ${user?.nickname || "???"} - Lucro: ${formatCoins(profit)} | ${eco.betsWon}W/${eco.betsLost}L (${wr}%)`,
        color: profit >= 0 ? Colors.GreenYellow : Colors.Red,
      });
    }
  }

  // ========================
  //  🏪 LOJA — Com categorias e raridades
  // ========================
  @ModuleCommand({
    aliases: ["loja", "shop", "store"],
    deleteMessage: true,
  })
  async shopCommand(command: CommandExecInfo) {
    const args = command.arguments;
    const category = args.length > 0 ? args[0].toString().toLowerCase() : null;

    // Se especificou categoria, mostrar só aquela
    if (category && ECONOMY_CONFIG.shopCategories[category]) {
      await this.showShopCategory(command.player, category);
      return;
    }

    // Mostrar menu de categorias (compacto)
    const parts: string[] = [];
    for (const [key, cat] of Object.entries(ECONOMY_CONFIG.shopCategories)) {
      const count = await prisma.shopItem.count({ where: { category: key, isActive: true, currency: "coins" } });
      if (count > 0) parts.push(`${cat.emoji} ${key}(${count})`);
    }
    const summary = parts.length > 0 ? parts.join(" | ") : "Loja vazia";
    command.player.reply(MessageFormatter.info("Loja", `${summary} | !loja <categoria> | !comprar <id>`));
  }

  private async showShopCategory(player: Player, category: string) {
    const catInfo = ECONOMY_CONFIG.shopCategories[category];
    const items = await prisma.shopItem.findMany({
      where: { category, isActive: true, currency: "coins" },
      orderBy: [{ rarity: "asc" }, { price: "asc" }],
      take: 10,
    });

    if (items.length === 0) {
      player.reply(MessageFormatter.warning("Nenhum item nesta categoria"));
      return;
    }

    player.reply(MessageFormatter.info(`${catInfo.emoji} ${catInfo.label}`, `!comprar <id>`));

    for (const item of items) {
      const rarityInfo = ECONOMY_CONFIG.rarities[item.rarity] || ECONOMY_CONFIG.rarities.common;
      const stockText = item.stock === -1 ? "∞" : `${item.stock}`;
      const currEmoji = "🪙";
      const codeBase = item.code || item.name.replace(/\s+/g, "").toLowerCase();
      const codeText = `id${codeBase}`;
      let avatarEmoji = "";
      if (item.category === "avatar") {
        try {
          const effect = JSON.parse(item.effect);
          if (effect.emoji) avatarEmoji = `${effect.emoji} `;
        } catch {}
      }
      const stockPart = item.stock === -1 ? "" : ` | ${stockText}x`;

      player.reply({
        message: `${rarityInfo.emoji} ${codeText} | ${avatarEmoji}${item.name} — ${currEmoji} ${formatCoins(item.price)}${stockPart}`,
        color: rarityInfo.color,
      });
    }
  }

  @ModuleCommand({
    aliases: ["comprar", "buy"],
    deleteMessage: true,
  })
  async buyCommand(command: CommandExecInfo) {
    if (!command.player.settings.account) {
      command.player.reply(MessageFormatter.error("Registre-se primeiro!", "Use !discord"));
      return;
    }

    const args = command.arguments;
    if (args.length === 0) {
      command.player.reply(MessageFormatter.warning("Uso: !comprar <id>", "Use !loja"));
      return;
    }

    let quantity = 1;
    let inputArgs = args.map(a => a.toString());
    const lastArg = inputArgs[inputArgs.length - 1];
    const maybeQty = parseInt(lastArg, 10);
    if (inputArgs.length > 1 && !Number.isNaN(maybeQty)) {
      quantity = maybeQty;
      inputArgs = inputArgs.slice(0, -1);
    }

    const inputRaw = inputArgs.join(" ").trim();
    const inputForCode = inputRaw.replace(/^id/i, "").replace(/\s+/g, "");
    const item = await prisma.shopItem.findFirst({
      where: {
        isActive: true,
        currency: "coins",
        OR: [
          { code: { equals: inputForCode, mode: "insensitive" } },
          { name: { equals: inputRaw, mode: "insensitive" } },
        ],
      },
    });

    if (!item) {
      command.player.reply(MessageFormatter.error("Item não encontrado!", "Use !loja"));
      return;
    }

    if (item.category !== "fila") {
      quantity = 1;
    } else if (quantity < 1) {
      command.player.reply(MessageFormatter.error("Quantidade inválida!", "Use !comprar furafila <quantidade>"));
      return;
    }

    if (item.stock === 0) {
      command.player.reply(MessageFormatter.error("Item esgotado!"));
      return;
    }
    if (item.stock > 0 && quantity > item.stock) {
      command.player.reply(MessageFormatter.error("Estoque insuficiente!", `Disponivel: ${item.stock}`));
      return;
    }

    const discordId = command.player.settings.account.discordId;
    const eco = await this.getOrCreateEconomy(discordId);

    // Verificar limite por usuário
    if (item.maxPerUser > 0) {
      const userPurchases = await prisma.purchase.count({
        where: { economy: { discordId }, itemId: item.id },
      });
      if (userPurchases >= item.maxPerUser) {
        command.player.reply(MessageFormatter.error("Limite de compras atingido!", `Máximo: ${item.maxPerUser}`));
        return;
      }
    }

    // Verificar saldo
    const totalPrice = item.price * quantity;
    if (eco.coins < totalPrice) {
      command.player.reply(MessageFormatter.error(`Saldo insuficiente!`, `Preço: ${formatCoins(totalPrice)} 🪙`));
      return;
    }

    // Cobrar
    await this.removeCoins(discordId, totalPrice, `Compra: ${item.name}`, "spend");

    // Reduzir estoque
    if (item.stock > 0) {
      await prisma.shopItem.update({ where: { id: item.id }, data: { stock: { decrement: quantity } } });
    }

    // Calcular expiração e usos
    let expiresAt: Date | null = null;
    let usesLeft = -1;
    try {
      const effect = JSON.parse(item.effect);
      if (effect.durationHours) {
        expiresAt = new Date(Date.now() + effect.durationHours * 60 * 60 * 1000);
      }
      if (effect.durationDays) {
        expiresAt = new Date(Date.now() + effect.durationDays * 24 * 60 * 60 * 1000);
      }
      if (effect.uses) {
        usesLeft = effect.uses * quantity;
      }
    } catch {}

    // Criar registro de compra
    await prisma.purchase.create({
      data: {
        economyId: eco.id,
        itemId: item.id,
        quantity,
        totalPrice,
        expiresAt,
        usesLeft,
        isActive: true,
      },
    });

    // Se é lootbox, processar abertura
    if (item.category === "lootbox") {
      await this.openLootbox(command.player, item, eco.id);
      return;
    }

    // Aplicar efeito do item
    if (item.category === "fila" && quantity > 1) {
      command.player.reply(MessageFormatter.success("🚀 Furafila adquirido!", `${quantity} usos`));
    } else {
      await this.applyItemEffect(command.player, item);
    }

    const rarityInfo = ECONOMY_CONFIG.rarities[item.rarity] || ECONOMY_CONFIG.rarities.common;
    const codeBase = item.code || item.name.replace(/\s+/g, "").toLowerCase();
    const codeLabel = `id${codeBase}`;
    command.player.reply(MessageFormatter.success(
      "Compra realizada!",
      `${rarityInfo.emoji} ${codeLabel} — ${formatCoins(totalPrice)} 🪙`
    ));

    // Anunciar compras lendárias/épicas
    if (item.rarity === "legendary" || item.rarity === "epic") {
      this.$.send({
        message: `[🛒] ${command.player.name} comprou ${rarityInfo.emoji} ${item.name}!`,
        color: rarityInfo.color,
        style: "bold",
      });
    }
  }

  // ========================
  //  📦 LOOTBOX
  // ========================
  private async openLootbox(player: Player, lootboxItem: any, economyId: string) {
    const discordId = player.settings.account?.discordId;
    if (!discordId) return;

    // Sortear raridade
    const wonRarity = rollRarity();
    const rarityInfo = ECONOMY_CONFIG.rarities[wonRarity];

    // Buscar itens dessa raridade (excluindo lootboxes)
    const possibleItems = await prisma.shopItem.findMany({
      where: {
        rarity: wonRarity,
        category: { not: "lootbox" },
        isActive: true,
      },
    });

    if (possibleItems.length === 0) {
      // Sem itens dessa raridade, dar moedas como prêmio
      const coinsReward = wonRarity === "legendary" ? 5000 : wonRarity === "epic" ? 2000 : wonRarity === "rare" ? 800 : 300;
      await this.addCoins(discordId, coinsReward, `Lootbox: prêmio em moedas (${rarityInfo.label})`);
      player.reply(MessageFormatter.economy(`Lootbox: ${rarityInfo.emoji} ${rarityInfo.label}`, `+${formatCoins(coinsReward)} moedas`));
      return;
    }

    // Sortear item aleatório
    const wonItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];

    // Verificar duplicata (avatares)
    const alreadyOwns = await prisma.purchase.findFirst({
      where: { economy: { discordId }, itemId: wonItem.id, isActive: true },
    });

    if (alreadyOwns && wonItem.category === "avatar") {
      const coinsCompensation = wonRarity === "legendary" ? 50000 : wonRarity === "epic" ? 25000 : wonRarity === "rare" ? 10000 : 3000;
      await this.addCoins(discordId, coinsCompensation, `Lootbox: duplicata (${wonItem.name})`);
      player.reply(MessageFormatter.warning(
        `Lootbox: ${rarityInfo.emoji} ${wonItem.name}`,
        `Duplicata +${formatCoins(coinsCompensation)} 🪙`
      ));
    } else {
      // Dar o item ao jogador
      let usesLeft = -1;
      let expiresAt: Date | null = null;
      try {
        const effect = JSON.parse(wonItem.effect);
        if (effect.uses) usesLeft = effect.uses;
        if (effect.durationHours) expiresAt = new Date(Date.now() + effect.durationHours * 60 * 60 * 1000);
        if (effect.durationDays) expiresAt = new Date(Date.now() + effect.durationDays * 24 * 60 * 60 * 1000);
      } catch {}

      const eco = await this.getOrCreateEconomy(discordId);
      await prisma.purchase.create({
        data: { economyId: eco.id, itemId: wonItem.id, totalPrice: 0, expiresAt, usesLeft, isActive: true },
      });

      player.reply(MessageFormatter.success(
        `Lootbox: ${rarityInfo.emoji} ${wonItem.name}`,
        "Item adicionado"
      ));

      // Aplicar efeito se não for avatar (avatares precisam ser equipados)
      if (wonItem.category !== "avatar") {
        await this.applyItemEffect(player, wonItem);
      }
    }

    // Anunciar épicos/lendários
    if (wonRarity === "legendary" || wonRarity === "epic") {
      this.$.send({
        message: `[📦] ${player.name} tirou ${rarityInfo.emoji} ${wonItem.name} da lootbox!`,
        color: rarityInfo.color,
        style: "bold",
      });
    }
  }

  // ========================
  //  🎭 COMANDO AVATAR
  // ========================
  @ModuleCommand({
    aliases: ["avatar", "av"],
    deleteMessage: true,
  })
  async avatarCommand(command: CommandExecInfo) {
    if (!command.player.settings.account) {
      command.player.reply(MessageFormatter.error("Registre-se primeiro!", "Use !discord"));
      return;
    }

    const discordId = command.player.settings.account.discordId;
    const args = command.arguments;

    if (args.length === 0) {
      // Mostrar avatares disponíveis
      const purchases = await prisma.purchase.findMany({
        where: {
          economy: { discordId },
          item: { category: "avatar" },
          isActive: true,
        },
        include: { item: true },
      });

      if (purchases.length === 0) {
        command.player.reply(MessageFormatter.warning("Você não possui avatares!", "Use !loja avatar"));
        return;
      }

      command.player.reply(MessageFormatter.info("Avatares", "Use !avatar <emoji>"));
      for (const p of purchases) {
        try {
          const effect = JSON.parse(p.item.effect);
          const rarityInfo = ECONOMY_CONFIG.rarities[p.item.rarity] || ECONOMY_CONFIG.rarities.common;
          command.player.reply({
            message: `${rarityInfo.emoji} ${effect.emoji || "?"} ${p.item.name} | !avatar ${effect.emoji}`,
            color: rarityInfo.color,
          });
        } catch {}
      }
      return;
    }

    // Equipar avatar
    const emoji = args[0].toString().trim();

    // Verificar se possui esse avatar
    const hasPurchase = await prisma.purchase.findFirst({
      where: {
        economy: { discordId },
        item: { category: "avatar", effect: { contains: emoji } },
        isActive: true,
      },
      include: { item: true },
    });

    if (!hasPurchase) {
      command.player.reply(MessageFormatter.error("Você não possui este avatar!", "Compre na !loja avatar"));
      return;
    }

    // Equipar via AvatarModule
    this.$.customEvents.emit("onAvatarEquipped", command.player, emoji);
    const rarityInfo = ECONOMY_CONFIG.rarities[hasPurchase.item.rarity] || ECONOMY_CONFIG.rarities.common;
    command.player.reply(MessageFormatter.success("Avatar equipado!", `${rarityInfo.emoji} ${hasPurchase.item.name}`));
  }

  private async applyItemEffect(player: Player, item: any) {
    try {
      const effect = JSON.parse(item.effect);
      const discordId = player.settings.account?.discordId;
      if (!discordId) return;

      switch (effect.type) {
        case "multiplier":
          const expDate = new Date(Date.now() + (effect.durationHours || 1) * 60 * 60 * 1000);
          await prisma.economy.update({
            where: { discordId },
            data: { multiplier: effect.value || 2.0, multiplierExp: expDate },
          });
          player.reply(MessageFormatter.success(`⚡ Boost ativado!`, `${effect.value}x por ${effect.durationHours}h`));
          break;
        case "coins":
          await this.addCoins(discordId, effect.value, `Item: ${item.name}`);
          break;
        case "gems":
          const converted = (effect.value || 0) * LEGACY_GEM_TO_COINS_RATE;
          await this.addCoins(discordId, converted, `Item: ${item.name} (conversao legado)`);
          player.reply(MessageFormatter.economy(`🪙 Moedas creditadas!`, `+${formatCoins(converted)} moedas`));
          break;
        case "vip":
          const vipExp = new Date(Date.now() + (effect.durationDays || 7) * 24 * 60 * 60 * 1000);
          await prisma.economy.update({ where: { discordId }, data: { vipExpires: vipExp } });
          player.reply(MessageFormatter.economy(`👑 VIP Ativado!`, `${effect.durationDays} dias`));
          break;
        case "avatar":
          // Avatares não são aplicados automaticamente, precisam ser equipados
          player.reply(MessageFormatter.info(`Use !avatar ${effect.emoji} para equipar`));
          break;
        case "furafila":
          // Furafila é consumido pelo FuraModule
          player.reply(MessageFormatter.success(`🚀 Furafila adquirido!`, `${effect.uses} usos`));
          break;
      }
    } catch {}
  }

  @ModuleCommand({
    aliases: ["inventario", "inventory", "inv"],
    deleteMessage: true,
  })
  async inventoryCommand(command: CommandExecInfo) {
    if (!command.player.settings.account) {
      command.player.reply(MessageFormatter.error("Registre-se primeiro!", "Use !discord"));
      return;
    }

    const discordId = command.player.settings.account.discordId;
    const eco = await this.getOrCreateEconomy(discordId);
    const purchases = await prisma.purchase.findMany({
      where: { economyId: eco.id, isActive: true },
      include: { item: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (purchases.length === 0) {
      command.player.reply(MessageFormatter.warning("Inventário vazio!", "Use !loja"));
      return;
    }

    command.player.reply(MessageFormatter.info("Inventário", "Itens ativos"));
    for (const p of purchases) {
      const rarityInfo = ECONOMY_CONFIG.rarities[p.item.rarity] || ECONOMY_CONFIG.rarities.common;
      const catInfo = ECONOMY_CONFIG.shopCategories[p.item.category];
      const expired = p.expiresAt && p.expiresAt < new Date();
      const usesText = p.usesLeft > 0 ? `| ${p.usesLeft} usos` : "";
      const st = expired ? "❌ Expirado" : "✅ Ativo";

      command.player.reply({
        message: `${rarityInfo.emoji} ${p.item.name} (${catInfo?.emoji || "?"}) | ${st} ${usesText}`,
        color: expired ? 0x666666 : rarityInfo.color,
      });
    }
  }
}

export { ECONOMY_CONFIG, getWealthTitle, formatCoins, getRankingName };
