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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarModule = void 0;
const haxball_extended_room_1 = require("haxball-extended-room");
const prisma_1 = require("../database/prisma");
// Avatar padrão para todos - não pode ser mudado sem comprar
const DEFAULT_AVATAR = "🏐";
let AvatarModule = class AvatarModule {
    constructor($) {
        this.$ = $;
        // Mapa de avatares equipados por discordId
        this.equippedAvatars = new Map();
        this.$.state.setAvatar = this.setAvatar.bind(this);
        setInterval(() => {
            for (const player of this.$.players.values()) {
                const equipped = this.getPlayerAvatar(player);
                if (player.avatar !== equipped) {
                    this.setAvatarSilently(player, equipped);
                }
            }
        }, 1500);
    }
    setAvatarSilently(player, avatar) {
        player.settings.ignoreAvatarChange = true;
        player.setAvatar(avatar);
        setTimeout(() => {
            player.settings.ignoreAvatarChange = false;
        }, 50);
    }
    /**
     * Carrega o avatar equipado de um jogador do banco de dados
     */
    loadPlayerAvatar(player) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const discordId = (_a = player.settings.account) === null || _a === void 0 ? void 0 : _a.discordId;
            if (!discordId)
                return;
            // Busca compras ativas de avatares
            const avatarPurchase = yield prisma_1.prisma.purchase.findFirst({
                where: {
                    economy: { discordId },
                    item: { category: "avatar" },
                    isActive: true,
                },
                include: { item: true },
                orderBy: { createdAt: "desc" },
            });
            if (avatarPurchase) {
                try {
                    const effect = JSON.parse(avatarPurchase.item.effect);
                    if (effect.emoji) {
                        this.equippedAvatars.set(discordId, effect.emoji);
                    }
                }
                catch (_b) { }
            }
        });
    }
    /**
     * Equipa um avatar comprado
     */
    equipAvatar(player, emoji) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const discordId = (_a = player.settings.account) === null || _a === void 0 ? void 0 : _a.discordId;
            if (!discordId)
                return false;
            // Verifica se o jogador possui este avatar
            const hasPurchase = yield prisma_1.prisma.purchase.findFirst({
                where: {
                    economy: { discordId },
                    item: {
                        category: "avatar",
                        effect: { contains: emoji },
                    },
                    isActive: true,
                },
                include: { item: true },
            });
            if (!hasPurchase)
                return false;
            this.equippedAvatars.set(discordId, emoji);
            return true;
        });
    }
    /**
     * Retorna o avatar equipado ou o padrão
     */
    getPlayerAvatar(player) {
        var _a;
        const discordId = (_a = player.settings.account) === null || _a === void 0 ? void 0 : _a.discordId;
        if (!discordId)
            return DEFAULT_AVATAR;
        return this.equippedAvatars.get(discordId) || DEFAULT_AVATAR;
    }
    /**
     * Lista avatares que o jogador possui
     */
    getOwnedAvatars(discordId) {
        return __awaiter(this, void 0, void 0, function* () {
            const purchases = yield prisma_1.prisma.purchase.findMany({
                where: {
                    economy: { discordId },
                    item: { category: "avatar" },
                    isActive: true,
                },
                include: { item: true },
            });
            return purchases.map(p => {
                try {
                    const effect = JSON.parse(p.item.effect);
                    return {
                        emoji: effect.emoji || "?",
                        name: p.item.name,
                        rarity: p.item.rarity,
                    };
                }
                catch (_a) {
                    return { emoji: "?", name: p.item.name, rarity: "common" };
                }
            });
        });
    }
    setAvatar(player, avatar, priority = false) {
        if (player.settings.priority)
            return;
        this.setAvatarSilently(player, avatar);
        if (player.settings.avatarTimeout)
            clearTimeout(player.settings.avatarTimeout);
        player.settings.priority = priority;
        player.settings.avatarTimeout = setTimeout(() => {
            // Ao resetar, volta para o avatar equipado ou padrão
            const equipped = this.getPlayerAvatar(player);
            this.setAvatarSilently(player, equipped);
            player.settings.avatarTimeout = null;
            player.settings.priorityAvatar = false;
        }, 1000);
    }
    onPlayerAvatarChange(player, avatar) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (player.settings.ignoreAvatarChange)
                return;
            const discordId = (_a = player.settings.account) === null || _a === void 0 ? void 0 : _a.discordId;
            const equipped = this.getPlayerAvatar(player);
            if (avatar === equipped)
                return;
            if (!discordId) {
                this.setAvatarSilently(player, DEFAULT_AVATAR);
                return;
            }
            const hasPurchase = yield prisma_1.prisma.purchase.findFirst({
                where: {
                    economy: { discordId },
                    item: { category: "avatar", effect: { contains: avatar } },
                    isActive: true,
                },
            });
            if (hasPurchase) {
                this.equippedAvatars.set(discordId, avatar);
                return;
            }
            this.setAvatarSilently(player, equipped);
        });
    }
    onPlayerBallKick(player) {
        if (this.$.state.touchPhase == "serveReception") {
            this.setAvatar(player, "😂");
        }
        else if (this.$.state.touchPhase == "fastServeTouch") {
            this.setAvatar(player, "🙌");
        }
        else if (this.$.state.touchPhase == "fastServe") {
            const av = player.team == 1 ? "🤜" : "🤛";
            this.setAvatar(player, av);
        }
        else if (this.$.state.touchPhase == "serve") {
            const av = player.team == 1 ? "🤜" : "🤛";
            this.setAvatar(player, av);
        }
        else if (this.$.state.touchPhase == "reception") {
            this.setAvatar(player, "1");
        }
        else if (this.$.state.touchPhase == "levant") {
            this.setAvatar(player, "2");
        }
        else if (this.$.state.touchPhase == "attack") {
            const av = player.team == 1 ? "🤜" : "🤛";
            this.setAvatar(player, av);
        }
        else if (this.$.state.touchPhase == "attackPurple") {
            this.setAvatar(player, "💜");
        }
    }
    onPlayerJoin(player) {
        return __awaiter(this, void 0, void 0, function* () {
            this.setAvatarSilently(player, DEFAULT_AVATAR);
            yield this.loadPlayerAvatar(player);
            this.setAvatarSilently(player, this.getPlayerAvatar(player));
        });
    }
    onAvatarEquipped(player, emoji) {
        var _a;
        const discordId = (_a = player.settings.account) === null || _a === void 0 ? void 0 : _a.discordId;
        if (!discordId)
            return;
        this.equippedAvatars.set(discordId, emoji);
        this.setAvatarSilently(player, emoji);
    }
};
exports.AvatarModule = AvatarModule;
__decorate([
    haxball_extended_room_1.Event
], AvatarModule.prototype, "onPlayerAvatarChange", null);
__decorate([
    haxball_extended_room_1.Event
], AvatarModule.prototype, "onPlayerBallKick", null);
__decorate([
    haxball_extended_room_1.Event
], AvatarModule.prototype, "onPlayerJoin", null);
__decorate([
    haxball_extended_room_1.CustomEvent
], AvatarModule.prototype, "onAvatarEquipped", null);
exports.AvatarModule = AvatarModule = __decorate([
    haxball_extended_room_1.Module
], AvatarModule);
