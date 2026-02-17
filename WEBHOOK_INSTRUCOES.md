# 📤 Instruções para Postar no Discord via Webhook

## Como Usar os JSONs no Discord

Os 5 arquivos JSON (`webhook_economia_1.json` até `webhook_economia_5.json`) contêm embeds formatados para postar a documentação de economia no Discord.

### Método 1: Usando cURL (Windows PowerShell)

```powershell
$webhookUrl = "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN"

# Postar cada arquivo
$files = @(
  "webhook_economia_1.json",
  "webhook_economia_2.json",
  "webhook_economia_3.json",
  "webhook_economia_4.json",
  "webhook_economia_5.json"
)

foreach ($file in $files) {
  $content = Get-Content $file -Raw
  Invoke-WebRequest -Uri $webhookUrl -Method Post -ContentType "application/json" -Body $content
  Start-Sleep -Seconds 1  # Aguarde 1 segundo entre mensagens
}
```

### Método 2: Usando Node.js

```javascript
const fs = require('fs');
const https = require('https');

const webhookUrl = 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN';
const files = [
  'webhook_economia_1.json',
  'webhook_economia_2.json',
  'webhook_economia_3.json',
  'webhook_economia_4.json',
  'webhook_economia_5.json'
];

files.forEach((file, index) => {
  setTimeout(() => {
    const data = fs.readFileSync(file, 'utf8');
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(webhookUrl, options, (res) => {
      console.log(`✅ ${file} enviado (Status: ${res.statusCode})`);
    });

    req.on('error', (error) => {
      console.error(`❌ Erro ao enviar ${file}:`, error);
    });

    req.write(data);
    req.end();
  }, index * 1000);  // 1 segundo entre cada mensagem
});
```

### Método 3: Postar Manualmente no Discord

1. No Discord, vá até **Configurações do Canal** → **Integrações** → **Webhooks**
2. Crie um novo webhook ou copie a URL de um existente
3. Copie o conteúdo de cada JSON
4. Com a URL do webhook, acesse: `https://discohook.org/`
5. Cole o JSON no editor
6. Clique em **Send**

---

## 📋 Referência dos Arquivos

| Arquivo | Conteúdo | Embeds |
|---------|----------|--------|
| `webhook_economia_1.json` | Visão Geral + Moeda + Ganhos + Boosts | 3 |
| `webhook_economia_2.json` | Lootboxes + Compensação + Furar Fila | 3 |
| `webhook_economia_3.json` | Apostas + Tigrinho + Transferência + Ranking | 3 |
| `webhook_economia_4.json` | Avatares + Títulos + Raridades | 3 |
| `webhook_economia_5.json` | Comandos Economia + Comandos Loja + Dicas | 4 |

---

## ⚙️ Como Obter a URL do Webhook

1. No Discord, vá ao canal onde deseja falar
2. Clique com botão direito no nome do canal
3. **Editar Canal** → **Integrações** → **Webhooks**
4. Clique em **Novo Webhook** ou selecione um existente
5. Copie a URL (formato: `https://discord.com/api/webhooks/123456789/abcdefgh...`)

---

## 🎨 Customização

Os JSONs usam cores padronizadas, mas você pode editá-las:
- `"color": 16776960` → Amarelo
- `"color": 3394560` → Azul
- `"color": 16744192` → Vermelho
- `"color": 65280` → Verde

Para encontrar outras cores, use [Color Picker](https://www.colorpicker.com/) e converta o código HEX para decimal.

---

## 📝 Notas

- Aguarde **1 segundo** entre postagens para não ser bloqueado pelo Discord
- Se receber erro 429, aguarde **15 minutos** antes de tentar novamente
- Os embeds foram otimizados para caber no limite de caracteres (≤4096 por embed)

---

*RVC Volley Bot • Fevereiro 2026*
