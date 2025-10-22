/**
 * PASSO 5 - Script Simplificado de Teste dos 3 Cenários
 * Testa apenas a criação de leads e logs do backend
 */

const http = require('http');

const BASE_URL = 'http://localhost:3050';
const SESSION_PREFIX = 'test-scenario-';

// Função auxiliar para fazer requisições HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Função para iniciar sessão
async function startSession(sessionId) {
  console.log(`   🔧 Iniciando sessão: ${sessionId}`);
  const response = await makeRequest('POST', '/api/chatbot/session/start', {
    sessionId,
    source: 'web_chat'
  });
  return response;
}

// Função para enviar mensagem ao chatbot
async function sendMessage(sessionId, message) {
  console.log(`   📤 Enviando: "${message}"`);
  const response = await makeRequest('POST', `/api/chatbot/session/${sessionId}/message`, {
    message,
    source: 'web_chat'
  });
  console.log(`   📥 Resposta: ${response.response ? response.response.substring(0, 60) + '...' : 'OK'}`);
  return response;
}

// CENÁRIO A: Fluxo Normal - Usuário completa tudo incluindo produtos
async function testScenarioA() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📋 CENÁRIO A: Fluxo Normal com Produtos');
  console.log('═══════════════════════════════════════════════════════\n');

  const sessionId = SESSION_PREFIX + 'A-' + Date.now();
  console.log(`🔑 Session ID: ${sessionId}\n`);

  try {
    // Iniciar sessão
    await startSession(sessionId);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fluxo completo até produtos
    await sendMessage(sessionId, 'Olá');
    await new Promise(resolve => setTimeout(resolve, 500));

    await sendMessage(sessionId, 'Fernando Martins');
    await new Promise(resolve => setTimeout(resolve, 500));

    await sendMessage(sessionId, '62999999999');
    await new Promise(resolve => setTimeout(resolve, 500));

    await sendMessage(sessionId, 'fernando@test.com');
    await new Promise(resolve => setTimeout(resolve, 500));

    await sendMessage(sessionId, 'produtor rural');
    await new Promise(resolve => setTimeout(resolve, 500));

    await sendMessage(sessionId, 'Sim, quero ver os produtos');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Selecionar produto
    await sendMessage(sessionId, '1');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n✅ CENÁRIO A: Fluxo completado. Verifique os logs do backend!\n');
    console.log(`🔍 Para verificar o lead criado, busque no banco por sessionId: ${sessionId}`);
    return true;

  } catch (error) {
    console.log('❌ ERRO:', error.message);
    return false;
  }
}

// CENÁRIO B: Auto-save durante seleção de produtos
async function testScenarioB() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📋 CENÁRIO B: Auto-save Durante Seleção');
  console.log('═══════════════════════════════════════════════════════\n');

  const sessionId = SESSION_PREFIX + 'B-' + Date.now();
  console.log(`🔑 Session ID: ${sessionId}\n`);

  try {
    // Iniciar sessão
    await startSession(sessionId);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Enviar exatamente 5 mensagens para triggerar auto-save
    await sendMessage(sessionId, 'Olá');
    await new Promise(resolve => setTimeout(resolve, 500));

    await sendMessage(sessionId, 'Fernando Teste B');
    await new Promise(resolve => setTimeout(resolve, 500));

    await sendMessage(sessionId, '62888888888');
    await new Promise(resolve => setTimeout(resolve, 500));

    await sendMessage(sessionId, 'fernando.b@test.com');
    await new Promise(resolve => setTimeout(resolve, 500));

    await sendMessage(sessionId, 'produtor rural'); // Mensagem #5 - deveria triggerar auto-save
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n⏸️ PAUSA - Auto-save deveria ter sido executado agora');
    console.log('🔍 Verifique nos logs se o lead foi criado SEM produtos\n');

    // Agora selecionar produtos
    await sendMessage(sessionId, 'Sim, quero ver os produtos');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await sendMessage(sessionId, '1');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n✅ CENÁRIO B: Fluxo completado. Verifique os logs do backend!\n');
    console.log(`🔍 Verifique se o lead foi ATUALIZADO com produtos`);
    console.log(`🔍 Busque no banco por sessionId: ${sessionId}`);
    return true;

  } catch (error) {
    console.log('❌ ERRO:', error.message);
    return false;
  }
}

// CENÁRIO C: Abandono antes de selecionar produtos
async function testScenarioC() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📋 CENÁRIO C: Abandono Antes de Produtos');
  console.log('═══════════════════════════════════════════════════════\n');

  const sessionId = SESSION_PREFIX + 'C-' + Date.now();
  console.log(`🔑 Session ID: ${sessionId}\n`);

  try {
    // Iniciar sessão
    await startSession(sessionId);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Enviar só 5 mensagens e parar (sem chegar nos produtos)
    await sendMessage(sessionId, 'Olá');
    await new Promise(resolve => setTimeout(resolve, 500));

    await sendMessage(sessionId, 'Fernando Teste C');
    await new Promise(resolve => setTimeout(resolve, 500));

    await sendMessage(sessionId, '62777777777');
    await new Promise(resolve => setTimeout(resolve, 500));

    await sendMessage(sessionId, 'fernando.c@test.com');
    await new Promise(resolve => setTimeout(resolve, 500));

    await sendMessage(sessionId, 'produtor rural'); // Mensagem #5
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n✅ CENÁRIO C: Fluxo completado (abandonado). Verifique os logs!\n');
    console.log(`🔍 Lead deveria ter sido criado SEM produtos e SEM automação`);
    console.log(`🔍 Busque no banco por sessionId: ${sessionId}`);
    return true;

  } catch (error) {
    console.log('❌ ERRO:', error.message);
    return false;
  }
}

// Executar todos os cenários
async function runAllScenarios() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║   PASSO 5 - TESTE DOS 3 CENÁRIOS                      ║');
  console.log('║   Solução: Update Existing Lead (Solução C)           ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  console.log('ℹ️ Este teste executará os 3 cenários e exibirá as interações.');
  console.log('ℹ️ Verifique os logs do backend para validar o comportamento.\n');

  // Executar cada cenário
  await testScenarioA();
  await new Promise(resolve => setTimeout(resolve, 3000));

  await testScenarioB();
  await new Promise(resolve => setTimeout(resolve, 3000));

  await testScenarioC();

  // Instruções finais
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║           TESTES EXECUTADOS COM SUCESSO               ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  console.log('📋 PRÓXIMOS PASSOS PARA VALIDAÇÃO:\n');
  console.log('1️⃣ Verificar logs do backend (docker logs ferraco-crm-vps)');
  console.log('   - Buscar por "test-scenario" nos logs');
  console.log('   - Verificar se leads foram criados/atualizados');
  console.log('   - Verificar se produtos foram capturados');
  console.log('   - Verificar se automações foram criadas\n');

  console.log('2️⃣ Verificar no banco de dados (Prisma Studio ou SQL)');
  console.log('   - SELECT * FROM "Lead" WHERE "metadata" LIKE \'%test-scenario%\';');
  console.log('   - Verificar campo metadata.selectedProducts');
  console.log('   - Verificar se WhatsAppAutomation foi criada\n');

  console.log('3️⃣ Critérios de Sucesso:');
  console.log('   ✅ Cenário A: Lead com produtos + automação criada');
  console.log('   ✅ Cenário B: Lead atualizado com produtos + automação');
  console.log('   ✅ Cenário C: Lead sem produtos + sem automação\n');

  console.log('═'.repeat(55) + '\n');
}

// Executar
runAllScenarios().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
