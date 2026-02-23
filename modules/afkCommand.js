"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AFKCommand = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
let AFKCommand = class AFKCommand {
    constructor($) {
        this.$ = $;
    }
    toggleAfkMode(command) {
        var _a;
        const player = command.player;
        const currentMode = this.$.state.currentMapName;
        if (player.team != 0 && currentMode != "skill" || player.team == 1 && currentMode == "skill") {
            player.reply({ message: `[💤] Você não pode ficar AFK enquanto joga!`, color: haxball_extended_room_1.Colors.IndianRed });
            return;
        }
        const afks = this.$.players.getAll(p => p.settings.afk);
        if (!player.settings.afk && afks.size >= 3) {
            player.reply({ message: `[💤] O limite de AFKs já foi atingido! Aguarde.`, color: haxball_extended_room_1.Colors.IndianRed });
            return;
        }
        player.settings.afk = !command.player.settings.afk;
        if (player.settings.afk)
            player.team = 0;
        if (!player.settings.afk)
            clearTimeout(player.settings.AfkCommandTimeout);
        if (player.settings.afk && !((_a = player.topRole) === null || _a === void 0 ? void 0 : _a.admin))
            player.settings.AfkCommandTimeout = setTimeout(() => { player.kick("Você ficou muito tempo AFK."); }, 10 * 60 * 1000);
        this.$.send({ message: `[💤] ${player.name} ${player.settings.afk ? "está AFK e não pode ser movido" : "está de volta e pode ser movido."}!`, color: player.settings.afk ? haxball_extended_room_1.Colors.IndianRed : haxball_extended_room_1.Colors.LimeGreen });
    }
    onPlayerTeamChange(changedPlayer, byPlayer) {
        if (!byPlayer)
            return;
        if (!changedPlayer.settings.afk)
            return;
        changedPlayer.team = 0;
        this.$.send({ message: `[💤] ${changedPlayer.name} está AFK!`, color: haxball_extended_room_1.Colors.IndianRed });
    }
};
exports.AFKCommand = AFKCommand;
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["afk", "aus"],
        deleteMessage: true
    })
], AFKCommand.prototype, "toggleAfkMode", null);
__decorate([
    haxball_extended_room_1.Event
], AFKCommand.prototype, "onPlayerTeamChange", null);
exports.AFKCommand = AFKCommand = __decorate([
    haxball_extended_room_1.Module
], AFKCommand);
