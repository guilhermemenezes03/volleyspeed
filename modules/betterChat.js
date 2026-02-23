"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetterChat = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
const settings_json_1 = __importDefault(require("../settings.json"));
let BetterChat = class BetterChat {
    constructor($) {
        this.$ = $;
        this.chatoff = false;
    }
    getMentionedPlayers(message) {
        const mentionedTexts = message.trim().split(" ").filter(m => m.startsWith("@"));
        const mentionedPlayers = [];
        for (const mention of mentionedTexts) {
            for (const p of this.$.players) {
                if (p.name.replace(/ /g, "_") == mention.substring(1))
                    mentionedPlayers.push(p);
            }
        }
        return mentionedPlayers;
    }
    onPlayerJoin(player) {
        for (const text of settings_json_1.default.ultraBlackWordsList) {
            if (player.name.includes(text)) {
                player.ban();
                return;
            }
        }
    }
    teamMessage(player, message) {
        let emoji = "🔴";
        let color = haxball_extended_room_1.Colors.IndianRed;
        if (player.team == 2) {
            emoji = "🔵";
            color = haxball_extended_room_1.Colors.LightSkyBlue;
        }
        else if (player.team == 0) {
            emoji = "○";
            color = haxball_extended_room_1.Colors.WhiteSmoke;
        }
        const members = this.$.players.getAll(p => p.team == player.team);
        members.reply({
            message: `[${emoji}] ${player.name}: ${message.substring(1).trimStart()}`,
            color,
            sound: 2
        });
    }
    onPlayerChat(player, message) {
        var _a, _b;
        if (message.startsWith("!"))
            return;
        if (player.settings.picking)
            return;
        if (player.settings.playable !== true)
            return;
        if (player.settings.delayTimeout) {
            player.reply({ message: `[🛑] Você está falando rápido demais!`, color: haxball_extended_room_1.Colors.Red });
            if (!player.settings.account) {
                player.reply({ message: `[🛑] Para falar mais rápido, se registre no !discord`, color: haxball_extended_room_1.Colors.Red });
            }
            return;
        }
        if (player.settings.muted) {
            player.reply({ message: `[🛑] Você está mutado!`, color: haxball_extended_room_1.Colors.Red });
            return;
        }
        const analyzeMsg = message
            .replace(/0/g, "o")
            .replace(/3/g, "e")
            .replace(/4/g, "a")
            .replace(/1/g, "i")
            .toLowerCase();
        for (const text of settings_json_1.default.ultraBlackWordsList) {
            if (analyzeMsg.includes(text)) {
                player.ban();
                return;
            }
        }
        for (const text of settings_json_1.default.blackWordsList) {
            if (analyzeMsg.includes(text)) {
                if (!player.settings.toxicWarn)
                    player.settings.toxicWarn = 0;
                else if (player.settings.toxicWarn == 2) {
                    player.settings.muted = true;
                    setTimeout(() => { if (player.settings)
                        player.settings.muted = false; }, 2 * 60 * 1000);
                    this.$.send({ message: `[😠] ${player.name} foi mutado 2 minutos por toxicidade.`, color: haxball_extended_room_1.Colors.Red });
                    return;
                }
                else if (player.settings.toxicWarn == 3) {
                    player.ban("Tóxico");
                    return;
                }
                player.reply({ message: `[😠] Cuidado com as palavras, ${player.name}! Você recebeu um aviso. [1/2]`, color: haxball_extended_room_1.Colors.Red });
                player.settings.toxicWarn++;
                return;
            }
        }
        if (message.startsWith("t ") || message.startsWith(";")) {
            this.teamMessage(player, message);
            return;
        }
        if (this.chatoff && !player.admin)
            return;
        const mentionedPlayers = this.getMentionedPlayers(message);
        const topRole = player.topRole;
        const emoji = (topRole === null || topRole === void 0 ? void 0 : topRole.prefix) || "❌";
        const color = (topRole === null || topRole === void 0 ? void 0 : topRole.color) || 0x7d7d7d;
        for (const p of this.$.players) {
            const wasMentioned = !!mentionedPlayers.find(pl => pl.id == p.id);
            p.reply({
                message: `[${emoji}] ${player.name}: ${message.trim()}`,
                color,
                sound: wasMentioned ? 2 : 1,
                style: wasMentioned ? "bold" : "normal"
            });
        }
        if (((_a = player.topRole) === null || _a === void 0 ? void 0 : _a.settings.delay) === 0)
            return;
        const pDelay = (((_b = player.topRole) === null || _b === void 0 ? void 0 : _b.settings.delay) || 10) * 1000;
        player.settings.delayTimeout = setTimeout(() => {
            player.settings.delayTimeout = null;
        }, pDelay);
    }
    chatOffCommand(command) {
        if (!command.player.admin)
            return;
        this.chatoff = !this.chatoff;
        this.$.send({ message: `[🔇] Chat ${this.chatoff ? "des" : ""}ativado por ${command.player.name}`, color: haxball_extended_room_1.Colors.Orange });
    }
};
exports.BetterChat = BetterChat;
__decorate([
    haxball_extended_room_1.Event
], BetterChat.prototype, "onPlayerJoin", null);
__decorate([
    haxball_extended_room_1.Event
], BetterChat.prototype, "onPlayerChat", null);
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["chatoff"],
        deleteMessage: true
    })
], BetterChat.prototype, "chatOffCommand", null);
exports.BetterChat = BetterChat = __decorate([
    haxball_extended_room_1.Module
], BetterChat);
