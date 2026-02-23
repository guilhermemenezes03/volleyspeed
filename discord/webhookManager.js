"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookManager = exports.WebhookManager = void 0;
const discord_js_1 = require("discord.js");
class WebhookManager {
    constructor(config = {}) {
        this.webhooks = new Map();
        // Webhooks podem ser configurados via variáveis de ambiente ou config
        if (config.economyLogWebhook) {
            this.webhooks.set("economy", new discord_js_1.WebhookClient({ url: config.economyLogWebhook }));
        }
        if (config.bettingLogWebhook) {
            this.webhooks.set("betting", new discord_js_1.WebhookClient({ url: config.bettingLogWebhook }));
        }
        if (config.economyTradeWebhook) {
            this.webhooks.set("trade", new discord_js_1.WebhookClient({ url: config.economyTradeWebhook }));
        }
        if (config.generalLogWebhook) {
            this.webhooks.set("general", new discord_js_1.WebhookClient({ url: config.generalLogWebhook }));
        }
    }
    /**
     * Registra um webhook
     */
    registerWebhook(name, webhookUrl) {
        this.webhooks.set(name, new discord_js_1.WebhookClient({ url: webhookUrl }));
    }
    /**
     * Envia um embed para um webhook
     */
    sendEmbed(webhookName, embed, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const webhook = this.webhooks.get(webhookName);
            if (!webhook) {
                console.warn(`[Webhook] ${webhookName} não está configurado`);
                return null;
            }
            try {
                return yield webhook.send({
                    content: content || undefined,
                    embeds: [embed],
                });
            }
            catch (error) {
                console.error(`[Webhook] Erro ao enviar para ${webhookName}:`, error);
                return null;
            }
        });
    }
    /**
     * Envia múltiplos embeds para um webhook
     */
    sendEmbeds(webhookName, embeds, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const webhook = this.webhooks.get(webhookName);
            if (!webhook) {
                console.warn(`[Webhook] ${webhookName} não está configurado`);
                return null;
            }
            try {
                return yield webhook.send({
                    content: content || undefined,
                    embeds: embeds,
                });
            }
            catch (error) {
                console.error(`[Webhook] Erro ao enviar múltiplos embeds para ${webhookName}:`, error);
                return null;
            }
        });
    }
    /**
     * Log de transaction econômica
     */
    logTransaction(username, type, amount, description, details) {
        return __awaiter(this, void 0, void 0, function* () {
            const emoji = {
                earn: "📈",
                spend: "📉",
                bet_win: "🎉",
                bet_loss: "💸",
                trade: "🔄",
            }[type];
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(type === "earn" || type === "bet_win" ? 0x2ecc71 : 0xe74c3c)
                .setTitle(`${emoji} Transação - ${type.toUpperCase()}`)
                .addFields({ name: "👤 Jogador", value: username, inline: true }, { name: "💰 Quantia", value: `${amount.toLocaleString("pt-BR")} moedas`, inline: true }, { name: "📝 Descrição", value: description, inline: false })
                .setTimestamp();
            if (details) {
                for (const [key, value] of Object.entries(details)) {
                    embed.addFields({ name: key, value: String(value), inline: true });
                }
            }
            return yield this.sendEmbed("economy", embed);
        });
    }
    /**
     * Log de aposta
     */
    logBet(username, betAmount, result, winnings, odds) {
        return __awaiter(this, void 0, void 0, function* () {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(result === "win" ? 0x2ecc71 : 0xe74c3c)
                .setTitle(`🎰 Aposta - ${result.toUpperCase()}`)
                .addFields({ name: "👤 Jogador", value: username, inline: true }, { name: "💵 Aposta", value: `${betAmount.toLocaleString("pt-BR")}`, inline: true }, { name: "🎯 Odd", value: `${odds.toFixed(2)}x`, inline: true }, {
                name: "💸 Resultado",
                value: result === "win" ? `+${winnings.toLocaleString("pt-BR")}` : `-${betAmount}`,
                inline: true,
            })
                .setTimestamp();
            return yield this.sendEmbed("betting", embed);
        });
    }
    /**
     * Log de evento geral
     */
    logEvent(title, description, fields) {
        return __awaiter(this, void 0, void 0, function* () {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x3498db)
                .setTitle(`📢 ${title}`)
                .setDescription(description)
                .setTimestamp();
            if (fields) {
                for (const [key, value] of Object.entries(fields)) {
                    embed.addFields({ name: key, value, inline: true });
                }
            }
            return yield this.sendEmbed("general", embed);
        });
    }
    /**
     * Verifica se um webhook está configurado
     */
    hasWebhook(name) {
        return this.webhooks.has(name);
    }
}
exports.WebhookManager = WebhookManager;
// Instância global do webhook manager
exports.webhookManager = new WebhookManager();
