// volley.js - Script para haxball-server
// Este arquivo carrega e executa o bot RVC Volley

const path = require('path');

// Caminho para o index.js compilado do bot
const botPath = path.join(__dirname, '../index.js');

module.exports = (HBInit) => {
  // Carregar o bot principal
  const botModule = require(botPath);

  // Retornar a configuração da sala
  return {
    roomName: "🏐   | Vôlei X3 | SPEEDvolley |   🤾‍♀️",
    maxPlayers: 12,
    public: true,
    geo: { lat: -22, lon: -43, code: "ES" },
    token: process.argv[2] || process.env.HAXBALL_TOKEN,
    noPlayer: true
  };
};