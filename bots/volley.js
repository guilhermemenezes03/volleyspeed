// volley.js - Script para haxball-server
// Carrega todos os módulos do bot RVC Volley

const Settings = require("../settings.json");
const { Room } = require("haxball-extended-room");

// Importar todos os módulos
const { ballHeightModule } = require("../dist/modules/ballHeight");
const { MapManager } = require("../dist/modules/mapManager");
const { baseGameMode } = require("../dist/modules/baseGamemode");
const { ScoreModule } = require("../dist/modules/score");
const { ToucherModule } = require("../dist/modules/lastTouchers");
const { TouchPhaseModule } = require("../dist/modules/TouchPhase");
const { BasicCommands } = require("../dist/modules/basicCommands");
const { BetterChat } = require("../dist/modules/betterChat");
const { AvatarModule } = require("../dist/modules/avatarModule");
const { AutoMoveModule } = require("../dist/modules/automoveModule");
const { AntiAfkSystem } = require("../dist/modules/afkDetection");
const { ClockDetector } = require("../dist/modules/clockTick");
const { AuthModule } = require("../dist/modules/authModule");
const { DiscordConnector } = require("../dist/discord/connector");
const { LoggerModule } = require("../dist/modules/loggerModule");
const { VoteBanModule } = require("../dist/modules/votebanModule");
const { pointModule } = require("../dist/modules/pointModule");
const { DisableAutoMove } = require("../dist/modules/disableAutoMove");
const { StatusCounter } = require("../dist/modules/statusCounter");
const { AFKCommand } = require("../dist/modules/afkCommand");
const { RecordingModule } = require("../dist/modules/recordingSystem");
const { FuraModule } = require("../dist/modules/FuraModule");
const { ReserveModule } = require("../dist/modules/reserveModule");
const { PassCommand } = require("../dist/modules/passCommand");
const { UniformeModule } = require("../dist/modules/uniforme");
const { SwapTeamsModule } = require("../dist/modules/swapTeamsModule");
const { EconomyModule } = require("../dist/modules/economyModule");

module.exports = (HBInit) => {
  console.log("[RVC] Iniciando sala via haxball-server...");
  
  // Criar a room com haxball-extended-room
  const room = new Room(
    {
      roomName: Settings.roomName,
      maxPlayers: Settings.maxPlayers,
      public: true,
      geo: Settings.geo,
    },
    HBInit
  );

  console.log("[RVC] Room criada, carregando módulos...");

  try {
    const discord = new DiscordConnector(process.env.DISCORD_TOKEN || "");

    // Carregar todos os módulos na ordem correta
    room.module(AvatarModule);
    room.module(ToucherModule);
    room.module(BasicCommands);
    room.module(TouchPhaseModule);
    room.module(ScoreModule);
    room.module(MapManager);
    room.module(ballHeightModule);
    room.module(baseGameMode);
    room.module(BetterChat);
    room.module(AutoMoveModule);
    room.module(AntiAfkSystem);
    room.module(ClockDetector);
    room.module(AuthModule, {
      settings: {
        discord
      }
    });
    room.module(LoggerModule);
    room.module(VoteBanModule);
    room.module(pointModule);
    room.module(DisableAutoMove);
    room.module(StatusCounter);
    room.module(AFKCommand);
    room.module(RecordingModule);
    room.module(FuraModule);
    room.module(ReserveModule);
    room.module(UniformeModule);
    room.module(PassCommand);
    room.module(SwapTeamsModule);
    room.module(EconomyModule);

    console.log("[RVC] Todos os módulos carregados com sucesso!");

    room.setTeamColors(1, { angle: 60, textColor: 0xffffff, colors: [0xEAB91B, 0xD6A919, 0xC49B17] });
    room.setTeamColors(2, { angle: 60, textColor: 0xffffff, colors: [0x55EB1F, 0x4DD61C, 0x47C41A] });

    room.logging = false;
    room.onPlayerChat = () => false;

    room.onRoomLink = (link) => {
      console.log("[RVC] Sala aberta: " + link);
    };

    room.onError = (e) => {
      console.error("[RVC] Room Error:", e);
    };

    room.onPlayerJoin = (player) => {
      console.log(`[RVC] ${player.name} entrou na sala`);
    };

    room.onPlayerLeave = (player) => {
      console.log(`[RVC] ${player.name} saiu da sala`);
    };

    console.log("[RVC] Bot RVC Volley inicializado com sucesso!");
  } catch (err) {
    console.error("[RVC] Erro ao carregar módulos:", err);
  }
};