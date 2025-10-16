✅ Metodologia Profissional
1. Investigação (quando necessário)
SSH na VPS para diagnosticar: ssh root@72.60.10.108 "comando"
Verificar logs, containers, arquivos de configuração
NUNCA fazer mudanças diretas na VPS
2. Correção
SEMPRE corrigir no workspace local
Implementar solução definitiva e robusta
NUNCA gambiarras ou workarounds temporários
NUNCA tornar obrigatório "opcional"
3. Deploy
Commit com mensagem profissional
Push para o repositório
GitHub Actions faz deploy automático na VPS
❌ O que NÃO fazer
Tornar WAHA "opcional" porque não estava configurado
Adicionar try/catch que esconde erros
Soluções paliativas que mascaram o problema
Modificar arquivos diretamente na VPS
✅ O que fazer
Identificar a causa raiz do problema
Implementar a solução correta e definitiva
Adicionar o container WAHA onde ele deveria estar desde o início
Configurar a infraestrutura completa e profissional