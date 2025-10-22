/**
 * PASSO 5 - Script de Teste dos 3 Cenários
 * Testa a solução implementada para criação de automações WhatsApp
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

// Função para enviar mensagem ao chatbot
async function sendMessage(sessionId, message) {
  return makeRequest('POST', '/api/chatbot/message', {
    sessionId,
    message,
    source: 'web_chat'
  });
}

// Função para verificar se lead foi criado
async function checkLead(sessionId) {
  const session = await makeRequest('GET', `/api/chatbot/sessions/${sessionId}`);
  if (session.leadId) {
    const lead = await makeRequest('GET', `/api/leads/${session.leadId}`);
    return lead;
  }
  return null;
}

// Função para verificar automação
async function checkAutomation(leadId) {
  try {
    const automations = await makeRequest('GET', `/api/whatsapp-automations?leadId=${leadId}`);
    return automations;
  } catch (error) {
    return null;
  }
}

// CENÁRIO A: Fluxo Normal - Usuário completa tudo incluindo produtos
async function testScenarioA() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📋 CENÁRIO A: Fluxo Normal com Produtos');
  console.log('═══════════════════════════════════════════════════════\n');

  const sessionId = SESSION_PREFIX + 'A-' + Date.now();

  try {
    // Fluxo completo até produtos
    await sendMessage(sessionId, 'Olá');
    await sendMessage(sessionId, 'Fernando Martins');
    await sendMessage(sessionId, '62999999999');
    await sendMessage(sessionId, 'fernando@test.com');
    await sendMessage(sessionId, 'produtor rural');
    await sendMessage(sessionId, 'Sim, quero ver os produtos'); // Trigger lista de produtos

    // Aguardar 1 segundo para processar
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Selecionar produto (ID real do banco)
    await sendMessage(sessionId, '1'); // Seleciona primeiro produto

    // Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar lead
    const lead = await checkLead(sessionId);

    if (!lead) {
      console.log('❌ FALHA: Lead não foi criado');
      return false;
    }

    console.log(`✅ Lead criado: ${lead.id}`);

    // Verificar metadata
    let metadata = {};
    try {
      metadata = JSON.parse(lead.metadata || '{}');
    } catch (e) {
      console.log('⚠️ Erro ao parsear metadata');
    }

    const hasProducts = metadata.selectedProducts && metadata.selectedProducts.length > 0;
    console.log(`📦 Produtos no metadata: ${hasProducts ? metadata.selectedProducts.length : 0}`);

    if (!hasProducts) {
      console.log('❌ FALHA: Lead não contém produtos no metadata');
      return false;
    }

    // Verificar automação
    await new Promise(resolve => setTimeout(resolve, 1000));
    const automation = await checkAutomation(lead.id);

    if (!automation || automation.length === 0) {
      console.log('❌ FALHA: Automação WhatsApp não foi criada');
      return false;
    }

    console.log(`✅ Automação criada: ${automation[0].id}`);
    console.log('\n✅ CENÁRIO A: PASSOU EM TODOS OS TESTES!\n');
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

  try {
    // Enviar exatamente 5 mensagens para triggerar auto-save
    await sendMessage(sessionId, 'Olá');
    await sendMessage(sessionId, 'Fernando Teste B');
    await sendMessage(sessionId, '62888888888');
    await sendMessage(sessionId, 'fernando.b@test.com');
    await sendMessage(sessionId, 'produtor rural'); // Mensagem #5 - deveria triggerar auto-save

    // Aguardar auto-save
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar se lead foi criado sem produtos
    let lead = await checkLead(sessionId);

    if (!lead) {
      console.log('❌ FALHA: Lead não foi criado no auto-save');
      return false;
    }

    console.log(`✅ Lead criado no auto-save: ${lead.id}`);

    let metadata = JSON.parse(lead.metadata || '{}');
    const productsBeforeSelection = metadata.selectedProducts || [];
    console.log(`📦 Produtos ANTES da seleção: ${productsBeforeSelection.length}`);

    // Agora selecionar produtos
    await sendMessage(sessionId, 'Sim, quero ver os produtos');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await sendMessage(sessionId, '1'); // Seleciona produto

    // Aguardar update
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar se lead foi ATUALIZADO com produtos
    lead = await checkLead(sessionId);
    metadata = JSON.parse(lead.metadata || '{}');
    const productsAfterSelection = metadata.selectedProducts || [];

    console.log(`📦 Produtos DEPOIS da seleção: ${productsAfterSelection.length}`);

    if (productsAfterSelection.length === 0) {
      console.log('❌ FALHA: Lead não foi atualizado com produtos');
      return false;
    }

    console.log('✅ Lead foi atualizado com produtos!');

    // Verificar automação
    const automation = await checkAutomation(lead.id);

    if (!automation || automation.length === 0) {
      console.log('❌ FALHA: Automação não foi criada após update');
      return false;
    }

    console.log(`✅ Automação criada: ${automation[0].id}`);
    console.log('\n✅ CENÁRIO B: PASSOU EM TODOS OS TESTES!\n');
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

  try {
    // Enviar só 5 mensagens e parar (sem chegar nos produtos)
    await sendMessage(sessionId, 'Olá');
    await sendMessage(sessionId, 'Fernando Teste C');
    await sendMessage(sessionId, '62777777777');
    await sendMessage(sessionId, 'fernando.c@test.com');
    await sendMessage(sessionId, 'produtor rural'); // Mensagem #5

    // Aguardar auto-save
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar lead
    const lead = await checkLead(sessionId);

    if (!lead) {
      console.log('❌ FALHA: Lead não foi criado');
      return false;
    }

    console.log(`✅ Lead criado: ${lead.id}`);

    // Verificar que NÃO tem produtos (comportamento esperado)
    const metadata = JSON.parse(lead.metadata || '{}');
    const hasProducts = metadata.selectedProducts && metadata.selectedProducts.length > 0;

    if (hasProducts) {
      console.log('❌ FALHA: Lead contém produtos (não deveria)');
      return false;
    }

    console.log('✅ Lead criado SEM produtos (comportamento esperado)');

    // Verificar que NÃO tem automação (comportamento esperado)
    const automation = await checkAutomation(lead.id);

    if (automation && automation.length > 0) {
      console.log('❌ FALHA: Automação foi criada sem produtos (não deveria)');
      return false;
    }

    console.log('✅ Automação NÃO criada (comportamento esperado - lead sem produtos)');
    console.log('\n✅ CENÁRIO C: PASSOU EM TODOS OS TESTES!\n');
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

  const results = {
    scenarioA: false,
    scenarioB: false,
    scenarioC: false
  };

  // Executar cada cenário
  results.scenarioA = await testScenarioA();
  await new Promise(resolve => setTimeout(resolve, 2000));

  results.scenarioB = await testScenarioB();
  await new Promise(resolve => setTimeout(resolve, 2000));

  results.scenarioC = await testScenarioC();

  // Relatório final
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║              RELATÓRIO FINAL DOS TESTES               ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  console.log(`Cenário A (Fluxo Normal):        ${results.scenarioA ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`Cenário B (Auto-save + Update):  ${results.scenarioB ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`Cenário C (Abandono):            ${results.scenarioC ? '✅ PASSOU' : '❌ FALHOU'}`);

  const allPassed = results.scenarioA && results.scenarioB && results.scenarioC;

  console.log('\n' + '═'.repeat(55));
  if (allPassed) {
    console.log('🎉 TODOS OS TESTES PASSARAM! SOLUÇÃO VALIDADA! 🎉');
  } else {
    console.log('⚠️ ALGUNS TESTES FALHARAM - REVISAR IMPLEMENTAÇÃO');
  }
  console.log('═'.repeat(55) + '\n');

  process.exit(allPassed ? 0 : 1);
}

// Executar
runAllScenarios().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
