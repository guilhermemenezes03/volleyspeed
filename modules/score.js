"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreModule = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
let ScoreModule = class ScoreModule {
    constructor($) {
        this.$ = $;
        this.$.state.scorePoint = (team) => {
            if (team == 1) {
                this.$.discs[1].xspeed = -5;
            }
            else {
                this.$.discs[1].xspeed = 5;
            }
        };
    }
    onTeamGoal() { this.$.discs[1].xspeed = 0; this.$.discs[1].x = 0; }
    onPositionsReset() { this.$.discs[1].xspeed = 0; this.$.discs[1].x = 0; }
};
exports.ScoreModule = ScoreModule;
__decorate([
    haxball_extended_room_1.Event
], ScoreModule.prototype, "onTeamGoal", null);
__decorate([
    haxball_extended_room_1.Event
], ScoreModule.prototype, "onPositionsReset", null);
exports.ScoreModule = ScoreModule = __decorate([
    haxball_extended_room_1.Module
], ScoreModule);
