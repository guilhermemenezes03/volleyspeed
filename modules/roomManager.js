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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
// roomManager.ts - Módulo para gerenciar múltiplas salas via PM2
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const ROOMS = [
    { name: "Sala 1", token: "", id: "sala1" },
    { name: "Sala 2", token: "", id: "sala2" },
    { name: "Sala 3", token: "", id: "sala3" }
];
class RoomManager {
    constructor() {
        this.runningRooms = new Map();
    }
    openRoom(roomId, token, channel) {
        return __awaiter(this, void 0, void 0, function* () {
            const room = ROOMS.find(r => r.id === roomId);
            if (!room) {
                return channel.send("❌ Sala inválida!");
            }
            if (this.runningRooms.has(roomId)) {
                return channel.send(`❌ ${room.name} já está aberta!`);
            }
            try {
                channel.send(`⏳ Abrindo ${room.name}...`);
                const { stdout } = yield execAsync(`pm2 start dist/index.js --name ${roomId} -- prod ${token}`);
                this.runningRooms.set(roomId, token);
                return channel.send(`✅ ${room.name} aberta com sucesso!`);
            }
            catch (err) {
                return channel.send(`❌ Erro ao abrir sala: ${err.message}`);
            }
        });
    }
    closeRoom(roomId, channel) {
        return __awaiter(this, void 0, void 0, function* () {
            const room = ROOMS.find(r => r.id === roomId);
            if (!room) {
                return channel.send("❌ Sala inválida!");
            }
            if (!this.runningRooms.has(roomId)) {
                return channel.send(`❌ ${room.name} não está aberta!`);
            }
            try {
                yield execAsync(`pm2 delete ${roomId}`);
                this.runningRooms.delete(roomId);
                return channel.send(`✅ ${room.name} fechada!`);
            }
            catch (err) {
                return channel.send(`❌ Erro ao fechar sala: ${err.message}`);
            }
        });
    }
    listRooms(channel) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { stdout } = yield execAsync("pm2 jlist");
                const processes = JSON.parse(stdout);
                let status = "**📊 Status das Salas:**\n\n";
                for (const room of ROOMS) {
                    const proc = processes.find((p) => p.name === room.id);
                    if (proc) {
                        const uptime = Math.floor((Date.now() - proc.pm2_env.pm_uptime) / 1000);
                        const memory = (proc.monit.memory / 1024 / 1024).toFixed(2);
                        status += `✅ **${room.name}** (${room.id})\n`;
                        status += `   └ Uptime: ${uptime}s | RAM: ${memory}MB\n\n`;
                    }
                    else {
                        status += `⭕ **${room.name}** (${room.id})\n`;
                        status += `   └ Offline\n\n`;
                    }
                }
                return channel.send(status);
            }
            catch (err) {
                return channel.send(`❌ Erro: ${err.message}`);
            }
        });
    }
    closeAll(channel) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield execAsync("pm2 delete all");
                this.runningRooms.clear();
                return channel.send("🛑 Todas as salas foram fechadas!");
            }
            catch (err) {
                return channel.send(`❌ Erro: ${err.message}`);
            }
        });
    }
}
exports.RoomManager = RoomManager;
