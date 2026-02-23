"use strict";
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
exports.Database = void 0;
const prisma_1 = require("./prisma");
class Database {
    static getSanitizedName(nickname) {
        return nickname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim().toLowerCase();
    }
    static getUnsanitizedName(nickname) {
        return nickname.replace(/\\([.*+?^${}()|[\]\\])/g, '$1').trim().toLowerCase();
    }
    static findUserByNickname(nickname) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma_1.prisma.user.findFirst({
                    where: {
                        name: this.getSanitizedName(nickname)
                    }
                });
            }
            catch (e) {
                console.log(`Error in database; Username: "${nickname}"`);
                console.log(e);
                return null;
            }
        });
    }
    static findUserByDiscordId(discordId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.prisma.user.findFirst({
                where: {
                    discordId
                }
            });
        });
    }
    static createNewAccount(nickname, discordId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.prisma.user.create({
                data: {
                    nickname: nickname.trim(),
                    name: this.getSanitizedName(nickname),
                    discordId
                }
            });
        });
    }
    static updateAuthByDiscordId(discordId, auth, conn) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma_1.prisma.user.update({
                    where: {
                        discordId
                    },
                    data: {
                        auth,
                        conn
                    }
                });
            }
            catch (e) {
                console.log("couldn't update auth from discord id " + discordId);
            }
        });
    }
    static updateNicknameByDiscordId(discordId, nickname) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.prisma.user.update({
                where: {
                    discordId
                },
                data: {
                    nickname: nickname.trim(),
                    name: this.getSanitizedName(nickname),
                    updatedAt: new Date()
                }
            });
        });
    }
    static canDiscordIdChangeNickname(discordId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.findUserByDiscordId(discordId);
            if (!user)
                return false;
            if (user.createdAt.getTime() != user.updatedAt.getTime())
                return false;
            return true;
        });
    }
}
exports.Database = Database;
