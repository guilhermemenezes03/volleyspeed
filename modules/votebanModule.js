"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoteBanModule = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
let VoteBanModule = class VoteBanModule {
    constructor($) {
        this.$ = $;
        this.currentBanning = null;
        this.yesPlayers = [];
        this.noPlayers = [];
        this.banList = [];
    }
    finishVotation() {
        this.currentBanning = null;
        this.yesPlayers = [];
        this.noPlayers = [];
    }
    onPlayerJoin(player) {
        if (this.banList.includes(player.conn))
            player.ban("Fugiu do voteban");
    }
    onPlayerLeave(player) {
        if (!this.currentBanning)
            return;
        const registredLen = this.$.players.getAll(p => p.settings.account && p.settings.playable);
        if (player.id == this.currentBanning.id
            && this.yesPlayers.length > this.noPlayers.length
            && this.yesPlayers.length > registredLen.size / 3) {
            this.banList.push(player.conn);
        }
        if (player.id == this.currentBanning.id) {
            this.finishVotation();
        }
    }
    voteSimCommand(command) {
        if (!this.currentBanning)
            return;
        if (this.yesPlayers.map(p => p.id).includes(command.player.id)
            || this.noPlayers.map(p => p.id).includes(command.player.id)) {
            command.player.reply({ message: "Você já votou!" });
            return;
        }
        this.yesPlayers.push(command.player);
        command.player.reply({ message: `Você votou a favor de banir ${this.currentBanning.name}.` });
    }
    voteNaoCommand(command) {
        if (!this.currentBanning)
            return;
        if (this.yesPlayers.map(p => p.id).includes(command.player.id)
            || this.noPlayers.map(p => p.id).includes(command.player.id)) {
            command.player.reply({ message: "Você já votou!" });
            return;
        }
        this.noPlayers.push(command.player);
        command.player.reply({ message: `Você votou contra banir ${this.currentBanning.name}.` });
    }
    voteBanCommand(command) {
        if (!command.player.settings.account)
            return;
        if (!command.arguments[0]) {
            command.player.reply({ message: `Utilize !voteban #id`, color: haxball_extended_room_1.Colors.BlueViolet });
            return;
        }
        if (this.currentBanning) {
            command.player.reply({ message: `${this.currentBanning.name} já está sendo julgado atualmente.`, color: haxball_extended_room_1.Colors.BlueViolet });
            return;
        }
        const registredLen = this.$.players.getAll(p => p.settings.account && p.settings.playable);
        if (registredLen.size <= 3) {
            command.player.reply({ message: `É necessário ter mais de 4 registrados na sala para isso.`, color: haxball_extended_room_1.Colors.BlueViolet });
            return;
        }
        const pId = command.arguments[0].toString().substring(1);
        const playerToBan = this.$.players[Number(pId)];
        if (!playerToBan) {
            command.player.reply({ message: `Não encontrei ninguém com esse ID.`, color: haxball_extended_room_1.Colors.BlueViolet });
            return;
        }
        if (playerToBan.settings.account) {
            command.player.reply({ message: `Um jogador registrado não pode ser banido. Faça uma denúncia no Discord.`, color: haxball_extended_room_1.Colors.BlueViolet });
            return;
        }
        this.yesPlayers = [command.player];
        this.noPlayers = [];
        this.currentBanning = playerToBan;
        this.$.send({
            message: `[👨‍⚖️] ${command.player.name} abriu um processo de ban contra ${playerToBan.name}. Registrados, digitem !sim para concordar ou !nao para discordar.`,
            color: haxball_extended_room_1.Colors.AliceBlue
        });
        setTimeout(() => {
            if (!this.currentBanning) {
                this.finishVotation();
                return;
            }
            if (this.yesPlayers.length < this.noPlayers.length) {
                this.finishVotation();
                return;
            }
            const registredLen = this.$.players.getAll(p => p.settings.account && p.settings.playable);
            if (this.yesPlayers.length > registredLen.size / 2) {
                this.currentBanning.ban("Voteban");
            }
        }, 60 * 1000);
    }
};
exports.VoteBanModule = VoteBanModule;
__decorate([
    haxball_extended_room_1.Event
], VoteBanModule.prototype, "onPlayerJoin", null);
__decorate([
    haxball_extended_room_1.Event
], VoteBanModule.prototype, "onPlayerLeave", null);
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["sim"],
        deleteMessage: true
    })
], VoteBanModule.prototype, "voteSimCommand", null);
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["nao"],
        deleteMessage: true
    })
], VoteBanModule.prototype, "voteNaoCommand", null);
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["voteban"],
        deleteMessage: true
    })
], VoteBanModule.prototype, "voteBanCommand", null);
exports.VoteBanModule = VoteBanModule = __decorate([
    haxball_extended_room_1.Module
], VoteBanModule);
