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
exports.ballHeightModule = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
const settings_json_1 = __importDefault(require("../settings.json"));
let ballHeightModule = class ballHeightModule {
    constructor($) {
        this.$ = $;
        this.currentBallChange = null;
        this.counting = false;
        this.ballCountdown = 0;
        this.baseBallRadius = 0;
        // Purple phase control
        this.purplePhaseActive = false;
        this.purplePhaseTicks = 0;
        this.purplePhaseTriggered = false;
        this.maxHeightReached = 0;
        this.$.state.setBallChange = (change) => {
            if (!this.counting)
                return;
            this.baseBallRadius = this.$.ball.radius || 0;
            this.currentBallChange = change;
            this.ballCountdown = 0;
            // Reset purple phase tracking on new ball change
            if (change.type == "up") {
                this.purplePhaseTriggered = false;
                this.purplePhaseActive = false;
                this.purplePhaseTicks = 0;
                this.maxHeightReached = 0;
            }
        };
    }
    isBallInFinalHeight(ballRadius, finalHeight) {
        return ballRadius - this.baseBallRadius >= finalHeight;
    }
    onGameTick() {
        // Handle purple phase duration (400ms = 24 ticks)
        if (this.purplePhaseActive) {
            this.purplePhaseTicks++;
            if (this.purplePhaseTicks >= 24) {
                // Return to attack phase after 400ms
                this.purplePhaseActive = false;
                this.purplePhaseTicks = 0;
                this.$.state.setTouchPhase("attack");
            }
        }
        if (!this.currentBallChange)
            return;
        const ball = this.$.ball;
        if (!ball.radius)
            return;
        // Track max height during attack phase
        if (this.$.state.touchPhase == "attack" && this.currentBallChange.type == "up") {
            if (ball.radius > this.maxHeightReached) {
                this.maxHeightReached = ball.radius;
            }
        }
        // Trigger purple phase at half of descent (only during attack, when going down)
        if (this.$.state.touchPhase == "attack" &&
            this.currentBallChange.type == "down" &&
            !this.purplePhaseTriggered &&
            this.maxHeightReached > 0) {
            const baseRadius = settings_json_1.default.mapSettings[this.$.state.currentMap].ballRadius;
            const midPoint = (this.maxHeightReached + baseRadius) / 2;
            if (ball.radius <= midPoint) {
                this.purplePhaseTriggered = true;
                this.purplePhaseActive = true;
                this.purplePhaseTicks = 0;
                this.$.state.setTouchPhase("attackPurple");
            }
        }
        if ((this.currentBallChange.type == "up" &&
            this.isBallInFinalHeight(ball.radius, this.currentBallChange.height)) ||
            (this.currentBallChange.type == "down" &&
                ball.radius <= this.currentBallChange.height) ||
            (this.currentBallChange.type == "up" &&
                ball.radius >= settings_json_1.default.gameMode.maxBallRadius)) {
            const count = this.$.state.ignoreBallCount ? 15 : 30;
            if (this.ballCountdown < count) {
                this.ballCountdown++;
                return;
            }
            this.ballCountdown = 0;
            ball.radius =
                (this.currentBallChange.type == "up" && ball.radius) ||
                    this.currentBallChange.height;
            const info = Object.assign({}, this.currentBallChange);
            this.currentBallChange = null;
            this.$.customEvents.emit("onBallHeightEnd", info);
            return;
        }
        this.ballCountdown = 0;
        const coeff = this.currentBallChange.type == "down" ? -1 : 1;
        let newBallRadius = ball.radius + this.currentBallChange.increaseRate * coeff;
        if (newBallRadius > settings_json_1.default.gameMode.maxBallRadius)
            newBallRadius = settings_json_1.default.gameMode.maxBallRadius;
        ball.radius = newBallRadius;
    }
    onBallHeightEnd(info) {
        if (info.type == "down")
            return;
        this.currentBallChange = {
            type: "down",
            increaseRate: settings_json_1.default.gameMode.defaultDownRate,
            height: settings_json_1.default.mapSettings[this.$.state.currentMap].ballRadius,
        };
    }
    onBallChangeSide() {
        if (!this.currentBallChange)
            return;
        if (this.currentBallChange.type == "up")
            return;
        const ball = this.$.ball;
        if (!ball || !ball.radius)
            return;
        if (ball.radius >= 7.5)
            return;
        this.$.state.setBallChange({
            type: "up",
            increaseRate: this.currentBallChange.increaseRate,
            height: 0.1,
        });
    }
    resetPurplePhase() {
        this.purplePhaseActive = false;
        this.purplePhaseTicks = 0;
        this.purplePhaseTriggered = false;
        this.maxHeightReached = 0;
    }
    onGameStart() {
        this.currentBallChange = null;
        this.counting = true;
        this.resetPurplePhase();
    }
    onTeamGoal() {
        this.currentBallChange = null;
        this.counting = false;
        this.resetPurplePhase();
    }
    onPositionsReset() {
        this.currentBallChange = null;
        this.counting = true;
        this.resetPurplePhase();
    }
};
exports.ballHeightModule = ballHeightModule;
__decorate([
    haxball_extended_room_1.Event
], ballHeightModule.prototype, "onGameTick", null);
__decorate([
    haxball_extended_room_1.CustomEvent
], ballHeightModule.prototype, "onBallHeightEnd", null);
__decorate([
    haxball_extended_room_1.CustomEvent
], ballHeightModule.prototype, "onBallChangeSide", null);
__decorate([
    haxball_extended_room_1.Event
], ballHeightModule.prototype, "onGameStart", null);
__decorate([
    haxball_extended_room_1.Event
], ballHeightModule.prototype, "onTeamGoal", null);
__decorate([
    haxball_extended_room_1.Event
], ballHeightModule.prototype, "onPositionsReset", null);
exports.ballHeightModule = ballHeightModule = __decorate([
    haxball_extended_room_1.Module
], ballHeightModule);
