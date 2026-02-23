// volley.js - Script para haxball-server
// Usa as APIs nativas do Haxball sem haxball-extended-room

const Settings = require("../settings.json");

module.exports = (HBInit) => {
  console.log("[RVC] Iniciando sala via haxball-server...");
  
  // Criar a room com as configurações padrão
  HBInit({
    roomName: Settings.roomName,
    maxPlayers: Settings.maxPlayers,
    public: true,
    geo: Settings.geo,
    noPlayer: true
  }).then((room) => {
    console.log("[RVC] Sala criada com sucesso!");
    
    // Configurar cores dos times
    room.setTeamColors(1, { angle: 60, textColor: 0xffffff, colors: [0xEAB91B, 0xD6A919, 0xC49B17] });
    room.setTeamColors(2, { angle: 60, textColor: 0xffffff, colors: [0x55EB1F, 0x4DD61C, 0x47C41A] });

    console.log("[RVC] Bot RVC Volley inicializado com sucesso!");

    // Callbacks básicos
    room.onPlayerJoin = (player) => {
      console.log(`[RVC] ${player.name} entrou na sala`);
    };

    room.onPlayerLeave = (player) => {
      console.log(`[RVC] ${player.name} saiu da sala`);
    };

    room.onRoomLink = (link) => {
      console.log("[RVC] Sala aberta: " + link);
    };

  }).catch((err) => {
    console.error("[RVC] Erro ao iniciar sala:", err);
  });
};