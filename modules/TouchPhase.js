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
exports.TouchPhaseModule = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
const settings_json_1 = __importDefault(require("../settings.json"));
const phases = settings_json_1.default.gameMode.phases;
let TouchPhaseModule = class TouchPhaseModule {
    constructor($) {
        this.$ = $;
        this.$.state.setTouchPhase = (phase, player) => {
            const ball = this.$.ball;
            ball.invMass = phases[this.$.state.currentMap][phase].invMass;
            const color = phases[this.$.state.currentMap][phase].color;
            if (color)
                ball.color = parseInt(color, 16);
            else
                ball.color = parseInt(settings_json_1.default.defaultBallColor, 16);
            this.$.state.touchPhase = phase;
            this.$.customEvents.emit("onTouchPhaseChange", phase, player);
        };
    }
    onPositionsReset() {
        this.$.discs[1].xspeed = 0;
        this.$.discs[1].x = 0;
    }
    onPlayerBallKick() {
        const touchPhase = this.$.state.touchPhase;
        const increaseRate = phases[this.$.state.currentMap][touchPhase].increaseRate;
        const height = phases[this.$.state.currentMap][touchPhase].height;
        this.$.state.setBallChange({ type: "up", increaseRate, height });
    }
};
exports.TouchPhaseModule = TouchPhaseModule;
__decorate([
    haxball_extended_room_1.Event
], TouchPhaseModule.prototype, "onPositionsReset", null);
__decorate([
    haxball_extended_room_1.Event
], TouchPhaseModule.prototype, "onPlayerBallKick", null);
exports.TouchPhaseModule = TouchPhaseModule = __decorate([
    haxball_extended_room_1.Module
], TouchPhaseModule);
