import { ButtonInteraction, Client, Events, GuildMember, Message, ModalSubmitInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Database } from "../database/database";
import { DiscordUtil } from "./utils";
import { EmbedTheme } from "./embedTheme";
import Settings from "../settings.json";
import { prisma } from "../database/prisma";

export class DiscordConnector {
    client;

    constructor(token : string) {
        console.log("log", `Conectando com Discord...`);
        this.client = new Client({
            intents: ["MessageContent", "GuildMessages", "GuildMembers", "Guilds"]
        });
        this.startListening();
        this.connect(token);
    }

    private connect(token : string) {
        this.client.login(token);
    }

    private async handleNewAccount(nickname: string, discordId: string, member: GuildMember | null) {
        if(!member) return;
        const exists = await this.giveRolesIfAccountExists(member);
        if(exists) return;
        await Database.createNewAccount(nickname, discordId);
        await DiscordUtil.giveRoleTo(member, Settings.discordRegistredRoleId);
        await DiscordUtil.setMemberNickname(member, nickname);
        this.client.emit("customOnAccountCreated", nickname);
    }

    private async giveRolesIfAccountExists(member : GuildMember) {
        const accountExists = await Database.findUserByDiscordId(member.user.id);
        if(!accountExists) return false;
        await DiscordUtil.giveRoleTo(member, Settings.discordRegistredRoleId);
        await DiscordUtil.setMemberNickname(member, accountExists.nickname);
        return true;
    }

    private async onDiscordReady(info : Client) {
        console.log("important", `Discord conectado com @${info.user?.username}`);
        DiscordUtil.client = this.client;
    }

    private async onRequestAccountModalCreation(info : Message) {
        const channel = info.channel;
        if(!channel.isSendable()) {
            console.log("error", "Can't send messages to this channel.");
            return;
        }
        await channel.send({
            embeds: [DiscordUtil.embeds.ChangeNickname()],
            components: [DiscordUtil.components.ChangeNicknameButton()]
        });
        await info.delete();
    }

    private async onRequestNicknameChange(interaction : ButtonInteraction) {
        await interaction.showModal(DiscordUtil.modals.ChangeNick());
    }

    async onChangeNickModalSubmit(interaction : ModalSubmitInteraction) {
        const nickname = interaction.fields.getTextInputValue("usernameInput");
        const userExists = await Database.findUserByNickname(nickname);
        const canChangeNickname = await Database.canDiscordIdChangeNickname(interaction.user.id);
        if(userExists) {
            await DiscordUtil.replyToInteraction(interaction, {
                content: "Esse nickname já está em uso. Tente novamente.",
                ephemeral: true
            });
        }else if(!canChangeNickname) {
            await DiscordUtil.replyToInteraction(interaction, {
                content: "Você já alterou seu nickname uma vez.",
                ephemeral: true
            });
        }else{
            await Database.updateNicknameByDiscordId(interaction.user.id, nickname);
            await DiscordUtil.setMemberNickname(interaction.member as GuildMember, nickname);
            await DiscordUtil.replyToInteraction(interaction, {
                content: "Nickname alterado!",
                ephemeral: true
            });
        }
    }

    private async onRequestRegisterModalCreation(info : Message) {
        const channel = info.channel;
        if(!channel.isSendable()) {
            console.log("error", "Can't send messages to this channel.");
            return;
        }
        await channel.send({
            embeds: [DiscordUtil.embeds.InviteToRegister()],
            components: [DiscordUtil.components.RegisterButton()]
        });
        await info.delete();
    }

    async onRequestRegisterModal(interaction : ButtonInteraction) {
        try {
            await interaction.showModal(DiscordUtil.modals.Register());
        }catch{
            console.log("[WARN] Couldn't show modal.")
        }
    }

    async onRegisterModalSubmit(interaction : ModalSubmitInteraction) {
        const nickname = interaction.fields.getTextInputValue("usernameInput");
        const userExists = await Database.findUserByNickname(nickname);
        if(userExists) {
            await DiscordUtil.replyToInteraction(interaction, {
                content: "Esse nickname já está em uso. Tente novamente.",
                ephemeral: true
            });
        }else{
            await this.handleNewAccount(nickname, interaction.user.id, interaction.member as GuildMember);
            await DiscordUtil.sendDMTo(interaction.user, {
                embeds: [
                    DiscordUtil.embeds.SuccessCreation(nickname)
                ]
            });
            await DiscordUtil.replyToInteraction(interaction, {
                content: "Registrado!",
                ephemeral: true
            });
        }
    }

    private async onConfirmAccountButton(interaction : ButtonInteraction) {
        const info = interaction.customId.substring(13);
        const [auth, conn] = info.split("&CONN=");
        const user = await Database.updateAuthByDiscordId(interaction.user.id, auth, conn);
        DiscordUtil.replyToInteraction(interaction, "Confirmado!");
        if(!user) return;
        this.client.emit("customOnAuthUpdate", user);
    }


    private async onMemberJoin(member: GuildMember) {
        await this.giveRolesIfAccountExists(member);
    }

    private async onShopCategoryButton(interaction: ButtonInteraction) {
        await interaction.deferUpdate();
        const category = interaction.customId.replace("shop_category_", "");
        const shopCategories: Record<string, { emoji: string; label: string }> = {
            avatar: { emoji: "🎭", label: "Avatares" },
            boost: { emoji: "⚡", label: "Boosts" },
            lootbox: { emoji: "📦", label: "Lootbox" },
            fila: { emoji: "🚀", label: "Fura Fila" },
        };
        const rarities: Record<string, { emoji: string; label: string; color: number }> = {
            common: { emoji: "⚪", label: "Comum", color: 0xAAAAAA },
            rare: { emoji: "🔵", label: "Raro", color: 0x3498db },
            epic: { emoji: "🟣", label: "Épico", color: 0x9b59b6 },
            legendary: { emoji: "🟡", label: "Lendário", color: 0xFFD700 },
        };

        const catInfo = shopCategories[category];
        if (!catInfo) {
            await interaction.followUp({ content: "Categoria não encontrada.", ephemeral: true });
            return;
        }

        const items = await prisma.shopItem.findMany({
            where: { category, isActive: true },
            orderBy: [{ rarity: "asc" }, { price: "asc" }],
            take: 15,
        });

        if (items.length === 0) {
            await interaction.followUp({ content: "Nenhum item nesta categoria.", ephemeral: true });
            return;
        }

        const embed = EmbedTheme.economy(`${catInfo.emoji} ${catInfo.label}`, `Use !comprar <id> no jogo`);
        const lines: string[] = [];
        for (const item of items) {
            const ri = rarities[item.rarity] || rarities.common;
            const curr = "🪙";
            const stock = item.stock === -1 ? "∞" : `${item.stock}`;
            const code = item.code || item.name.replace(/\s+/g, "").toLowerCase();
            let avatarEmoji = "";
            if (item.category === "avatar") {
                try {
                    const effect = JSON.parse(item.effect);
                    if (effect.emoji) avatarEmoji = `${effect.emoji} `;
                } catch {}
            }
            const stockPart = item.stock === -1 ? "" : ` | ${stock}x`;
            lines.push(`${ri.emoji} id${code} | ${avatarEmoji}${item.name} — ${curr} ${item.price.toLocaleString("pt-BR")}${stockPart}`);
        }
        embed.setDescription(lines.join("\n"));
        EmbedTheme.setFooter(embed, `HaxVolley | ${catInfo.label}`);

        // Botões para navegar para outras categorias
        const otherButtons: ButtonBuilder[] = [];
        for (const [key, cat] of Object.entries(shopCategories)) {
            if (key === category) continue;
            const count = await prisma.shopItem.count({ where: { category: key, isActive: true } });
            if (count > 0) {
                otherButtons.push(
                    new ButtonBuilder()
                        .setCustomId(`shop_category_${key}`)
                        .setLabel(cat.label)
                        .setEmoji(cat.emoji)
                        .setStyle(ButtonStyle.Secondary)
                );
            }
        }

        const rows: ActionRowBuilder<ButtonBuilder>[] = [];
        for (let i = 0; i < otherButtons.length; i += 5) {
            rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(otherButtons.slice(i, i + 5)));
        }

        await interaction.editReply({ embeds: [embed], components: rows });
    }

    private startListening() {
        this.client.once(Events.ClientReady, (info) => { this.onDiscordReady(info); })
        this.client.on(Events.MessageCreate, async (info) => {
            const member = info.member;
            if(!member?.roles.highest.permissions.has("Administrator")) return;
            if(info.content != "##createregistermodal") return;
            this.onRequestRegisterModalCreation(info);
        })
        this.client.on(Events.MessageCreate, async (info) => {
            const member = info.member;
            if(!member?.roles.highest.permissions.has("Administrator")) return;
            if(!info.content.startsWith("!ban")) return;
            const auth = info.content.split(" ")[1]; 
            const ip = info.content.split(" ")[2];
            if(!ip) return;
            if(!auth) return;
            await prisma.ban.create({ data: { auth, ip } });
            info.reply(`auth ${auth} e ip ${ip} banido.`);
            this.client.emit("onPlayerBan", auth, ip);

        })
        this.client.on(Events.MessageCreate, async (info) => {
            if(info.content != "!roominfo") return;
            this.client.emit("requestRoomInfo", info.channel.id, info.author.id);
        })
        this.client.on(Events.MessageCreate, async (info) => {
            if(!info.content.startsWith("!adduni")) return;
            const member = info.member;
            if(!member?.roles.highest.permissions.has("Administrator")) return;
            const messageSplitted = info.content.split(" ");
            const toUser = info.mentions.users.first();
            if(!toUser) {
                info.reply("Usuário não encontrado. Utilize !adduni @usuario /colors red ....");
                return;
            } 
            // !uni @jogador barcelona /colors red 60 ff
            const unicode = messageSplitted.slice(5).join(" ");
            const uniname = messageSplitted[2];
            await prisma.uniforme.create({
                data: {
                    code: unicode,
                    name: uniname,
                    userId: toUser.id
                }
            });
            info.reply("Uniforme adicionado com sucesso.");
        })
        this.client.on(Events.MessageCreate, async (info) => {
            const member = info.member;
            if(!member?.roles.highest.permissions.has("Administrator")) return;
            if(!info.content.startsWith("!unban")) return;
            const ipOrAuth = info.content.split(" ")[1]; 
            if(!ipOrAuth) return;
            await prisma.ban.deleteMany({
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

        })
        this.client.on(Events.MessageCreate, async (info) => {
            const member = info.member;
            if(!member?.roles.highest.permissions.has("Administrator")) return;
            if(info.content != "##createaccountmodal") return;
            this.onRequestAccountModalCreation(info);
        })
        this.client.on(Events.InteractionCreate, async (interaction) => {
            if(!interaction.isButton()) return;
            if(interaction.customId != "register") return;
            this.onRequestRegisterModal(interaction);
        })
        this.client.on(Events.InteractionCreate, async (interaction) => {
            if(!interaction.isButton()) return;
            if(interaction.customId != "changeNickname") return;
            this.onRequestNicknameChange(interaction);
        })
        this.client.on(Events.InteractionCreate, async (interaction) => {
            if(!interaction.isModalSubmit()) return;
            if(interaction.customId != "registerModal") return;
            this.onRegisterModalSubmit(interaction);
        })
        this.client.on(Events.InteractionCreate, async (interaction) => {
            if(!interaction.isModalSubmit()) return;
            if(interaction.customId != "changeNickModal") return;
            this.onChangeNickModalSubmit(interaction);
        })
        this.client.on(Events.InteractionCreate, async (interaction) => {
            if(!interaction.isButton()) return;
            if(!interaction.customId.startsWith("confirm-")) return;
            this.onConfirmAccountButton(interaction);
        })
        // ====== SHOP CATEGORY BUTTONS ======
        this.client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isButton()) return;
            if (!interaction.customId.startsWith("shop_category_")) return;
            await this.onShopCategoryButton(interaction);
        })
        this.client.on(Events.GuildMemberAdd, async (member) => { this.onMemberJoin(member); })

        // ====== COMANDOS DE ECONOMIA NO DISCORD ======
        this.client.on(Events.MessageCreate, async (info) => {
            if (info.author.bot) return;
            const content = info.content.toLowerCase().trim();

            const getRankingName = (elo: number): string => {
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
            };

            const getWealthTitle = (coins: number) => {
                const titles = [
                    { min: 0, title: "🪙 Falido", color: 0x808080 as number },
                    { min: 500, title: "🥉 Classe Baixa", color: 0xCD7F32 as number },
                    { min: 2000, title: "🥈 Classe Média", color: 0xC0C0C0 as number },
                    { min: 5000, title: "🥇 Classe Alta", color: 0xFFD700 as number },
                    { min: 15000, title: "💰 Rico", color: 0x00FF00 as number },
                    { min: 50000, title: "💎 Milionário", color: 0x00BFFF as number },
                    { min: 150000, title: "👑 Magnata", color: 0xFF4500 as number },
                    { min: 500000, title: "🏛️ Oligarca", color: 0xFF0000 as number },
                    { min: 1000000, title: "🌍 Dono do Servidor", color: 0xFFD700 as number },
                ];
                let wealth = titles[0];
                for (const t of titles) {
                    if (coins >= t.min) wealth = t;
                }
                return wealth;
            };

            // !economia / !saldo / !wallet
            if (content === "!economia" || content === "!saldo" || content === "!wallet" || content === "!coins") {
                const user = await Database.findUserByDiscordId(info.author.id);
                if (!user) {
                    info.reply("❌ Você não possui uma conta registrada.");
                    return;
                }
                const eco = await prisma.economy.findUnique({ where: { discordId: info.author.id } });
                if (!eco) {
                    info.reply("❌ Você ainda não possui dados econômicos. Jogue uma partida primeiro!");
                    return;
                }
                const status = await prisma.status.findFirst({ where: { discordId: info.author.id } });
                const wealth = getWealthTitle(eco.coins);
                const multiplierActive = eco.multiplierExp && eco.multiplierExp > new Date();
                const vipActive = eco.vipExpires && eco.vipExpires > new Date();
                const betProfit = eco.totalBetWon - eco.totalBetLost;
                const betWR = eco.totalBets > 0 ? ((eco.betsWon / eco.totalBets) * 100).toFixed(1) : "0.0";

                const ZERO_WIDTH = "\u200B";
                const embed = EmbedTheme.userProfile(
                    info.author,
                    "Perfil Economico",
                    `Resumo de ${user.nickname}`
                )
                    .setColor(wealth.color)
                    .addFields(
                        { name: "Saldo", value: `🪙 ${eco.coins.toLocaleString("pt-BR")}`, inline: true },
                        { name: "Classe", value: wealth.title, inline: true },
                        { name: ZERO_WIDTH, value: ZERO_WIDTH, inline: true },
                    );

                EmbedTheme.addSection(embed, "Beneficios Ativos");
                if (multiplierActive || vipActive) {
                    embed.addFields(
                        { name: "Multiplicador", value: multiplierActive ? `⚡ ${eco.multiplier}x` : "—", inline: true },
                        { name: "VIP", value: vipActive ? `👑 ${eco.vipExpires!.toLocaleDateString("pt-BR")}` : "—", inline: true },
                        { name: ZERO_WIDTH, value: ZERO_WIDTH, inline: true },
                    );
                } else {
                    embed.addFields({ name: "Status", value: "Nenhum beneficio ativo", inline: false });
                }

                EmbedTheme.addSection(embed, "Apostas");
                embed.addFields(
                    { name: "Total", value: `${eco.totalBets}`, inline: true },
                    { name: "Vitorias", value: `${eco.betsWon}`, inline: true },
                    { name: "Derrotas", value: `${eco.betsLost}`, inline: true },
                    { name: "Lucro", value: `${betProfit >= 0 ? "+" : ""}${betProfit.toLocaleString("pt-BR")}`, inline: true },
                    { name: "WR", value: `${betWR}%`, inline: true },
                    { name: ZERO_WIDTH, value: ZERO_WIDTH, inline: true },
                );

                if (status) {
                    const elo = status.elo;
                    const wins = status.wins;
                    const loses = status.loses;
                    const total = wins + loses;
                    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";
                    EmbedTheme.addSection(embed, "Jogo");
                    embed.addFields(
                        { name: "ELO", value: `${elo} (${getRankingName(elo)})`, inline: true },
                        { name: "Win Rate", value: `${winRate}%`, inline: true },
                        { name: "Partidas", value: `${wins}V / ${loses}D`, inline: true },
                        { name: "Cortes", value: `${status.cortes}`, inline: true },
                        { name: "Levants", value: `${status.levants}`, inline: true },
                        { name: "Bloqueios", value: `${status.blocks}`, inline: true },
                    );
                }

                EmbedTheme.setFooter(embed, "HaxVolley | Economia");
                info.reply({ embeds: [embed] });
            }

            // !topricos / !ranking / !leaderboard
            if (content === "!topricos" || content === "!ranking" || content === "!leaderboard") {
                const top = await prisma.economy.findMany({
                    orderBy: { coins: "desc" },
                    take: 10,
                });
                if (top.length === 0) {
                    info.reply("Nenhum dado encontrado.");
                    return;
                }
                const lines: string[] = [];
                for (let i = 0; i < top.length; i++) {
                    const eco = top[i];
                    const user = await prisma.user.findFirst({ where: { discordId: eco.discordId } });
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**#${i + 1}**`;
                    const wealth = getWealthTitle(eco.coins);
                    lines.push(`${medal} ${user?.nickname || "???"} — 🪙 ${eco.coins.toLocaleString("pt-BR")} (${wealth.title})`);
                }
                const embed = EmbedTheme.ranking("Top 10 Mais Ricos", lines.join("\n"));
                info.reply({ embeds: [embed] });
            }

            // !topelo - Ranking de ELO pelo Discord
            if (content === "!topelo" || content === "!eloranking") {
                const top = await prisma.status.findMany({
                    orderBy: { elo: "desc" },
                    take: 10,
                });
                if (top.length === 0) {
                    info.reply("Nenhum dado encontrado.");
                    return;
                }
                const lines: string[] = [];
                for (let i = 0; i < top.length; i++) {
                    const st = top[i];
                    const user = await prisma.user.findFirst({ where: { discordId: st.discordId } });
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**#${i + 1}**`;
                    lines.push(`${medal} ${user?.nickname || "???"} — ⭐ ${st.elo} (${getRankingName(st.elo)})`);
                }
                const embed = EmbedTheme.stats("Top 10 ELO", lines.join("\n"));
                info.reply({ embeds: [embed] });
            }

            // !topapostas - Ranking de apostadores pelo Discord
            if (content === "!topapostas" || content === "!topbets") {
                const top = await prisma.economy.findMany({
                    orderBy: { totalBetWon: "desc" },
                    take: 10,
                });
                if (top.length === 0) {
                    info.reply("Nenhum dado encontrado.");
                    return;
                }
                const lines: string[] = [];
                for (let i = 0; i < top.length; i++) {
                    const eco = top[i];
                    const user = await prisma.user.findFirst({ where: { discordId: eco.discordId } });
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**#${i + 1}**`;
                    const profit = eco.totalBetWon - eco.totalBetLost;
                    const wr = eco.totalBets > 0 ? ((eco.betsWon / eco.totalBets) * 100).toFixed(0) : "0";
                    const sign = profit >= 0 ? "+" : "";
                    lines.push(`${medal} ${user?.nickname || "???"} — ${sign}${profit.toLocaleString("pt-BR")} | ${eco.betsWon}V/${eco.betsLost}D (${wr}%)`);
                }
                const embed = EmbedTheme.betting("Top 10 Apostadores", lines.join("\n"));
                info.reply({ embeds: [embed] });
            }

            // !topstats <categoria> - Rankings de stats pelo Discord
            if (content.startsWith("!topstats") || content.startsWith("!topcortes") || content.startsWith("!toplevants") || content.startsWith("!topblocks") || content.startsWith("!topwins")) {
                let field = "cortes";
                let title = "⚽ Top 10 Cortes";
                if (content.startsWith("!topstats")) {
                    const arg = content.split(" ")[1];
                    if (arg === "levants" || arg === "levant") { field = "levants"; title = "🏌️ Top 10 Levantamentos"; }
                    else if (arg === "blocks" || arg === "block" || arg === "bloqueios") { field = "blocks"; title = "🛡️ Top 10 Bloqueios"; }
                    else if (arg === "wins" || arg === "vitorias") { field = "wins"; title = "✅ Top 10 Vitórias"; }
                    else { field = "cortes"; title = "⚽ Top 10 Cortes"; }
                } else if (content.startsWith("!toplevants")) { field = "levants"; title = "🏌️ Top 10 Levantamentos"; }
                else if (content.startsWith("!topblocks")) { field = "blocks"; title = "🛡️ Top 10 Bloqueios"; }
                else if (content.startsWith("!topwins")) { field = "wins"; title = "✅ Top 10 Vitórias"; }

                const top = await prisma.status.findMany({
                    orderBy: { [field]: "desc" },
                    take: 10,
                });
                if (top.length === 0) {
                    info.reply("Nenhum dado encontrado.");
                    return;
                }
                const lines: string[] = [];
                for (let i = 0; i < top.length; i++) {
                    const st = top[i];
                    const user = await prisma.user.findFirst({ where: { discordId: st.discordId } });
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**#${i + 1}**`;
                    const value = (st as any)[field] || 0;
                    lines.push(`${medal} ${user?.nickname || "???"} — ${value}`);
                }
                const embed = EmbedTheme.stats(title, lines.join("\n"));
                info.reply({ embeds: [embed] });
            }

            // !loja
            if (content === "!loja" || content === "!shop") {
                const shopCategories: Record<string, { emoji: string; label: string }> = {
                    avatar: { emoji: "🎭", label: "Avatares" },
                    boost: { emoji: "⚡", label: "Boosts" },
                    lootbox: { emoji: "📦", label: "Lootbox" },
                    fila: { emoji: "🚀", label: "Fura Fila" },
                };
                const rarities: Record<string, { emoji: string; label: string; color: number }> = {
                    common: { emoji: "⚪", label: "Comum", color: 0xAAAAAA },
                    rare: { emoji: "🔵", label: "Raro", color: 0x3498db },
                    epic: { emoji: "🟣", label: "Épico", color: 0x9b59b6 },
                    legendary: { emoji: "🟡", label: "Lendário", color: 0xFFD700 },
                };

                // Contar itens por categoria
                const categoryCounts: Record<string, number> = {};
                for (const key of Object.keys(shopCategories)) {
                    categoryCounts[key] = await prisma.shopItem.count({ where: { category: key, isActive: true } });
                }

                const embed = EmbedTheme.economy("🏪 Loja HaxVolley", "Categorias:");
                const description: string[] = [];
                for (const [key, cat] of Object.entries(shopCategories)) {
                    if (categoryCounts[key] > 0) {
                        description.push(`${cat.emoji} ${cat.label} (${categoryCounts[key]})`);
                    }
                }
                embed.setDescription(description.join("\n") || "Loja vazia.");

                // Criar botões de categoria
                const buttons: ButtonBuilder[] = [];
                for (const [key, cat] of Object.entries(shopCategories)) {
                    if (categoryCounts[key] > 0) {
                        buttons.push(
                            new ButtonBuilder()
                                .setCustomId(`shop_category_${key}`)
                                .setLabel(cat.label)
                                .setEmoji(cat.emoji)
                                .setStyle(ButtonStyle.Secondary)
                        );
                    }
                }

                const rows: ActionRowBuilder<ButtonBuilder>[] = [];
                // Max 5 buttons per row
                for (let i = 0; i < buttons.length; i += 5) {
                    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(i, i + 5)));
                }

                EmbedTheme.setFooter(embed, "HaxVolley | Loja");
                info.reply({ embeds: [embed], components: rows });
            }

            // !transacoes
            if (content === "!transacoes" || content === "!historico" || content === "!transactions") {
                const user = await Database.findUserByDiscordId(info.author.id);
                if (!user) { info.reply("❌ Conta não encontrada."); return; }
                const eco = await prisma.economy.findUnique({ where: { discordId: info.author.id } });
                if (!eco) { info.reply("❌ Sem dados econômicos."); return; }
                const txs = await prisma.transaction.findMany({
                    where: { economyId: eco.id },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                });
                if (txs.length === 0) { info.reply("📋 Nenhuma transação encontrada."); return; }
                const lines = txs.map(tx => {
                    const emoji = tx.type === "earn" ? "📈" : tx.type === "spend" ? "📉" : tx.type === "bet" ? "🎰" : tx.type === "tigrinho" ? "🐯" : "💸";
                    const sign = tx.type === "earn" || tx.type === "transfer_in" ? "+" : "-";
                    return `${emoji} ${sign}${tx.amount.toLocaleString("pt-BR")} 🪙 — ${tx.description} (${tx.createdAt.toLocaleDateString("pt-BR")})`;
                });
                const embed = EmbedTheme.info(`📋 Últimas Transações de ${user.nickname}`, lines.join("\n"));
                info.reply({ embeds: [embed] });
            }

            // !additem (admin only) - Para admins criarem itens na loja
            if (content.startsWith("!additem")) {
                const member = info.member;
                if (!member?.roles.highest.permissions.has("Administrator")) return;
                // Formato: !additem id|nome|descricao|preco|moeda|categoria|efeito_json|estoque|maxPerUser|raridade
                const parts = info.content.substring(9).split("|").map(s => s.trim());
                if (parts.length < 7) {
                    info.reply("Formato: `!additem id|nome|descricao|preco|moeda|categoria|efeito_json|estoque|maxPerUser|raridade`\nEx: `!additem boost1|Boost 2x|Dobra ganhos 1h|500|coins|boost|{\"type\":\"multiplier\",\"value\":2,\"durationHours\":1}|-1|-1|rare`");
                    return;
                }
                await prisma.shopItem.create({
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
                if (!member?.roles.highest.permissions.has("Administrator")) return;
                const itemName = info.content.substring(12).trim();
                const item = await prisma.shopItem.findFirst({ where: { name: { equals: itemName, mode: "insensitive" } } });
                if (!item) { info.reply("Item não encontrado."); return; }
                await prisma.shopItem.update({ where: { id: item.id }, data: { isActive: false } });
                info.reply(`✅ Item "${item.name}" removido da loja.`);
            }

            // !addcoins (admin only)
            if (content.startsWith("!addcoins")) {
                const member = info.member;
                if (!member?.roles.highest.permissions.has("Administrator")) return;
                const mentioned = info.mentions.users.first();
                if (!mentioned) { info.reply("Mencione o usuário: `!addcoins @user 1000`"); return; }
                const amount = parseInt(info.content.split(" ").pop() || "0");
                if (!amount) { info.reply("Valor inválido."); return; }
                let eco = await prisma.economy.findUnique({ where: { discordId: mentioned.id } });
                if (!eco) { eco = await prisma.economy.create({ data: { discordId: mentioned.id } }); }
                await prisma.economy.update({ where: { discordId: mentioned.id }, data: { coins: { increment: amount }, totalEarned: { increment: amount } } });
                await prisma.transaction.create({ data: { economyId: eco.id, type: "earn", amount, description: `Admin grant por ${info.author.username}` } });
                info.reply(`✅ ${amount.toLocaleString("pt-BR")} moedas adicionadas para <@${mentioned.id}>.`);
            }

        });
    }

    setupRoomManagerCommands(roomManager: any) {
        this.client.on(Events.MessageCreate, async (info) => {
            if(!info.content.startsWith("!")) return;

            const [command, ...args] = info.content.slice(1).split(" ");

            if(command === "help") {
                const helpEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle("🎮 Comandos de Gerenciamento de Salas")
                    .addFields(
                        { name: "!open <sala> <token>", value: "Abre uma sala no servidor" },
                        { name: "!close <sala>", value: "Fecha uma sala específica" },
                        { name: "!list", value: "Lista todas as salas e seus status" },
                        { name: "!closeall", value: "Fecha todas as salas" }
                    );
                info.reply({ embeds: [helpEmbed] });
            }

            if(command === "open" && args.length >= 2) {
                const roomId = args[0];
                const token = args[1];
                await roomManager.openRoom(roomId, token, info.channel);
            }

            if(command === "close" && args.length >= 1) {
                const roomId = args[0];
                await roomManager.closeRoom(roomId, info.channel);
            }

            if(command === "list") {
                await roomManager.listRooms(info.channel);
            }

            if(command === "closeall") {
                await roomManager.closeAll(info.channel);
            }
        });
    }
}