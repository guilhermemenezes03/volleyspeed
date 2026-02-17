# 🏪 Sistema de Loja — HaxVolley Bot

Documentação completa do sistema de loja, avatares, lootbox e economia do HaxVolley Bot.

---

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Sistema de Avatares](#sistema-de-avatares)
3. [Loja com Categorias](#loja-com-categorias)
4. [Sistema de Lootbox](#sistema-de-lootbox)
5. [Furar Fila na Loja](#furar-fila-na-loja)
6. [Raridades](#raridades)
7. [Comandos In-Game](#comandos-in-game)
8. [Comandos Discord](#comandos-discord)
9. [Schema do Banco de Dados](#schema-do-banco-de-dados)
10. [Arquivos Modificados](#arquivos-modificados)
11. [Itens Iniciais da Loja](#itens-iniciais-da-loja)

---

## Visão Geral

O sistema de loja do HaxVolley foi completamente redesenhado para oferecer uma experiência rica de economia in-game. Os jogadores ganham moedas jogando partidas, apostando, e completando diárias. Essas moedas podem ser usadas para comprar itens organizados em categorias, abrir lootboxes, e personalizar seus avatares.

### Fluxo Principal

```
Jogador ganha moedas (vitórias, cortes, levantamentos, diário)
    → Acessa a loja (!loja) 
   → Navega por categorias (avatar, boost, lootbox, fila)
   → Compra item (!comprar <id>)
    → Item vai para o inventário (!inventario)
   → Equipar avatar (!avatar <emoji>)
```

---

## Sistema de Avatares
- **Avatar padrão**: Todos os jogadores usam o avatar padrão 🏐 (bola de vôlei)
- **Avatares são comprados na loja** com moedas
- **Estoque limitado** — apenas X unidades de cada avatar disponíveis
- **Cada jogador pode ter no máximo 1 de cada avatar**
- **Para equipar**: Use `!avatar <emoji>` após comprar

---

## Loja com Categorias
### Categorias Disponíveis

| Categoria | Emoji | Descrição |
|-----------|-------|-----------|
| `avatar` | 🎭 | Avatares/emojis para personalizar o jogador |
| `boost` | ⚡ | Multiplicadores de ganhos de moedas |
| `lootbox` | 📦 | Caixas com itens aleatórios e raridades |
| `fila` | 🚀 | Passes para furar a fila de espera |

### Navegação

**In-Game:**
```
!loja              → Menu de todas as categorias com contagem de itens
!loja avatar       → Mostra items da categoria avatar
!loja boost        → Mostra items da categoria boost
!loja lootbox      → Mostra items da categoria lootbox
!loja fila         → Mostra items de furar fila
```

**Discord:**
- `!loja` / `!shop` → Embed com botões interativos para cada categoria
- Clicar no botão de uma categoria → Embed atualiza mostrando os itens daquela categoria
- Botões de navegação para alternar entre categorias sem reenviar mensagens

### Formato de Exibição

Cada item mostra:
```
⚪ id: estrela1 | Avatar Estrela — 🪙 1.000 | Estoque: 20
```

Onde:
- ⚪/🔵/🟣/🟡 = indicador de raridade
- 🪙 = moeda (coins)
- Estoque: número restante (∞ = ilimitado)

---

## Sistema de Lootbox

### Como Funciona

1. Jogador compra uma lootbox na loja (`!comprar lootbox1`)
2. Sistema sorteia uma **raridade** baseada em pesos:
   - ⚪ Comum: 50% de chance
   - 🔵 Raro: 30% de chance
   - 🟣 Épico: 15% de chance
   - 🟡 Lendário: 5% de chance
3. Sistema busca um **item aleatório** daquela raridade
4. Se o item já pertence ao jogador (duplicata de avatar):
   - Compensação em moedas (3.000/10.000/25.000/50.000 moedas conforme raridade)
5. Se não existem itens daquela raridade:
   - Compensação em moedas (300/800/2000/5000 conforme raridade)
6. Item épico ou lendário é **anunciado para toda a sala**

### Tipos de Lootbox

| Nome | Preço | Moeda | Raridade | Estoque |
|------|-------|-------|----------|---------|
| Lootbox Comum | 800 | 🪙 | ⚪ Comum | ∞ |
| Lootbox Rara | 2.500 | 🪙 | 🔵 Raro | 20 |
| Lootbox Épica | 20.000 | 🪙 | 🟣 Épico | 5 |
| Lootbox Lendária | 50.000 | 🪙 | 🟡 Lendário | 0 |

## Furar Fila na Loja

### Como Funciona

- Jogadores podem comprar **passes de furar fila** na loja
- Cada passe permite pular a fila de espectadores para um time
- Funciona junto com o VIP (VIPs também podem furar fila)

### Limites

| Tipo | Usos por Dia |
|------|-------------|
| VIP (role) | 3 vezes por dia |
| Comprado na loja | Baseado na quantidade comprada |

### Itens Disponíveis

| Nome | Preço | Usos | Max por Jogador |
|------|-------|------|-----------------|
| Fura Fila | 1.000 🪙 | 1 por compra | Ilimitado |

**Exemplo de compra em quantidade:**
```
!comprar furafila 20
```
Isso adiciona 20 usos ao inventário.

### Módulo `FuraModule.ts`

- Verifica primeiro se é VIP (3/dia grátis)
- Se não, verifica se tem passes comprados (`category: "fila"`, `isActive: true`, `usesLeft > 0`)
- Consome 1 uso por utilização
- Quando `usesLeft` chega a 0, o item é desativado

---

## Raridades

### Tabela de Raridades

| Raridade | Emoji | Cor | Uso |
|----------|-------|-----|-----|
| Common (Comum) | ⚪ | `#AAAAAA` | Itens básicos, acessíveis |
| Rare (Raro) | 🔵 | `#3498db` | Itens melhores, preço médio |
| Epic (Épico) | 🟣 | `#9b59b6` | Itens premium, estoque limitado |
| Legendary (Lendário) | 🟡 | `#FFD700` | Itens raríssimos, estoque muito limitado |

### Chance na Lootbox

```
⚪ Comum:    50%  ████████████████████████████████████████
🔵 Raro:     30%  ████████████████████████
🟣 Épico:    15%  ████████████
🟡 Lendário:  5%  ████
```

### Compensação por Duplicata (Lootbox)

| Raridade | Moedas de Compensação |
|----------|-----------------------|
| ⚪ Comum | 3.000 🪙 |
| 🔵 Raro | 10.000 🪙 |
| 🟣 Épico | 25.000 🪙 |
| 🟡 Lendário | 50.000 🪙 |

---

## Comandos In-Game

### Economia

| Comando | Aliases | Descrição |
|---------|---------|-----------|
| `!coins` | `!saldo`, `!carteira`, `!wallet` | Ver saldo, ELO, stats |
| `!daily` | `!diario` | Coletar recompensa diária |
| `!transferir <valor> @jogador` | `!pagar`, `!pay`, `!transfer` | Transferir moedas (10% taxa) |
| `!ranking <categoria>` | `!ricos`, `!top`, `!leaderboard` | Rankings (coins, elo, cortes, etc) |

### Loja

| Comando | Aliases | Descrição |
|---------|---------|-----------|
| `!loja [categoria]` | `!shop`, `!store` | Ver loja / categoria específica |
| `!comprar <id> [quantidade]` | `!buy` | Comprar item da loja (quantidade apenas para furafila) |
| `!inventario` | `!inventory`, `!inv` | Ver itens no inventário |
| `!avatar [emoji]` | `!av` | Listar avatares / equipar um |

### Apostas

| Comando | Aliases | Descrição |
|---------|---------|-----------|
| `!apostar <valor> <red/blue>` | `!bet` | Apostar em um time (15s no início) |
| `!odds` | — | Ver odds atuais |
| `!tigrinho <valor>` | `!tiger`, `!slot`, `!slots` | Máquina de slots |

---

## Comandos Discord

### Para Jogadores

| Comando | Descrição |
|---------|-----------|
| `!economia` / `!saldo` / `!wallet` / `!coins` | Perfil econômico com embed detalhado |
| `!loja` / `!shop` | Loja com botões de categoria interativos |
| `!topricos` / `!ranking` / `!leaderboard` | Top 10 mais ricos |
| `!topelo` / `!eloranking` | Top 10 ELO |
| `!topapostas` / `!topbets` | Top 10 apostadores |
| `!topstats <cortes/levants/blocks/wins>` | Rankings por estatística |
| `!transacoes` / `!historico` | Últimas 10 transações |

### Para Admins

| Comando | Descrição |
|---------|-----------|
| `!additem id\|nome\|desc\|preço\|moeda\|categoria\|efeito\|estoque\|maxPerUser\|raridade` | Adicionar item à loja |
| `!removeitem <nome>` | Remover item da loja |
| `!addcoins @user <valor>` | Dar moedas a um jogador |

#### Exemplo de !additem

```
!additem sol1|Avatar Sol|Avatar brilhante do sol ☀️|3000|coins|avatar|{"type":"avatar","emoji":"☀️"}|10|1|epic
```

**Parâmetros:**
1. `id` — Identificador para compra (ex: `boost1`)
2. `nome` — Nome do item
3. `descrição` — Descrição do item
4. `preço` — Valor (inteiro)
5. `moeda` — `coins`
6. `categoria` — `avatar`, `boost`, `lootbox`, `fila`
7. `efeito` — JSON com dados do efeito (veja tabela abaixo)
8. `estoque` — `-1` = ilimitado, `N` = N unidades
9. `maxPerUser` — `-1` = ilimitado, `N` = máximo por jogador
10. `raridade` — `common`, `rare`, `epic`, `legendary`

### Efeitos JSON

| Tipo | JSON | Descrição |
|------|------|-----------|
| Avatar | `{"type":"avatar","emoji":"🔥"}` | Define o emoji do avatar |
| Multiplicador | `{"type":"multiplier","value":2.0,"durationHours":1}` | Multiplica ganhos |
| Moedas | `{"type":"coins","value":500}` | Dá moedas |
| Furar Fila | `{"type":"furafila","uses":3}` | Dá passes de fura fila |
| Lootbox | `{"type":"lootbox"}` | Abre lootbox ao comprar |

---

## Schema do Banco de Dados

### Modelos Modificados/Criados

#### `ShopItem` (modificado)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `rarity` | `String @default("common")` | **NOVO** — Raridade do item |
| `category` | `String` | Atualizado para aceitar: avatar, boost, lootbox, fila |
| `code` | `String? @unique` | **NOVO** — ID público para compra (ex: `boost1`) |

#### `Purchase` (modificado)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `usesLeft` | `Int @default(-1)` | **NOVO** — Usos restantes (-1 = ilimitado) |
| `isActive` | `Boolean @default(true)` | **NOVO** — Se o item está ativo no inventário |

#### `LootboxOpening` (novo modelo)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `String @id @default(cuid())` | ID único |
| `discordId` | `String` | Discord ID do jogador |
| `lootboxId` | `String` | ID do ShopItem da lootbox |
| `itemWonId` | `String` | ID do ShopItem ganho |
| `rarity` | `String` | Raridade do prêmio |
| `createdAt` | `DateTime @default(now())` | Data da abertura |

#### `Transaction` (atualizado)

Tipo agora aceita: `"earn"`, `"spend"`, `"transfer_in"`, `"transfer_out"`, `"tax"`, `"daily"`, `"bet"`, `"lootbox"`

---

## Arquivos Modificados

| Arquivo | Mudanças |
|---------|----------|
| `prisma/schema.prisma` | Adicionados `rarity` (ShopItem), `usesLeft`/`isActive` (Purchase), modelo `LootboxOpening` |
| `modules/avatarModule.ts` | Reescrito com sistema de avatar padrão 🏐, carregamento de avatares comprados, bloqueio do `/avatar` nativo |
| `modules/FuraModule.ts` | Reescrito para suportar VIP + passes comprados na loja |
| `modules/economyModule.ts` | Adicionados: categorias de loja, comando `!avatar`, sistema de lootbox, raridades, navegação por categorias |
| `discord/connector.ts` | Loja Discord com botões interativos (`ButtonBuilder`/`ActionRowBuilder`) para navegação por categorias, handler para `shop_category_*` buttons, `!additem` atualizado com campo de raridade |
| `database/prisma.ts` | Comentário atualizado |
| `seedShop.ts` | **NOVO** — Script para popular loja com 19 itens iniciais |

---

## Itens Iniciais da Loja

### 🎭 Avatares (10 itens)

| Nome | Emoji | Preço | Moeda | Raridade | Estoque |
|------|-------|-------|-------|----------|---------|
| Avatar Estrela | ⭐ | 1.000 | 🪙 | ⚪ Comum | 20 |
| Avatar Robô | 🤖 | 1.200 | 🪙 | ⚪ Comum | 15 |
| Avatar Fogo | 🔥 | 1.500 | 🪙 | 🔵 Raro | 10 |
| Avatar Raio | ⚡ | 2.000 | 🪙 | 🔵 Raro | 8 |
| Avatar Fantasma | 👻 | 2.500 | 🪙 | 🔵 Raro | 7 |
| Avatar Caveira | 💀 | 3.000 | 🪙 | 🟣 Épico | 5 |
| Avatar Diamante | 💎 | 5.000 | 🪙 | 🟣 Épico | 5 |
| Avatar Aliens | 👽 | 30 | 💎 | 🟡 Lendário | 2 |
| Avatar Coroa | 👑 | 50 | 💎 | 🟡 Lendário | 3 |
| Avatar Dragão | 🐉 | 80 | 💎 | 🟡 Lendário | 2 |

### ⚡ Boosts (4 itens)

| Nome | Multiplicador | Duração | Preço | Moeda | Raridade |
|------|---------------|---------|-------|-------|----------|
| Boost 2x 1h | 2.0x | 1h | 500 | 🪙 | ⚪ Comum |
| Boost 2x 3h | 2.0x | 3h | 1.200 | 🪙 | 🔵 Raro |
| Boost 3x 1h | 3.0x | 1h | 2.000 | 🪙 | 🟣 Épico |
| Mega Boost 5x | 5.0x | 30min | 25 | 💎 | 🟡 Lendário |

### 👑 VIP (3 itens)

| Nome | Duração | Preço | Moeda | Raridade |
|------|---------|-------|-------|----------|
| VIP 7 Dias | 7d | 5.000 | 🪙 | 🔵 Raro |
| VIP 30 Dias | 30d | 15.000 | 🪙 | 🟣 Épico |
| VIP Premium 30d | 30d + 1.5x boost | 100 | 💎 | 🟡 Lendário |

### 📦 Lootbox (3 itens)

| Nome | Preço | Moeda | Raridade | Estoque |
|------|-------|-------|----------|---------|
| Lootbox Comum | 800 | 🪙 | ⚪ Comum | ∞ |
| Lootbox Rara | 2.500 | 🪙 | 🔵 Raro | ∞ |
| Lootbox Épica | 20 | 💎 | 🟣 Épico | 10 |

### 🚀 Furar Fila (3 itens)

| Nome | Usos | Preço | Moeda | Raridade |
|------|------|-------|-------|----------|
| Fura Fila x1 | 1 | 1.000 | 🪙 | ⚪ Comum |
| Fura Fila x3 | 3 | 2.500 | 🪙 | 🔵 Raro |
| Fura Fila x5 | 5 | 15 | 💎 | 🟣 Épico |

### 🧪 Consumíveis (3 itens)

| Nome | Efeito | Preço | Moeda | Raridade |
|------|--------|-------|-------|----------|
| Pacote 500 Moedas | +500 🪙 | 5 | 💎 | ⚪ Comum |
| Pacote 2000 Moedas | +2.000 🪙 | 15 | 💎 | 🔵 Raro |
| Pacote 10 Gemas | +10 💎 | 8.000 | 🪙 | 🟣 Épico |

---

## Diagrama de Fluxo

```
                    ┌──────────────────┐
                    │   JOGADOR ENTRA  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Avatar = 🏐     │
                    │  (padrão)        │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼─────┐ ┌──────▼───────┐
     │  Ganha moedas │ │  !daily  │ │  !tigrinho   │
     │  jogando      │ │  diário  │ │/!apostar 🎰 │
     └────────┬──────┘ └────┬─────┘ └──────┬───────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼─────────┐
                    │    !loja         │
                    │  (categorias)    │
                    └────────┬─────────┘
                             │
     ┌───────┬───────┬───────┼───────┬───────┐
     │       │       │       │       │       │
   🎭     ⚡      👑      📦      🚀      🧪
  Avatar  Boost   VIP   Lootbox  Fila   Consu.
     │       │       │       │       │       │
     │       │       │   ┌───▼───┐   │       │
     │       │       │   │ Sorteia│   │       │
     │       │       │   │raridade│   │       │
     │       │       │   └───┬───┘   │       │
     │       │       │       │       │       │
     └───────┴───────┴───────┼───────┴───────┘
                             │
                    ┌────────▼─────────┐
                    │  !inventario     │
                    │  !avatar <emoji> │
                    └──────────────────┘
```

---

*Documentação gerada automaticamente. Última atualização: Fevereiro 2026*
