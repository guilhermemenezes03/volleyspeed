"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntiAfkSystem = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
const settings_json_1 = __importDefault(require("../settings.json"));
let AntiAfkSystem = class AntiAfkSystem {
    constructor($) {
        this.$ = $;
    }
    onClockTick() {
        if (settings_json_1.default.afkTimeLimit == 0)
            return;
        let teams = this.$.players.teams();
        if (teams.size <= 2)
            return;
        if (this.$.state.disableAfkDetectionForBlue)
            teams = this.$.players.red();
        for (const p of teams) {
            if (!p.settings.afkTime)
                p.settings.afkTime = 0;
            p.settings.afkTime++;
            if (p.settings.afkTime == Math.trunc(settings_json_1.default.afkTimeLimit / 2))
                p.reply({
                    message: `[💤] Ei, ${p.name}! Você está por aí? Dê algum sinal de vida.`,
                    sound: 2,
                    style: "bold",
                    color: haxball_extended_room_1.Colors.LightYellow
                });
            if (p.settings.afkTime >= settings_json_1.default.afkTimeLimit)
                p.kick("Você ficou AFK durante a jogatina.");
        }
    }
    onPlayerTeamChange(changedPlayer) {
        changedPlayer.settings.afkTime = 0;
    }
    onPlayerActivity(player) {
        player.settings.afkTime = 0;
    }
};
exports.AntiAfkSystem = AntiAfkSystem;
__decorate([
    haxball_extended_room_1.CustomEvent
], AntiAfkSystem.prototype, "onClockTick", null);
__decorate([
    haxball_extended_room_1.Event
], AntiAfkSystem.prototype, "onPlayerTeamChange", null);
__decorate([
    haxball_extended_room_1.Event
], AntiAfkSystem.prototype, "onPlayerActivity", null);
exports.AntiAfkSystem = AntiAfkSystem = __decorate([
    haxball_extended_room_1.Module
], AntiAfkSystem);
