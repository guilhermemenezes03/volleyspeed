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
exports.StatusCounter = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
const prisma_1 = require("../database/prisma");
const roles_1 = require("./roles");
function getRanking(elo) {
    if (elo < 1000)
        return "Bronze";
    if (elo < 1100)
        return "Prata I";
    if (elo < 1200)
        return "Prata II";
    if (elo < 1300)
        return "Prata III";
    if (elo < 1400)
        return "Ouro I";
    if (elo < 1500)
        return "Ouro II";
    if (elo < 1600)
        return "Ouro III";
    if (elo < 1700)
        return "Platina";
    if (elo < 1800)
        return "Platina II";
    if (elo < 1900)
        return "Platina III";
    if (elo < 2000)
        return "Diamante I";
    if (elo < 2100)
        return "Diamante II";
    if (elo < 2200)
        return "Diamante III";
    if (elo < 2300)
        return "Diamante IV";
    return "Mestre";
}
let StatusCounter = class StatusCounter {
    constructor($) {
        this.$ = $;
        this.counting = false;
        this.streak = 0;
        this.matchStatus = {};
        this.StatusCache = {};
    }
    addStatus(player, name, increase = 1) {
        var _a;
        const discordId = (_a = player.settings.account) === null || _a === void 0 ? void 0 : _a.discordId;
        if (!discordId)
            return;
        if (!this.matchStatus[discordId])
            this.matchStatus[discordId] = {};
        if (!this.matchStatus[discordId][name])
            this.matchStatus[discordId][name] = 0;
        this.matchStatus[discordId][name] += increase;
    }
    savematchStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const discordId of Object.keys(this.matchStatus)) {
                const status = this.matchStatus[discordId];
                const previousStatus = yield prisma_1.prisma.status.findFirst({ where: { discordId } });
                if (!previousStatus) {
                    yield prisma_1.prisma.status.create({
                        data: Object.assign({ discordId }, status)
                    });
                    continue;
                }
                const dataUpdate = {};
                if (!status || !Object.keys(status))
                    continue;
                for (const element of Object.keys(status)) {
                    const value = Number(status[element]) || 0;
                    if (element == "streak") {
                        if (!previousStatus.streak || value > previousStatus.streak) {
                            dataUpdate["streak"] = {
                                set: value
                            };
                        }
                    }
                    if (previousStatus[element] && element != "elo") {
                        dataUpdate[element] = {
                            increment: value
                        };
                    }
                    else {
                        dataUpdate[element] = {
                            set: value
                        };
                    }
                }
                yield prisma_1.prisma.status.update({
                    where: { id: previousStatus.id },
                    data: dataUpdate
                });
            }
            this.clearmatchStatus();
        });
    }
    clearmatchStatus() { this.matchStatus = {}; }
    calculateNewElo(playerElo, enemyElo, actualScore) {
        const K = 32;
        const expectedScore = 1 / (1 + Math.pow(10, (enemyElo - playerElo) / 400));
        const newPlayerElo = playerElo + K * (actualScore - expectedScore);
        return Math.trunc(newPlayerElo);
    }
    addEloStatus(winnerTeam) {
        return __awaiter(this, void 0, void 0, function* () {
            const DEFAULT_ELO = 1000;
            const eloInfo = {};
            const teams = this.$.players.teams().values();
            for (const player of teams) {
                if (!player.settings.account) {
                    eloInfo[player.id] = {
                        elo: DEFAULT_ELO,
                        player
                    };
                    continue;
                }
                const pStatus = yield prisma_1.prisma.status.findFirst({ where: { discordId: player.settings.account.discordId } });
                if (!pStatus || !pStatus.elo) {
                    eloInfo[player.id] = {
                        elo: DEFAULT_ELO,
                        player
                    };
                    continue;
                }
                eloInfo[player.id] = {
                    elo: pStatus.elo,
                    player
                };
            }
            const redTeam = Object.values(eloInfo).filter(elo => elo.player.team == 1);
            const redValue = redTeam.reduce((acc, elo) => {
                return elo.elo + acc;
            }, 0);
            const meanRed = redValue / redTeam.length;
            const blueTeam = Object.values(eloInfo).filter(elo => elo.player.team == 2);
            const blueValue = redTeam.reduce((acc, elo) => {
                return elo.elo + acc;
            }, 0);
            const meanBlue = blueValue / blueTeam.length;
            const eloRed = this.calculateNewElo(meanRed, meanBlue, winnerTeam == 1 ? 1 : 0);
            const eloBlue = this.calculateNewElo(meanBlue, meanRed, winnerTeam == 2 ? 1 : 0);
            const deltaRed = eloRed - meanRed;
            const deltaBlue = eloBlue - meanBlue;
            for (const id of Object.keys(eloInfo)) {
                const info = eloInfo[Number(id)];
                const delta = info.player.team == 1 ? deltaRed : deltaBlue;
                info.player.reply({
                    message: `[⭐] Você ${delta > 0 ? "ganhou" : "perdeu"} ${Math.abs(delta)} de elo.`
                });
                this.addStatus(info.player, "elo", info.elo + delta);
            }
        });
    }
    setStatusAvatar(player, avatar) {
        player.setAvatar(avatar);
        clearTimeout(player.settings.statusAvatarTimeout);
        player.settings.statusAvatarTimeout = setTimeout(() => {
            player.clearAvatar();
        }, 1000);
    }
    onPlayerCorte(player) {
        if (!this.counting)
            return;
        this.addStatus(player, "cortes");
    }
    onPlayerLevant(player) {
        if (!this.counting)
            return;
        this.addStatus(player, "levants");
    }
    onPlayerBlock(player) {
        if (!this.counting)
            return;
        this.addStatus(player, "blocks");
    }
    onGameStart() {
        this.counting = true;
        this.matchStatus = {};
    }
    onPositionsReset() { this.counting = true; }
    onStadiumChange() { this.streak = 0; this.matchStatus = {}; }
    onTeamVictory() {
        return __awaiter(this, void 0, void 0, function* () {
            // Stats ativadas para 3x3 com pelo menos 6 jogadores
            if (this.$.players.size < 6) {
                this.clearmatchStatus();
                return;
            }
            const scores = this.$.scores;
            if (scores) {
                const redScore = scores.red;
                const blueScore = scores.blue;
                const winnerTeam = (redScore > blueScore) ? 1 : 2;
                const winner = this.$.players.teams().values().filter(p => p.team == winnerTeam);
                const looser = this.$.players.teams().values().filter(p => p.team != winnerTeam);
                for (const p of winner) {
                    this.addStatus(p, "wins");
                }
                for (const p of looser) {
                    this.addStatus(p, "loses");
                }
                yield this.addEloStatus(winnerTeam);
                if (winnerTeam == 1) {
                    this.streak++;
                    for (const p of winner) {
                        this.addStatus(p, "streak", this.streak);
                    }
                    this.$.send({ message: `[🔥] O time vermelho está em um streak de ${this.streak}!`, color: haxball_extended_room_1.Colors.AntiqueWhite });
                }
                else {
                    this.streak = 0;
                }
            }
            yield this.savematchStatus();
            this.StatusCache = {};
        });
    }
    sendStatusToPlayer(command) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!command.player.settings.account)
                return;
            const playerStatus = this.StatusCache[command.player.id];
            let status = null;
            if (!status) {
                status = yield prisma_1.prisma.status.findFirst({ where: { discordId: command.player.settings.account.discordId } });
                if (status)
                    this.StatusCache[command.player.id] = status;
            }
            const cortes = (status === null || status === void 0 ? void 0 : status.cortes) || 0;
            const levants = (status === null || status === void 0 ? void 0 : status.levants) || 0;
            const blocks = (status === null || status === void 0 ? void 0 : status.blocks) || 0;
            const wins = (status === null || status === void 0 ? void 0 : status.wins) || 0;
            const loses = (status === null || status === void 0 ? void 0 : status.loses) || 0;
            const elo = (status === null || status === void 0 ? void 0 : status.elo) || 1000;
            const streak = (status === null || status === void 0 ? void 0 : status.streak) || 0;
            const ranking = getRanking(elo);
            this.$.send({
                message: `📊 Estatísticas de ${command.player.name}:`,
                color: haxball_extended_room_1.Colors.White,
                sound: 1,
            });
            this.$.send({
                message: `⚽ Cortes: ${cortes} | 🏌️ Levantamentos: ${levants} | 🤡 Bloqueios: ${blocks}`,
                color: haxball_extended_room_1.Colors.GreenYellow,
                sound: 0
            });
            this.$.send({
                message: `✅ Vitórias: ${wins} | ❌ Derrotas: ${loses} | 🥅 Partidas: ${wins + loses} | 🔥 Streak: ${streak}`,
                color: haxball_extended_room_1.Colors.GreenYellow,
                sound: 0
            });
            this.$.send({
                message: `⭐ Elo: ${elo} | 💎 Ranking: ${ranking}`,
                color: haxball_extended_room_1.Colors.GreenYellow,
                sound: 0
            });
        });
    }
};
exports.StatusCounter = StatusCounter;
__decorate([
    haxball_extended_room_1.CustomEvent
], StatusCounter.prototype, "onPlayerCorte", null);
__decorate([
    haxball_extended_room_1.CustomEvent
], StatusCounter.prototype, "onPlayerLevant", null);
__decorate([
    haxball_extended_room_1.CustomEvent
], StatusCounter.prototype, "onPlayerBlock", null);
__decorate([
    haxball_extended_room_1.Event
], StatusCounter.prototype, "onGameStart", null);
__decorate([
    haxball_extended_room_1.Event
], StatusCounter.prototype, "onPositionsReset", null);
__decorate([
    haxball_extended_room_1.Event
], StatusCounter.prototype, "onStadiumChange", null);
__decorate([
    haxball_extended_room_1.CustomEvent
], StatusCounter.prototype, "onTeamVictory", null);
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["status"],
        roles: [roles_1.Roles.RegistredRole]
    })
], StatusCounter.prototype, "sendStatusToPlayer", null);
exports.StatusCounter = StatusCounter = __decorate([
    haxball_extended_room_1.Module
], StatusCounter);
