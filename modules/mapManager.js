"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.MapManager = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
let MapManager = class MapManager {
    constructor($) {
        this.$ = $;
        this.changeMapTo("volleyx3");
    }
    getJsonFromMap(filename) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    const mapsFolder = path_1.default.resolve(__dirname, "../maps");
                    const filePath = path_1.default.join(mapsFolder, filename);
                    fs.readFile(filePath, (err, data) => {
                        if (err)
                            reject(err);
                        if (!data)
                            return reject("Couldn't find file.");
                        const fileContent = data.toString() || "";
                        const finalMapContent = fileContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
                        try {
                            const content = JSON.parse(finalMapContent);
                            resolve(content);
                        }
                        catch (e) {
                            reject("Couldn't read file.");
                            return e;
                        }
                    });
                }
                catch (e) {
                    reject("Couldn't read file.");
                    return e;
                }
            });
        });
    }
    onPlayerJoin() {
        // Mapa fixo em volleyx3 para modo 3x3
    }
    onPlayerLeave() {
        // Mapa fixo em volleyx3 para modo 3x3
    }
    changeMapTo(mapName) {
        if (this.$.state.currentMap == mapName)
            return;
        this.$.state.currentMap = mapName;
        this.$.stop();
        this.$.setScoreLimit(0);
        this.$.setTimeLimit(0);
        this.$.lockTeams();
        this.getJsonFromMap(mapName + ".json").then((stadium) => {
            this.$.stop();
            this.$.setStadium(stadium);
            this.$.start();
        });
    }
    onStadiumChange(stadiumName, player) {
        var _a;
        if (!player)
            return;
        if (!((_a = player.topRole) === null || _a === void 0 ? void 0 : _a.admin))
            this.changeMapTo(this.$.state.currentMap);
    }
};
exports.MapManager = MapManager;
__decorate([
    haxball_extended_room_1.Event
], MapManager.prototype, "onPlayerJoin", null);
__decorate([
    haxball_extended_room_1.Event
], MapManager.prototype, "onPlayerLeave", null);
__decorate([
    haxball_extended_room_1.Event
], MapManager.prototype, "onStadiumChange", null);
exports.MapManager = MapManager = __decorate([
    haxball_extended_room_1.Module
], MapManager);
