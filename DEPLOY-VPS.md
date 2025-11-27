# Deploy Manual na VPS - Correção do Swagger

## Problema
O Swagger UI não está acessível em `https://metalurgicaferraco.com.br/api-docs/` porque o Nginx externo da VPS está fazendo proxy de TUDO para o container, incluindo `/api-docs`, que cai no React Router e exige autenticação.

## Solução

Adicionar a location `/api-docs` no Nginx externo da VPS ANTES do location `/` (catch-all).

### Passos:

1. **SSH na VPS**:
```bash
ssh root@72.60.10.108
```

2. **Editar o arquivo de configuração do Nginx**:
```bash
nano /etc/nginx/sites-available/ferraco.conf
```

3. **Adicionar estas linhas ANTES do `location /` no server block do `.com.br`**:

```nginx
    # API Documentation (Swagger) - Public access
    location /api-docs {
        proxy_pass http://localhost:3050/api-docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```

**IMPORTANTE**: Adicionar ACIMA da linha `# Proxy to Docker container` e do `location /`

4. **Testar a configuração**:
```bash
nginx -t
```

5. **Se o teste passar, recarregar o Nginx**:
```bash
systemctl reload nginx
```

6. **Testar o acesso**:
```bash
curl -I https://metalurgicaferraco.com.br/api-docs/
```

Deve retornar `200 OK` e HTML do Swagger UI.

## Arquitetura

```
Nginx Externo (VPS)
├─ /api-docs → proxy → localhost:3050 (Container)
└─ / → proxy → localhost:3050 (Container)
    ↓
Container (Nginx Interno na porta 3050)
├─ /api-docs → proxy → localhost:3000 (Backend)
├─ / → Frontend estático
    ↓
Backend Node.js (porta 3000)
└─ /api-docs → Swagger UI
```
