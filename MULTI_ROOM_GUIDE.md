# 🎮 Guia de Gerenciamento de Múltiplas Salas

Este guia explica como abrir e gerenciar múltiplas salas do RVC Volley Bot usando Discord e PM2.

## 📋 Pré-requisitos

1. **Node.js** e **PM2** instalados
2. **Bot Discord** criado (para gerenciamento)
3. **IPs adicionais + Squid** (para mais de 2 salas)
4. **PostgreSQL** configurado

---

## 🔧 Configuração Inicial

### 1. Instalar dependências

```bash
npm install discord.js pm2 -g
npm install
npm run build
```

### 2. Configurar variáveis de ambiente

Edite o arquivo `.env`:

```bash
nano .env
```

Adicione:

```env
# Token do bot Discord MANAGER (para controlar salas)
MANAGER_DISCORD_TOKEN=seu_token_manager_aqui

# IDs dos usuários permitidos (separados por vírgula)
DISCORD_MASTERS=123456789012345678,987654321098765432

# Token do bot Discord PRINCIPAL (usado pelo jogo)
DISCORD_TOKEN=seu_token_do_jogo_aqui

# Database
DATABASE_URL=postgresql://usuario:senha@localhost:5432/volleydb
```

### 3. Iniciar o Manager Bot

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🎯 Comandos Discord

### Abrir uma sala
```
!open sala1 thr1.AAAAAGmcoUSOCAhmgmvapA.1TapFlQ9VfM
!open sala2 thr1.AAAAAGmcpNAn6xBLzgqGyA.H1spRjokC9w
!open sala3 thr1.AAAAAGmco0mQlsuUIUeDFg.8iGQoYTReJo
```

### Ver status de todas as salas
```
!list
```

### Fechar uma sala
```
!close sala1
```

### Reiniciar uma sala
```
!restart sala2
```

### Ver logs de uma sala
```
!logs sala1
```

### Fechar todas as salas
```
!closeall
```

### Ajuda
```
!help
```

---

## 🌐 Configuração de Proxies (para 3+ salas)

### 1. Adicionar IP secundário na AWS EC2

No console AWS:
1. EC2 → Network Interfaces → selecione sua interface
2. Actions → Manage IP Addresses → Assign new IP
3. Anote o IP privado (ex: `172.31.7.50`)

### 2. Associar Elastic IP

1. EC2 → Elastic IPs → Allocate address
2. Actions → Associate Elastic IP
3. Selecione sua instância e o IP privado secundário

### 3. Ativar IP secundário no Ubuntu

```bash
sudo ip addr add 172.31.7.50/20 dev ens5 label ens5:1
ip addr show dev ens5  # confirmar
```

### 4. Configurar Squid Proxy

Instalar:
```bash
sudo apt update
sudo apt install -y squid
```

Editar configuração:
```bash
sudo nano /etc/squid/squid.conf
```

Adicionar no final:
```
http_port 127.0.0.1:8000 name=8000
http_port 127.0.0.1:8001 name=8001

acl prt8000 myportname 8000 src 172.31.7.11/24
http_access allow prt8000
tcp_outgoing_address 172.31.7.11 prt8000

acl prt8001 myportname 8001 src 172.31.7.50/24
http_access allow prt8001
tcp_outgoing_address 172.31.7.50 prt8001
```

Reiniciar Squid:
```bash
sudo systemctl restart squid
sudo systemctl enable squid
```

### 5. Configurar proxies nas salas

**Para sala1 e sala2** (usando IP principal):
- Nenhuma configuração de proxy necessária

**Para sala3** (usando IP secundário via proxy):

Edite `manager-bot.js` e adicione proxy:

```javascript
const ROOMS = {
  'sala1': { name: 'RVC Volley #1', script: 'dist/index.js', args: 'TOKEN1' },
  'sala2': { name: 'RVC Volley #2', script: 'dist/index.js', args: 'TOKEN2' },
  'sala3': { 
    name: 'RVC Volley #3', 
    script: 'dist/index.js', 
    args: 'TOKEN3',
    env: { HTTP_PROXY: 'http://127.0.0.1:8001', HTTPS_PROXY: 'http://127.0.0.1:8001' }
  }
};
```

---

## 📊 Monitoramento

### Ver todas as salas rodando
```bash
pm2 list
```

### Ver logs em tempo real
```bash
pm2 logs manager-bot
pm2 logs sala1
```

### Ver uso de memória/CPU
```bash
pm2 monit
```

### Reiniciar tudo
```bash
pm2 restart all
```

---

## 🚨 Troubleshooting

### Sala não abre
1. Verificar se o token está correto
2. Ver logs: `pm2 logs sala1`
3. Verificar memória: `free -h`

### Bot Discord não responde
1. Verificar se está rodando: `pm2 list`
2. Ver logs: `pm2 logs manager-bot`
3. Verificar token e permissões

### Sala fecha sozinha
1. Ver logs de erro: `pm2 logs sala1 --err`
2. Verificar memória disponível
3. Verificar se o token expirou

### Proxy não funciona
1. Ver status do Squid: `sudo systemctl status squid`
2. Testar proxy: `curl -x http://127.0.0.1:8001 http://google.com`
3. Ver logs do Squid: `sudo tail -f /var/log/squid/access.log`

---

## 📝 Notas Importantes

- **Máximo de 2 salas por IP** (limitação do Haxball)
- Para **3 salas**, você precisa de **1 IP adicional + proxy**
- Para **4 salas**, você precisa de **1 IP adicional + proxy** (2 por IP)
- Para **6 salas**, você precisa de **2 IPs adicionais + proxies**

---

## 🔄 Atualizações

Quando atualizar o código:

```bash
git pull origin main
npm run build
pm2 restart all
```

---

## 📞 Suporte

Se algo não funcionar:
1. Veja os logs: `pm2 logs`
2. Verifique se todas as variáveis de ambiente estão corretas
3. Certifique-se que o PostgreSQL está rodando
4. Verifique se tem memória disponível: `free -h`
