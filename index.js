"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const haxball_extended_room_1 = require("haxball-extended-room");
const haxball_js_1 = __importDefault(require("haxball.js"));
const settings_json_1 = __importDefault(require("./settings.json"));
const ballHeight_1 = require("./modules/ballHeight");
const mapManager_1 = require("./modules/mapManager");
const baseGamemode_1 = require("./modules/baseGamemode");
const score_1 = require("./modules/score");
const lastTouchers_1 = require("./modules/lastTouchers");
const TouchPhase_1 = require("./modules/TouchPhase");
const basicCommands_1 = require("./modules/basicCommands");
const betterChat_1 = require("./modules/betterChat");
const avatarModule_1 = require("./modules/avatarModule");
const automoveModule_1 = require("./modules/automoveModule");
const afkDetection_1 = require("./modules/afkDetection");
const clockTick_1 = require("./modules/clockTick");
const authModule_1 = require("./modules/authModule");
const connector_1 = require("./discord/connector");
const loggerModule_1 = require("./modules/loggerModule");
const votebanModule_1 = require("./modules/votebanModule");
const pointModule_1 = require("./modules/pointModule");
const disableAutoMove_1 = require("./modules/disableAutoMove");
const statusCounter_1 = require("./modules/statusCounter");
const afkCommand_1 = require("./modules/afkCommand");
const recordingSystem_1 = require("./modules/recordingSystem");
const FuraModule_1 = require("./modules/FuraModule");
const reserveModule_1 = require("./modules/reserveModule");
const passCommand_1 = require("./modules/passCommand");
const uniforme_1 = require("./modules/uniforme");
const swapTeamsModule_1 = require("./modules/swapTeamsModule");
const economyModule_1 = require("./modules/economyModule");
const roomManager_1 = require("./modules/roomManager");
function getEnvMode() {
    if (!process.argv[3])
        return "prod";
    return process.argv[2];
}
function getToken() {
    if (!process.argv[3])
        return process.argv[2];
    return process.argv[3];
}
(0, haxball_js_1.default)().then((HBInit) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("[RVC] HaxballJS inicializado");
    try {
        const envMode = getEnvMode();
        const token = getToken();
        if (!token) {
            console.log("[RVC] TOKEN não identificado.");
            return;
        }
        console.log("[RVC] Criando room...");
        const room = new haxball_extended_room_1.Room({
            roomName: settings_json_1.default.roomName,
            maxPlayers: settings_json_1.default.maxPlayers,
            public: envMode == "dev" ? false : true,
            geo: settings_json_1.default.geo,
            token,
        }, HBInit);
        console.log("[RVC] Room criada, adicionando módulos...");
        room.state.devMode = envMode == "dev" ? true : false;
        try {
            const discord = new connector_1.DiscordConnector(process.env.DISCORD_TOKEN || "");
            room.module(avatarModule_1.AvatarModule);
            console.log("[RVC] AvatarModule carregado");
            room.module(lastTouchers_1.ToucherModule);
            room.module(basicCommands_1.BasicCommands);
            room.module(TouchPhase_1.TouchPhaseModule);
            room.module(score_1.ScoreModule);
            room.module(mapManager_1.MapManager);
            room.module(ballHeight_1.ballHeightModule);
            room.module(baseGamemode_1.baseGameMode);
            room.module(betterChat_1.BetterChat);
            room.module(automoveModule_1.AutoMoveModule);
            room.module(afkDetection_1.AntiAfkSystem);
            room.module(clockTick_1.ClockDetector);
            room.module(authModule_1.AuthModule, {
                settings: {
                    discord
                }
            });
            room.module(loggerModule_1.LoggerModule);
            room.module(votebanModule_1.VoteBanModule);
            room.module(pointModule_1.pointModule);
            room.module(disableAutoMove_1.DisableAutoMove);
            room.module(statusCounter_1.StatusCounter);
            room.module(afkCommand_1.AFKCommand);
            room.module(recordingSystem_1.RecordingModule);
            room.module(FuraModule_1.FuraModule);
            room.module(reserveModule_1.ReserveModule);
            room.module(uniforme_1.UniformeModule);
            room.module(passCommand_1.PassCommand);
            room.module(swapTeamsModule_1.SwapTeamsModule);
            room.module(economyModule_1.EconomyModule);
            console.log("[RVC] Todos os módulos carregados");
            // Setup room manager commands
            const roomManager = new roomManager_1.RoomManager();
            discord.setupRoomManagerCommands(roomManager);
            console.log("[RVC] Comandos de gerenciamento de salas configurados");
            room.setTeamColors(1, { angle: 60, textColor: 0xffffff, colors: [0xEAB91B, 0xD6A919, 0xC49B17] });
            room.setTeamColors(2, { angle: 60, textColor: 0xffffff, colors: [0x55EB1F, 0x4DD61C, 0x47C41A] });
            room.logging = false;
            room.onPlayerChat = () => false;
            room.onRoomLink = (link) => __awaiter(void 0, void 0, void 0, function* () {
                console.log("[RVC] Sala aberta: " + link);
            });
            room.onError = (e) => {
                console.error("[RVC] Room Error:", e);
            };
            room.onPlayerJoin = (player) => {
                console.log(`[RVC] ${player.name} entrou na sala`);
            };
            room.onPlayerLeave = (player) => {
                console.log(`[RVC] ${player.name} saiu da sala`);
            };
            console.log("[RVC] Bot inicializado com sucesso!");
        }
        catch (moduleErr) {
            console.error("[RVC] Error loading modules:", moduleErr);
        }
    }
    catch (err) {
        console.error("[RVC] Initialization Error:", err);
    }
})).catch((err) => {
    console.error("[RVC] Haxball Init Error:", err);
});
process.on('unhandledRejection', (reason) => {
    console.error('[RVC] Unhandled Rejection:', reason);
    // Don't exit on error
});
process.on('uncaughtException', (err) => {
    console.error('[RVC] Uncaught Exception:', err);
    // Don't exit on error
});
// Prevent process from exiting
setInterval(() => {
    // Keeps process alive
}, 1000);
