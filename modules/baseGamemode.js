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
exports.baseGameMode = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
const settings_json_1 = __importDefault(require("../settings.json"));
const positionsMode = settings_json_1.default.gameMode.positions;
let baseGameMode = class baseGameMode {
    constructor($) {
        this.$ = $;
        this.currentPossession = 1;
        this.redRotation = 0;
        this.blueRotation = 0;
        this.ballNetCollision = false;
        this.ignoreDoubleTouch = false;
        this.saqueTimeout = null;
        this.currentServer = null;
        this.lastScore = 1;
        this.lastSide = 1;
    }
    getServer(team, score) {
        const index = score % team.length;
        return team[index];
    }
    // [0, 1, 2, 3, 4, 5]
    getListOrderWithRotation(team, rotation) {
        if (rotation == 0)
            return team;
        const indexStart = rotation % team.length;
        const newTeam = [];
        let finishedList = false;
        for (let i = indexStart; i < team.length + 1; i++) {
            if (i == team.length) {
                i = 0;
                finishedList = true;
            }
            if (i == indexStart && finishedList)
                break;
            newTeam.push(team[i]);
        }
        return newTeam;
    }
    // Retorna o time que ERROU (time do último jogador que tocou)
    getLastToucherTeamRaw() {
        const touchers = this.$.state.absTouchers;
        if (!touchers || !touchers[0])
            return null;
        const team = touchers[0].team;
        if (team !== 1 && team !== 2)
            return null;
        return team;
    }
    // Retorna o time que deve GANHAR o ponto (adversário do último tocador)
    getLastToucherTeam() {
        const lastToucherTeam = this.getLastToucherTeamRaw();
        // Se não conseguir determinar quem tocou, usa a posição da bola como fallback
        if (lastToucherTeam === null) {
            const ball = this.$.ball;
            // Se a bola saiu do lado do blue (x > 0), RED provavelmente atacou e errou -> BLUE ganha
            // Se a bola saiu do lado do red (x < 0), BLUE provavelmente atacou e errou -> RED ganha
            if (ball && ball.x !== undefined) {
                return ball.x > 0 ? 2 : 1;
            }
            return 1; // Fallback final
        }
        // Retorna o time ADVERSÁRIO do último jogador que tocou
        return lastToucherTeam === 1 ? 2 : 1;
    }
    startServe() {
        const team = this.$.players
            .getAll((p) => p.team == this.currentPossession)
            .order(this.$);
        const p = this.getServer(team, this.currentPossession == 1 ? this.redRotation : this.blueRotation);
        this.$.state.setTouchPhase("serve", p);
        const randomizer = Math.round(Math.random() * 2 - 1);
        const ball = this.$.ball;
        ball.radius = settings_json_1.default.mapSettings[this.$.state.currentMap].ballRadius + 0.1;
        ball.x =
            settings_json_1.default.gameMode.servePosition[this.$.state.currentMap].ball.x *
                (this.currentPossession == 2 ? -1 : 1);
        ball.y = (settings_json_1.default.gameMode.servePosition[this.$.state.currentMap].ball.y * randomizer || 1);
        // ball.cGroup = 0;
        // ball.cMask = 0;
        // ball.color = Colors.Gray; 
        if (team.length == 0) {
            if (this.currentPossession == 1)
                return;
            console.log("[RVC] Empty team detected. Restarting game...");
            this.$.stop();
            this.$.start();
            return;
        }
        const cf = this.currentPossession == 1
            ? this.$.CollisionFlags.c1
            : this.$.CollisionFlags.c2;
        team.forEach((p) => {
            if (p.cGroup == undefined || p.cGroup == null)
                return;
            p.cGroup = p.cGroup | cf;
        });
        const server = this.getServer(team, this.currentPossession == 1 ? this.redRotation : this.blueRotation);
        server.x =
            settings_json_1.default.gameMode.servePosition[this.$.state.currentMap].player.x *
                (this.currentPossession == 2 ? -1 : 1);
        server.y = (settings_json_1.default.gameMode.servePosition[this.$.state.currentMap].player.y * randomizer || 1);
        this.$.send({
            message: `[🤾] Saque de ${server.name}.`,
            color: haxball_extended_room_1.Colors.AquaMarine,
        });
        this.saqueTimeout = 19;
        this.currentServer = server;
        this.lastSide = this.currentPossession;
        // this.$.send({
        //   message: "[⚠️] A bola está bloqueada. O saque será liberado em 2 segundos.",
        //   color: Colors.Gray,
        // });
        // setTimeout(() => {
        //   ball.cGroup = this.$.CollisionFlags.kick; 
        //   ball.color = Colors.Yellow;
        //   this.$.send({
        //     message: "[⚡] Bola liberada! O saque pode ser feito agora.",
        //     color: Colors.Yellow,
        //   });
        // }, 3500);
    }
    scoreTo(team, reason, force = false) {
        if (!this.$.state.ballInGame && !force)
            return;
        this.$.state.ballInGame = false;
        this.$.send({
            message: `[🏐] ${reason}. Ponto do ${team == 1 ? "vermelho" : "azul"}.`,
            color: haxball_extended_room_1.Colors.AquaMarine,
        });
        this.$.state.scorePoint(team);
    }
    positionPlayers() {
        const red = this.$.players.red().order(this.$);
        const blue = this.$.players.blue().order(this.$);
        const redOrder = this.getListOrderWithRotation(red, this.redRotation);
        const blueOrder = this.getListOrderWithRotation(blue, this.blueRotation);
        for (let i = 0; i < redOrder.length; i++) {
            const order = (redOrder.length + "");
            if (!redOrder[i] || !positionsMode[order])
                continue;
            redOrder[i].x = positionsMode[order][i][0];
            redOrder[i].y = positionsMode[order][i][1];
        }
        for (let i = 0; i < blueOrder.length; i++) {
            const order = (blueOrder.length + "");
            if (!blueOrder[i] || !positionsMode[order])
                continue;
            blueOrder[i].x = positionsMode[order][i][0] * -1;
            blueOrder[i].y = positionsMode[order][i][1];
        }
    }
    distanceBetween(d1, d2) {
        if (!d1.x || !d1.y || !d2.x || !d2.y)
            return null;
        return Math.sqrt(Math.pow((d1.x - d2.x), 2) + Math.pow((d1.y - d2.y), 2));
    }
    onGameTick() {
        if (!this.$.state.ballInGame)
            return;
        const ball = this.$.ball;
        if (!ball || !ball.radius || !ball.x || !ball.y)
            return;
        // if(ball.radius < Settings.mapSettings.ballRadius+0.1) {
        //     this.ballNetCollision = true;
        //     ball.cGroup = this.$.CollisionFlags.ball | this.$.CollisionFlags.kick;
        // }else{
        //     this.ballNetCollision = false;
        //     ball.cGroup = this.$.CollisionFlags.kick;
        // }
        // if(ball.cGroup !== null && ball.cGroup !== undefined) {
        //     if(ball.radius > Settings.gameMode.intouchableBallHeight) {
        //         ball.cGroup = ball.cGroup & ~this.$.CollisionFlags.kick;
        //     }else{
        //         ball.cGroup = ball.cGroup | this.$.CollisionFlags.kick;
        //     }
        // }
        // const touchingNet = this.$.players.values().find(p => p.x && p.x >= -15.1 && p.x <= 15.1);
        // if(touchingNet) {
        //     const scoreTo = touchingNet.team == 1 ? 2 : 1;
        //     this.scoreTo(scoreTo, `${touchingNet.name} encostou na rede`);
        // }
        let ballTouchingAntenna = false;
        const dist1 = this.distanceBetween(ball, this.$.discs[2]);
        const dist2 = this.distanceBetween(ball, this.$.discs[3]);
        if (dist1 && dist1 < settings_json_1.default.mapSettings[this.$.state.currentMap].ballRadius)
            ballTouchingAntenna = true;
        if (dist2 && dist2 < settings_json_1.default.mapSettings[this.$.state.currentMap].ballRadius)
            ballTouchingAntenna = true;
        if (ballTouchingAntenna) {
            const team = this.getLastToucherTeam();
            this.scoreTo(team, `Bola encostou na antena`);
        }
        const mapY = settings_json_1.default.mapSettings[this.$.state.currentMap].mapY;
        const ballSide = ball.x > 0 ? 2 : 1;
        if (ballSide != this.lastSide) {
            if (ball.y < -mapY || ball.y > mapY) {
                const team = this.getLastToucherTeam();
                this.scoreTo(team, `Bola passou por fora`);
            }
            else {
                this.$.customEvents.emit("onBallChangeSide", ballSide);
            }
        }
        this.lastSide = ballSide;
    }
    setBlockTouch(player) {
        if (this.$.state.firstTouch)
            return;
        this.$.state.removeLastTouch();
        const ball = this.$.ball;
        this.$.state.setAvatar(player, "🚫", true);
        if (ball.yspeed)
            ball.yspeed /= 2.5;
        if (ball.xspeed)
            ball.xspeed /= 2;
        ball.cGroup = 0;
        ball.cMask = 0;
        setTimeout(() => {
            if (ball) {
                ball.cGroup = this.$.CollisionFlags.kick;
            }
        }, 700);
        return;
    }
    onGameStart() {
        this.$.state.ballInGame = false;
        this.$.state.lastTeamTouch = 1;
        this.$.state.firstTouch = false;
        this.redRotation = 0;
        this.blueRotation = 0;
        this.currentPossession = 1;
        this.lastScore = 1;
        this.lastSide = 1;
        const players = this.$.players.teams();
        this.ignoreDoubleTouch = players.size <= 3 ? true : false;
        this.positionPlayers();
        this.startServe();
        if (this.$.ball.xspeed !== undefined)
            this.$.ball.xspeed = 0.000001;
    }
    onGameStop() {
        this.currentServer = null;
    }
    onPositionsReset() {
        this.$.discs[4].x = 0;
        this.$.discs[4].y = 2000;
        this.$.state.ballInGame = false;
        this.positionPlayers();
        this.startServe();
        if (this.$.ball.xspeed !== undefined)
            this.$.ball.xspeed = 0.000001;
    }
    onTeamGoal(team) {
        this.currentPossession = team;
        if (this.lastScore != team) {
            if (team == 1)
                this.redRotation++;
            if (team == 2)
                this.blueRotation++;
        }
        this.lastScore = team;
    }
    onPlayerBallKick(player) {
        if (this.$.state.touchPhase == "block"
            && player.x
            && player.x > -35
            && player.x < 35)
            this.setBlockTouch(player);
        if (this.$.state.touchPhase == "levantFast") {
            this.$.state.ignoreBallCount = true;
        }
        else {
            this.$.state.ignoreBallCount = false;
        }
        if (this.$.state.touchPhase == "fastServeCurve") {
            const playerY = player.y || 0;
            const ballY = this.$.ball.y || 0;
            const curveLevel = playerY - ballY;
            setTimeout(() => {
                this.$.ball.ygravity = curveLevel * 0.015;
            }, 200);
            setTimeout(() => { if (this.$.ball)
                this.$.ball.ygravity = 0; }, 600);
        }
        if (this.$.state.touchPhase == "serveReception") {
            const lastTouchers = this.$.state.touchers;
            const team = lastTouchers[0].team == 1 ? 2 : 1;
            this.scoreTo(team, player.name + " encostou durante o saque");
        }
        else if (this.$.state.touchPhase == "fastServeTouch") {
            this.$.state.setTouchPhase("fastServeCurve", player);
            this.$.state.ballInGame = true;
            this.saqueTimeout = null;
            this.$.state.firstTouch = true;
        }
        else if (this.$.state.touchPhase == "fastServe" || this.$.state.touchPhase == "fastServeCurve") {
            this.currentServer = null;
            this.$.state.setTouchPhase("serveReception", player);
            const team = this.$.players.getAll((p) => p.team == this.currentPossession);
            const cf = this.currentPossession == 1
                ? this.$.CollisionFlags.c1
                : this.$.CollisionFlags.c2;
            team.values().forEach((p) => {
                if (p.cGroup === null || p.cGroup === undefined)
                    return;
                p.cGroup = p.cGroup & ~cf;
            });
        }
        else if (this.$.state.touchPhase == "serve") {
            this.$.state.setTouchPhase("serveReception", player);
            this.$.state.ballInGame = true;
            this.$.state.firstTouch = true;
            this.saqueTimeout = null;
            this.currentServer = null;
            const team = this.$.players.getAll((p) => p.team == this.currentPossession);
            const cf = this.currentPossession == 1
                ? this.$.CollisionFlags.c1
                : this.$.CollisionFlags.c2;
            team.values().forEach((p) => {
                if (p.cGroup === null || p.cGroup === undefined)
                    return;
                p.cGroup = p.cGroup & ~cf;
            });
        }
        else if (this.$.state.touchPhase == "reception") {
            this.$.state.firstTouch = false;
            this.$.state.setTouchPhase("levantFast", player);
        }
        else if (this.$.state.touchPhase == "levant" || this.$.state.touchPhase == "levantFast") {
            this.$.customEvents.emit("onPlayerLevant", player);
            if (player.team != this.$.state.lastTeamTouch) {
                this.$.state.setTouchPhase("reception");
            }
            else {
                this.$.state.setTouchPhase("attack", player);
            }
        }
        else if (this.$.state.touchPhase == "attack" || this.$.state.touchPhase == "attackPurple") {
            this.$.customEvents.emit("onPlayerCorte", player);
            if (player.team != this.$.state.lastTeamTouch) {
                this.$.state.setTouchPhase("reception");
            }
            else {
                this.$.state.setTouchPhase("block");
            }
        }
        else if (this.$.state.touchPhase == "block") {
            this.$.customEvents.emit("onPlayerBlock", player);
            this.$.state.setTouchPhase("receptionBlock");
        }
        else if (this.$.state.touchPhase == "receptionBlock") {
            this.$.state.setTouchPhase("levant");
        }
        this.$.state.lastTeamTouch = player.team;
        const lastTouchers = this.$.state.touchers || [];
        const absTouchers = this.$.state.absTouchers || [];
        if (lastTouchers.length === 0)
            return;
        if (lastTouchers[1] &&
            lastTouchers[1].id == lastTouchers[0].id &&
            absTouchers[1] &&
            absTouchers[1].id == absTouchers[0].id &&
            !this.ignoreDoubleTouch) {
            const team = lastTouchers[1].team == 1 ? 2 : 1;
            this.scoreTo(team, "Toque duplo");
        }
        else if (this.countConsecutiveTouches(lastTouchers, lastTouchers[0].team) >= 4 &&
            this.countConsecutiveTouches(absTouchers, absTouchers[0].team) >= 4) {
            const team = lastTouchers[0].team == 1 ? 2 : 1;
            this.scoreTo(team, "Mais de 3 toques");
        }
    }
    countConsecutiveTouches(touchers, team) {
        let count = 0;
        for (const toucher of touchers) {
            if (!toucher || toucher.team != team)
                break;
            count++;
        }
        return count;
    }
    onBallChangeSide() {
        if (this.$.state.touchPhase == "receptionBlock") {
            this.$.state.setBallChange({ height: 8, increaseRate: 0.3, type: "up" });
        }
        this.$.state.touchers = [];
        this.$.state.absTouchers = [];
        this.$.state.setTouchPhase("reception");
    }
    onClockTick() {
        if (this.saqueTimeout === null)
            return;
        if (!this.currentServer) {
            this.saqueTimeout = null;
            return;
        }
        this.saqueTimeout--;
        if (this.saqueTimeout == 14) {
            this.$.send({ message: `[🤾] ${this.currentServer.name} tem 5 segundos para sacar.`, color: haxball_extended_room_1.Colors.AquaMarine });
        }
        else if (this.saqueTimeout == 0) {
            const team = this.currentPossession == 1 ? 2 : 1;
            this.scoreTo(team, `${this.currentServer.name} demorou para sacar`, true);
            this.saqueTimeout = null;
        }
    }
    onPlayerLeave(player) {
        if (this.$.state.ballInGame)
            return;
        if (this.currentServer && this.currentServer.id == player.id) {
            this.startServe();
        }
    }
    onPlayerTeamChange(changed) {
        if (this.$.state.ballInGame)
            return;
        if (this.currentServer && this.currentServer.id == changed.id) {
            this.startServe();
        }
    }
    setToHighServe(command) {
        if (this.$.state.ballInGame)
            return;
        if (!this.currentServer || this.currentServer.id != command.player.id)
            return;
        if (this.$.state.touchPhase == "fastServeTouch")
            return;
        const player = command.player;
        const ball = this.$.ball;
        if (!ball)
            return;
        const randomizer = Math.round(Math.random() * 2 - 1);
        player.x =
            settings_json_1.default.gameMode.servePosition[this.$.state.currentMap].fastPlayer.x *
                (player.team == 2 ? -1 : 1);
        player.y = (settings_json_1.default.gameMode.servePosition[this.$.state.currentMap].fastPlayer.y * randomizer || 1);
        ball.x =
            settings_json_1.default.gameMode.servePosition[this.$.state.currentMap].fastBall.x * (player.team == 2 ? -1 : 1);
        ball.y = (settings_json_1.default.gameMode.servePosition[this.$.state.currentMap].fastBall.y * randomizer || 1);
        this.$.state.setTouchPhase("fastServeTouch", player);
        this.$.send({
            message: `[🤾‍♂️] ${command.player.name} ativou o saque alto.`,
            color: haxball_extended_room_1.Colors.AquaMarine,
        });
    }
    onBallHeightEnd(info) {
        if (info.type == "up" && this.$.state.touchPhase == "levantFast") {
            this.$.state.setTouchPhase("levant");
        }
        else if (info.type == "up" && this.$.state.touchPhase == "fastServeCurve") {
            this.$.state.setTouchPhase("fastServe");
        }
        if (info.type != "down")
            return;
        const ball = this.$.ball;
        if (!ball || !ball.x || !ball.y)
            return;
        const map = this.$.state.currentMap;
        const mapX = settings_json_1.default.mapSettings[map].mapX + 5;
        const mapY = settings_json_1.default.mapSettings[map].mapY + 5;
        // Verifica se a bola caiu dentro dos limites da quadra
        if (ball.x > -mapX && ball.x < mapX && ball.y > -mapY && ball.y < mapY) {
            // Ball.x > 0 = lado azul (direita)
            // Ball.x < 0 = lado vermelho (esquerda)
            if (ball.x > 0) {
                // Bola caiu no lado do azul, ponto pro vermelho
                this.scoreTo(1, "Ponto do vermelho");
            }
            else {
                // Bola caiu no lado do vermelho, ponto pro azul
                this.scoreTo(2, "Ponto do azul");
            }
        }
        else {
            // Bola caiu fora - ponto pro time adversário de quem tocou por último
            const team = this.getLastToucherTeam();
            const teamName = team == 1 ? "vermelho" : "azul";
            this.scoreTo(team, `Bola fora - ponto do ${teamName}`);
        }
        this.$.discs[4].x = ball.x;
        this.$.discs[4].y = ball.y;
        if (ball.xspeed)
            ball.xspeed /= 4;
        if (ball.yspeed)
            ball.yspeed /= 4;
        this.$.state.ballInGame = false;
    }
};
exports.baseGameMode = baseGameMode;
__decorate([
    haxball_extended_room_1.Event
], baseGameMode.prototype, "onGameTick", null);
__decorate([
    haxball_extended_room_1.Event
], baseGameMode.prototype, "onGameStart", null);
__decorate([
    haxball_extended_room_1.Event
], baseGameMode.prototype, "onGameStop", null);
__decorate([
    haxball_extended_room_1.Event
], baseGameMode.prototype, "onPositionsReset", null);
__decorate([
    haxball_extended_room_1.Event
], baseGameMode.prototype, "onTeamGoal", null);
__decorate([
    haxball_extended_room_1.Event
], baseGameMode.prototype, "onPlayerBallKick", null);
__decorate([
    haxball_extended_room_1.CustomEvent
], baseGameMode.prototype, "onBallChangeSide", null);
__decorate([
    haxball_extended_room_1.CustomEvent
], baseGameMode.prototype, "onClockTick", null);
__decorate([
    haxball_extended_room_1.Event
], baseGameMode.prototype, "onPlayerLeave", null);
__decorate([
    haxball_extended_room_1.Event
], baseGameMode.prototype, "onPlayerTeamChange", null);
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["sa"],
        deleteMessage: true,
    })
], baseGameMode.prototype, "setToHighServe", null);
__decorate([
    haxball_extended_room_1.CustomEvent
], baseGameMode.prototype, "onBallHeightEnd", null);
exports.baseGameMode = baseGameMode = __decorate([
    haxball_extended_room_1.Module
], baseGameMode);
