"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReserveModule = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
let ReserveModule = class ReserveModule {
    constructor($) {
        this.$ = $;
        this.$.customEvents.on("onPlayerAuth", (player) => {
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
};
exports.ReserveModule = ReserveModule;
exports.ReserveModule = ReserveModule = __decorate([
    haxball_extended_room_1.Module
], ReserveModule);
