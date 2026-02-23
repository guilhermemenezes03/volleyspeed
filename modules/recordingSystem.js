"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordingModule = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
const utils_1 = require("../discord/utils");
const settings_json_1 = __importDefault(require("../settings.json"));
const discord_js_1 = require("discord.js");
let RecordingModule = class RecordingModule {
    constructor($) {
        this.$ = $;
        this.recording = false;
    }
    pad(number) {
        return number < 10 ? "0" + number : "" + number;
    }
    onGameStart() {
        if (this.recording)
            this.$.stopRecording();
        this.$.startRecording();
        this.recording = true;
    }
    onTeamVictory(redScore, blueScore, players) {
        return __awaiter(this, void 0, void 0, function* () {
            const recording = this.$.stopRecording();
            if (!recording)
                return;
            const file = Buffer.from(recording);
            const redPlayers = players.filter(p => p.team == 1).map(p => p.name).join("\n") || "Vazio";
            const bluePlayers = players.filter(p => p.team == 2).map(p => p.name).join("\n") || "Vazio";
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(haxball_extended_room_1.Colors.Red)
                .setTitle(`🔴 VERMELHO ${redScore} x ${blueScore} AZUL 🔵`)
                .addFields({ name: '🔴 Time vermelho', value: redPlayers, inline: true }, { name: '\u200B', value: '\u200B', inline: true }, { name: '🔵 Time azul', value: bluePlayers, inline: true });
            const date = new Date();
            const dateFormatted = `${this.pad(date.getHours())}:${this.pad(date.getMinutes())}-${this.pad(date.getDate())}-${this.pad(date.getMonth())}-${date.getFullYear()}`;
            const name = dateFormatted + ".hbr2";
            yield utils_1.DiscordUtil.uploadFileToChannel(settings_json_1.default.discordRecordingChannel, file, name, "", embed);
        });
    }
};
exports.RecordingModule = RecordingModule;
__decorate([
    haxball_extended_room_1.Event
], RecordingModule.prototype, "onGameStart", null);
__decorate([
    haxball_extended_room_1.CustomEvent
], RecordingModule.prototype, "onTeamVictory", null);
exports.RecordingModule = RecordingModule = __decorate([
    haxball_extended_room_1.Module
], RecordingModule);
