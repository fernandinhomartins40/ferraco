# Guia Rápido de Deploy - metalurgicaferraco.com.br

## 🚀 Deploy Rápido (5 minutos)

### Passo 1: Enviar arquivos para o VPS

```bash
# Enviar script de setup
scp scripts/setup-domain.sh root@72.60.10.108:/root/

# Enviar configuração Nginx
scp docker/nginx-vps.conf root@72.60.10.108:/root/
```

### Passo 2: Executar no VPS

```bash
# Conectar ao VPS
ssh root@72.60.10.108

# Executar setup
chmod +x setup-domain.sh
./setup-domain.sh
```

### Passo 3: Atualizar variáveis de ambiente do backend

```bash
# No VPS, editar .env do backend
nano /var/www/ferraco/backend/.env

# Adicionar/atualizar:
CORS_ORIGIN="https://metalurgicaferraco.com.br,https://www.metalurgicaferraco.com.br,http://localhost:3000"
```

### Passo 4: Reiniciar serviços

```bash
# Reiniciar backend
systemctl restart ferraco-backend

# Verificar status
systemctl status ferraco-backend
systemctl status nginx
```

## ✅ Checklist Final

- [ ] DNS configurado (A record para 72.60.10.108)
- [ ] Script executado sem erros
- [ ] Certificado SSL obtido
- [ ] Site acessível via HTTPS
- [ ] Backend respondendo em /api
- [ ] WebSocket funcionando
- [ ] Redirecionamento HTTP → HTTPS ativo

## 🔍 Verificação

```bash
# Teste 1: DNS
nslookup metalurgicaferraco.com.br

# Teste 2: HTTP redirect
curl -I http://metalurgicaferraco.com.br

# Teste 3: HTTPS
curl -I https://metalurgicaferraco.com.br

# Teste 4: API
curl https://metalurgicaferraco.com.br/api/health

# Teste 5: SSL Certificate
echo | openssl s_client -servername metalurgicaferraco.com.br -connect metalurgicaferraco.com.br:443 2>/dev/null | openssl x509 -noout -dates
```

## 🐛 Troubleshooting Rápido

### Problema: Site não carrega

```bash
# Verificar Nginx
nginx -t
systemctl status nginx
tail -f /var/log/nginx/ferraco-error.log
```

### Problema: API não responde (502)

```bash
# Verificar backend
systemctl status ferraco-backend
tail -f /var/log/ferraco/backend.log
netstat -tulpn | grep 3000
```

### Problema: SSL inválido

```bash
# Verificar certificado
certbot certificates

# Renovar se necessário
certbot renew --force-renewal
systemctl reload nginx
```

## 📱 Contatos e Suporte

- IP VPS: 72.60.10.108
- Domínio Principal: metalurgicaferraco.com.br
- Porta Backend: 3000 (interno)
- Portas Públicas: 80 (HTTP), 443 (HTTPS)
