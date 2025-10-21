// Script temporário para testar verificação de número
const axios = require('axios');

const testNumber = '45999070479'; // Número válido para teste
const testInvalidNumber = '1234567890'; // Número inválido

async function testCheckNumber() {
  try {
    console.log('🔍 Testando verificação de número válido:', testNumber);

    const response = await axios.post('http://72.60.10.108:3050/api/whatsapp/check-numbers', {
      phoneNumbers: [testNumber]
    }, {
      headers: {
        'Authorization': 'Bearer SEU_TOKEN_AQUI', // Substituir por token real
        'Content-Type': 'application/json'
      }
    });

    console.log('\n📊 Resposta completa:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.error('❌ Erro na resposta:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ Erro:', error.message);
    }
  }
}

testCheckNumber();
