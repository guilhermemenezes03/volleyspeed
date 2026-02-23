"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedTheme = void 0;
const discord_js_1 = require("discord.js");
const DEFAULT_FOOTER = "HaxVolley | Volley Bot";
const ZERO_WIDTH = "\u200B";
const buildEmbed = (color, title, emoji, description) => {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(color)
        .setTitle(emoji ? `${emoji} ${title}` : title)
        .setTimestamp()
        .setFooter({ text: DEFAULT_FOOTER });
    if (description && description.trim().length > 0) {
        embed.setDescription(description);
    }
    return embed;
};
const splitFieldValue = (value, maxLen) => {
    if (value.length <= maxLen)
        return [value];
    const lines = value.split("\n");
    const chunks = [];
    let current = "";
    for (const line of lines) {
        const next = current.length === 0 ? line : `${current}\n${line}`;
        if (next.length > maxLen) {
            if (current.length > 0)
                chunks.push(current);
            current = line;
            continue;
        }
        current = next;
    }
    if (current.length > 0)
        chunks.push(current);
    return chunks.length > 0 ? chunks : [value.slice(0, maxLen)];
};
exports.EmbedTheme = {
    // Cores do sistema
    colors: {
        success: 0x2ecc71,
        error: 0xe74c3c,
        info: 0x3498db,
        warning: 0xf39c12,
        economy: 0xffd700,
        stats: 0x9b59b6,
        betting: 0xff6600,
        neutral: 0x95a5a6,
    },
    // Criar embed de sucesso
    success: (title, description) => buildEmbed(exports.EmbedTheme.colors.success, title, "✅", description),
    // Criar embed de erro
    error: (title, description) => buildEmbed(exports.EmbedTheme.colors.error, title, "❌", description),
    // Criar embed de info
    info: (title, description) => buildEmbed(exports.EmbedTheme.colors.info, title, "ℹ️", description),
    // Criar embed de economia
    economy: (title, description) => buildEmbed(exports.EmbedTheme.colors.economy, title, "💰", description),
    // Criar embed de estatísticas
    stats: (title, description) => buildEmbed(exports.EmbedTheme.colors.stats, title, "📊", description),
    // Criar embed de apostas
    betting: (title, description) => buildEmbed(exports.EmbedTheme.colors.betting, title, "🎰", description),
    // Criar perfil de usuário
    userProfile: (user, title, description) => {
        const embed = buildEmbed(exports.EmbedTheme.colors.economy, title, "💳", description)
            .setThumbnail(user.displayAvatarURL())
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() });
        return embed;
    },
    // Criar ranking
    ranking: (title, description) => buildEmbed(exports.EmbedTheme.colors.stats, title, "🏆", description),
    // Adicionar seção com divisor
    addSection: (embed, title) => {
        embed.addFields({ name: title, value: ZERO_WIDTH, inline: false });
        return embed;
    },
    // Adicionar campo com quebra segura de tamanho
    addFieldChunks: (embed, title, value, maxLen = 950) => {
        const chunks = splitFieldValue(value, maxLen);
        chunks.forEach((chunk, index) => {
            embed.addFields({ name: index === 0 ? title : ZERO_WIDTH, value: chunk });
        });
        return embed;
    },
    // Formatter para números com separador
    formatNumber: (num) => num.toLocaleString("pt-BR"),
    // Footer padrão
    setFooter: (embed, text = DEFAULT_FOOTER, iconUrl) => {
        embed.setFooter({ text, iconURL: iconUrl });
        return embed;
    },
};
