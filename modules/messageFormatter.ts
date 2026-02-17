import { Colors } from "haxball-extended-room";

/**
 * Sistema padronizado de mensagens in-game
 * Reduz poluição visual mantendo informações claras
 */
export class MessageFormatter {
  // Emojis padrão
  static emojis = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
    money: "💰",
    stats: "📊",
    betting: "🎰",
    trophy: "🏆",
    fire: "🔥",
    heart: "❤️",
    star: "⭐",
    check: "✔️",
    arrow: "→",
    separator: "━━━━━",
  };

  private static buildLine(
    emoji: string,
    title: string,
    detail?: string
  ): string {
    if (detail && detail.trim().length > 0) {
      return `${emoji} ${title} | ${detail}`;
    }
    return `${emoji} ${title}`;
  }

  /**
   * Mensagem de sucesso
   */
  static success(title: string, detail?: string): { message: string; color: number } {
    return {
      message: this.buildLine(this.emojis.success, title, detail),
      color: Colors.Green,
    };
  }

  /**
   * Mensagem de erro
   */
  static error(title: string, detail?: string): { message: string; color: number } {
    return {
      message: this.buildLine(this.emojis.error, title, detail),
      color: Colors.Red,
    };
  }

  /**
   * Mensagem de info
   */
  static info(title: string, detail?: string): { message: string; color: number } {
    return {
      message: this.buildLine(this.emojis.info, title, detail),
      color: Colors.LightBlue,
    };
  }

  /**
   * Mensagem de advertência
   */
  static warning(title: string, detail?: string): { message: string; color: number } {
    return {
      message: this.buildLine(this.emojis.warning, title, detail),
      color: Colors.Orange,
    };
  }

  /**
   * Mensagem de economia
   */
  static economy(title: string, detail?: string): { message: string; color: number } {
    return {
      message: this.buildLine(this.emojis.money, title, detail),
      color: Colors.Gold,
    };
  }

  /**
   * Mensagem de apostas
   */
  static betting(title: string, detail?: string): { message: string; color: number } {
    return {
      message: this.buildLine(this.emojis.betting, title, detail),
      color: 0xff6600,
    };
  }

  /**
   * Mensagem de ranking
   */
  static ranking(title: string, detail?: string): { message: string; color: number } {
    return {
      message: this.buildLine(this.emojis.trophy, title, detail),
      color: Colors.Yellow,
    };
  }

  /**
   * Mensagem streak
   */
  static streak(title: string, detail?: string): { message: string; color: number } {
    return {
      message: this.buildLine(this.emojis.fire, title, detail),
      color: Colors.OrangeRed,
    };
  }

  /**
   * Mensagem com stat
   */
  static stat(label: string, value: string | number): { message: string; color: number } {
    return {
      message: `${this.emojis.stats} ${label}: ${value}`,
      color: Colors.Purple,
    };
  }

  /**
   * Cabeçalho de categoria (para dividir informações)
   */
  static header(title: string): { message: string; color: number } {
    return {
      message: `\n${this.emojis.separator} ${title} ${this.emojis.separator}`,
      color: Colors.Gray,
    };
  }

  /**
   * Formata número com separador brasileiro
   */
  static formatNumber(num: number): string {
    return num.toLocaleString("pt-BR");
  }

  /**
   * Monta um sumário de transação
   */
  static transactionSummary(
    from: string,
    to: string,
    amount: number,
    fee?: number
  ): { message: string; color: number } {
    let message = `💳 ${from} ${this.emojis.arrow} ${to}: ${this.formatNumber(amount)}`;
    if (fee && fee > 0) {
      message += ` (-${this.formatNumber(fee)} taxa)`;
    }
    return {
      message,
      color: Colors.LightGoldenRodYellow,
    };
  }

  /**
   * Monta um resultado de aposta compacto
   */
  static bettingResult(
    playerName: string,
    betAmount: number,
    result: "win" | "loss",
    multiplier?: number
  ): { message: string; color: number } {
    const sign = result === "win" ? "+" : "-";
    const emoji = result === "win" ? "🎉" : "💸";
    const winnings = betAmount * (multiplier || 0);

    const message =
      result === "win"
        ? `${emoji} ${playerName} ganhou ${this.formatNumber(winnings)} (${multiplier}x)!`
        : `${emoji} ${playerName} perdeu ${this.formatNumber(betAmount)}`;

    return {
      message,
      color: result === "win" ? Colors.GreenYellow : Colors.Red,
    };
  }

  /**
   * Compacta um status em uma única linha
   */
  static compactStatus(
    nickname: string,
    coins: number,
    elo: number,
    rank: string
  ): { message: string; color: number } {
    return {
      message: `${this.emojis.star} ${nickname}: 🪙${this.formatNumber(coins)} | ⭐${elo} (${rank})`,
      color: Colors.Purple,
    };
  }

  /**
   * Mensagem de comando inválido
   */
  static invalidCommand(command: string): { message: string; color: number } {
    return this.error(`Comando desconhecido: ${command}`);
  }

  /**
   * Mensagem de uso de comando
   */
  static usage(command: string, args: string): { message: string; color: number } {
    return this.info(`Uso: !${command} ${args}`);
  }

  /**
   * Cria uma linha de separação visual
   */
  static divider(): { message: string; color: number } {
    return {
      message: "━━━━━━━━━━━━━━━━",
      color: Colors.Gray,
    };
  }
}
