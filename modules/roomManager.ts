// roomManager.ts - Módulo para gerenciar múltiplas salas via PM2
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface RoomConfig {
  name: string;
  token: string;
  id: string;
}

const ROOMS: RoomConfig[] = [
  { name: "Sala 1", token: "", id: "sala1" },
  { name: "Sala 2", token: "", id: "sala2" },
  { name: "Sala 3", token: "", id: "sala3" }
];

export class RoomManager {
  private runningRooms = new Map<string, string>();

  async openRoom(roomId: string, token: string, channel: any) {
    const room = ROOMS.find(r => r.id === roomId);
    if (!room) {
      return channel.send("❌ Sala inválida!");
    }

    if (this.runningRooms.has(roomId)) {
      return channel.send(`❌ ${room.name} já está aberta!`);
    }

    try {
      channel.send(`⏳ Abrindo ${room.name}...`);
      
      const { stdout } = await execAsync(
        `pm2 start dist/index.js --name ${roomId} -- prod ${token}`
      );
      
      this.runningRooms.set(roomId, token);
      return channel.send(`✅ ${room.name} aberta com sucesso!`);
    } catch (err: any) {
      return channel.send(`❌ Erro ao abrir sala: ${err.message}`);
    }
  }

  async closeRoom(roomId: string, channel: any) {
    const room = ROOMS.find(r => r.id === roomId);
    if (!room) {
      return channel.send("❌ Sala inválida!");
    }

    if (!this.runningRooms.has(roomId)) {
      return channel.send(`❌ ${room.name} não está aberta!`);
    }

    try {
      await execAsync(`pm2 delete ${roomId}`);
      this.runningRooms.delete(roomId);
      return channel.send(`✅ ${room.name} fechada!`);
    } catch (err: any) {
      return channel.send(`❌ Erro ao fechar sala: ${err.message}`);
    }
  }

  async listRooms(channel: any) {
    try {
      const { stdout } = await execAsync("pm2 jlist");
      const processes = JSON.parse(stdout);

      let status = "**📊 Status das Salas:**\n\n";
      
      for (const room of ROOMS) {
        const proc = processes.find((p: any) => p.name === room.id);
        
        if (proc) {
          const uptime = Math.floor((Date.now() - proc.pm2_env.pm_uptime) / 1000);
          const memory = (proc.monit.memory / 1024 / 1024).toFixed(2);
          status += `✅ **${room.name}** (${room.id})\n`;
          status += `   └ Uptime: ${uptime}s | RAM: ${memory}MB\n\n`;
        } else {
          status += `⭕ **${room.name}** (${room.id})\n`;
          status += `   └ Offline\n\n`;
        }
      }

      return channel.send(status);
    } catch (err: any) {
      return channel.send(`❌ Erro: ${err.message}`);
    }
  }

  async closeAll(channel: any) {
    try {
      await execAsync("pm2 delete all");
      this.runningRooms.clear();
      return channel.send("🛑 Todas as salas foram fechadas!");
    } catch (err: any) {
      return channel.send(`❌ Erro: ${err.message}`);
    }
  }
}
