#!/bin/bash

# 🚀 RVC VOLLEY BOT - SCRIPT DE INSTALAÇÃO AUTOMATIZADA
# Este script configura automaticamente o bot em uma VM Ubuntu/Debian

set -e  # Parar execução em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   error "Este script não deve ser executado como root"
   exit 1
fi

log "🚀 Iniciando instalação do RVC Volley Bot..."

# Verificar sistema operacional
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v apt &> /dev/null; then
        PACKAGE_MANAGER="apt"
        info "Sistema detectado: Ubuntu/Debian"
    elif command -v yum &> /dev/null; then
        PACKAGE_MANAGER="yum"
        info "Sistema detectado: Amazon Linux/CentOS"
    else
        error "Gerenciador de pacotes não suportado. Use Ubuntu/Debian ou Amazon Linux."
        exit 1
    fi
else
    error "Sistema operacional não suportado. Use Linux Ubuntu/Debian ou Amazon Linux."
    exit 1
fi

# Função para instalar pacotes
install_package() {
    local package=$1
    if [[ $PACKAGE_MANAGER == "apt" ]]; then
        sudo apt install -y $package
    else
        sudo yum install -y $package
    fi
}

# 1. Atualizar sistema
log "📦 Atualizando sistema..."
if [[ $PACKAGE_MANAGER == "apt" ]]; then
    sudo apt update && sudo apt upgrade -y
else
    sudo yum update -y
fi

# 2. Instalar dependências básicas
log "📦 Instalando dependências básicas..."
install_package curl
install_package wget
install_package git
install_package unzip
install_package build-essential

# 3. Instalar Node.js 18+
log "📦 Instalando Node.js 18+..."
if [[ $PACKAGE_MANAGER == "apt" ]]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
fi

# 4. Instalar Bun
log "📦 Instalando Bun runtime..."
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
source ~/.bashrc

# Verificar instalações
log "🔍 Verificando instalações..."
node --version
npm --version
bun --version

# 5. Instalar PostgreSQL
log "📦 Instalando PostgreSQL..."
if [[ $PACKAGE_MANAGER == "apt" ]]; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
else
    sudo yum install -y postgresql-server postgresql-contrib
    sudo postgresql-setup initdb
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Configurar senha do PostgreSQL
log "🔐 Configurando PostgreSQL..."
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'rvc_volley_bot_2024';"
sudo -u postgres createdb rvc_volley_bot || true

# 6. Clonar repositório
log "📥 Clonando repositório..."
cd ~
if [[ -d "rvc-volley-bot" ]]; then
    warn "Diretório rvc-volley-bot já existe. Fazendo pull das atualizações..."
    cd rvc-volley-bot
    git pull origin master
else
    # Solicitar URL do repositório
    echo -e "${YELLOW}Digite a URL do seu repositório GitHub:${NC}"
    read -r REPO_URL
    git clone $REPO_URL rvc-volley-bot
    cd rvc-volley-bot
fi

# 7. Instalar dependências do projeto
log "📦 Instalando dependências do projeto..."
bun install
bun pm trust --all

# 8. Configurar banco de dados
log "🗄️ Configurando banco de dados..."
bunx prisma generate
bunx prisma db push

# 9. Configurar arquivo .env
log "⚙️ Configurando variáveis de ambiente..."
if [[ ! -f ".env" ]]; then
    cat > .env << EOF
# Haxball Token (será configurado manualmente)
HAXBALL_TOKEN=your_haxball_token_here

# Discord Bot Token (será configurado manualmente)
DISCORD_TOKEN=your_discord_token_here

# Database
DATABASE_URL="postgresql://postgres:rvc_volley_bot_2024@localhost:5432/rvc_volley_bot"

# Discord Configuration
DISCORD_GUILD_ID=your_guild_id_here
DISCORD_CLIENT_ID=your_client_id_here

# Webhooks (opcionais)
DISCORD_WEBHOOK_ECONOMY=your_webhook_url_here
DISCORD_WEBHOOK_ELO=your_webhook_url_here
EOF
    warn "Arquivo .env criado. Você precisa configurar os tokens manualmente!"
else
    info "Arquivo .env já existe."
fi

# 10. Popular banco com dados iniciais
log "🌱 Populando banco de dados..."
bun run seedShop.ts || warn "Seed do shop falhou. Execute manualmente se necessário."

# 11. Instalar PM2 para gerenciamento de processos
log "📦 Instalando PM2..."
bun add -g pm2

# 12. Criar arquivo de configuração PM2
log "⚙️ Criando configuração PM2..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'rvc-volley-bot',
    script: 'index.ts',
    args: 'prod YOUR_HAXBALL_TOKEN_HERE', // Substitua pelo token real
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
EOF

# Criar diretório de logs
mkdir -p logs

# 13. Configurar firewall básico
log "🔥 Configurando firewall..."
if [[ $PACKAGE_MANAGER == "apt" ]]; then
    sudo ufw allow ssh || true
    sudo ufw allow 80 || true
    sudo ufw allow 443 || true
    echo "y" | sudo ufw enable || true
fi

log "✅ INSTALAÇÃO CONCLUÍDA!"
echo ""
echo -e "${GREEN}🎉 Parabéns! O RVC Volley Bot foi instalado com sucesso!${NC}"
echo ""
echo -e "${YELLOW}📋 PRÓXIMOS PASSOS:${NC}"
echo "1. Edite o arquivo .env e configure seus tokens:"
echo "   nano ~/rvc-volley-bot/.env"
echo ""
echo "2. Edite o ecosystem.config.js e substitua 'YOUR_HAXBALL_TOKEN_HERE' pelo seu token real:"
echo "   nano ~/rvc-volley-bot/ecosystem.config.js"
echo ""
echo "3. Teste o bot em modo desenvolvimento:"
echo "   cd ~/rvc-volley-bot && bun dev SEU_TOKEN"
echo ""
echo "4. Para produção 24/7, execute:"
echo "   pm2 start ecosystem.config.js"
echo ""
echo -e "${BLUE}📚 Para mais informações, consulte o arquivo VM_SETUP_GUIDE.md${NC}"
echo ""
echo -e "${GREEN}🚀 Seu bot está pronto para ser configurado!${NC}"