# 🛡️ Sistema de Proteção Anti-Spam WhatsApp

## 🎯 Visão Geral

Sistema robusto de **proteção contra banimento do WhatsApp** com múltiplas camadas de segurança baseado nas melhores práticas do WhatsApp Business API e políticas oficiais do WhatsApp.

---

## ⚠️ Por Que É Necessário?

O WhatsApp possui **mecanismos automáticos de detecção de spam** que podem resultar em:

### **Consequências do Banimento:**
- ⛔ **Bloqueio temporário** (24h-7 dias)
- ⛔ **Bloqueio permanente** da conta
- ⛔ **Blacklist do número** (impossível reativar)
- ⛔ **Perda de confiança** dos clientes

### **Padrões que Triggeram Banimento:**
- ❌ Envio em massa muito rápido (>15 msgs/minuto)
- ❌ Mensagens idênticas para múltiplos contatos
- ❌ Envio fora do horário comercial
- ❌ Alto índice de bloqueios/denúncias
- ❌ Spikes repentinos de volume
- ❌ Múltiplas falhas consecutivas

---

## 🛡️ Camadas de Proteção Implementadas

### **1. Rate Limiting (Janela Deslizante)**

Limites automáticos baseados em tempo real:

| **Limite** | **Valor** | **Baseado Em** |
|-----------|----------|----------------|
| Por Minuto | 12 mensagens | WhatsApp recomenda 10-15/min |
| Por Hora | 200 mensagens | Práticas seguras |
| Por Dia | 1.000 mensagens | Limite conservador |
| Por Contato/Dia | 5 mensagens | Evita spam individual |

**Técnica:** Sliding Window (janela deslizante) - mais preciso que contadores fixos.

---

### **2. Delays Humanizados**

Variação aleatória nos intervalos para simular comportamento humano:

```typescript
// Delay entre mensagens de texto
MIN: 2 segundos
MAX: 8 segundos
VARIAÇÃO: ±20% aleatória

// Delay após enviar mídia (imagens/vídeos)
ADICIONAL: +5 segundos

// Delay entre automações diferentes
MÍNIMO: 30 segundos
```

**Exemplo:**
```
Mensagem 1 → 3.2s → Mensagem 2 → 6.8s → Imagem → 7.5s → Mensagem 3
```

Delays variáveis evitam padrões detectáveis por bots.

---

### **3. Horário Comercial**

Envios pausados automaticamente fora do horário comercial:

```
Horário Permitido: 08:00 - 20:00 (Segunda a Sexta)
Final de Semana: BLOQUEADO
Feriados: Não implementado (futuro)
```

**Razão:** WhatsApp penaliza mensagens fora de horário comercial (incomoda usuários).

---

### **4. Circuit Breaker**

Sistema de proteção contra cascata de falhas:

```
Trigger: 5 falhas consecutivas
Ação: Pausa automática de 5 minutos
Reset: Automático após pausa ou sucesso
```

**Cenário:**
```
Falha 1 → Falha 2 → Falha 3 → Falha 4 → Falha 5
    ↓
🚨 CIRCUIT BREAKER ATIVO
    ↓
Aguardar 5 minutos
    ↓
✅ Sistema retoma envios
```

---

### **5. Detecção de Burst (Rajada)**

Detecta padrões suspeitos de envio muito rápido:

```
Regra: Mais de 5 mensagens em 10 segundos = BURST
Ação: Pausa de 30 segundos
```

Protege contra bugs que causem loops infinitos.

---

### **6. Registro e Auditoria**

Todos os envios são registrados para análise:

```typescript
{
  timestamp: Date,
  phone: string,
  automationId: string,
  success: boolean
}
```

**Limpeza Automática:** Registros >24h são removidos (economiza memória).

---

## 📊 Estatísticas em Tempo Real

### **Endpoint:** `GET /api/whatsapp-automations/anti-spam-stats`

```json
{
  "messagesLastMinute": 8,
  "messagesLastHour": 45,
  "messagesLastDay": 234,
  "failureRate": 2.5,
  "isPaused": false,
  "pausedUntil": null
}
```

### **Indicadores:**
- ✅ `failureRate < 5%` - Normal
- ⚠️ `failureRate 5-10%` - Atenção
- 🚨 `failureRate > 10%` - Investigar

---

## 🎯 Como Funciona na Prática

### **Fluxo de Envio Protegido:**

```
1. Lead manifesta interesse em produtos via chatbot
   ↓
2. Sistema cria automação (PENDING)
   ↓
3. Automação entra na fila de processamento
   ↓
4. 🛡️ ANTI-SPAM: Verificar se pode enviar
   ├─ Horário comercial? ✅
   ├─ Circuit breaker ativo? ❌
   ├─ Limite por minuto atingido? ❌ (8/12)
   ├─ Limite por hora atingido? ❌ (45/200)
   ├─ Limite por dia atingido? ❌ (234/1000)
   ├─ Limite para este contato? ❌ (1/5)
   └─ Padrão de burst? ❌
   ↓
5. ✅ LIBERADO - Iniciar envio
   ↓
6. Mensagem 1 → Delay 3.5s → Registro ✅
   ↓
7. Mensagem 2 → Delay 5.2s → Registro ✅
   ↓
8. Imagem → Delay 7.8s → Registro ✅
   ↓
9. Automação COMPLETA
```

### **Fluxo Bloqueado:**

```
1. Tentativa de envio
   ↓
2. 🛡️ ANTI-SPAM: Limite por minuto atingido (12/12)
   ↓
3. ⏸️ BLOQUEADO
   ↓
4. Automação volta para PENDING
   ↓
5. Re-agendamento automático para 60s depois
   ↓
6. Sistema tenta novamente
```

---

## 🔧 Configuração

### **Arquivo:** `whatsappAntiSpam.service.ts`

```typescript
const LIMITS = {
  PER_MINUTE: 12,          // Ajustar conforme volume
  PER_HOUR: 200,           // Ajustar conforme volume
  PER_DAY: 1000,           // Ajustar conforme volume
  PER_CONTACT_PER_DAY: 5,  // Máximo por contato

  MIN_DELAY_BETWEEN_MESSAGES: 2000,  // ms
  MAX_DELAY_BETWEEN_MESSAGES: 8000,  // ms

  BUSINESS_HOURS: {
    START: 8,   // 08:00
    END: 20,    // 20:00
  },

  MAX_FAILURES_BEFORE_PAUSE: 5,
  PAUSE_DURATION_MS: 300000,  // 5 minutos
};
```

### **Ajustes Recomendados:**

**Para alto volume (>500 leads/dia):**
```typescript
PER_MINUTE: 15
PER_HOUR: 300
PER_DAY: 2000
```

**Para conservador (máxima segurança):**
```typescript
PER_MINUTE: 8
PER_HOUR: 150
PER_DAY: 500
MIN_DELAY: 3000
MAX_DELAY: 10000
```

---

## 🚨 Monitoramento e Alertas

### **Dashboard Visual**

Adicionar na página `/admin/whatsapp-automations`:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Proteção Anti-Spam</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-3 gap-4">
      <div>
        <p className="text-sm text-gray-500">Último Minuto</p>
        <p className="text-2xl font-bold">
          {stats.messagesLastMinute}/12
        </p>
        <Progress value={(stats.messagesLastMinute / 12) * 100} />
      </div>
      <div>
        <p className="text-sm text-gray-500">Última Hora</p>
        <p className="text-2xl font-bold">
          {stats.messagesLastHour}/200
        </p>
        <Progress value={(stats.messagesLastHour / 200) * 100} />
      </div>
      <div>
        <p className="text-sm text-gray-500">Taxa de Falha</p>
        <p className={`text-2xl font-bold ${
          stats.failureRate > 10 ? 'text-red-600' : 'text-green-600'
        }`}>
          {stats.failureRate.toFixed(1)}%
        </p>
      </div>
    </div>

    {stats.isPaused && (
      <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Sistema em Pausa</AlertTitle>
        <AlertDescription>
          Circuit breaker ativado. Retoma em{' '}
          {formatDistance(stats.pausedUntil, new Date(), { locale: ptBR })}
        </AlertDescription>
      </Alert>
    )}
  </CardContent>
</Card>
```

---

## 🆘 Troubleshooting

### **Problema 1: Mensagens não estão sendo enviadas**

**Sintomas:**
- Automações ficam em PENDING
- Logs mostram "bloqueado"

**Causas Possíveis:**
1. Limite atingido → Ver stats
2. Fora do horário comercial → Aguardar 08h
3. Circuit breaker ativo → Aguardar 5 minutos
4. WhatsApp desconectado → Reconectar

**Solução:**
```bash
# Ver stats
GET /api/whatsapp-automations/anti-spam-stats

# Se limites OK mas ainda bloqueado
POST /api/whatsapp-automations/reset-anti-spam
```

### **Problema 2: Circuit Breaker ativou**

**Causa:** 5+ falhas consecutivas

**Investigar:**
```sql
SELECT * FROM whatsapp_automations
WHERE status = 'FAILED'
ORDER BY createdAt DESC
LIMIT 10;
```

**Verificar:**
- WhatsApp conectado?
- Números válidos?
- Erro de mídia (imagem quebrada)?

**Reset Manual (emergência):**
```bash
POST /api/whatsapp-automations/reset-anti-spam
```

### **Problema 3: Alta taxa de falha**

**Taxa > 10%** indica problema sistêmico:

**Checklist:**
1. ✅ WhatsApp está conectado?
2. ✅ Números estão com DDI correto? (+55)
3. ✅ URLs de mídia válidas?
4. ✅ Servidor tem conexão estável?
5. ✅ WhatsApp não está bloqueado?

---

## 📈 Melhores Práticas

### **✅ DO:**
- Respeitar horário comercial
- Variar conteúdo das mensagens
- Monitorar taxa de bloqueio/denúncia
- Usar delays humanizados
- Limpar contatos inativos
- Testar com volume pequeno primeiro

### **❌ DON'T:**
- Enviar mensagens idênticas em massa
- Ignorar bloqueios de usuários
- Desabilitar anti-spam "para ir mais rápido"
- Enviar para números sem consentimento
- Usar listas compradas de contatos
- Resetar anti-spam frequentemente

---

## 🔮 Melhorias Futuras

- [ ] Machine Learning para detectar padrões de banimento
- [ ] Integração com WhatsApp Business API oficial
- [ ] Rotação automática de números (multi-dispositivo)
- [ ] Análise de sentimento para evitar mensagens agressivas
- [ ] Pausas automáticas em feriados
- [ ] Whitelist/Blacklist de contatos
- [ ] Geolocalização para horários regionais

---

## 📚 Referências

- [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy)
- [WhatsApp Business API Rate Limits](https://developers.facebook.com/docs/whatsapp/cloud-api/overview#throughput)
- [Anti-Spam Best Practices](https://github.com/wppconnect-team/wppconnect/wiki/Anti-Spam)

---

**Implementado por:** Claude Code
**Data:** 2025-10-22
**Versão:** 1.0
**Status:** ✅ Produção
