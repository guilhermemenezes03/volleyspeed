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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordConnector = void 0;
const discord_js_1 = require("discord.js");
const database_1 = require("../database/database");
const utils_1 = require("./utils");
const embedTheme_1 = require("./embedTheme");
const settings_json_1 = __importDefault(require("../settings.json"));
const prisma_1 = require("../database/prisma");
class DiscordConnector {
    constructor(token) {
        console.log("log", `Conectando com Discord...`);
        this.client = new discord_js_1.Client({
            intents: ["MessageContent", "GuildMessages", "GuildMembers", "Guilds"]
        });
        this.startListening();
        this.connect(token);
    }
    connect(token) {
        this.client.login(token);
    }
    handleNewAccount(nickname, discordId, member) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!member)
                return;
            const exists = yield this.giveRolesIfAccountExists(member);
            if (exists)
                return;
            yield database_1.Database.createNewAccount(nickname, discordId);
            yield utils_1.DiscordUtil.giveRoleTo(member, settings_json_1.default.discordRegistredRoleId);
            yield utils_1.DiscordUtil.setMemberNickname(member, nickname);
            this.client.emit("customOnAccountCreated", nickname);
        });
    }
    giveRolesIfAccountExists(member) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountExists = yield database_1.Database.findUserByDiscordId(member.user.id);
            if (!accountExists)
                return false;
            yield utils_1.DiscordUtil.giveRoleTo(member, settings_json_1.default.discordRegistredRoleId);
            yield utils_1.DiscordUtil.setMemberNickname(member, accountExists.nickname);
            return true;
        });
    }
    onDiscordReady(info) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            console.log("important", `Discord conectado com @${(_a = info.user) === null || _a === void 0 ? void 0 : _a.username}`);
            utils_1.DiscordUtil.client = this.client;
        });
    }
    onRequestAccountModalCreation(info) {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = info.channel;
            if (!channel.isSendable()) {
                console.log("error", "Can't send messages to this channel.");
                return;
            }
            yield channel.send({
                embeds: [utils_1.DiscordUtil.embeds.ChangeNickname()],
                components: [utils_1.DiscordUtil.components.ChangeNicknameButton()]
            });
            yield info.delete();
        });
    }
    onRequestNicknameChange(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            yield interaction.showModal(utils_1.DiscordUtil.modals.ChangeNick());
        });
    }
    onChangeNickModalSubmit(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const nickname = interaction.fields.getTextInputValue("usernameInput");
            const userExists = yield database_1.Database.findUserByNickname(nickname);
            const canChangeNickname = yield database_1.Database.canDiscordIdChangeNickname(interaction.user.id);
            if (userExists) {
                yield utils_1.DiscordUtil.replyToInteraction(interaction, {
                    content: "Esse nickname já está em uso. Tente novamente.",
                    ephemeral: true
                });
            }
            else if (!canChangeNickname) {
                yield utils_1.DiscordUtil.replyToInteraction(interaction, {
                    content: "Você já alterou seu nickname uma vez.",
                    ephemeral: true
                });
            }
            else {
                yield database_1.Database.updateNicknameByDiscordId(interaction.user.id, nickname);
                yield utils_1.DiscordUtil.setMemberNickname(interaction.member, nickname);
                yield utils_1.DiscordUtil.replyToInteraction(interaction, {
                    content: "Nickname alterado!",
                    ephemeral: true
                });
            }
        });
    }
    onRequestRegisterModalCreation(info) {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = info.channel;
            if (!channel.isSendable()) {
                console.log("error", "Can't send messages to this channel.");
                return;
            }
            yield channel.send({
                embeds: [utils_1.DiscordUtil.embeds.InviteToRegister()],
                components: [utils_1.DiscordUtil.components.RegisterButton()]
            });
            yield info.delete();
        });
    }
    onRequestRegisterModal(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield interaction.showModal(utils_1.DiscordUtil.modals.Register());
            }
            catch (_a) {
                console.log("[WARN] Couldn't show modal.");
            }
        });
    }
    onRegisterModalSubmit(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const nickname = interaction.fields.getTextInputValue("usernameInput");
            const userExists = yield database_1.Database.findUserByNickname(nickname);
            if (userExists) {
                yield utils_1.DiscordUtil.replyToInteraction(interaction, {
                    content: "Esse nickname já está em uso. Tente novamente.",
                    ephemeral: true
                });
            }
            else {
                yield this.handleNewAccount(nickname, interaction.user.id, interaction.member);
                yield utils_1.DiscordUtil.sendDMTo(interaction.user, {
                    embeds: [
                        utils_1.DiscordUtil.embeds.SuccessCreation(nickname)
                    ]
                });
                yield utils_1.DiscordUtil.replyToInteraction(interaction, {
                    content: "Registrado!",
                    ephemeral: true
                });
            }
        });
    }
    onConfirmAccountButton(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const info = interaction.customId.substring(13);
            const [auth, conn] = info.split("&CONN=");
            const user = yield database_1.Database.updateAuthByDiscordId(interaction.user.id, auth, conn);
            utils_1.DiscordUtil.replyToInteraction(interaction, "Confirmado!");
            if (!user)
                return;
            this.client.emit("customOnAuthUpdate", user);
        });
    }
    onMemberJoin(member) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.giveRolesIfAccountExists(member);
        });
    }
    onShopCategoryButton(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            yield interaction.deferUpdate();
            const category = interaction.customId.replace("shop_category_", "");
            const shopCategories = {
                avatar: { emoji: "🎭", label: "Avatares" },
                boost: { emoji: "⚡", label: "Boosts" },
                lootbox: { emoji: "📦", label: "Lootbox" },
                fila: { emoji: "🚀", label: "Fura Fila" },
            };
            const rarities = {
                common: { emoji: "⚪", label: "Comum", color: 0xAAAAAA },
                rare: { emoji: "🔵", label: "Raro", color: 0x3498db },
                epic: { emoji: "🟣", label: "Épico", color: 0x9b59b6 },
                legendary: { emoji: "🟡", label: "Lendário", color: 0xFFD700 },
            };
            const catInfo = shopCategories[category];
            if (!catInfo) {
                yield interaction.followUp({ content: "Categoria não encontrada.", ephemeral: true });
                return;
            }
            const items = yield prisma_1.prisma.shopItem.findMany({
                where: { category, isActive: true },
                orderBy: [{ rarity: "asc" }, { price: "asc" }],
                take: 15,
            });
            if (items.length === 0) {
                yield interaction.followUp({ content: "Nenhum item nesta categoria.", ephemeral: true });
                return;
            }
            const embed = embedTheme_1.EmbedTheme.economy(`${catInfo.emoji} ${catInfo.label}`, `Use !comprar <id> no jogo`);
            const lines = [];
            for (const item of items) {
                const ri = rarities[item.rarity] || rarities.common;
                const curr = "🪙";
                const stock = item.stock === -1 ? "∞" : `${item.stock}`;
                const code = item.code || item.name.replace(/\s+/g, "").toLowerCase();
                let avatarEmoji = "";
                if (item.category === "avatar") {
                    try {
                        const effect = JSON.parse(item.effect);
                        if (effect.emoji)
                            avatarEmoji = `${effect.emoji} `;
                    }
                    catch (_a) { }
                }
                const stockPart = item.stock === -1 ? "" : ` | ${stock}x`;
                lines.push(`${ri.emoji} id${code} | ${avatarEmoji}${item.name} — ${curr} ${item.price.toLocaleString("pt-BR")}${stockPart}`);
            }
            embed.setDescription(lines.join("\n"));
            embedTheme_1.EmbedTheme.setFooter(embed, `HaxVolley | ${catInfo.label}`);
            // Botões para navegar para outras categorias
            const otherButtons = [];
            for (const [key, cat] of Object.entries(shopCategories)) {
                if (key === category)
                    continue;
                const count = yield prisma_1.prisma.shopItem.count({ where: { category: key, isActive: true } });
                if (count > 0) {
                    otherButtons.push(new discord_js_1.ButtonBuilder()
                        .setCustomId(`shop_category_${key}`)
                        .setLabel(cat.label)
                        .setEmoji(cat.emoji)
                        .setStyle(discord_js_1.ButtonStyle.Secondary));
                }
            }
            const rows = [];
            for (let i = 0; i < otherButtons.length; i += 5) {
                rows.push(new discord_js_1.ActionRowBuilder().addComponents(otherButtons.slice(i, i + 5)));
            }
            yield interaction.editReply({ embeds: [embed], components: rows });
        });
    }
    startListening() {
        this.client.once(discord_js_1.Events.ClientReady, (info) => { this.onDiscordReady(info); });
        this.client.on(discord_js_1.Events.MessageCreate, (info) => __awaiter(this, void 0, void 0, function* () {
            const member = info.member;
            if (!(member === null || member === void 0 ? void 0 : member.roles.highest.permissions.has("Administrator")))
                return;
            if (info.content != "##createregistermodal")
                return;
            this.onRequestRegisterModalCreation(info);
        }));
        this.client.on(discord_js_1.Events.MessageCreate, (info) => __awaiter(this, void 0, void 0, function* () {
            const member = info.member;
            if (!(member === null || member === void 0 ? void 0 : member.roles.highest.permissions.has("Administrator")))
                return;
            if (!info.content.startsWith("!ban"))
                return;
            const auth = info.content.split(" ")[1];
            const ip = info.content.split(" ")[2];
            if (!ip)
                return;
            if (!auth)
                return;
            yield prisma_1.prisma.ban.create({ data: { auth, ip } });
            info.reply(`auth ${auth} e ip ${ip} banido.`);
            this.client.emit("onPlayerBan", auth, ip);
        }));
        this.client.on(discord_js_1.Events.MessageCreate, (info) => __awaiter(this, void 0, void 0, function* () {
            if (info.content != "!roominfo")
                return;
            this.client.emit("requestRoomInfo", info.channel.id, info.author.id);
        }));
        this.client.on(discord_js_1.Events.MessageCreate, (info) => __awaiter(this, void 0, void 0, function* () {
            if (!info.content.startsWith("!adduni"))
                return;
            const member = info.member;
            if (!(member === null || member === void 0 ? void 0 : member.roles.highest.permissions.has("Administrator")))
                return;
            const messageSplitted = info.content.split(" ");
            const toUser = info.mentions.users.first();
            if (!toUser) {
                info.reply("Usuário não encontrado. Utilize !adduni @usuario /colors red ....");
                return;
            }
            // !uni @jogador barcelona /colors red 60 ff
            const unicode = messageSplitted.slice(5).join(" ");
            const uniname = messageSplitted[2];
            yield prisma_1.prisma.uniforme.create({
                data: {
                    code: unicode,
                    name: uniname,
                    userId: toUser.id
                }
            });
            info.reply("Uniforme adicionado com sucesso.");
        }));
        this.client.on(discord_js_1.Events.MessageCreate, (info) => __awaiter(this, void 0, void 0, function* () {
            const member = info.member;
            if (!(member === null || member === void 0 ? void 0 : member.roles.highest.permissions.has("Administrator")))
                return;
            if (!info.content.startsWith("!unban"))
                return;
            const ipOrAuth = info.content.split(" ")[1];
            if (!ipOrAuth)
                return;
            yield prisma_1.prisma.ban.deleteMany({
                where: {
                    OR: [
                        {
                            auth: ipOrAuth
                        },
                        {
                            ip: ipOrAuth
                        }
                    ]
                }
            });
        }));
        this.client.on(discord_js_1.Events.MessageCreate, (info) => __awaiter(this, void 0, void 0, function* () {
            const member = info.member;
            if (!(member === null || member === void 0 ? void 0 : member.roles.highest.permissions.has("Administrator")))
                return;
            if (info.content != "##createaccountmodal")
                return;
            this.onRequestAccountModalCreation(info);
        }));
        this.client.on(discord_js_1.Events.InteractionCreate, (interaction) => __awaiter(this, void 0, void 0, function* () {
            if (!interaction.isButton())
                return;
            if (interaction.customId != "register")
                return;
            this.onRequestRegisterModal(interaction);
        }));
        this.client.on(discord_js_1.Events.InteractionCreate, (interaction) => __awaiter(this, void 0, void 0, function* () {
            if (!interaction.isButton())
                return;
            if (interaction.customId != "changeNickname")
                return;
            this.onRequestNicknameChange(interaction);
        }));
        this.client.on(discord_js_1.Events.InteractionCreate, (interaction) => __awaiter(this, void 0, void 0, function* () {
            if (!interaction.isModalSubmit())
                return;
            if (interaction.customId != "registerModal")
                return;
            this.onRegisterModalSubmit(interaction);
        }));
        this.client.on(discord_js_1.Events.InteractionCreate, (interaction) => __awaiter(this, void 0, void 0, function* () {
            if (!interaction.isModalSubmit())
                return;
            if (interaction.customId != "changeNickModal")
                return;
            this.onChangeNickModalSubmit(interaction);
        }));
        this.client.on(discord_js_1.Events.InteractionCreate, (interaction) => __awaiter(this, void 0, void 0, function* () {
            if (!interaction.isButton())
                return;
            if (!interaction.customId.startsWith("confirm-"))
                return;
            this.onConfirmAccountButton(interaction);
        }));
        // ====== SHOP CATEGORY BUTTONS ======
        this.client.on(discord_js_1.Events.InteractionCreate, (interaction) => __awaiter(this, void 0, void 0, function* () {
            if (!interaction.isButton())
                return;
            if (!interaction.customId.startsWith("shop_category_"))
                return;
            yield this.onShopCategoryButton(interaction);
        }));
        this.client.on(discord_js_1.Events.GuildMemberAdd, (member) => __awaiter(this, void 0, void 0, function* () { this.onMemberJoin(member); }));
        // ====== COMANDOS DE ECONOMIA NO DISCORD ======
        this.client.on(discord_js_1.Events.MessageCreate, (info) => __awaiter(this, void 0, void 0, function* () {
            if (info.author.bot)
                return;
            const content = info.content.toLowerCase().trim();
            const getRankingName = (elo) => {
                if (elo < 1000)
                    return "🟤 Bronze";
                if (elo < 1100)
                    return "⚪ Prata I";
                if (elo < 1200)
                    return "⚪ Prata II";
                if (elo < 1300)
                    return "⚪ Prata III";
                if (elo < 1400)
                    return "🟡 Ouro I";
                if (elo < 1500)
                    return "🟡 Ouro II";
                if (elo < 1600)
                    return "🟡 Ouro III";
                if (elo < 1700)
                    return "🔵 Platina I";
                if (elo < 1800)
                    return "🔵 Platina II";
                if (elo < 1900)
                    return "🔵 Platina III";
                if (elo < 2000)
                    return "💎 Diamante I";
                if (elo < 2100)
                    return "💎 Diamante II";
                if (elo < 2200)
                    return "💎 Diamante III";
                if (elo < 2300)
                    return "💎 Diamante IV";
                return "👑 Mestre";
            };
            const getWealthTitle = (coins) => {
                const titles = [
                    { min: 0, title: "🪙 Falido", color: 0x808080 },
                    { min: 500, title: "🥉 Classe Baixa", color: 0xCD7F32 },
                    { min: 2000, title: "🥈 Classe Média", color: 0xC0C0C0 },
                    { min: 5000, title: "🥇 Classe Alta", color: 0xFFD700 },
                    { min: 15000, title: "💰 Rico", color: 0x00FF00 },
                    { min: 50000, title: "💎 Milionário", color: 0x00BFFF },
                    { min: 150000, title: "👑 Magnata", color: 0xFF4500 },
                    { min: 500000, title: "🏛️ Oligarca", color: 0xFF0000 },
                    { min: 1000000, title: "🌍 Dono do Servidor", color: 0xFFD700 },
                ];
                let wealth = titles[0];
                for (const t of titles) {
                    if (coins >= t.min)
                        wealth = t;
                }
                return wealth;
            };
            // !economia / !saldo / !wallet
            if (content === "!economia" || content === "!saldo" || content === "!wallet" || content === "!coins") {
                const user = yield database_1.Database.findUserByDiscordId(info.author.id);
                if (!user) {
                    info.reply("❌ Você não possui uma conta registrada.");
                    return;
                }
                const eco = yield prisma_1.prisma.economy.findUnique({ where: { discordId: info.author.id } });
                if (!eco) {
                    info.reply("❌ Você ainda não possui dados econômicos. Jogue uma partida primeiro!");
                    return;
                }
                const status = yield prisma_1.prisma.status.findFirst({ where: { discordId: info.author.id } });
                const wealth = getWealthTitle(eco.coins);
                const multiplierActive = eco.multiplierExp && eco.multiplierExp > new Date();
                const vipActive = eco.vipExpires && eco.vipExpires > new Date();
                const betProfit = eco.totalBetWon - eco.totalBetLost;
                const betWR = eco.totalBets > 0 ? ((eco.betsWon / eco.totalBets) * 100).toFixed(1) : "0.0";
                const ZERO_WIDTH = "\u200B";
                const embed = embedTheme_1.EmbedTheme.userProfile(info.author, "Perfil Economico", `Resumo de ${user.nickname}`)
                    .setColor(wealth.color)
                    .addFields({ name: "Saldo", value: `🪙 ${eco.coins.toLocaleString("pt-BR")}`, inline: true }, { name: "Classe", value: wealth.title, inline: true }, { name: ZERO_WIDTH, value: ZERO_WIDTH, inline: true });
                embedTheme_1.EmbedTheme.addSection(embed, "Beneficios Ativos");
                if (multiplierActive || vipActive) {
                    embed.addFields({ name: "Multiplicador", value: multiplierActive ? `⚡ ${eco.multiplier}x` : "—", inline: true }, { name: "VIP", value: vipActive ? `👑 ${eco.vipExpires.toLocaleDateString("pt-BR")}` : "—", inline: true }, { name: ZERO_WIDTH, value: ZERO_WIDTH, inline: true });
                }
                else {
                    embed.addFields({ name: "Status", value: "Nenhum beneficio ativo", inline: false });
                }
                embedTheme_1.EmbedTheme.addSection(embed, "Apostas");
                embed.addFields({ name: "Total", value: `${eco.totalBets}`, inline: true }, { name: "Vitorias", value: `${eco.betsWon}`, inline: true }, { name: "Derrotas", value: `${eco.betsLost}`, inline: true }, { name: "Lucro", value: `${betProfit >= 0 ? "+" : ""}${betProfit.toLocaleString("pt-BR")}`, inline: true }, { name: "WR", value: `${betWR}%`, inline: true }, { name: ZERO_WIDTH, value: ZERO_WIDTH, inline: true });
                if (status) {
                    const elo = status.elo;
                    const wins = status.wins;
                    const loses = status.loses;
                    const total = wins + loses;
                    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";
                    embedTheme_1.EmbedTheme.addSection(embed, "Jogo");
                    embed.addFields({ name: "ELO", value: `${elo} (${getRankingName(elo)})`, inline: true }, { name: "Win Rate", value: `${winRate}%`, inline: true }, { name: "Partidas", value: `${wins}V / ${loses}D`, inline: true }, { name: "Cortes", value: `${status.cortes}`, inline: true }, { name: "Levants", value: `${status.levants}`, inline: true }, { name: "Bloqueios", value: `${status.blocks}`, inline: true });
                }
                embedTheme_1.EmbedTheme.setFooter(embed, "HaxVolley | Economia");
                info.reply({ embeds: [embed] });
            }
            // !topricos / !ranking / !leaderboard
            if (content === "!topricos" || content === "!ranking" || content === "!leaderboard") {
                const top = yield prisma_1.prisma.economy.findMany({
                    orderBy: { coins: "desc" },
                    take: 10,
                });
                if (top.length === 0) {
                    info.reply("Nenhum dado encontrado.");
                    return;
                }
                const lines = [];
                for (let i = 0; i < top.length; i++) {
                    const eco = top[i];
                    const user = yield prisma_1.prisma.user.findFirst({ where: { discordId: eco.discordId } });
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**#${i + 1}**`;
                    const wealth = getWealthTitle(eco.coins);
                    lines.push(`${medal} ${(user === null || user === void 0 ? void 0 : user.nickname) || "???"} — 🪙 ${eco.coins.toLocaleString("pt-BR")} (${wealth.title})`);
                }
                const embed = embedTheme_1.EmbedTheme.ranking("Top 10 Mais Ricos", lines.join("\n"));
                info.reply({ embeds: [embed] });
            }
            // !topelo - Ranking de ELO pelo Discord
            if (content === "!topelo" || content === "!eloranking") {
                const top = yield prisma_1.prisma.status.findMany({
                    orderBy: { elo: "desc" },
                    take: 10,
                });
                if (top.length === 0) {
                    info.reply("Nenhum dado encontrado.");
                    return;
                }
                const lines = [];
                for (let i = 0; i < top.length; i++) {
                    const st = top[i];
                    const user = yield prisma_1.prisma.user.findFirst({ where: { discordId: st.discordId } });
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**#${i + 1}**`;
                    lines.push(`${medal} ${(user === null || user === void 0 ? void 0 : user.nickname) || "???"} — ⭐ ${st.elo} (${getRankingName(st.elo)})`);
                }
                const embed = embedTheme_1.EmbedTheme.stats("Top 10 ELO", lines.join("\n"));
                info.reply({ embeds: [embed] });
            }
            // !topapostas - Ranking de apostadores pelo Discord
            if (content === "!topapostas" || content === "!topbets") {
                const top = yield prisma_1.prisma.economy.findMany({
                    orderBy: { totalBetWon: "desc" },
                    take: 10,
                });
                if (top.length === 0) {
                    info.reply("Nenhum dado encontrado.");
                    return;
                }
                const lines = [];
                for (let i = 0; i < top.length; i++) {
                    const eco = top[i];
                    const user = yield prisma_1.prisma.user.findFirst({ where: { discordId: eco.discordId } });
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**#${i + 1}**`;
                    const profit = eco.totalBetWon - eco.totalBetLost;
                    const wr = eco.totalBets > 0 ? ((eco.betsWon / eco.totalBets) * 100).toFixed(0) : "0";
                    const sign = profit >= 0 ? "+" : "";
                    lines.push(`${medal} ${(user === null || user === void 0 ? void 0 : user.nickname) || "???"} — ${sign}${profit.toLocaleString("pt-BR")} | ${eco.betsWon}V/${eco.betsLost}D (${wr}%)`);
                }
                const embed = embedTheme_1.EmbedTheme.betting("Top 10 Apostadores", lines.join("\n"));
                info.reply({ embeds: [embed] });
            }
            // !topstats <categoria> - Rankings de stats pelo Discord
            if (content.startsWith("!topstats") || content.startsWith("!topcortes") || content.startsWith("!toplevants") || content.startsWith("!topblocks") || content.startsWith("!topwins")) {
                let field = "cortes";
                let title = "⚽ Top 10 Cortes";
                if (content.startsWith("!topstats")) {
                    const arg = content.split(" ")[1];
                    if (arg === "levants" || arg === "levant") {
                        field = "levants";
                        title = "🏌️ Top 10 Levantamentos";
                    }
                    else if (arg === "blocks" || arg === "block" || arg === "bloqueios") {
                        field = "blocks";
                        title = "🛡️ Top 10 Bloqueios";
                    }
                    else if (arg === "wins" || arg === "vitorias") {
                        field = "wins";
                        title = "✅ Top 10 Vitórias";
                    }
                    else {
                        field = "cortes";
                        title = "⚽ Top 10 Cortes";
                    }
                }
                else if (content.startsWith("!toplevants")) {
                    field = "levants";
                    title = "🏌️ Top 10 Levantamentos";
                }
                else if (content.startsWith("!topblocks")) {
                    field = "blocks";
                    title = "🛡️ Top 10 Bloqueios";
                }
                else if (content.startsWith("!topwins")) {
                    field = "wins";
                    title = "✅ Top 10 Vitórias";
                }
                const top = yield prisma_1.prisma.status.findMany({
                    orderBy: { [field]: "desc" },
                    take: 10,
                });
                if (top.length === 0) {
                    info.reply("Nenhum dado encontrado.");
                    return;
                }
                const lines = [];
                for (let i = 0; i < top.length; i++) {
                    const st = top[i];
                    const user = yield prisma_1.prisma.user.findFirst({ where: { discordId: st.discordId } });
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**#${i + 1}**`;
                    const value = st[field] || 0;
                    lines.push(`${medal} ${(user === null || user === void 0 ? void 0 : user.nickname) || "???"} — ${value}`);
                }
                const embed = embedTheme_1.EmbedTheme.stats(title, lines.join("\n"));
                info.reply({ embeds: [embed] });
            }
            // !loja
            if (content === "!loja" || content === "!shop") {
                const shopCategories = {
                    avatar: { emoji: "🎭", label: "Avatares" },
                    boost: { emoji: "⚡", label: "Boosts" },
                    lootbox: { emoji: "📦", label: "Lootbox" },
                    fila: { emoji: "🚀", label: "Fura Fila" },
                };
                const rarities = {
                    common: { emoji: "⚪", label: "Comum", color: 0xAAAAAA },
                    rare: { emoji: "🔵", label: "Raro", color: 0x3498db },
                    epic: { emoji: "🟣", label: "Épico", color: 0x9b59b6 },
                    legendary: { emoji: "🟡", label: "Lendário", color: 0xFFD700 },
                };
                // Contar itens por categoria
                const categoryCounts = {};
                for (const key of Object.keys(shopCategories)) {
                    categoryCounts[key] = yield prisma_1.prisma.shopItem.count({ where: { category: key, isActive: true } });
                }
                const embed = embedTheme_1.EmbedTheme.economy("🏪 Loja HaxVolley", "Categorias:");
                const description = [];
                for (const [key, cat] of Object.entries(shopCategories)) {
                    if (categoryCounts[key] > 0) {
                        description.push(`${cat.emoji} ${cat.label} (${categoryCounts[key]})`);
                    }
                }
                embed.setDescription(description.join("\n") || "Loja vazia.");
                // Criar botões de categoria
                const buttons = [];
                for (const [key, cat] of Object.entries(shopCategories)) {
                    if (categoryCounts[key] > 0) {
                        buttons.push(new discord_js_1.ButtonBuilder()
                            .setCustomId(`shop_category_${key}`)
                            .setLabel(cat.label)
                            .setEmoji(cat.emoji)
                            .setStyle(discord_js_1.ButtonStyle.Secondary));
                    }
                }
                const rows = [];
                // Max 5 buttons per row
                for (let i = 0; i < buttons.length; i += 5) {
                    rows.push(new discord_js_1.ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
                }
                embedTheme_1.EmbedTheme.setFooter(embed, "HaxVolley | Loja");
                info.reply({ embeds: [embed], components: rows });
            }
            // !transacoes
            if (content === "!transacoes" || content === "!historico" || content === "!transactions") {
                const user = yield database_1.Database.findUserByDiscordId(info.author.id);
                if (!user) {
                    info.reply("❌ Conta não encontrada.");
                    return;
                }
                const eco = yield prisma_1.prisma.economy.findUnique({ where: { discordId: info.author.id } });
                if (!eco) {
                    info.reply("❌ Sem dados econômicos.");
                    return;
                }
                const txs = yield prisma_1.prisma.transaction.findMany({
                    where: { economyId: eco.id },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                });
                if (txs.length === 0) {
                    info.reply("📋 Nenhuma transação encontrada.");
                    return;
                }
                const lines = txs.map(tx => {
                    const emoji = tx.type === "earn" ? "📈" : tx.type === "spend" ? "📉" : tx.type === "bet" ? "🎰" : tx.type === "tigrinho" ? "🐯" : "💸";
                    const sign = tx.type === "earn" || tx.type === "transfer_in" ? "+" : "-";
                    return `${emoji} ${sign}${tx.amount.toLocaleString("pt-BR")} 🪙 — ${tx.description} (${tx.createdAt.toLocaleDateString("pt-BR")})`;
                });
                const embed = embedTheme_1.EmbedTheme.info(`📋 Últimas Transações de ${user.nickname}`, lines.join("\n"));
                info.reply({ embeds: [embed] });
            }
            // !additem (admin only) - Para admins criarem itens na loja
            if (content.startsWith("!additem")) {
                const member = info.member;
                if (!(member === null || member === void 0 ? void 0 : member.roles.highest.permissions.has("Administrator")))
                    return;
                // Formato: !additem id|nome|descricao|preco|moeda|categoria|efeito_json|estoque|maxPerUser|raridade
                const parts = info.content.substring(9).split("|").map(s => s.trim());
                if (parts.length < 7) {
                    info.reply("Formato: `!additem id|nome|descricao|preco|moeda|categoria|efeito_json|estoque|maxPerUser|raridade`\nEx: `!additem boost1|Boost 2x|Dobra ganhos 1h|500|coins|boost|{\"type\":\"multiplier\",\"value\":2,\"durationHours\":1}|-1|-1|rare`");
                    return;
                }
                yield prisma_1.prisma.shopItem.create({
                    data: {
                        code: parts[0] || null,
                        name: parts[1],
                        description: parts[2],
                        price: parseInt(parts[3]) || 100,
                        currency: parts[4] || "coins",
                        category: parts[5] || "consumable",
                        effect: parts[6] || "{}",
                        stock: parseInt(parts[7]) || -1,
                        maxPerUser: parseInt(parts[8]) || -1,
                        rarity: parts[9] || "common",
                    },
                });
                info.reply(`✅ Item "${parts[1]}" adicionado (id: ${parts[0]}).`);
            }
            // !removeitem (admin only)
            if (content.startsWith("!removeitem")) {
                const member = info.member;
                if (!(member === null || member === void 0 ? void 0 : member.roles.highest.permissions.has("Administrator")))
                    return;
                const itemName = info.content.substring(12).trim();
                const item = yield prisma_1.prisma.shopItem.findFirst({ where: { name: { equals: itemName, mode: "insensitive" } } });
                if (!item) {
                    info.reply("Item não encontrado.");
                    return;
                }
                yield prisma_1.prisma.shopItem.update({ where: { id: item.id }, data: { isActive: false } });
                info.reply(`✅ Item "${item.name}" removido da loja.`);
            }
            // !addcoins (admin only)
            if (content.startsWith("!addcoins")) {
                const member = info.member;
                if (!(member === null || member === void 0 ? void 0 : member.roles.highest.permissions.has("Administrator")))
                    return;
                const mentioned = info.mentions.users.first();
                if (!mentioned) {
                    info.reply("Mencione o usuário: `!addcoins @user 1000`");
                    return;
                }
                const amount = parseInt(info.content.split(" ").pop() || "0");
                if (!amount) {
                    info.reply("Valor inválido.");
                    return;
                }
                let eco = yield prisma_1.prisma.economy.findUnique({ where: { discordId: mentioned.id } });
                if (!eco) {
                    eco = yield prisma_1.prisma.economy.create({ data: { discordId: mentioned.id } });
                }
                yield prisma_1.prisma.economy.update({ where: { discordId: mentioned.id }, data: { coins: { increment: amount }, totalEarned: { increment: amount } } });
                yield prisma_1.prisma.transaction.create({ data: { economyId: eco.id, type: "earn", amount, description: `Admin grant por ${info.author.username}` } });
                info.reply(`✅ ${amount.toLocaleString("pt-BR")} moedas adicionadas para <@${mentioned.id}>.`);
            }
        }));
    }
    setupRoomManagerCommands(roomManager) {
        this.client.on(discord_js_1.Events.MessageCreate, (info) => __awaiter(this, void 0, void 0, function* () {
            if (!info.content.startsWith("!"))
                return;
            const [command, ...args] = info.content.slice(1).split(" ");
            if (command === "help") {
                const helpEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle("🎮 Comandos de Gerenciamento de Salas")
                    .addFields({ name: "!open <sala> <token>", value: "Abre uma sala no servidor" }, { name: "!close <sala>", value: "Fecha uma sala específica" }, { name: "!list", value: "Lista todas as salas e seus status" }, { name: "!closeall", value: "Fecha todas as salas" });
                info.reply({ embeds: [helpEmbed] });
            }
            if (command === "open" && args.length >= 2) {
                const roomId = args[0];
                const token = args[1];
                yield roomManager.openRoom(roomId, token, info.channel);
            }
            if (command === "close" && args.length >= 1) {
                const roomId = args[0];
                yield roomManager.closeRoom(roomId, info.channel);
            }
            if (command === "list") {
                yield roomManager.listRooms(info.channel);
            }
            if (command === "closeall") {
                yield roomManager.closeAll(info.channel);
            }
        }));
    }
}
exports.DiscordConnector = DiscordConnector;
