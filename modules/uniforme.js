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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniformeModule = void 0;
// src/modules/UniformeModule.ts
const haxball_extended_room_1 = require("haxball-extended-room");
const prisma_1 = require("../database/prisma");
let UniformeModule = class UniformeModule {
    constructor($) {
        this.$ = $;
        this.playersUsing = [];
    }
    onPlayerLeave(player) {
        if (this.playersUsing.map(p => p[0]).includes(player.id)) {
            const index = this.playersUsing.map(p => p[0]).indexOf(player.id);
            if (this.playersUsing[index][1] == 1) {
                this.$.setTeamColors(1, { angle: 60, textColor: 0xffffff, colors: [0xEAB91B, 0xD6A919, 0xC49B17] });
            }
            else {
                this.$.setTeamColors(2, { angle: 60, textColor: 0xffffff, colors: [0x55EB1F, 0x4DD61C, 0x47C41A] });
            }
            this.playersUsing.splice(index, 1);
        }
    }
    onPlayerTeamChange(player) {
        if (this.playersUsing.map(p => p[0]).includes(player.id)) {
            const index = this.playersUsing.map(p => p[0]).indexOf(player.id);
            if (this.playersUsing[index][1] == 1) {
                this.$.setTeamColors(1, { angle: 60, textColor: 0xffffff, colors: [0xEAB91B, 0xD6A919, 0xC49B17] });
            }
            else {
                this.$.setTeamColors(2, { angle: 60, textColor: 0xffffff, colors: [0x55EB1F, 0x4DD61C, 0x47C41A] });
            }
            this.playersUsing.splice(index, 1);
        }
    }
    setUni(command) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (command.player.team == 0) {
                command.player.reply({ message: "Você precisa estar em um time para usar este comando." });
                return;
            }
            if (!command.arguments[0] || !command.arguments[0].toString()) {
                command.player.reply({ message: "Por favor, insira o nome do uniforme." });
                return;
            }
            if (!((_a = command.player.settings.account) === null || _a === void 0 ? void 0 : _a.discordId)) {
                command.player.reply({ message: "Você precisa estar logado para usar esta função." });
                return;
            }
            const uniname = command.arguments[0].toString();
            const unicode = yield prisma_1.prisma.uniforme.findFirst({
                where: {
                    name: uniname,
                    userId: command.player.settings.account.discordId
                }
            });
            if (!unicode) {
                command.player.reply({ message: "Uniforme não encontrado." });
                return;
            }
            const unicodeSplit = unicode.code.split(" ");
            const angle = Number(unicodeSplit[0]);
            const textColor = parseInt(unicodeSplit[1], 16);
            const colors = unicodeSplit.splice(2).map((color) => parseInt(color, 16));
            this.$.setTeamColors(command.player.team, {
                angle,
                colors,
                textColor
            });
            this.$.send({
                message: `[💎] Uniforme do ${command.player.team == 1 ? "vermelho" : "azul"} alterado por ${command.player.name} para ${uniname}.`
            });
            this.playersUsing.push([command.player.id, command.player.team]);
        });
    }
};
exports.UniformeModule = UniformeModule;
__decorate([
    haxball_extended_room_1.Event
], UniformeModule.prototype, "onPlayerLeave", null);
__decorate([
    haxball_extended_room_1.Event
], UniformeModule.prototype, "onPlayerTeamChange", null);
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["uni"]
        // Removido o 'roles: ["vip"]' para permitir que qualquer jogador use o comando
    })
], UniformeModule.prototype, "setUni", null);
exports.UniformeModule = UniformeModule = __decorate([
    haxball_extended_room_1.Module
], UniformeModule);
