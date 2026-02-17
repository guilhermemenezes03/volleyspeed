import { WebhookClient, EmbedBuilder, Message } from "discord.js";
import Settings from "../settings.json";

interface WebhookConfig {
  economyLogWebhook?: string;
  bettingLogWebhook?: string;
  economyTradeWebhook?: string;
  generalLogWebhook?: string;
}

export class WebhookManager {
  private webhooks: Map<string, WebhookClient> = new Map();

  constructor(config: WebhookConfig = {}) {
    // Webhooks podem ser configurados via variáveis de ambiente ou config
    if (config.economyLogWebhook) {
      this.webhooks.set("economy", new WebhookClient({ url: config.economyLogWebhook }));
    }
    if (config.bettingLogWebhook) {
      this.webhooks.set("betting", new WebhookClient({ url: config.bettingLogWebhook }));
    }
    if (config.economyTradeWebhook) {
      this.webhooks.set("trade", new WebhookClient({ url: config.economyTradeWebhook }));
    }
    if (config.generalLogWebhook) {
      this.webhooks.set("general", new WebhookClient({ url: config.generalLogWebhook }));
    }
  }

  /**
   * Registra um webhook
   */
  registerWebhook(name: string, webhookUrl: string) {
    this.webhooks.set(name, new WebhookClient({ url: webhookUrl }));
  }

  /**
   * Envia um embed para um webhook
   */
  async sendEmbed(webhookName: string, embed: EmbedBuilder, content?: string) {
    const webhook = this.webhooks.get(webhookName);
    if (!webhook) {
      console.warn(`[Webhook] ${webhookName} não está configurado`);
      return null;
    }

    try {
      return await webhook.send({
        content: content || undefined,
        embeds: [embed],
      });
    } catch (error) {
      console.error(`[Webhook] Erro ao enviar para ${webhookName}:`, error);
      return null;
    }
  }

  /**
   * Envia múltiplos embeds para um webhook
   */
  async sendEmbeds(webhookName: string, embeds: EmbedBuilder[], content?: string) {
    const webhook = this.webhooks.get(webhookName);
    if (!webhook) {
      console.warn(`[Webhook] ${webhookName} não está configurado`);
      return null;
    }

    try {
      return await webhook.send({
        content: content || undefined,
        embeds: embeds,
      });
    } catch (error) {
      console.error(`[Webhook] Erro ao enviar múltiplos embeds para ${webhookName}:`, error);
      return null;
    }
  }

  /**
   * Log de transaction econômica
   */
  async logTransaction(
    username: string,
    type: "earn" | "spend" | "bet_win" | "bet_loss" | "trade",
    amount: number,
    description: string,
    details?: Record<string, string | number>
  ) {
    const emoji = {
      earn: "📈",
      spend: "📉",
      bet_win: "🎉",
      bet_loss: "💸",
      trade: "🔄",
    }[type];

    const embed = new EmbedBuilder()
      .setColor(type === "earn" || type === "bet_win" ? 0x2ecc71 : 0xe74c3c)
      .setTitle(`${emoji} Transação - ${type.toUpperCase()}`)
      .addFields(
        { name: "👤 Jogador", value: username, inline: true },
        { name: "💰 Quantia", value: `${amount.toLocaleString("pt-BR")} moedas`, inline: true },
        { name: "📝 Descrição", value: description, inline: false }
      )
      .setTimestamp();

    if (details) {
      for (const [key, value] of Object.entries(details)) {
        embed.addFields({ name: key, value: String(value), inline: true });
      }
    }

    return await this.sendEmbed("economy", embed);
  }

  /**
   * Log de aposta
   */
  async logBet(
    username: string,
    betAmount: number,
    result: "win" | "loss",
    winnings: number,
    odds: number
  ) {
    const embed = new EmbedBuilder()
      .setColor(result === "win" ? 0x2ecc71 : 0xe74c3c)
      .setTitle(`🎰 Aposta - ${result.toUpperCase()}`)
      .addFields(
        { name: "👤 Jogador", value: username, inline: true },
        { name: "💵 Aposta", value: `${betAmount.toLocaleString("pt-BR")}`, inline: true },
        { name: "🎯 Odd", value: `${odds.toFixed(2)}x`, inline: true },
        {
          name: "💸 Resultado",
          value: result === "win" ? `+${winnings.toLocaleString("pt-BR")}` : `-${betAmount}`,
          inline: true,
        }
      )
      .setTimestamp();

    return await this.sendEmbed("betting", embed);
  }

  /**
   * Log de evento geral
   */
  async logEvent(title: string, description: string, fields?: Record<string, string>) {
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`📢 ${title}`)
      .setDescription(description)
      .setTimestamp();

    if (fields) {
      for (const [key, value] of Object.entries(fields)) {
        embed.addFields({ name: key, value, inline: true });
      }
    }

    return await this.sendEmbed("general", embed);
  }

  /**
   * Verifica se um webhook está configurado
   */
  hasWebhook(name: string): boolean {
    return this.webhooks.has(name);
  }
}

// Instância global do webhook manager
export const webhookManager = new WebhookManager();
