// volley.js - Script para haxball-server
// Este arquivo configura e executa o bot RVC Volley

HBInit({
  roomName: "🏐   | Vôlei X3 | SPEEDvolley |   🤾‍♀️",
  maxPlayers: 12,
  public: true,
  geo: { lat: -22, lon: -43, code: "ES" },
  token: null, // Token será passado pelo haxball-server
  noPlayer: true
}).then((room) => {
  room.send({
    message: "[✅] RVC Volley Bot iniciado com sucesso!",
    color: 0x00FF00
  });
  
  console.log("[RVC] Sala aberta com sucesso!");
}).catch((err) => {
  console.error("[RVC] Erro ao iniciar a sala:", err);
});