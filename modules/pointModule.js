"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pointModule = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
let pointModule = class pointModule {
    constructor($) {
        this.$ = $;
        this.maxScore = 12;
        this.redScore = 0;
        this.blueScore = 0;
    }
    onGameStart() {
        this.$.send({ message: `[🏐] Jogo vai até ${this.maxScore} pontos.`, color: haxball_extended_room_1.Colors.AquaMarine });
        this.redScore = 0;
        this.blueScore = 0;
    }
    onTeamGoal(team) {
        if (team == 1)
            this.redScore++;
        else
            this.blueScore++;
        this.$.send({ message: `[🏐] PLACAR: 🔴 RED ${this.redScore} x ${this.blueScore} BLUE 🔵`, color: haxball_extended_room_1.Colors.AquaMarine });
    }
    onPositionsReset() {
        if (this.redScore >= this.maxScore || this.blueScore >= this.maxScore) {
            const diff = Math.abs(this.redScore - this.blueScore);
            if (diff >= 2) {
                this.$.stop();
                const winner = this.redScore > this.blueScore ? 1 : 2;
                this.$.customEvents.emit("onTeamVictory", this.redScore, this.blueScore, this.$.players.values());
                this.$.send({ message: `[🏐] VITÓRIA DO TIME ${winner == 1 ? "VERMELHO" : "AZUL"}`, color: haxball_extended_room_1.Colors.AquaMarine });
            }
            else {
                const higherScore = this.redScore > this.blueScore ? this.redScore : this.blueScore;
                const newValue = higherScore + (2 - diff);
                this.$.send({ message: `[🏐] QUEM MARCAR ${newValue} PONTOS VENCE.`, color: haxball_extended_room_1.Colors.AquaMarine });
            }
        }
    }
    setLimitCommand(command) {
        if (!command.arguments[0] || !command.arguments[0].number) {
            command.player.reply({ message: `!setlimit (numero)` });
            return;
        }
        this.maxScore = Number(command.arguments[0]);
        this.$.send({ message: `[🏐] ${command.player.name} alterou o score limit para ${this.maxScore}.`, color: haxball_extended_room_1.Colors.AliceBlue });
    }
    setScoreCommand(command) {
        if (!command.arguments[1] || !command.arguments[0].number || !command.arguments[1].number) {
            command.player.reply({ message: `!setscore (numero) (numero)` });
            return;
        }
        this.redScore = Number(command.arguments[0]);
        this.blueScore = Number(command.arguments[1]);
        this.$.send({ message: `[🏐] ${command.player.name} alterou o placar para 🔴 RED ${this.redScore} x ${this.blueScore} AZUL 🔵`, color: haxball_extended_room_1.Colors.AliceBlue });
    }
};
exports.pointModule = pointModule;
__decorate([
    haxball_extended_room_1.Event
], pointModule.prototype, "onGameStart", null);
__decorate([
    haxball_extended_room_1.Event
], pointModule.prototype, "onTeamGoal", null);
__decorate([
    haxball_extended_room_1.Event
], pointModule.prototype, "onPositionsReset", null);
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["setlimit"],
        roles: ["admin"]
    })
], pointModule.prototype, "setLimitCommand", null);
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["setscore"],
        roles: ["admin"]
    })
], pointModule.prototype, "setScoreCommand", null);
exports.pointModule = pointModule = __decorate([
    haxball_extended_room_1.Module
], pointModule);
