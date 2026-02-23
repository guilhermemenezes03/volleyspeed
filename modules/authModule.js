"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
exports.AuthModule = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
const database_1 = require("../database/database");
const roles_1 = require("./roles");
const utils_1 = require("../discord/utils");
const settings_json_1 = __importDefault(require("../settings.json"));
const prisma_1 = require("../database/prisma");
const discord_js_1 = require("discord.js");
const messageFormatter_1 = require("./messageFormatter");
let AuthModule = class AuthModule {
    constructor($, settings) {
        this.$ = $;
        this.settings = settings;
        this.discord = this.settings.discord;
        this.customListener();
    }
    customListener() {
        this.discord.client.on("customOnAuthUpdate", (user) => {
            const players = this.$.players.getAll(p => p.auth === user.auth);
            for (const p of players) {
                clearTimeout(p.settings.deadInterval);
                p.settings.playable = true;
                this.$.customEvents.emit("onPlayerAuth", p, user);
            }
        });
        this.discord.client.on("onPlayerBan", (auth, ip) => {
            const players = this.$.players.getAll(p => p.auth === auth || p.ip == ip);
            for (const p of players) {
                p.ban();
            }
        });
        this.discord.client.on("customOnAccountCreated", (nickname) => {
            const players = this.$.players.getAll(p => p.name === nickname);
            for (const p of players) {
                this.checkPlayerAuthentication(p);
            }
        });
        this.discord.client.on("requestRoomInfo", (channelId, authorId) => __awaiter(this, void 0, void 0, function* () {
            const players = this.$.players.values();
            const embed = new discord_js_1.EmbedBuilder({
                color: haxball_extended_room_1.Colors.LightGoldenRodYellow,
                fields: [
                    { name: "🔴 Time vermelho", value: players.filter(p => p.team == 1).map(p => p.name).join("\n") || "Nenhum jogador", inline: true },
                    { name: "⚪ Espectadores", value: players.filter(p => p.team == 0).map(p => p.name).join("\n") || "Nenhum jogador", inline: true },
                    { name: "🔵 Time azul", value: players.filter(p => p.team == 2).map(p => p.name).join("\n") || "Nenhum jogador", inline: true }
                ]
            });
            yield utils_1.DiscordUtil.sendEmbedInChannel(channelId, embed, `Requisitado por <@${authorId}>`);
        }));
    }
    checkPlayerAuthentication(player) {
        return __awaiter(this, void 0, void 0, function* () {
            const registredPlayer = yield database_1.Database.findUserByNickname(player.name);
            if (!registredPlayer) {
                player.settings.playable = true;
                yield this.assignRoles(player, null);
                this.$.customEvents.emit("onPlayerAuth", player, null);
            }
            else if (player.auth != registredPlayer.auth) {
                player.settings.deadInterval = setTimeout(() => {
                    player.kick("Conta não confirmada.");
                }, 30000);
                this.sendAuthVerification(player, registredPlayer);
            }
            else {
                player.settings.playable = true;
                yield this.assignRoles(player, registredPlayer);
                this.$.customEvents.emit("onPlayerAuth", player, registredPlayer);
            }
        });
    }
    assignRoles(player, account) {
        return __awaiter(this, void 0, void 0, function* () {
            player.settings.account = account;
            player.settings.playable = true;
            if (!account)
                return;
            const isInServer = yield utils_1.DiscordUtil.isUserInServer(account.discordId);
            if (!isInServer) {
                player.kick("Entre no Discord da HR: " + settings_json_1.default.discordLink);
                return;
            }
            player.addRole(roles_1.Roles.RegistredRole);
            const integratedRoles = settings_json_1.default.discordIntegrationRoles;
            for (const r of Object.keys(integratedRoles)) {
                const role = integratedRoles[r];
                const hasRole = yield utils_1.DiscordUtil.hasRole(account.discordId, role);
                if (hasRole) {
                    const roleObject = (0, roles_1.getRoleByName)(r);
                    if (roleObject !== null)
                        player.addRole(roleObject);
                    if (roleObject === null || roleObject === void 0 ? void 0 : roleObject.admin)
                        player.admin = true;
                }
            }
            console.log(`[AuthModule] Papéis de ${player.name}: ${JSON.stringify(player.roles)}`);
        });
    }
    censorIP(ip) {
        const parts = ip.split(".");
        return parts
            .map((part, index) => (index === 0 || index === parts.length - 1 ? part : part.replace(/\d/g, "\\*")))
            .join(".");
    }
    sendAuthVerification(player, register) {
        return __awaiter(this, void 0, void 0, function* () {
            const dm = yield utils_1.DiscordUtil.sendDMTo(register.discordId, {
                embeds: [utils_1.DiscordUtil.embeds.Confirmation(register.nickname, player.auth || "null", this.censorIP(player.ip))],
                components: [utils_1.DiscordUtil.components.ConfirmationButton(player.auth || "null", player.conn)]
            });
            if (dm) {
                player.reply(messageFormatter_1.MessageFormatter.success("Verificação enviada!", "Confirme por DM no Discord"));
            }
            else {
                player.reply(messageFormatter_1.MessageFormatter.error("Erro ao enviar DM!", "Habilite mensagens privadas do servidor"));
            }
        });
    }
    onPlayerAuth(player, account) {
        return __awaiter(this, void 0, void 0, function* () {
            if (account) {
                player.reply(messageFormatter_1.MessageFormatter.success(`Bem-vindo de volta, ${player.name}!`, ""));
            }
            else {
                player.reply(messageFormatter_1.MessageFormatter.info(`Bem-vindo, ${player.name}!`, `Discord: ${settings_json_1.default.discordLink}`));
                player.reply(messageFormatter_1.MessageFormatter.info(`💡 Dica`, "Digite !ajuda para tutorial ou !discord para se registrar"));
            }
        });
    }
    onPlayerTeamChange(changedPlayer, byPlayer) {
        if (!changedPlayer.settings.playable && byPlayer) {
            changedPlayer.team = 0;
            this.$.send({ message: `[❌] ${changedPlayer.name} não pode jogar no momento.`, color: haxball_extended_room_1.Colors.LightGoldenRodYellow });
        }
    }
    checkForBan(player) {
        return __awaiter(this, void 0, void 0, function* () {
            const isBan = yield prisma_1.prisma.ban.findFirst({
                where: {
                    OR: [
                        { ip: player.ip },
                        { auth: player.auth || "" }
                    ]
                }
            });
            if (isBan)
                player.ban();
        });
    }
    onPlayerJoin(player) {
        this.checkForBan(player);
        player.settings.playable = false;
        const equalAuth = this.$.players.getAll(p => p.auth == player.auth && p.id != player.id);
        if (equalAuth.size > 0 && !this.$.state.devMode) {
            equalAuth.kick("Você reentrou na sala.");
        }
        else {
            const equalName = this.$.players.getAll(p => p.name == player.name && p.id != player.id);
            if (equalName.size > 0)
                return player.kick("Nome já está sendo utilizado.");
        }
        this.checkPlayerAuthentication(player);
    }
};
exports.AuthModule = AuthModule;
__decorate([
    haxball_extended_room_1.CustomEvent
], AuthModule.prototype, "onPlayerAuth", null);
__decorate([
    haxball_extended_room_1.Event
], AuthModule.prototype, "onPlayerTeamChange", null);
__decorate([
    haxball_extended_room_1.Event
], AuthModule.prototype, "onPlayerJoin", null);
exports.AuthModule = AuthModule = __decorate([
    haxball_extended_room_1.Module
], AuthModule);
