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
exports.FuraModule = void 0;
// src/modules/furaModule.ts
const haxball_extended_room_1 = require("haxball-extended-room");
const prisma_1 = require("../database/prisma");
const messageFormatter_1 = require("./messageFormatter");
const MS_IN_MINUTE = 1000 * 60;
const COOLDOWN_MINUTES = 90; // 1 hora e meia
const DAILY_LIMIT_VIP = 3;
let FuraModule = class FuraModule {
    constructor($) {
        this.$ = $;
        this.cache = {};
    }
    /**
     * Verifica se o jogador tem furafila comprado na loja (usa consumível)
     */
    hasPurchasedFurafila(discordId) {
        return __awaiter(this, void 0, void 0, function* () {
            const purchase = yield prisma_1.prisma.purchase.findFirst({
                where: {
                    economy: { discordId },
                    item: { category: "fila" },
                    isActive: true,
                    usesLeft: { gt: 0 },
                },
            });
            return !!purchase;
        });
    }
    /**
     * Consome um uso do furafila comprado
     */
    consumeFurafila(discordId) {
        return __awaiter(this, void 0, void 0, function* () {
            const purchase = yield prisma_1.prisma.purchase.findFirst({
                where: {
                    economy: { discordId },
                    item: { category: "fila" },
                    isActive: true,
                    usesLeft: { gt: 0 },
                },
                orderBy: { createdAt: "asc" },
            });
            if (!purchase)
                return false;
            const newUsesLeft = purchase.usesLeft - 1;
            yield prisma_1.prisma.purchase.update({
                where: { id: purchase.id },
                data: {
                    usesLeft: newUsesLeft,
                    isActive: newUsesLeft > 0,
                },
            });
            return true;
        });
    }
    furaFila(command) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const player = command.player;
            // Verificar se o jogador está nos spectators
            if (player.team !== 0) {
                command.player.reply(messageFormatter_1.MessageFormatter.error("Você deve estar nos spectators!"));
                return;
            }
            const isVip = player.hasRole("vip");
            const discordId = (_a = player.settings.account) === null || _a === void 0 ? void 0 : _a.discordId;
            const hasPurchased = discordId ? yield this.hasPurchasedFurafila(discordId) : false;
            // Precisa ser VIP ou ter comprado na loja
            if (!isVip && !hasPurchased) {
                command.player.reply(messageFormatter_1.MessageFormatter.error("Sem acesso!", "Seja VIP ou compre na !loja"));
                return;
            }
            // Inicializar o cache
            const now = new Date();
            const today = now.toDateString();
            if (!this.cache[player.name]) {
                this.cache[player.name] = { lastUse: new Date(0), usedToday: 0, day: today };
            }
            // Resetar o contador se o dia mudou
            if (this.cache[player.name].day !== today) {
                this.cache[player.name] = { lastUse: new Date(0), usedToday: 0, day: today };
            }
            // VIP: limite diário de 3 usos grátis
            if (isVip) {
                if (this.cache[player.name].usedToday >= DAILY_LIMIT_VIP) {
                    command.player.reply(messageFormatter_1.MessageFormatter.error(`Limite atingido!`, `${DAILY_LIMIT_VIP} usos/dia`));
                    return;
                }
            }
            // Verificar cooldown
            const lastUse = this.cache[player.name].lastUse;
            const diffInMinutes = (now.getTime() - lastUse.getTime()) / MS_IN_MINUTE;
            if (diffInMinutes < COOLDOWN_MINUTES) {
                const remainingMinutes = Math.ceil(COOLDOWN_MINUTES - diffInMinutes);
                command.player.reply(messageFormatter_1.MessageFormatter.warning(`Aguarde ${remainingMinutes} min`));
                return;
            }
            // Se não é VIP, consumir o uso da compra (sem limite diário — usa os usos comprados)
            if (!isVip && hasPurchased && discordId) {
                const consumed = yield this.consumeFurafila(discordId);
                if (!consumed) {
                    command.player.reply(messageFormatter_1.MessageFormatter.error("Furafila esgotado!", "Compre mais na !loja"));
                    return;
                }
            }
            // Executar o furarfila
            this.cache[player.name].lastUse = now;
            if (isVip) {
                this.cache[player.name].usedToday++;
            }
            this.cache[player.name].day = today;
            this.$.reorderPlayers([player.id], true);
            // Mensagem de sucesso
            if (isVip) {
                const remaining = DAILY_LIMIT_VIP - this.cache[player.name].usedToday;
                command.player.reply(messageFormatter_1.MessageFormatter.success(`Fila furada!`, `${remaining} usos restantes hoje`));
            }
            else {
                const purchase = yield prisma_1.prisma.purchase.findFirst({
                    where: { economy: { discordId }, item: { category: "fila" }, isActive: true, usesLeft: { gt: 0 } },
                });
                const usesLeft = (purchase === null || purchase === void 0 ? void 0 : purchase.usesLeft) || 0;
                command.player.reply(messageFormatter_1.MessageFormatter.success(`Fila furada!`, `${usesLeft} usos restantes`));
            }
            this.$.send({
                message: `[⭐] ${player.name} furou a fila!`,
                color: haxball_extended_room_1.Colors.GreenYellow,
                style: "bold"
            });
        });
    }
};
exports.FuraModule = FuraModule;
__decorate([
    (0, haxball_extended_room_1.ModuleCommand)({
        aliases: ["furarfila"],
    })
], FuraModule.prototype, "furaFila", null);
exports.FuraModule = FuraModule = __decorate([
    haxball_extended_room_1.Module
], FuraModule);
