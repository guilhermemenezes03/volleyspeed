"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassCommand = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
let PassCommand = class PassCommand {
    constructor($) {
        this.$ = $;
    }
    setPassword(command) {
        var _a;
        if (!((_a = command.player.topRole) === null || _a === void 0 ? void 0 : _a.admin)) {
            command.player.reply({ message: `[🔒] Você não tem permissão para alterar a senha da sala!`, color: haxball_extended_room_1.Colors.IndianRed });
            return;
        }
        const args = command.arguments;
        if (args.length === 0) {
            this.$.setPassword(null);
            this.$.send({ message: `[🔓] A senha da sala foi removida!`, color: haxball_extended_room_1.Colors.LimeGreen });
        }
        else {
            const password = args.join(" ");
            this.$.setPassword(password);
            this.$.send({ message: `[🔒] A senha da sala foi definida!`, color: haxball_extended_room_1.Colors.Orange });
        }
    }
};
exports.PassCommand = PassCommand;
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["senha", "password", "pass"],
        deleteMessage: true
    })
], PassCommand.prototype, "setPassword", null);
exports.PassCommand = PassCommand = __decorate([
    haxball_extended_room_1.Module
], PassCommand);
