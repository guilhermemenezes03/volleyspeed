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
exports.LoggerModule = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
const settings_json_1 = __importDefault(require("../settings.json"));
const utils_1 = require("../discord/utils");
let LoggerModule = class LoggerModule {
    constructor($) {
        this.$ = $;
        this.chatLogTimeout = null;
        this.messageCache = "";
    }
    onPlayerAuth(player, account) {
        utils_1.DiscordUtil.sendMessageInChannel(settings_json_1.default.discordJoinLog, `'\n\`${player.name}\` (${account ? `<@${account.discordId}>` : ""}) entrou.\n\`AUTH\`: \`${player.auth || ""}\`\n\`IP\`: \`${player.ip || ""}\``);
    }
    onPlayerChat(player, message) {
        const addMsg = `\`${player.name}\`: \`${message}\`\n`;
        const newCache = this.messageCache + addMsg;
        if (newCache.length > 1999) {
            utils_1.DiscordUtil.sendMessageInChannel(settings_json_1.default.discordChatLog, this.messageCache);
            this.messageCache = addMsg;
            this.chatLogTimeout = null;
        }
        else {
            this.messageCache = newCache;
        }
        if (!this.chatLogTimeout) {
            this.chatLogTimeout = setTimeout(() => {
                if (this.messageCache.length > 1 && this.messageCache.length < 1999) {
                    utils_1.DiscordUtil.sendMessageInChannel(settings_json_1.default.discordChatLog, this.messageCache);
                    this.messageCache = "";
                }
                this.chatLogTimeout = null;
            }, 30 * 1000);
        }
    }
};
exports.LoggerModule = LoggerModule;
__decorate([
    haxball_extended_room_1.CustomEvent
], LoggerModule.prototype, "onPlayerAuth", null);
__decorate([
    haxball_extended_room_1.Event
], LoggerModule.prototype, "onPlayerChat", null);
exports.LoggerModule = LoggerModule = __decorate([
    haxball_extended_room_1.Module
], LoggerModule);
