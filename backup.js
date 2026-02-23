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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Backup = Backup;
const backup_json_1 = __importDefault(require("./backup.json"));
const prisma_1 = require("./database/prisma");
function Backup() {
    return __awaiter(this, void 0, void 0, function* () {
        const users = backup_json_1.default.users;
        let count = 0;
        for (const user of users) {
            yield prisma_1.prisma.user.create({
                data: {
                    name: user.name,
                    discordId: user.discordId,
                    nickname: user.nickname
                }
            });
            count++;
            console.log(`${user.name} | ${user.discordId} | USER CREATED | ${count}`);
        }
        const bans = backup_json_1.default.bans;
        count = 0;
        for (const ban of bans) {
            yield prisma_1.prisma.ban.create({
                data: {
                    auth: ban.auth,
                    ip: ban.ip
                }
            });
            count++;
            console.log(`${ban.auth} | ${ban.ip} | BAN CREATED | ${count}`);
        }
        const status = backup_json_1.default.status;
        count = 0;
        for (const statu of status) {
            yield prisma_1.prisma.status.create({
                data: Object.assign({}, statu)
            });
            count++;
            console.log(`${statu.discordId} | STATUS CREATED | ${count}`);
        }
    });
}
