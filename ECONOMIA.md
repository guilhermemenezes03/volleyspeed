# 💰 Sistema de Economia — RVC Volley Bot

Documentação completa do sistema de economia, loja, comandos e funcionalidades do bot.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Moeda Única](#moeda-única)
3. [Como Ganhar Moedas](#como-ganhar-moedas)
4. [Loja](#loja)
5. [Lootboxes](#lootboxes)
6. [Furar Fila](#furar-fila)
7. [Apostas](#apostas)
8. [Tigrinho](#tigrinho)
9. [Comandos Completos](#comandos-completos)
10. [Títulos de Riqueza](#títulos-de-riqueza)

---

## Visão Geral

O sistema de economia do RVC Volley Bot permite que jogadores ganhem moedas 🪙 jogando partidas, completando objetivos e apostando. As moedas podem ser usadas para comprar itens na loja, abrir lootboxes, e personalizar a experiência no jogo.

### Fluxo Principal

```
🎮 Jogar Partidas
    ↓
💰 Ganhar Moedas (vitórias, cortes, levantamentos, bloqueios)
    ↓
🏪 Acessar a Loja (!loja)
    ↓
🛒 Comprar Itens (!comprar <id>)
    ↓
📦 Usar Itens (!inventario, !avatar)
```

---

## Moeda Única

O sistema utiliza **apenas moedas (🪙)** como única forma de pagamento.

| Símbolo | Nome | Uso |
|---------|------|-----|
| 🪙 | Moedas | Compras na loja, apostas, transferências |

> **Nota:** O sistema antigo de gemas foi descontinuado. Jogadores com gemas antigas tiveram o saldo convertido automaticamente para moedas (1 gema = 1.000 moedas).

---

## Como Ganhar Moedas

### Por Partida

| Ação | Moedas |
|------|--------|
| Vitória | +150 🪙 |
| Derrota | +30 🪙 |
| Corte | +20 🪙 |
| Levantamento | +15 🪙 |
| Bloqueio | +25 🪙 |
| MVP da Partida | +100 🪙 |
| Participação | +10 🪙 |

### Diário

| Recompensa | Valor |
|------------|-------|
| Base diária | 200 🪙 |
| Bônus por streak | +50 🪙 por dia (máx 500) |

**Comando:** `!daily` ou `!diario`

### Outras Formas

- **Apostas:** Aposte em partidas e ganhe com multiplicadores
- **Tigrinho:** Máquina de slots com jackpots
- **Lootboxes:** Abra caixas e ganhe moedas como compensação

---

## Loja

A loja está organizada em **4 categorias**:

| Categoria | Emoji | Descrição |
|-----------|-------|-----------|
| `avatar` | 🎭 | Avatares personalizados (emojis) |
| `boost` | ⚡ | Multiplicadores de ganhos |
| `lootbox` | 📦 | Caixas com itens aleatórios |
| `fila` | 🚀 | Passes para furar fila |

### Navegando na Loja

```
!loja              → Ver todas as categorias
!loja avatar       → Ver avatares disponíveis
!loja boost        → Ver boosts disponíveis
!loja lootbox      → Ver lootboxes
!loja fila         → Ver furar fila
```

### Comprando Itens

```
!comprar <id>              → Comprar 1 unidade
!comprar furafila 10       → Comprar 10 furafilas
```

> **Dica:** Os IDs aparecem no formato `idnome` na loja. Você pode usar com ou sem o prefixo "id".

### Itens Disponíveis

#### 🎭 Avatares (10 itens)

| ID | Nome | Emoji | Preço | Raridade | Estoque |
|----|------|-------|-------|----------|---------|
| `estrela1` | Avatar Estrela | ⭐ | 1.000 | ⚪ Comum | 20 |
| `robo1` | Avatar Robô | 🤖 | 1.200 | ⚪ Comum | 15 |
| `fogo1` | Avatar Fogo | 🔥 | 1.500 | 🔵 Raro | 10 |
| `raio1` | Avatar Raio | ⚡ | 2.000 | 🔵 Raro | 8 |
| `fantasma2` | Avatar Fantasma | 👻 | 2.500 | 🔵 Raro | 7 |
| `caveira1` | Avatar Caveira | 💀 | 3.000 | 🟣 Épico | 5 |
| `diamante1` | Avatar Diamante | 💎 | 5.000 | 🟣 Épico | 5 |
| `alien1` | Avatar Aliens | 👽 | 30.000 | 🟡 Lendário | 2 |
| `coroa1` | Avatar Coroa | 👑 | 50.000 | 🟡 Lendário | 3 |
| `dragao1` | Avatar Dragão | 🐉 | 80.000 | 🟡 Lendário | 2 |

#### ⚡ Boosts (4 itens) — Estoque Infinito

| ID | Nome | Multiplicador | Duração | Preço | Raridade |
|----|------|---------------|---------|-------|----------|
| `boost2x` | Boost 2x 1h | 2.0x | 1 hora | 500 | ⚪ Comum |
| `boost2x3h` | Boost 2x 3h | 2.0x | 3 horas | 1.200 | 🔵 Raro |
| `boost3x` | Boost 3x 1h | 3.0x | 1 hora | 2.000 | 🟣 Épico |
| `boost5x` | Mega Boost 5x | 5.0x | 30 min | 25.000 | 🟡 Lendário |

#### 📦 Lootboxes (4 itens)

| ID | Nome | Preço | Raridade | Estoque |
|----|------|-------|----------|---------|
| `lootbox1` | Lootbox Comum | 800 | ⚪ Comum | ∞ |
| `lootbox2` | Lootbox Rara | 2.500 | 🔵 Raro | 20 |
| `lootbox3` | Lootbox Épica | 20.000 | 🟣 Épico | 5 |
| `lootbox4` | Lootbox Lendária | 50.000 | 🟡 Lendário | 0 (eventos) |

#### 🚀 Furar Fila (1 item) — Estoque Infinito

| ID | Nome | Usos | Preço | Raridade |
|----|------|------|-------|----------|
| `furafila` | Fura Fila | 1 por unidade | 1.000 | ⚪ Comum |

**Compra em quantidade:** `!comprar furafila 20` = 20 usos

---

## Lootboxes

### Como Funciona

1. Compre uma lootbox na loja (`!comprar lootbox1`)
2. O sistema sorteia uma **raridade**:
   - ⚪ Comum: 50%
   - 🔵 Raro: 30%
   - 🟣 Épico: 15%
   - 🟡 Lendário: 5%
3. Um **item aleatório** daquela raridade é dado ao jogador
4. Se for **duplicata de avatar**, você recebe moedas:

| Raridade | Compensação |
|----------|-------------|
| ⚪ Comum | 3.000 🪙 |
| 🔵 Raro | 10.000 🪙 |
| 🟣 Épico | 25.000 🪙 |
| 🟡 Lendário | 50.000 🪙 |

> Itens épicos e lendários são anunciados para toda a sala!

---

## Furar Fila

### Para VIPs

- **3 usos grátis por dia**
- Cooldown de **1h30min** entre usos
- Não consome passes comprados

### Para Quem Compra

- **Sem limite diário** — usa os passes comprados
- Cooldown de **1h30min** entre usos
- Cada uso consome 1 passe do inventário

**Comando:** `!furarfila`

---

## Apostas

### Apostas em Partidas

Durante partidas 3x3, você pode apostar nos primeiros 15 segundos:

```
!apostar 500 red     → Aposta 500 moedas no time vermelho
!apostar 1000 blue   → Aposta 1000 moedas no time azul
!odds               → Ver odds atuais
```

| Configuração | Valor |
|--------------|-------|
| Aposta mínima | 50 🪙 |
| Aposta máxima | 10.000 🪙 |
| Taxa da casa | 5% |

As **odds** são calculadas baseadas no ELO médio dos times.

---

## Tigrinho

Máquina de slots com símbolos e multiplicadores:

```
!tigrinho 100    → Aposta 100 moedas
```

### Símbolos

| Emoji | Peso | Multiplicador |
|-------|------|---------------|
| 🍒 | 30% | 1.5x |
| 🍋 | 25% | 2.0x |
| 🍊 | 20% | 2.5x |
| 🍇 | 15% | 3.0x |
| 💎 | 7% | 5.0x |
| 🐯 | 3% | 10.0x |

### Resultados

| Resultado | Prêmio |
|-----------|--------|
| 3 iguais | Aposta × Multiplicador do símbolo |
| 2 iguais | Aposta devolvida |
| Todos diferentes | Perde a aposta |

> **🐯🐯🐯 TIGRINHO TRIPLO** é anunciado para toda a sala!

| Configuração | Valor |
|--------------|-------|
| Aposta mínima | 20 🪙 |
| Aposta máxima | 3.000 🪙 |
| Cooldown | 30 segundos |

---

## Comandos Completos

### 💰 Economia

| Comando | Aliases | Descrição |
|---------|---------|-----------|
| `!coins` | `!saldo`, `!carteira`, `!wallet` | Ver saldo, ELO e estatísticas |
| `!daily` | `!diario` | Coletar recompensa diária |
| `!transferir <valor> @jogador` | `!pagar`, `!pay`, `!transfer` | Transferir moedas (10% taxa) |

### 🏪 Loja

| Comando | Aliases | Descrição |
|---------|---------|-----------|
| `!loja [categoria]` | `!shop`, `!store` | Ver loja ou categoria específica |
| `!comprar <id> [qtd]` | `!buy` | Comprar item (quantidade para furafila) |
| `!inventario` | `!inventory`, `!inv` | Ver itens no inventário |
| `!avatar [emoji]` | `!av` | Listar avatares ou equipar um |

### 🎰 Apostas

| Comando | Aliases | Descrição |
|---------|---------|-----------|
| `!apostar <valor> <red/blue>` | `!bet` | Apostar em um time |
| `!odds` | — | Ver odds atuais |
| `!tigrinho <valor>` | `!tiger`, `!slot`, `!slots` | Jogar na máquina de slots |

### 🚀 Utilitários

| Comando | Aliases | Descrição |
|---------|---------|-----------|
| `!furarfila` | — | Furar a fila de espera |
| `!ranking [categoria]` | `!ricos`, `!top`, `!leaderboard` | Ver rankings |

### 📊 Categorias de Ranking

```
!ranking coins      → Top mais ricos
!ranking elo        → Top ELO
!ranking cortes     → Top cortes
!ranking levants    → Top levantamentos
!ranking blocks     → Top bloqueios
!ranking wins       → Top vitórias
!ranking apostas    → Top apostadores
```

---

## Títulos de Riqueza

| Moedas | Título |
|--------|--------|
| 0+ | 🪙 Falido |
| 500+ | 🥉 Classe Baixa |
| 2.000+ | 🥈 Classe Média |
| 5.000+ | 🥇 Classe Alta |
| 15.000+ | 💰 Rico |
| 50.000+ | 💎 Milionário |
| 150.000+ | 👑 Magnata |
| 500.000+ | 🏛️ Oligarca |
| 1.000.000+ | 🌍 Dono do Servidor |

---

## Raridades

| Raridade | Emoji | Cor | Descrição |
|----------|-------|-----|-----------|
| Common | ⚪ | Cinza | Itens básicos, acessíveis |
| Rare | 🔵 | Azul | Itens melhores, preço médio |
| Epic | 🟣 | Roxo | Itens premium, estoque limitado |
| Legendary | 🟡 | Dourado | Itens raríssimos |

---

## Dicas

1. **Colete o diário todo dia** para maximizar o bônus de streak
2. **Use boosts** antes de jogar partidas importantes para ganhar mais moedas
3. **Lootboxes comuns** têm melhor custo-benefício para iniciantes
4. **Avatares lendários** são muito raros — compre rápido antes de esgotar!
5. **Furafila em quantidade** — compre vários de uma vez para economizar tempo

---

*Documentação do Sistema de Economia — RVC Volley Bot*  
*Última atualização: Fevereiro 2026*
