"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToucherModule = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
let ToucherModule = class ToucherModule {
    constructor($) {
        this.$ = $;
        this.$.state.removeLastTouch = () => {
            const [last, ...rest] = this.$.state.touchers || [];
            this.$.state.touchers = rest;
        };
    }
    addNewToucher(player) {
        const touchers = this.$.state.touchers || [];
        this.$.state.touchers = [player, ...touchers];
    }
    addNewAbsToucher(player) {
        const absTouchers = this.$.state.absTouchers || [];
        this.$.state.absTouchers = [player, ...absTouchers];
    }
    onPlayerBallKick(player) {
        this.addNewAbsToucher(player);
        if (this.$.state.touchPhase == "fastServeTouch")
            return;
        this.addNewToucher(player);
    }
    onGameStart() {
        this.$.state.touchers = [];
        this.$.state.absTouchers = [];
    }
    onPositionsReset() {
        this.$.state.touchers = [];
        this.$.state.absTouchers = [];
    }
};
exports.ToucherModule = ToucherModule;
__decorate([
    haxball_extended_room_1.Event
], ToucherModule.prototype, "onPlayerBallKick", null);
__decorate([
    haxball_extended_room_1.Event
], ToucherModule.prototype, "onGameStart", null);
__decorate([
    haxball_extended_room_1.Event
], ToucherModule.prototype, "onPositionsReset", null);
exports.ToucherModule = ToucherModule = __decorate([
    haxball_extended_room_1.Module
], ToucherModule);
