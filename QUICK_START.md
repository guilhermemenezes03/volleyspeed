# 🚀 Quick Start - Gerenciamento de Salas via Discord

## Setup rápido (na VPS)

### 1. Atualizar código e instalar
```bash
cd ~/volleyspeed
git pull origin main
npm install
npm run build
```

### 2. Configurar .env
```bash
nano .env
```

Adicione estas linhas:
```env
DISCORD_TOKEN=SEU_TOKEN_DO_BOT
DATABASE_URL=postgresql://usuario:senha@localhost:5432/volleydb
```

### 3. Iniciar o Bot (com PM2)
```bash
pm2 start dist/index.js --name volley -- prod SEU_TOKEN_HAXBALL_PRINCIPAL
pm2 save
pm2 startup  # copie e execute o comando que aparecer
```

---

## Comandos Discord 🎮

### Ver ajuda
```
!help
```

### Abrir salas
```
!open sala1 SEU_TOKEN_HAXBALL_1
!open sala2 SEU_TOKEN_HAXBALL_2
!open sala3 SEU_TOKEN_HAXBALL_3
```

### Ver status
```
!list
```

### Fechar sala
```
!close sala1
```

### Fechar todas
```
!closeall
```

---

## Obter um Token Haxball

1. Acesse https://www.haxball.com/headless
2. Clique em "Get Started"
3. Abra o console (F12)
4. Procure por `window.localStorage.get('headless_token')` ou copie o token exibido
5. Use esse token nos comandos !open

---

## Troubleshooting

**Bot não responde aos comandos?**
```bash
pm2 logs volley
pm2 restart volley
```

**Ver processo rodando:**
```bash
pm2 list
```

**Ver logs em tempo real:**
```bash
pm2 logs volley --lines 50 --follow
```

