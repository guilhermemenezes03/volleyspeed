"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapTeamsModule = void 0;
// src/modules/swapTeamsModule.ts
const haxball_extended_room_1 = require("haxball-extended-room");
let SwapTeamsModule = class SwapTeamsModule {
    constructor($) {
        this.$ = $;
    }
    swapTeamsCommand(command) {
        // Verificar se o jogador é administrador
        if (!command.player.admin) {
            command.player.reply({
                message: "[⚠] Apenas administradores podem usar este comando!",
                color: haxball_extended_room_1.Colors.Red
            });
            return;
        }
        // Pegar todos os jogadores em times (exclui spectators)
        const players = this.$.players.teams().values();
        // Inverter os times usando a API nativa
        for (const player of players) {
            if (player.team === 1) {
                this.$.native.setPlayerTeam(player.id, 2); // Red -> Blue
            }
            else if (player.team === 2) {
                this.$.native.setPlayerTeam(player.id, 1); // Blue -> Red
            }
        }
        // Enviar mensagem de confirmação
        this.$.send({
            message: "[🔄] Os times foram invertidos!",
            color: haxball_extended_room_1.Colors.Green
        });
    }
};
exports.SwapTeamsModule = SwapTeamsModule;
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["swapteams", "trocar-times"],
        deleteMessage: true
    })
], SwapTeamsModule.prototype, "swapTeamsCommand", null);
exports.SwapTeamsModule = SwapTeamsModule = __decorate([
    haxball_extended_room_1.Module
], SwapTeamsModule);
