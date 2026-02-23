"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = void 0;
exports.getRoleByName = getRoleByName;
const haxball_extended_room_1 = require("haxball-extended-room");
const RegistredRole = new haxball_extended_room_1.Role().setPrefix("✅").setPosition(1).setColor(0xffffff);
RegistredRole.settings.delay = 2;
const ToxicoRole = new haxball_extended_room_1.Role().setPrefix("🤮").setPosition(2).setColor(0x363636).setName("toxico");
ToxicoRole.settings.delay = 3;
const BoosterRole = new haxball_extended_room_1.Role().setPrefix("💫").setPosition(3).setColor(0xff57eb).setName("booster");
BoosterRole.settings.delay = 1;
const VipRole = new haxball_extended_room_1.Role().setPrefix("💎").setPosition(4).setColor(0x69e7f5).setName("vip");
VipRole.settings.delay = 0;
const ModeradorRole = new haxball_extended_room_1.Role().setPrefix("👮").setPosition(5).setAdmin().setColor(0x57cfff).setName("moderador");
ModeradorRole.settings.delay = 0;
const DiretorRole = new haxball_extended_room_1.Role().setPrefix("👑").setPosition(6).setAdmin().setColor(0xf03c4e).setName("diretor");
DiretorRole.settings.delay = 0;
exports.Roles = {
    RegistredRole,
    ToxicoRole,
    BoosterRole,
    VipRole,
    ModeradorRole,
    DiretorRole
};
function getRoleByName(name) {
    const roles = exports.Roles;
    for (const r of Object.keys(roles)) {
        const role = roles[r];
        if (role.name == name)
            return role;
    }
    return null;
}
