import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function createMockData() {
  try {
    // Criar usuário
    const user = await prisma.user.upsert({
      where: { id: 'cmlke8q4j0000ekrfbepas4pi' },
      update: {},
      create: {
        id: 'cmlke8q4j0000ekrfbepas4pi',
        name: 'guilherme',
        nickname: 'guilherme',
        discordId: '1324985162500538420',
        auth: 'mock_auth_token',
        conn: '127.0.0.1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Criar dados econômicos
    const economy = await prisma.economy.upsert({
      where: { discordId: '1324985162500538420' },
      update: {},
      create: {
        discordId: '1324985162500538420',
        coins: 50000,
        gems: 0,
        totalSpent: 15000,
        totalBetWon: 25000,
        totalBetLost: 10000,
        betsWon: 15,
        betsLost: 8,
        totalBets: 23,
        dailyStreak: 5,
        lastDaily: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ontem
        multiplier: 1.0,
        multiplierExp: null,
        vipExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        lastTigrinho: new Date(Date.now() - 30 * 60 * 1000), // 30 min atrás
      },
    });

    // Criar status de jogo
    const existingStatus = await prisma.status.findFirst({
      where: { discordId: '1324985162500538420' },
    });

    let status;
    if (existingStatus) {
      status = await prisma.status.update({
        where: { id: existingStatus.id },
        data: {
          elo: 1250,
          wins: 45,
          loses: 23,
          cortes: 120,
          levants: 85,
          blocks: 30,
          streak: 3,
        },
      });
    } else {
      status = await prisma.status.create({
        data: {
          discordId: '1324985162500538420',
          elo: 1250,
          wins: 45,
          loses: 23,
          cortes: 120,
          levants: 85,
          blocks: 30,
          streak: 3,
        },
      });
    }

    // Criar algumas transações mock
    const transactions = [
      {
        economyId: economy.id,
        type: 'earn',
        amount: 1000,
        currency: 'coins',
        description: 'Recompensa diária',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        economyId: economy.id,
        type: 'spend',
        amount: 500,
        currency: 'coins',
        description: 'Compra: Boost 2x',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        economyId: economy.id,
        type: 'bet',
        amount: 2000,
        currency: 'coins',
        description: 'Aposta: 2000 no Red (1.5x)',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        economyId: economy.id,
        type: 'earn',
        amount: 3000,
        currency: 'coins',
        description: 'Vitória em aposta',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        economyId: economy.id,
        type: 'tigrinho',
        amount: 500,
        currency: 'coins',
        description: 'Tigrinho: 3 iguais (5x)',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ];

    for (const tx of transactions) {
      await prisma.transaction.create({ data: tx });
    }

    // Criar itens da loja mock
    const shopItems = [
      {
        name: 'Boost 2x',
        description: 'Dobra seus ganhos por 1 hora',
        price: 500,
        currency: 'coins',
        category: 'boost',
        effect: JSON.stringify({ type: 'multiplier', value: 2.0, durationHours: 1 }),
        stock: -1,
        maxPerUser: 3,
        isActive: true,
      },
      {
        name: 'Lootbox Comum',
        description: 'Caixa com item aleatório',
        price: 800,
        currency: 'coins',
        category: 'lootbox',
        effect: JSON.stringify({ type: 'lootbox' }),
        stock: -1,
        maxPerUser: -1,
        isActive: true,
      },
      {
        name: 'Fura Fila',
        description: 'Fure a fila para entrar direto',
        price: 1000,
        currency: 'coins',
        category: 'fila',
        effect: JSON.stringify({ type: 'furafila', uses: 1 }),
        stock: -1,
        maxPerUser: -1,
        isActive: true,
      },
    ];

    for (const item of shopItems) {
      const existingItem = await prisma.shopItem.findFirst({
        where: { name: item.name },
      });

      if (!existingItem) {
        await prisma.shopItem.create({
          data: item,
        });
      }
    }

    // Criar uma compra mock
    const boostItem = await prisma.shopItem.findFirst({ where: { name: 'Boost 2x' } });
    if (boostItem) {
      await prisma.purchase.create({
        data: {
          economyId: economy.id,
          itemId: boostItem.id,
          totalPrice: boostItem.price,
          expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hora
        },
      });
    }

    console.log('✅ Dados mock criados com sucesso!');
    console.log('Usuário:', user.nickname);
    console.log('Economia:', { coins: economy.coins });
    console.log('Status:', { elo: status.elo, wins: status.wins });

  } catch (error) {
    console.error('❌ Erro ao criar dados mock:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMockData();