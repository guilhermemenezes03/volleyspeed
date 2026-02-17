#!/usr/bin/env python3
"""
Script para postar a documentação de economia no Discord via Webhooks.
Uso: python3 post_economia.py <webhook_url>
"""

import requests
import json
import sys
import time
from pathlib import Path

def post_webhook(webhook_url: str, json_file: str) -> bool:
    """
    Posta um arquivo JSON como webhook no Discord.
    """
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        response = requests.post(webhook_url, json=data)
        
        if response.status_code == 204:
            print(f"✅ {json_file} enviado com sucesso!")
            return True
        else:
            print(f"❌ Erro ao enviar {json_file}: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erro ao processar {json_file}: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("❌ Uso: python3 post_economia.py <webhook_url>")
        print("\nExemplo:")
        print('python3 post_economia.py "https://discord.com/api/webhooks/123456789/abcdefgh..."')
        sys.exit(1)
    
    webhook_url = sys.argv[1]
    
    files = [
        "webhook_economia_1.json",
        "webhook_economia_2.json",
        "webhook_economia_3.json",
        "webhook_economia_4.json",
        "webhook_economia_5.json"
    ]
    
    print("📤 Iniciando postagem da documentação de economia...\n")
    
    success_count = 0
    for i, file in enumerate(files, 1):
        if Path(file).exists():
            print(f"[{i}/5] Enviando {file}...")
            if post_webhook(webhook_url, file):
                success_count += 1
            time.sleep(1)  # Aguarde 1 segundo entre mensagens
        else:
            print(f"⚠️  Arquivo não encontrado: {file}")
    
    print(f"\n{'='*50}")
    print(f"📊 Resultado: {success_count}/{len(files)} arquivos enviados com sucesso!")
    
    if success_count == len(files):
        print("🎉 Documentação postada com sucesso no Discord!")
    else:
        print("⚠️  Alguns arquivos falharam. Verifique a URL do webhook e tente novamente.")
    
    sys.exit(0 if success_count == len(files) else 1)

if __name__ == "__main__":
    main()
