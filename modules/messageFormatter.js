"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageFormatter = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
/**
 * Sistema padronizado de mensagens in-game
 * Reduz poluição visual mantendo informações claras
 */
class MessageFormatter {
    static buildLine(emoji, title, detail) {
        if (detail && detail.trim().length > 0) {
            return `${emoji} ${title} | ${detail}`;
        }
        return `${emoji} ${title}`;
    }
    /**
     * Mensagem de sucesso
     */
    static success(title, detail) {
        return {
            message: this.buildLine(this.emojis.success, title, detail),
            color: haxball_extended_room_1.Colors.Green,
        };
    }
    /**
     * Mensagem de erro
     */
    static error(title, detail) {
        return {
            message: this.buildLine(this.emojis.error, title, detail),
            color: haxball_extended_room_1.Colors.Red,
        };
    }
    /**
     * Mensagem de info
     */
    static info(title, detail) {
        return {
            message: this.buildLine(this.emojis.info, title, detail),
            color: haxball_extended_room_1.Colors.LightBlue,
        };
    }
    /**
     * Mensagem de advertência
     */
    static warning(title, detail) {
        return {
            message: this.buildLine(this.emojis.warning, title, detail),
            color: haxball_extended_room_1.Colors.Orange,
        };
    }
    /**
     * Mensagem de economia
     */
    static economy(title, detail) {
        return {
            message: this.buildLine(this.emojis.money, title, detail),
            color: haxball_extended_room_1.Colors.Gold,
        };
    }
    /**
     * Mensagem de apostas
     */
    static betting(title, detail) {
        return {
            message: this.buildLine(this.emojis.betting, title, detail),
            color: 0xff6600,
        };
    }
    /**
     * Mensagem de ranking
     */
    static ranking(title, detail) {
        return {
            message: this.buildLine(this.emojis.trophy, title, detail),
            color: haxball_extended_room_1.Colors.Yellow,
        };
    }
    /**
     * Mensagem streak
     */
    static streak(title, detail) {
        return {
            message: this.buildLine(this.emojis.fire, title, detail),
            color: haxball_extended_room_1.Colors.OrangeRed,
        };
    }
    /**
     * Mensagem com stat
     */
    static stat(label, value) {
        return {
            message: `${this.emojis.stats} ${label}: ${value}`,
            color: haxball_extended_room_1.Colors.Purple,
        };
    }
    /**
     * Cabeçalho de categoria (para dividir informações)
     */
    static header(title) {
        return {
            message: `\n${this.emojis.separator} ${title} ${this.emojis.separator}`,
            color: haxball_extended_room_1.Colors.Gray,
        };
    }
    /**
     * Formata número com separador brasileiro
     */
    static formatNumber(num) {
        return num.toLocaleString("pt-BR");
    }
    /**
     * Monta um sumário de transação
     */
    static transactionSummary(from, to, amount, fee) {
        let message = `💳 ${from} ${this.emojis.arrow} ${to}: ${this.formatNumber(amount)}`;
        if (fee && fee > 0) {
            message += ` (-${this.formatNumber(fee)} taxa)`;
        }
        return {
            message,
            color: haxball_extended_room_1.Colors.LightGoldenRodYellow,
        };
    }
    /**
     * Monta um resultado de aposta compacto
     */
    static bettingResult(playerName, betAmount, result, multiplier) {
        const sign = result === "win" ? "+" : "-";
        const emoji = result === "win" ? "🎉" : "💸";
        const winnings = betAmount * (multiplier || 0);
        const message = result === "win"
            ? `${emoji} ${playerName} ganhou ${this.formatNumber(winnings)} (${multiplier}x)!`
            : `${emoji} ${playerName} perdeu ${this.formatNumber(betAmount)}`;
        return {
            message,
            color: result === "win" ? haxball_extended_room_1.Colors.GreenYellow : haxball_extended_room_1.Colors.Red,
        };
    }
    /**
     * Compacta um status em uma única linha
     */
    static compactStatus(nickname, coins, elo, rank) {
        return {
            message: `${this.emojis.star} ${nickname}: 🪙${this.formatNumber(coins)} | ⭐${elo} (${rank})`,
            color: haxball_extended_room_1.Colors.Purple,
        };
    }
    /**
     * Mensagem de comando inválido
     */
    static invalidCommand(command) {
        return this.error(`Comando desconhecido: ${command}`);
    }
    /**
     * Mensagem de uso de comando
     */
    static usage(command, args) {
        return this.info(`Uso: !${command} ${args}`);
    }
    /**
     * Cria uma linha de separação visual
     */
    static divider() {
        return {
            message: "━━━━━━━━━━━━━━━━",
            color: haxball_extended_room_1.Colors.Gray,
        };
    }
}
exports.MessageFormatter = MessageFormatter;
// Emojis padrão
MessageFormatter.emojis = {
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
