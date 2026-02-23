"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClockDetector = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
let ClockDetector = class ClockDetector {
    constructor($) {
        this.$ = $;
        this.lastTime = 0;
    }
    onGameTick() {
        var _a;
        const time = Math.trunc((_a = this.$.scores) === null || _a === void 0 ? void 0 : _a.time) || 0;
        if (time != this.lastTime) {
            this.$.customEvents.emit('onClockTick', time);
            this.lastTime = time;
        }
    }
    onGameStart() {
        this.lastTime = 0;
    }
};
exports.ClockDetector = ClockDetector;
__decorate([
    haxball_extended_room_1.Event
], ClockDetector.prototype, "onGameTick", null);
__decorate([
    haxball_extended_room_1.Event
], ClockDetector.prototype, "onGameStart", null);
exports.ClockDetector = ClockDetector = __decorate([
    haxball_extended_room_1.Module
], ClockDetector);
