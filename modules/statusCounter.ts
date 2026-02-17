import { Colors, CommandExecInfo, CustomEvent, Event, Module, ModuleCommand, Player, Room } from "haxball-extended-room";
import { prisma } from "../database/prisma";
import { Roles } from "./roles";
import { Status } from "@prisma/client";

type StatusT = {
    cortes?: number;
    levants?: number;
    blocks?: number;
    wins?: number;
    loses?: number;
    elo?: number;
    streak?: number;
}

function getRanking(elo : number) {
    if(elo < 1000) return "Bronze";
    if(elo < 1100) return "Prata I";
    if(elo < 1200) return "Prata II";
    if(elo < 1300) return "Prata III";
    if(elo < 1400) return "Ouro I";
    if(elo < 1500) return "Ouro II";
    if(elo < 1600) return "Ouro III";
    if(elo < 1700) return "Platina";
    if(elo < 1800) return "Platina II";
    if(elo < 1900) return "Platina III";
    if(elo < 2000) return "Diamante I";
    if(elo < 2100) return "Diamante II";
    if(elo < 2200) return "Diamante III";
    if(elo < 2300) return "Diamante IV";
    return "Mestre";
}

@Module export class StatusCounter {

    private counting : boolean = false;
    private streak : number = 0;

    private matchStatus : {[key: string]: StatusT} = {}
    private StatusCache : {[key: number]: Status} = {}

    constructor(private $: Room) {}

    private addStatus(player : Player, name : keyof StatusT, increase : number = 1) {
        const discordId = player.settings.account?.discordId;
        if(!discordId) return;
        if(!this.matchStatus[discordId]) this.matchStatus[discordId] = {};
        if(!this.matchStatus[discordId][name]) this.matchStatus[discordId][name] = 0;
        this.matchStatus[discordId][name] += increase;
    }

    private async savematchStatus() {
        for(const discordId of Object.keys(this.matchStatus)) {
            const status = this.matchStatus[discordId];
            const previousStatus = await prisma.status.findFirst({ where: { discordId } });
            if(!previousStatus) {
                await prisma.status.create({
                    data: {
                        discordId,
                        ...status
                    }
                });
                continue;
            }
            const dataUpdate : {[key: string]: {increment?: number, set?: number}} = {};
            if(!status || !Object.keys(status)) continue;
            for(const element of Object.keys(status)) {
                const value = Number(status[(element as keyof StatusT)]) || 0;
                if(element == "streak") {
                    if(!previousStatus.streak || value > previousStatus.streak) {
                        dataUpdate["streak"] = {
                            set: value
                        }
                    }
                }
                if(previousStatus[element as keyof StatusT] && element != "elo") {
                    dataUpdate[element] = {
                        increment: value
                    }
                }else{
                    dataUpdate[element] = {
                        set: value
                    }
                }
            }
            await prisma.status.update({
                where: { id: previousStatus.id },
                data: dataUpdate
            })
        }

        this.clearmatchStatus();
    }
    private clearmatchStatus() { this.matchStatus = {}; }

    calculateNewElo(playerElo : number, enemyElo : number, actualScore : number) {
        const K = 32;
        const expectedScore = 1 / (1 + Math.pow(10, (enemyElo - playerElo) / 400));
        const newPlayerElo = playerElo + K * (actualScore - expectedScore);
        return Math.trunc(newPlayerElo);
    }

    private async addEloStatus(winnerTeam : 1 | 2) {
        const DEFAULT_ELO = 1000;
        const eloInfo : { [key: number]: {
            elo: number;
            player: Player;
        } } = {};
        const teams = this.$.players.teams().values();
        for(const player of teams) {
            if(!player.settings.account) {
                eloInfo[player.id] = {
                    elo: DEFAULT_ELO,
                    player
                };
                continue;
            }
            const pStatus = await prisma.status.findFirst({ where: { discordId: player.settings.account.discordId } });
            if(!pStatus || !pStatus.elo) {
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

        const redTeam = Object.values(eloInfo).filter(elo => elo.player.team == 1)
        const redValue = redTeam.reduce((acc, elo) => {
            return elo.elo + acc;
        }, 0);
        const meanRed = redValue / redTeam.length;

        const blueTeam = Object.values(eloInfo).filter(elo => elo.player.team == 2)
        const blueValue = redTeam.reduce((acc, elo) => {
            return elo.elo + acc;
        }, 0);
        const meanBlue = blueValue / blueTeam.length;

        const eloRed = this.calculateNewElo(meanRed, meanBlue, winnerTeam == 1 ? 1 : 0);
        const eloBlue = this.calculateNewElo(meanBlue, meanRed, winnerTeam == 2 ? 1 : 0);

        const deltaRed = eloRed - meanRed;
        const deltaBlue = eloBlue - meanBlue;

        for(const id of Object.keys(eloInfo)) {
            const info = eloInfo[Number(id)];
            const delta = info.player.team == 1 ? deltaRed : deltaBlue;
            info.player.reply({
                message: `[⭐] Você ${delta > 0 ? "ganhou" : "perdeu"} ${Math.abs(delta)} de elo.`
            })
            this.addStatus(info.player, "elo", info.elo+delta);
        }
    }

    setStatusAvatar(player : Player, avatar : string) {
        player.setAvatar(avatar);
        clearTimeout(player.settings.statusAvatarTimeout);
        player.settings.statusAvatarTimeout = setTimeout(() => {
            player.clearAvatar();
        }, 1000);
    }

    @CustomEvent onPlayerCorte(player : Player) {
        if(!this.counting) return;
        this.addStatus(player, "cortes");
    }

    @CustomEvent onPlayerLevant(player : Player) {
        if(!this.counting) return;
        this.addStatus(player, "levants");
    }

    @CustomEvent onPlayerBlock(player : Player) {
        if(!this.counting) return;
        this.addStatus(player, "blocks");
    }

    @Event onGameStart() { 
        this.counting = true; 
        this.matchStatus = {};
    }
    @Event onPositionsReset() { this.counting = true; }
    @Event onStadiumChange() { this.streak = 0; this.matchStatus = {}; }

    @CustomEvent async onTeamVictory() {
        // Stats ativadas para 3x3 com pelo menos 6 jogadores
        if(this.$.players.size < 6) {
            this.clearmatchStatus();
            return;
        }
        const scores = this.$.scores;
        if(scores) {
            const redScore = scores.red;
            const blueScore = scores.blue;
            const winnerTeam = (redScore > blueScore) ? 1 : 2;
            const winner = this.$.players.teams().values().filter(p => p.team == winnerTeam);
            const looser = this.$.players.teams().values().filter(p => p.team != winnerTeam);
            for(const p of winner) { this.addStatus(p, "wins") }
            for(const p of looser) { this.addStatus(p, "loses") }
            await this.addEloStatus(winnerTeam);

            if(winnerTeam == 1) {
                this.streak++;
                for(const p of winner) { this.addStatus(p, "streak", this.streak) }
                this.$.send({ message: `[🔥] O time vermelho está em um streak de ${this.streak}!`, color: Colors.AntiqueWhite })
            }else {
                this.streak = 0;
            }
        }
        await this.savematchStatus();
        this.StatusCache = {};
    }

    @ModuleCommand({
        aliases: ["status"],
        roles: [Roles.RegistredRole]
    })
    async sendStatusToPlayer(command : CommandExecInfo) {
        if(!command.player.settings.account) return;

        const playerStatus = this.StatusCache[command.player.id];
        let status : Status | null = null;
        if(!status) {
            status = await prisma.status.findFirst({ where: { discordId: command.player.settings.account.discordId } });
            if(status) this.StatusCache[command.player.id] = status;
        }

        const cortes = status?.cortes || 0;
        const levants = status?.levants || 0;
        const blocks = status?.blocks || 0;
        const wins = status?.wins || 0;
        const loses = status?.loses || 0;
        const elo = status?.elo || 1000;
        const streak = status?.streak || 0;

        const ranking = getRanking(elo);

        this.$.send({
            message: `📊 Estatísticas de ${command.player.name}:`,
            color: Colors.White,
            sound: 1,
        });
        this.$.send({
            message: `⚽ Cortes: ${cortes} | 🏌️ Levantamentos: ${levants} | 🤡 Bloqueios: ${blocks}`,
            color: Colors.GreenYellow,
            sound: 0
        });
        this.$.send({
            message: `✅ Vitórias: ${wins} | ❌ Derrotas: ${loses} | 🥅 Partidas: ${wins+loses} | 🔥 Streak: ${streak}`,
            color: Colors.GreenYellow,
            sound: 0
        });
        this.$.send({
            message: `⭐ Elo: ${elo} | 💎 Ranking: ${ranking}`,
            color: Colors.GreenYellow,
            sound: 0
        });
    }

}