// volley.js - Script minimal para haxball-server
// Apenas retorna a configuração da sala

const Settings = require("../settings.json");

module.exports = (HBInit) => {
  return {
    roomName: Settings.roomName,
    maxPlayers: Settings.maxPlayers,
    public: true,
    geo: Settings.geo,
    noPlayer: true
  };
};