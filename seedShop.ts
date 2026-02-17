import { prisma } from "./database/prisma";

/**
 * Script para popular a loja com itens iniciais.
 * Execute: bunx --bun ts-node seedShop.ts
 * Ou: bun run seedShop.ts
 */
async function seedShop() {
  console.log("🛒 Populando loja com itens...\n");

  const items = [
    // ====== 🎭 AVATARES (estoque limitado, diversos raridades) ======
    {
      code: "fogo1",
      name: "Avatar Fogo",
      description: "Avatar de fogo 🔥 para os melhores jogadores",
      price: 1500,
      currency: "coins",
      category: "avatar",
      rarity: "rare",
      effect: JSON.stringify({ type: "avatar", emoji: "🔥" }),
      stock: 10,
      maxPerUser: 1,
    },
    {
      code: "estrela1",
      name: "Avatar Estrela",
      description: "Brilhe como uma estrela ⭐ na quadra",
      price: 1000,
      currency: "coins",
      category: "avatar",
      rarity: "common",
      effect: JSON.stringify({ type: "avatar", emoji: "⭐" }),
      stock: 20,
      maxPerUser: 1,
    },
    {
      code: "raio1",
      name: "Avatar Raio",
      description: "Velocidade e precisão ⚡",
      price: 2000,
      currency: "coins",
      category: "avatar",
      rarity: "rare",
      effect: JSON.stringify({ type: "avatar", emoji: "⚡" }),
      stock: 8,
      maxPerUser: 1,
    },
    {
      code: "coroa1",
      name: "Avatar Coroa",
      description: "Avatar lendário da realeza 👑",
      price: 50000,
      currency: "coins",
      category: "avatar",
      rarity: "legendary",
      effect: JSON.stringify({ type: "avatar", emoji: "👑" }),
      stock: 3,
      maxPerUser: 1,
    },
    {
      code: "diamante1",
      name: "Avatar Diamante",
      description: "Raro e precioso 💎",
      price: 5000,
      currency: "coins",
      category: "avatar",
      rarity: "epic",
      effect: JSON.stringify({ type: "avatar", emoji: "💎" }),
      stock: 5,
      maxPerUser: 1,
    },
    {
      code: "caveira1",
      name: "Avatar Caveira",
      description: "Para os mais temidos 💀",
      price: 3000,
      currency: "coins",
      category: "avatar",
      rarity: "epic",
      effect: JSON.stringify({ type: "avatar", emoji: "💀" }),
      stock: 5,
      maxPerUser: 1,
    },
    {
      code: "alien1",
      name: "Avatar Aliens",
      description: "De outro mundo 👽",
      price: 30000,
      currency: "coins",
      category: "avatar",
      rarity: "legendary",
      effect: JSON.stringify({ type: "avatar", emoji: "👽" }),
      stock: 2,
      maxPerUser: 1,
    },
    {
      code: "robo1",
      name: "Avatar Robô",
      description: "Jogador perfeito 🤖",
      price: 1200,
      currency: "coins",
      category: "avatar",
      rarity: "common",
      effect: JSON.stringify({ type: "avatar", emoji: "🤖" }),
      stock: 15,
      maxPerUser: 1,
    },
    {
      code: "fantasma2",
      name: "Avatar Fantasma",
      description: "Invisível na quadra 👻",
      price: 2500,
      currency: "coins",
      category: "avatar",
      rarity: "rare",
      effect: JSON.stringify({ type: "avatar", emoji: "👻" }),
      stock: 7,
      maxPerUser: 1,
    },
    {
      code: "dragao1",
      name: "Avatar Dragão",
      description: "O lendário dragão 🐉",
      price: 80000,
      currency: "coins",
      category: "avatar",
      rarity: "legendary",
      effect: JSON.stringify({ type: "avatar", emoji: "🐉" }),
      stock: 2,
      maxPerUser: 1,
    },

    // ====== ⚡ BOOSTS ======
    {
      code: "boost2x",
      name: "Boost 2x 1h",
      description: "Dobra seus ganhos de moedas por 1 hora",
      price: 500,
      currency: "coins",
      category: "boost",
      rarity: "common",
      effect: JSON.stringify({ type: "multiplier", value: 2.0, durationHours: 1 }),
      stock: -1,
      maxPerUser: -1,
    },
    {
      code: "boost2x3h",
      name: "Boost 2x 3h",
      description: "Dobra seus ganhos de moedas por 3 horas",
      price: 1200,
      currency: "coins",
      category: "boost",
      rarity: "rare",
      effect: JSON.stringify({ type: "multiplier", value: 2.0, durationHours: 3 }),
      stock: -1,
      maxPerUser: -1,
    },
    {
      code: "boost3x",
      name: "Boost 3x 1h",
      description: "TRIPLA ganhos de moedas por 1 hora",
      price: 2000,
      currency: "coins",
      category: "boost",
      rarity: "epic",
      effect: JSON.stringify({ type: "multiplier", value: 3.0, durationHours: 1 }),
      stock: -1,
      maxPerUser: -1,
    },
    {
      code: "boost5x",
      name: "Mega Boost 5x",
      description: "QUINTUPLICAR ganhos por 30 minutos!",
      price: 25000,
      currency: "coins",
      category: "boost",
      rarity: "legendary",
      effect: JSON.stringify({ type: "multiplier", value: 5.0, durationHours: 0.5 }),
      stock: -1,
      maxPerUser: -1,
    },

    // ====== 📦 LOOTBOX ======
    {
      code: "lootbox1",
      name: "Lootbox Comum",
      description: "Caixa com item aleatório. Pode vir algo bom!",
      price: 800,
      currency: "coins",
      category: "lootbox",
      rarity: "common",
      effect: JSON.stringify({ type: "lootbox" }),
      stock: -1,
      maxPerUser: -1,
    },
    {
      code: "lootbox2",
      name: "Lootbox Rara",
      description: "Caixa com maiores chances de itens raros+",
      price: 2500,
      currency: "coins",
      category: "lootbox",
      rarity: "rare",
      effect: JSON.stringify({ type: "lootbox" }),
      stock: 20,
      maxPerUser: -1,
    },
    {
      code: "lootbox3",
      name: "Lootbox Épica",
      description: "Caixa premium com chances elevadas de itens épicos!",
      price: 20000,
      currency: "coins",
      category: "lootbox",
      rarity: "epic",
      effect: JSON.stringify({ type: "lootbox" }),
      stock: 5,
      maxPerUser: -1,
    },
    {
      code: "lootbox4",
      name: "Lootbox Lendária",
      description: "Caixa lendária disponível apenas em eventos!",
      price: 50000,
      currency: "coins",
      category: "lootbox",
      rarity: "legendary",
      effect: JSON.stringify({ type: "lootbox" }),
      stock: 0,
      maxPerUser: -1,
    },

    // ====== 🚀 FURAR FILA ======
    {
      code: "furafila",
      name: "Fura Fila",
      description: "Fure a fila 1 vez para entrar direto no time",
      price: 1000,
      currency: "coins",
      category: "fila",
      rarity: "common",
      effect: JSON.stringify({ type: "furafila", uses: 1 }),
      stock: -1,
      maxPerUser: -1,
    },
  ];
  let created = 0;
  for (const item of items) {
    // Check if item already exists
    const exists = await prisma.shopItem.findFirst({
      where: { name: item.name },
    });
    if (exists) {
      if (item.code && exists.code !== item.code) {
        await prisma.shopItem.update({
          where: { id: exists.id },
          data: { code: item.code },
        });
        console.log(`🔧 id atualizado: ${item.code} → ${item.name}`);
      }
      console.log(`⏭️  "${item.name}" já existe, pulando...`);
      continue;
    }

    await prisma.shopItem.create({ data: item });
    const rarityEmojis: Record<string, string> = {
      common: "⚪",
      rare: "🔵",
      epic: "🟣",
      legendary: "🟡",
    };
    console.log(`✅ ${rarityEmojis[item.rarity] || "⚪"} ${item.name} (${item.category}) — ${item.price} ${item.currency}`);
    created++;
  }

  console.log(`\n🎉 ${created} itens criados! (${items.length - created} já existiam)`);
  console.log("🏪 Loja populada com sucesso!");
  process.exit(0);
}

seedShop().catch((err) => {
  console.error("❌ Erro ao popular loja:", err);
  process.exit(1);
});
