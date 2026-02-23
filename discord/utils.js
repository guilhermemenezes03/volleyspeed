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
exports.DiscordUtil = void 0;
const discord_js_1 = require("discord.js");
const settings_json_1 = __importDefault(require("../settings.json"));
class DiscordUtil {
    static giveRoleTo(member, roleId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield member.roles.add(roleId);
            }
            catch (_a) {
                console.log("log", `Couldn't give role ${roleId} to ${member.user.displayName}`);
            }
        });
    }
    static getGuild(guildId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const guild = (_a = DiscordUtil.client) === null || _a === void 0 ? void 0 : _a.guilds.cache.get(guildId);
            if (!guild)
                console.log("log", `Discord Guild not found.`);
            return guild || null;
        });
    }
    static getDefaultGuild() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getGuild(settings_json_1.default.discordGuildId);
        });
    }
    static getMember(guild, memberId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const member = yield guild.members.fetch(memberId);
                return member;
            }
            catch (_a) {
                return null;
            }
        });
    }
    static hasRole(userId, roleId) {
        return __awaiter(this, void 0, void 0, function* () {
            const guild = yield this.getDefaultGuild();
            if (!guild)
                return false;
            const member = yield this.getMember(guild, userId);
            if (!member)
                return false;
            return member.roles.cache.has(roleId);
        });
    }
    static isUserInServer(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getUserByDiscordId(userId);
            if (!user)
                return false;
            return true;
        });
    }
    static uploadFileToChannel(channelId, file, name, description, embed) {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = yield DiscordUtil.getChannelById(channelId);
            if (!(channel === null || channel === void 0 ? void 0 : channel.isSendable()))
                return;
            const att = new discord_js_1.AttachmentBuilder(file)
                .setName(name);
            yield channel.send({
                content: description,
                files: [att],
                embeds: embed ? [embed] : []
            });
        });
    }
    static setMemberNickname(member, nickname) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield member.setNickname(nickname);
            }
            catch (_a) {
                console.log("log", `Couldn't change ${member.user.displayName}'s nickname to ${nickname}.`);
            }
        });
    }
    static getUserByDiscordId(discordId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                return (yield ((_a = DiscordUtil.client) === null || _a === void 0 ? void 0 : _a.users.fetch(discordId))) || null;
            }
            catch (_b) {
                return null;
            }
        });
    }
    static sendDMTo(user, message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof user === "string")
                user = yield this.getUserByDiscordId(user);
            if (!user)
                return false;
            try {
                yield user.send(message);
                return true;
            }
            catch (_a) {
                console.log("log", `Couldn't send DM to ${user.username}`);
                return false;
            }
        });
    }
    static getChannelById(channelId) {
        return __awaiter(this, void 0, void 0, function* () {
            const guild = yield this.getDefaultGuild();
            return (guild === null || guild === void 0 ? void 0 : guild.channels.cache.get(channelId)) || null;
        });
    }
    static sendMessageInChannel(channel, message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof channel === "string")
                channel = yield DiscordUtil.getChannelById(channel);
            if (!channel) {
                console.log("log", `Channel not found.`);
                return;
            }
            if (channel.isSendable())
                channel.send(message);
        });
    }
    static sendEmbedInChannel(channel, embed, description) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof channel === "string")
                channel = yield DiscordUtil.getChannelById(channel);
            if (!channel) {
                console.log("log", `Channel not found.`);
                return;
            }
            if (!channel.isSendable())
                return;
            channel.send({
                content: description,
                embeds: [embed]
            });
        });
    }
    static replyToInteraction(interaction, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!interaction.isRepliable())
                return;
            try {
                yield interaction.reply(reply);
            }
            catch (_a) {
                return;
            }
        });
    }
}
exports.DiscordUtil = DiscordUtil;
DiscordUtil.embeds = {
    InviteToRegister: () => {
        return new discord_js_1.EmbedBuilder()
            .setColor(0xffffff)
            .setTitle('Escolha seu nickname')
            .setDescription(`Seu nickname será utilizado para proteger seu nickname na sala da HaxVolley.`);
    },
    ChangeNickname: () => {
        return new discord_js_1.EmbedBuilder()
            .setColor(0xffffff)
            .setTitle('Mude seu apelido')
            .setDescription(`Seu apelido pode ser alterado apenas UMA vez. Tenha cuidado ao usar essa função.`);
    },
    Confirmation: (nickname, auth, ip) => {
        return new discord_js_1.EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Verificação de conta')
            .setDescription(`Ei, ${nickname}! Parece que um IP desconhecido tentou acessar a sua conta. É você? Caso não seja, ignore esta mensagem.`)
            .addFields({ name: 'AUTH', value: `${auth}` }, { name: 'IP', value: `${ip}` })
            .setTimestamp()
            .setFooter({
            text: 'Haxvolley',
            iconURL: 'https://cdn.discordapp.com/icons/1160576492401590334/b735599632fc12346e098ad60d89979a.png'
        });
    },
    SuccessCreation: (nickname) => {
        return new discord_js_1.EmbedBuilder()
            .setColor(0x34d513)
            .setTitle(`Boa, ${nickname}!`)
            .setDescription(`Nickname registrado com sucesso.`);
    }
};
DiscordUtil.components = {
    ConfirmationButton: (auth, conn) => {
        const buttonComponent = new discord_js_1.ButtonBuilder()
            .setCustomId(`confirm-AUTH=${auth}&CONN=${conn}`)
            .setLabel('Confirmar')
            .setStyle(discord_js_1.ButtonStyle.Success);
        return new discord_js_1.ActionRowBuilder().addComponents(buttonComponent);
    },
    RegisterButton: () => {
        const buttonComponent = new discord_js_1.ButtonBuilder()
            .setCustomId('register')
            .setLabel('Registrar')
            .setStyle(discord_js_1.ButtonStyle.Success);
        return new discord_js_1.ActionRowBuilder().addComponents(buttonComponent);
    },
    ChangeNicknameButton: () => {
        const buttonComponent = new discord_js_1.ButtonBuilder()
            .setCustomId('changeNickname')
            .setLabel('Alterar')
            .setStyle(discord_js_1.ButtonStyle.Danger);
        return new discord_js_1.ActionRowBuilder().addComponents(buttonComponent);
    },
    RegisterModalInputsRow: () => {
        const usernameInput = new discord_js_1.TextInputBuilder()
            .setCustomId('usernameInput')
            .setLabel("Digite o seu nickname no Haxball:")
            .setMinLength(3)
            .setRequired(true)
            .setMaxLength(25)
            .setStyle(discord_js_1.TextInputStyle.Short);
        return new discord_js_1.ActionRowBuilder().addComponents(usernameInput);
    },
    ChangeNickModalInputsRow: () => {
        const usernameInput = new discord_js_1.TextInputBuilder()
            .setCustomId('usernameInput')
            .setLabel("Digite o seu novo nickname:")
            .setMinLength(3)
            .setRequired(true)
            .setMaxLength(25)
            .setStyle(discord_js_1.TextInputStyle.Short);
        return new discord_js_1.ActionRowBuilder().addComponents(usernameInput);
    }
};
DiscordUtil.modals = {
    Register: () => {
        return new discord_js_1.ModalBuilder()
            .setCustomId("registerModal")
            .setTitle("Registro na HaxVolley")
            .addComponents(DiscordUtil.components.RegisterModalInputsRow());
    },
    ChangeNick: () => {
        return new discord_js_1.ModalBuilder()
            .setCustomId("changeNickModal")
            .setTitle("Alterar seu nickname na CIRS")
            .addComponents(DiscordUtil.components.ChangeNickModalInputsRow());
    }
};
