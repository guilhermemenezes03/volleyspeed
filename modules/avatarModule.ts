import { CustomEvent, Event, Module, Player, Room } from "haxball-extended-room";
import { RoomState } from "../roomState";
import { prisma } from "../database/prisma";

// Avatar padrão para todos - não pode ser mudado sem comprar
const DEFAULT_AVATAR = "🏐";

@Module export class AvatarModule {
    // Mapa de avatares equipados por discordId
    private equippedAvatars: Map<string, string> = new Map();

    constructor(private $ : Room<RoomState>) {
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

    private setAvatarSilently(player: Player, avatar: string) {
        player.settings.ignoreAvatarChange = true;
        player.setAvatar(avatar);
        setTimeout(() => {
            player.settings.ignoreAvatarChange = false;
        }, 50);
    }

    /**
     * Carrega o avatar equipado de um jogador do banco de dados
     */
    async loadPlayerAvatar(player: Player) {
        const discordId = player.settings.account?.discordId;
        if (!discordId) return;

        // Busca compras ativas de avatares
        const avatarPurchase = await prisma.purchase.findFirst({
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
            } catch {}
        }
    }

    /**
     * Equipa um avatar comprado
     */
    async equipAvatar(player: Player, emoji: string): Promise<boolean> {
        const discordId = player.settings.account?.discordId;
        if (!discordId) return false;

        // Verifica se o jogador possui este avatar
        const hasPurchase = await prisma.purchase.findFirst({
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

        if (!hasPurchase) return false;

        this.equippedAvatars.set(discordId, emoji);
        return true;
    }

    /**
     * Retorna o avatar equipado ou o padrão
     */
    getPlayerAvatar(player: Player): string {
        const discordId = player.settings.account?.discordId;
        if (!discordId) return DEFAULT_AVATAR;
        return this.equippedAvatars.get(discordId) || DEFAULT_AVATAR;
    }

    /**
     * Lista avatares que o jogador possui
     */
    async getOwnedAvatars(discordId: string): Promise<{ emoji: string; name: string; rarity: string }[]> {
        const purchases = await prisma.purchase.findMany({
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
            } catch {
                return { emoji: "?", name: p.item.name, rarity: "common" };
            }
        });
    }

    setAvatar(player : Player, avatar : string, priority : boolean = false) {
        if(player.settings.priority) return;
        this.setAvatarSilently(player, avatar);
        if(player.settings.avatarTimeout) clearTimeout(player.settings.avatarTimeout);
        player.settings.priority = priority;
        player.settings.avatarTimeout = setTimeout(() => {
            // Ao resetar, volta para o avatar equipado ou padrão
            const equipped = this.getPlayerAvatar(player);
            this.setAvatarSilently(player, equipped);
            player.settings.avatarTimeout = null;
            player.settings.priorityAvatar = false;
        }, 1000);
    }

    @Event async onPlayerAvatarChange(player: Player, avatar: string) {
        if (player.settings.ignoreAvatarChange) return;

        const discordId = player.settings.account?.discordId;
        const equipped = this.getPlayerAvatar(player);
        if (avatar === equipped) return;

        if (!discordId) {
            this.setAvatarSilently(player, DEFAULT_AVATAR);
            return;
        }

        const hasPurchase = await prisma.purchase.findFirst({
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
    }

    @Event onPlayerBallKick(player : Player) {
        if(this.$.state.touchPhase == "serveReception") {
            this.setAvatar(player, "😂");
        }else if(this.$.state.touchPhase == "fastServeTouch") {
            this.setAvatar(player, "🙌");
        }else if(this.$.state.touchPhase == "fastServe") {
            const av = player.team == 1 ? "🤜" : "🤛";
            this.setAvatar(player, av);
        }else if(this.$.state.touchPhase == "serve") {
            const av = player.team == 1 ? "🤜" : "🤛";
            this.setAvatar(player, av);
        }else if(this.$.state.touchPhase == "reception") {
            this.setAvatar(player, "1");
        }else if(this.$.state.touchPhase == "levant") {
            this.setAvatar(player, "2");
        }else if(this.$.state.touchPhase == "attack") {
            const av = player.team == 1 ? "🤜" : "🤛";
            this.setAvatar(player, av);
        }else if(this.$.state.touchPhase == "attackPurple") {
            this.setAvatar(player, "💜");
        }
    }

    @Event async onPlayerJoin(player: Player) {
        this.setAvatarSilently(player, DEFAULT_AVATAR);
        await this.loadPlayerAvatar(player);
        this.setAvatarSilently(player, this.getPlayerAvatar(player));
    }

    @CustomEvent onAvatarEquipped(player: Player, emoji: string) {
        const discordId = player.settings.account?.discordId;
        if (!discordId) return;
        this.equippedAvatars.set(discordId, emoji);
        this.setAvatarSilently(player, emoji);
    }
}