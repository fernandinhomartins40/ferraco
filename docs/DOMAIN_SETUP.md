# Configuração do Domínio metalurgicaferraco.com.br

Este guia explica como configurar o novo domínio `metalurgicaferraco.com.br` no servidor VPS.

## Pré-requisitos

1. DNS configurado apontando para o IP do servidor (72.60.10.108)
   - `metalurgicaferraco.com.br` → 72.60.10.108
   - `www.metalurgicaferraco.com.br` → 72.60.10.108

2. Portas abertas no firewall:
   - Porta 80 (HTTP)
   - Porta 443 (HTTPS)
   - Porta 3000 (Backend Node.js - interno)

3. Nginx instalado no servidor

## Método 1: Script Automático (Recomendado)

### Passo 1: Enviar o script para o VPS

```bash
# Do seu computador local
scp scripts/setup-domain.sh root@72.60.10.108:/root/
```

### Passo 2: Executar o script no VPS

```bash
# Conectar ao VPS
ssh root@72.60.10.108

# Dar permissão de execução
chmod +x /root/setup-domain.sh

# Executar o script
./setup-domain.sh
```

O script irá:
- ✅ Instalar Certbot (se necessário)
- ✅ Configurar Nginx para o domínio
- ✅ Obter certificado SSL/TLS gratuito via Let's Encrypt
- ✅ Configurar redirecionamento HTTP → HTTPS
- ✅ Configurar renovação automática do certificado
- ✅ Aplicar headers de segurança
- ✅ Otimizar cache e compressão

## Método 2: Configuração Manual

### Passo 1: Instalar Certbot

```bash
apt update
apt install -y certbot python3-certbot-nginx
```

### Passo 2: Copiar configuração do Nginx

```bash
# Copiar o arquivo de configuração
cp /path/to/docker/nginx-vps.conf /etc/nginx/sites-available/ferraco

# Criar symlink
ln -sf /etc/nginx/sites-available/ferraco /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Recarregar Nginx
systemctl reload nginx
```

### Passo 3: Obter certificado SSL

```bash
certbot --nginx -d metalurgicaferraco.com.br -d www.metalurgicaferraco.com.br
```

### Passo 4: Configurar renovação automática

```bash
# Adicionar ao crontab
crontab -e

# Adicionar esta linha:
0 0,12 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'
```

## Verificação

Após a configuração, verifique:

### 1. DNS propagado

```bash
nslookup metalurgicaferraco.com.br
nslookup www.metalurgicaferraco.com.br
```

### 2. Nginx funcionando

```bash
systemctl status nginx
nginx -t
```

### 3. Certificado SSL válido

```bash
certbot certificates
```

### 4. Acesso ao site

Acesse no navegador:
- https://metalurgicaferraco.com.br
- https://www.metalurgicaferraco.com.br

## Variáveis de Ambiente

### Backend (.env)

Atualize o arquivo `.env` do backend para incluir o novo domínio no CORS:

```env
# CORS - Permitir múltiplos domínios
CORS_ORIGIN="https://metalurgicaferraco.com.br,https://www.metalurgicaferraco.com.br"
```

### Aplicação Frontend

O frontend já está configurado para funcionar com qualquer domínio, pois usa paths relativos.

## Estrutura do Nginx

```
/etc/nginx/
├── sites-available/
│   └── ferraco              # Configuração principal
├── sites-enabled/
│   └── ferraco -> ../sites-available/ferraco
└── nginx.conf               # Configuração global
```

## Logs

```bash
# Logs de acesso
tail -f /var/log/nginx/ferraco-access.log

# Logs de erro
tail -f /var/log/nginx/ferraco-error.log

# Logs do backend
tail -f /var/log/ferraco/backend.log
```

## Troubleshooting

### Erro: "Name or service not known"

- Verifique se o DNS foi propagado (pode levar até 48h)
- Use `dig metalurgicaferraco.com.br` para verificar

### Erro: "Connection refused"

- Verifique se o Nginx está rodando: `systemctl status nginx`
- Verifique se as portas estão abertas: `netstat -tulpn | grep nginx`

### Erro: "SSL certificate problem"

- Aguarde alguns minutos após a instalação do certificado
- Verifique se o certificado foi instalado: `certbot certificates`
- Tente renovar manualmente: `certbot renew --force-renewal`

### Erro 502 Bad Gateway

- Verifique se o backend está rodando: `systemctl status ferraco-backend`
- Verifique os logs do backend: `tail -f /var/log/ferraco/backend.log`

## Renovação de Certificado

O certificado SSL é renovado automaticamente via cron job. Para renovar manualmente:

```bash
certbot renew
systemctl reload nginx
```

## Rollback

Se precisar reverter para a configuração anterior:

```bash
# Restaurar backup
cp /etc/nginx/sites-available/ferraco.backup.YYYYMMDD_HHMMSS /etc/nginx/sites-available/ferraco

# Recarregar Nginx
nginx -t
systemctl reload nginx
```

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs do Nginx e do backend
2. Teste a configuração: `nginx -t`
3. Verifique o status dos serviços: `systemctl status nginx ferraco-backend`
