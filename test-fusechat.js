/**
 * Script de teste para verificar integração FuseChat RAG
 * Execute: node test-fusechat.js
 */

const API_KEY = 'pk_sua_api_key_aqui'; // SUBSTITUA pela sua API Key
const BASE_URL = 'https://digiurbis.com.br';

async function testFuseChat() {
  console.log('🧪 Testando integração FuseChat RAG...\n');

  // Teste 1: Verificar Knowledge Base atual
  console.log('1️⃣ Verificando Knowledge Base atual...');
  try {
    const kbResponse = await fetch(`${BASE_URL}/api/rag/knowledge`, {
      headers: { 'X-API-Key': API_KEY }
    });

    if (kbResponse.ok) {
      const kbData = await kbResponse.json();
      console.log('✅ Knowledge Base:', JSON.stringify(kbData, null, 2));
    } else {
      console.log('❌ Erro ao buscar KB:', kbResponse.status, await kbResponse.text());
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  console.log('\n');

  // Teste 2: Verificar Guardrails
  console.log('2️⃣ Verificando Guardrails...');
  try {
    const grResponse = await fetch(`${BASE_URL}/api/rag/guardrails`, {
      headers: { 'X-API-Key': API_KEY }
    });

    if (grResponse.ok) {
      const grData = await grResponse.json();
      console.log('✅ Guardrails:', JSON.stringify(grData, null, 2));
    } else {
      console.log('❌ Erro ao buscar Guardrails:', grResponse.status, await grResponse.text());
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  console.log('\n');

  // Teste 3: Verificar estatísticas
  console.log('3️⃣ Verificando estatísticas...');
  try {
    const statsResponse = await fetch(`${BASE_URL}/api/rag/stats`, {
      headers: { 'X-API-Key': API_KEY }
    });

    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Estatísticas:', JSON.stringify(statsData, null, 2));
    } else {
      console.log('❌ Erro ao buscar stats:', statsResponse.status, await statsResponse.text());
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  console.log('\n');

  // Teste 4: Enviar mensagem de teste
  console.log('4️⃣ Testando chat...');
  try {
    const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        message: 'Quais produtos vocês têm?'
      })
    });

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Resposta da IA:', chatData.response);
      console.log('📝 Session ID:', chatData.session_id);
    } else {
      console.log('❌ Erro no chat:', chatResponse.status, await chatResponse.text());
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  console.log('\n✅ Teste concluído!');
}

testFuseChat();
