"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisableAutoMove = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
const automoveModule_1 = require("./automoveModule");
let DisableAutoMove = class DisableAutoMove {
    constructor($) {
        this.$ = $;
        this.disabled = false;
    }
    disableMove(command) {
        if (this.disabled) {
            this.$.module(automoveModule_1.AutoMoveModule);
        }
        else {
            this.$.removeModule(automoveModule_1.AutoMoveModule);
        }
        this.disabled = !this.disabled;
        command.player.reply({ message: `${this.disabled ? "desativado" : "ativado"}` });
    }
};
exports.DisableAutoMove = DisableAutoMove;
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["disablemove"],
        roles: ["admin"]
    })
], DisableAutoMove.prototype, "disableMove", null);
exports.DisableAutoMove = DisableAutoMove = __decorate([
    haxball_extended_room_1.Module
], DisableAutoMove);
