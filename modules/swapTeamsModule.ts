// src/modules/swapTeamsModule.ts
import { Colors, CommandExecInfo, Module, ModuleCommand, Room } from "haxball-extended-room";
import { RoomState } from "../roomState";

@Module
export class SwapTeamsModule {
  constructor(private $: Room<RoomState>) {}

  @ModuleCommand({
    aliases: ["swapteams", "trocar-times"],
    deleteMessage: true
  })
  swapTeamsCommand(command: CommandExecInfo) {
    // Verificar se o jogador é administrador
    if (!command.player.admin) {
      command.player.reply({
        message: "[⚠] Apenas administradores podem usar este comando!",
        color: Colors.Red
      });
      return;
    }

    // Pegar todos os jogadores em times (exclui spectators)
    const players = this.$.players.teams().values();

    // Inverter os times usando a API nativa
    for (const player of players) {
      if (player.team === 1) {
        this.$.native.setPlayerTeam(player.id, 2); // Red -> Blue
      } else if (player.team === 2) {
        this.$.native.setPlayerTeam(player.id, 1); // Blue -> Red
      }
    }

    // Enviar mensagem de confirmação
    this.$.send({
      message: "[🔄] Os times foram invertidos!",
      color: Colors.Green
    });
  }
}