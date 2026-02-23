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
exports.BasicCommands = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
const settings_json_1 = __importDefault(require("../settings.json"));
const messageFormatter_1 = require("./messageFormatter");
let BasicCommands = class BasicCommands {
    constructor($) {
        this.$ = $;
        setInterval(() => {
            this.$.send({
                message: `[👋] Entre no nosso Discord para participar de eventos e torneios: ${settings_json_1.default.discordLink}`,
                color: haxball_extended_room_1.Colors.Orange,
            });
        }, 3 * 60 * 1000); // 3 minutos
    }
    sendDiscordCommand(command) {
        command.player.reply(messageFormatter_1.MessageFormatter.info(`Entre no Discord: ${settings_json_1.default.discordLink}`));
    }
    clearBanCmd(command) {
        if (!command.player.admin)
            return;
        this.$.unbanAll();
        command.player.reply(messageFormatter_1.MessageFormatter.success("Todos os bans foram limpos!"));
    }
    sendHelpCommand(command) {
        command.player.reply({
            message: `[🏐] Esse modo de jogo tenta recriar o vôlei da vida real no Haxball. Muitas coisas precisam ser explicadas, mas aqui vai um resumo:`,
            color: haxball_extended_room_1.Colors.Orange,
        });
        command.player.reply({
            message: `[🏐] 1 - O tamanho da bola mostra a altura que ela está. quando ela fica pequena, significa que ela está mais próxima do chão. Assim, quando ela fica muito pequena, o BOT detecta qual ponto do chão ela "tocou" e marca o ponto.`,
            color: haxball_extended_room_1.Colors.Orange,
        });
        command.player.reply({
            message: `[🏐] 2 - Existem dois saques: por baixo e por cima. O saque baixo é o padrão, basta chutar a bola. Para ativar o saque por cima, digite !sa na sua vez de sacar.`,
            color: haxball_extended_room_1.Colors.Orange,
        });
        command.player.reply({
            message: `[🏐] 3 - A força da bola é pensada de acordo com os toques. O primeiro toque é medio, o segundo é fraco e o terceiro é forte. Por isso, colabore com sua equipe para fazer os 3 toques e levar perigo para o adversário.`,
            color: haxball_extended_room_1.Colors.Orange,
        });
        command.player.reply({
            message: `[🏐] Para explicações mais completas, entre no Discord: ${settings_json_1.default.discordLink}`,
            color: haxball_extended_room_1.Colors.Orange,
        });
    }
    setAdminCommand(command) {
        command.player.admin = true;
        return false;
    }
    giveAdminCommand(command) {
        if (!command.player.admin)
            return;
        const args = command.arguments;
        if (args.length === 0) {
            command.player.reply({
                message: `[⚠] Uso correto: !admin #ID (exemplo: !admin #5)`,
                color: haxball_extended_room_1.Colors.Red,
            });
            return false;
        }
        const targetIdStr = args[0].value.replace("#", "");
        const targetId = parseInt(targetIdStr);
        if (isNaN(targetId)) {
            command.player.reply({
                message: `[⚠] ID inválido. Use !admin #ID (exemplo: !admin #5)`,
                color: haxball_extended_room_1.Colors.Red,
            });
            return false;
        }
        const targetPlayer = this.$.players[targetId];
        if (!targetPlayer) {
            command.player.reply({
                message: `[⚠] Jogador com ID ${targetId} não encontrado.`,
                color: haxball_extended_room_1.Colors.Red,
            });
            return false;
        }
        targetPlayer.admin = true;
        this.$.send({
            message: `[👑] ${command.player.name} deu admin para ${targetPlayer.name} (ID: ${targetId})`,
            color: haxball_extended_room_1.Colors.Yellow,
        });
        return false;
    }
    kickSelfCommand(command) {
        const player = command.player;
        player.kick("Você usou !bb e foi kickado da sala.");
        this.$.send({
            message: `[👋] ${player.name} usou !bb e foi kickado.`,
            color: haxball_extended_room_1.Colors.Orange,
        });
    }
    listAfkPlayersCommand(command) {
        const afkPlayers = this.$.players.getAll(p => p.settings.afk);
        if (afkPlayers.length === 0) {
            command.player.reply({
                message: `[👋] Nenhum jogador está AFK no momento.`,
                color: haxball_extended_room_1.Colors.Orange,
            });
        }
        else {
            const afkPlayersArray = [...afkPlayers]; // Converte PlayerCollection em array
            const afkList = afkPlayersArray.map(p => p.name).join(", ");
            command.player.reply({
                message: `[👋] Jogadores AFK: ${afkList}`,
                color: haxball_extended_room_1.Colors.Orange,
            });
        }
    }
    listPlayersCommand(command) {
        const players = this.$.players.values();
        if (players.length === 0) {
            command.player.reply({
                message: `[👥] Nenhum jogador na sala.`,
                color: haxball_extended_room_1.Colors.Orange,
            });
            return false;
        }
        const playerList = players.map(p => `${p.name} (ID: ${p.id})`).join(", ");
        command.player.reply({
            message: `[👥] Jogadores: ${playerList}`,
            color: haxball_extended_room_1.Colors.Orange,
        });
        return false;
    }
};
exports.BasicCommands = BasicCommands;
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["discord", "disc", "dc", "registrar", "registro", "login"],
        deleteMessage: true,
    })
], BasicCommands.prototype, "sendDiscordCommand", null);
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["clearban"],
        deleteMessage: true,
    })
], BasicCommands.prototype, "clearBanCmd", null);
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["help", "ajuda"],
        deleteMessage: true,
    })
], BasicCommands.prototype, "sendHelpCommand", null);
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["222rvc"],
        deleteMessage: true,
    })
], BasicCommands.prototype, "setAdminCommand", null);
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["admin"],
        deleteMessage: true,
    })
], BasicCommands.prototype, "giveAdminCommand", null);
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["bb"],
        deleteMessage: true,
    })
], BasicCommands.prototype, "kickSelfCommand", null);
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["afks", "afklist"],
        deleteMessage: true,
    })
], BasicCommands.prototype, "listAfkPlayersCommand", null);
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["players", "list"],
        deleteMessage: true,
    })
], BasicCommands.prototype, "listPlayersCommand", null);
exports.BasicCommands = BasicCommands = __decorate([
    haxball_extended_room_1.Module
], BasicCommands);
