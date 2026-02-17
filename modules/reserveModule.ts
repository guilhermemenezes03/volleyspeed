import { Module, Player, Room } from "haxball-extended-room";
import { RoomState } from "../roomState";

@Module
export class ReserveModule {
  constructor(private $: Room<RoomState>) {
    this.$.customEvents.on("onPlayerAuth", (player: Player) => {
      const playersSize = this.$.players.size;
      console.log(`[ReserveModule] ${player.name} - Players: ${playersSize}, VIP: ${player.hasRole("vip")}`);
      // Reserva 2 vagas para VIPs (10 de 12 jogadores)
      if (playersSize >= 10) {
        if (!player.hasRole("vip")) {
          player.kick("Vaga reservada para vips.");
        }
      }
    });
  }
}