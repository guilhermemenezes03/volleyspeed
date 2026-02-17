// src/modules/UniformeModule.ts
import { Colors, CommandExecInfo, Event, Module, ModuleCommand, Player, Room } from "haxball-extended-room";
import { prisma } from "../database/prisma";

@Module
export class UniformeModule {
  playersUsing: number[][] = [];

  constructor(private $: Room) {}

  @Event
  onPlayerLeave(player: Player) {
    if (this.playersUsing.map(p => p[0]).includes(player.id)) {
      const index = this.playersUsing.map(p => p[0]).indexOf(player.id);
      if (this.playersUsing[index][1] == 1) {
        this.$.setTeamColors(1, { angle: 60, textColor: 0xffffff, colors: [0xEAB91B, 0xD6A919, 0xC49B17] });
      } else {
        this.$.setTeamColors(2, { angle: 60, textColor: 0xffffff, colors: [0x55EB1F, 0x4DD61C, 0x47C41A] });
      }
      this.playersUsing.splice(index, 1);
    }
  }

  @Event
  onPlayerTeamChange(player: Player) {
    if (this.playersUsing.map(p => p[0]).includes(player.id)) {
      const index = this.playersUsing.map(p => p[0]).indexOf(player.id);
      if (this.playersUsing[index][1] == 1) {
        this.$.setTeamColors(1, { angle: 60, textColor: 0xffffff, colors: [0xEAB91B, 0xD6A919, 0xC49B17] });
      } else {
        this.$.setTeamColors(2, { angle: 60, textColor: 0xffffff, colors: [0x55EB1F, 0x4DD61C, 0x47C41A] });
      }
      this.playersUsing.splice(index, 1);
    }
  }

  @ModuleCommand({
    aliases: ["uni"]
    // Removido o 'roles: ["vip"]' para permitir que qualquer jogador use o comando
  })
  async setUni(command: CommandExecInfo) {
    if (command.player.team == 0) {
      command.player.reply({ message: "Você precisa estar em um time para usar este comando." });
      return;
    }
    if (!command.arguments[0] || !command.arguments[0].toString()) {
      command.player.reply({ message: "Por favor, insira o nome do uniforme." });
      return;
    }
    if (!command.player.settings.account?.discordId) {
      command.player.reply({ message: "Você precisa estar logado para usar esta função." });
      return;
    }
    const uniname = command.arguments[0].toString();
    const unicode = await prisma.uniforme.findFirst({
      where: {
        name: uniname,
        userId: command.player.settings.account.discordId
      }
    });
    if (!unicode) {
      command.player.reply({ message: "Uniforme não encontrado." });
      return;
    }
    const unicodeSplit = unicode.code.split(" ");
    const angle = Number(unicodeSplit[0]);
    const textColor = parseInt(unicodeSplit[1], 16);
    const colors = unicodeSplit.splice(2).map((color) => parseInt(color, 16));
    this.$.setTeamColors(command.player.team, {
      angle,
      colors,
      textColor
    });
    this.$.send({
      message: `[💎] Uniforme do ${command.player.team == 1 ? "vermelho" : "azul"} alterado por ${command.player.name} para ${uniname}.`
    });
    this.playersUsing.push([command.player.id, command.player.team]);
  }
}