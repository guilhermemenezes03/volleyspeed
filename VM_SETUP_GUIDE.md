# 🚀 GUIA COMPLETO DE CONFIGURAÇÃO DO BOT RVC VOLLEY

## 📋 PRÉ-REQUISITOS

### Conta no GitHub
- Crie uma conta gratuita em [github.com](https://github.com)

### Máquina Virtual (AWS EC2, DigitalOcean, etc.)
- Ubuntu 20.04+ ou Amazon Linux 2+
- Pelo menos 1GB RAM, 1 vCPU
- Acesso SSH

---

## 📦 PARTE 1: PREPARANDO O CÓDIGO NO GITHUB

### 1. Criar Repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique em **"New repository"**
3. Configure:
   - **Repository name**: `rvc-volley-bot`
   - **Description**: `Bot de vôlei para Haxball com sistema de economia e Discord`
   - **Visibility**: `Private` (recomendado para segurança)
   - ✅ **Add a README file**
   - ✅ **Add .gitignore**: `Node`
4. Clique em **"Create repository"**

### 2. Upload do Código

```bash
# No seu computador local, navegue até a pasta do projeto
cd /caminho/para/rvc-volley-bot

# Adicionar remote do GitHub (substitua SEU_USERNAME)
git remote add origin https://github.com/SEU_USERNAME/rvc-volley-bot.git

# Fazer push do código
git push -u origin master
```

---

## 🖥️ PARTE 2: CONFIGURANDO A MÁQUINA VIRTUAL

### 1. Conectar na VM via SSH

```bash
# Para AWS EC2 (substitua o IP e caminho da chave)
ssh -i "sua-chave.pem" ec2-user@18.118.110.107

# Para outras VMs (substitua pelo seu usuário e IP)
ssh usuario@seu-ip-da-vm
```

### 2. Atualizar o Sistema

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# Amazon Linux
sudo yum update -y
```

### 3. Instalar Dependências Essenciais

```bash
# Ubuntu/Debian
sudo apt install -y curl wget git unzip

# Amazon Linux
sudo yum install -y curl wget git unzip
```

### 4. Instalar Node.js e npm

```bash
# Instalar Node.js 18+ (recomendado)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 5. Instalar Bun (Runtime JavaScript)

```bash
curl -fsSL https://bun.sh/install | bash

# Recarregar shell ou executar:
source ~/.bashrc

# Verificar instalação
bun --version
```

### 6. Instalar PostgreSQL

```bash
# Ubuntu/Debian
sudo apt install -y postgresql postgresql-contrib

# Amazon Linux
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configurar senha do usuário postgres
sudo -u postgres psql
\password postgres
# Digite uma senha segura e confirme
\q
```

---

## 📥 PARTE 3: BAIXANDO E CONFIGURANDO O BOT

### 1. Clonar o Repositório

```bash
# Navegar para diretório home
cd ~

# Clonar o repositório
git clone https://github.com/SEU_USERNAME/rvc-volley-bot.git

# Entrar na pasta do projeto
cd rvc-volley-bot
```

### 2. Instalar Dependências do Projeto

```bash
# Instalar dependências
bun install

# Confiar em dependências nativas
bun pm trust --all
```

### 3. Configurar Banco de Dados

```bash
# Instalar Prisma CLI globalmente
bun add -g prisma

# Configurar banco de dados
# Edite o arquivo prisma/schema.prisma e configure a URL do banco:
nano prisma/schema.prisma

# Procure por:
# datasource db {
#   provider = "postgresql"
#   url = env("DATABASE_URL")
# }

# Criar arquivo .env com a URL do banco
nano .env

# Adicione:
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/rvc_volley_bot"

# Criar banco de dados
sudo -u postgres createdb rvc_volley_bot

# Executar migrações do Prisma
bunx prisma generate
bunx prisma db push
```

### 4. Configurar Tokens e Credenciais

```bash
# Editar arquivo de configuração
nano .env

# Adicione as seguintes variáveis (substitua pelos valores reais):
# Token do Haxball
HAXBALL_TOKEN=seu_token_do_haxball_aqui

# Token do Discord Bot
DISCORD_TOKEN=seu_token_do_discord_bot_aqui

# URL do banco de dados (já configurado acima)
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/rvc_volley_bot"

# IDs do Discord
DISCORD_GUILD_ID=seu_guild_id
DISCORD_CLIENT_ID=seu_client_id

# URLs de webhooks do Discord (opcional)
DISCORD_WEBHOOK_ECONOMY=url_do_webhook_economia
DISCORD_WEBHOOK_ELO=url_do_webhook_elo
```

### 5. Configurar Shop e Dados Iniciais

```bash
# Executar seed do shop
bun run seedShop.ts

# (Opcional) Criar dados de teste
bun run createMockData.ts
```

---

## 🚀 PARTE 4: EXECUTANDO O BOT

### 1. Teste em Modo Desenvolvimento

```bash
# Executar em modo dev (com logs detalhados)
bun dev seu_token_haxball
```

### 2. Produção com PM2 (24/7)

```bash
# Instalar PM2 globalmente
bun add -g pm2

# Criar arquivo de configuração PM2
nano ecosystem.config.js
```

**Conteúdo do ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'rvc-volley-bot',
    script: 'index.ts',
    args: 'prod seu_token_haxball',
    interpreter: 'bun',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

```bash
# Criar diretório de logs
mkdir logs

# Iniciar bot com PM2
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Ver logs
pm2 logs rvc-volley-bot

# Salvar configuração PM2
pm2 save

# Configurar PM2 para iniciar automaticamente no boot
pm2 startup
# Execute o comando que aparecer na tela
```

### 3. Produção com Systemd (Alternativa)

```bash
# Criar arquivo de serviço
sudo nano /etc/systemd/system/rvc-volley-bot.service
```

**Conteúdo do arquivo de serviço:**
```ini
[Unit]
Description=RVC Volley Bot
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/rvc-volley-bot
ExecStart=/home/ubuntu/.bun/bin/bun prod seu_token_haxball
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
# Recarregar systemd
sudo systemctl daemon-reload

# Iniciar serviço
sudo systemctl start rvc-volley-bot

# Habilitar no boot
sudo systemctl enable rvc-volley-bot

# Verificar status
sudo systemctl status rvc-volley-bot

# Ver logs
sudo journalctl -u rvc-volley-bot -f
```

---

## 🔧 PARTE 5: MONITORAMENTO E MANUTENÇÃO

### 1. Comandos Úteis

```bash
# Verificar se o bot está rodando
pm2 status
# ou
sudo systemctl status rvc-volley-bot

# Reiniciar bot
pm2 restart rvc-volley-bot
# ou
sudo systemctl restart rvc-volley-bot

# Ver logs
pm2 logs rvc-volley-bot --lines 100
# ou
sudo journalctl -u rvc-volley-bot -n 100

# Atualizar código
cd ~/rvc-volley-bot
git pull origin master
pm2 restart rvc-volley-bot

# Backup do banco
pg_dump rvc_volley_bot > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Configuração de Firewall

```bash
# Ubuntu/Debian
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Amazon Linux
# Configurar Security Groups no AWS Console
```

### 3. Monitoramento de Recursos

```bash
# Verificar uso de CPU/Memória
htop
# ou
top

# Verificar espaço em disco
df -h

# Verificar conexões de rede
netstat -tlnp
```

---

## 🆘 TROUBLESHOOTING

### Problema: Bot não conecta no Haxball
**Solução:** Verifique se o token do Haxball está correto no arquivo `.env`

### Problema: Erro de conexão com banco
**Solução:**
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão
psql -h localhost -U postgres -d rvc_volley_bot
```

### Problema: Bot crasha frequentemente
**Solução:** Verifique os logs e aumente a memória da VM se necessário

### Problema: Discord não responde
**Solução:** Verifique se o token do Discord está correto e se o bot tem permissões adequadas

---

## 📚 REFERÊNCIAS

- [Documentação Haxball](https://haxball.com/)
- [Documentação Discord.js](https://discord.js.org/)
- [Documentação Prisma](https://www.prisma.io/)
- [Documentação Bun](https://bun.sh/)

---

## ⚠️ NOTAS DE SEGURANÇA

1. **Nunca** commite tokens ou senhas no GitHub
2. Use repositórios privados para código sensível
3. Configure firewall adequadamente
4. Mantenha o sistema atualizado
5. Use senhas fortes para o banco de dados
6. Faça backups regulares do banco de dados

---

## 🎯 PRÓXIMOS PASSOS

Após configurar o bot:

1. ✅ Teste todas as funcionalidades
2. ✅ Configure webhooks do Discord
3. ✅ Ajuste configurações de gameplay em `settings.json`
4. ✅ Configure itens da loja
5. ✅ Teste o sistema de economia
6. ✅ Configure backups automáticos

**Seu bot está pronto! 🚀**