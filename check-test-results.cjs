/**
 * Script para verificar resultados dos testes no banco de dados
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTestResults() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║        VERIFICAÇÃO DOS RESULTADOS DOS TESTES          ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  try {
    // Buscar todos os leads de teste
    const testLeads = await prisma.lead.findMany({
      where: {
        OR: [
          { name: { contains: 'Fernando Martins' } },
          { name: { contains: 'Fernando Teste B' } },
          { name: { contains: 'Fernando Teste C' } },
        ],
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // Últimos 10 minutos
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    if (testLeads.length === 0) {
      console.log('⚠️ Nenhum lead de teste encontrado nos últimos 10 minutos.\n');
      return;
    }

    console.log(`📊 Encontrados ${testLeads.length} leads de teste:\n`);

    for (const lead of testLeads) {
      console.log('─'.repeat(55));
      console.log(`🆔 ID: ${lead.id}`);
      console.log(`👤 Nome: ${lead.name}`);
      console.log(`📧 Email: ${lead.email}`);
      console.log(`📞 Telefone: ${lead.phone}`);
      console.log(`📅 Criado em: ${lead.createdAt.toISOString()}`);

      // Parse metadata
      let metadata = {};
      try {
        metadata = JSON.parse(lead.metadata || '{}');
      } catch (e) {
        console.log('⚠️ Erro ao parsear metadata');
      }

      const selectedProducts = metadata.selectedProducts || [];
      console.log(`📦 Produtos: ${selectedProducts.length > 0 ? selectedProducts.join(', ') : 'NENHUM'}`);
      console.log(`🤖 Should trigger bot: ${metadata.shouldTriggerWhatsAppBot ? 'SIM' : 'NÃO'}`);

      // Verificar se há automação
      const automation = await prisma.whatsAppAutomation.findFirst({
        where: { leadId: lead.id }
      });

      if (automation) {
        console.log(`✅ Automação: ${automation.id} (Status: ${automation.status})`);
      } else {
        console.log(`❌ Automação: NÃO CRIADA`);
      }

      console.log('');
    }

    console.log('═'.repeat(55));

    // Análise dos cenários
    console.log('\n📋 ANÁLISE POR CENÁRIO:\n');

    const scenarioA = testLeads.find(l => l.name === 'Fernando Martins');
    const scenarioB = testLeads.find(l => l.name === 'Fernando Teste B');
    const scenarioC = testLeads.find(l => l.name === 'Fernando Teste C');

    // Cenário A
    if (scenarioA) {
      const metaA = JSON.parse(scenarioA.metadata || '{}');
      const productsA = metaA.selectedProducts || [];
      const autoA = await prisma.whatsAppAutomation.findFirst({ where: { leadId: scenarioA.id } });

      console.log('✅ CENÁRIO A (Fluxo Normal):');
      console.log(`   - Lead criado: SIM (${scenarioA.id})`);
      console.log(`   - Produtos: ${productsA.length > 0 ? `${productsA.length} produto(s) ✅` : 'NENHUM ❌'}`);
      console.log(`   - Automação: ${autoA ? `CRIADA ✅` : 'NÃO CRIADA ❌'}`);
      console.log(`   - Resultado: ${productsA.length > 0 && autoA ? '🎉 PASSOU' : '❌ FALHOU'}\n`);
    } else {
      console.log('❌ CENÁRIO A: Lead não encontrado\n');
    }

    // Cenário B
    if (scenarioB) {
      const metaB = JSON.parse(scenarioB.metadata || '{}');
      const productsB = metaB.selectedProducts || [];
      const autoB = await prisma.whatsAppAutomation.findFirst({ where: { leadId: scenarioB.id } });

      console.log('✅ CENÁRIO B (Auto-save + Update):');
      console.log(`   - Lead criado: SIM (${scenarioB.id})`);
      console.log(`   - Produtos: ${productsB.length > 0 ? `${productsB.length} produto(s) ✅` : 'NENHUM ❌'}`);
      console.log(`   - Automação: ${autoB ? `CRIADA ✅` : 'NÃO CRIADA ❌'}`);
      console.log(`   - Resultado: ${productsB.length > 0 && autoB ? '🎉 PASSOU' : '❌ FALHOU'}\n`);
    } else {
      console.log('❌ CENÁRIO B: Lead não encontrado\n');
    }

    // Cenário C
    if (scenarioC) {
      const metaC = JSON.parse(scenarioC.metadata || '{}');
      const productsC = metaC.selectedProducts || [];
      const autoC = await prisma.whatsAppAutomation.findFirst({ where: { leadId: scenarioC.id } });

      console.log('✅ CENÁRIO C (Abandono):');
      console.log(`   - Lead criado: SIM (${scenarioC.id})`);
      console.log(`   - Produtos: ${productsC.length === 0 ? 'NENHUM ✅' : `${productsC.length} produto(s) ❌`}`);
      console.log(`   - Automação: ${!autoC ? 'NÃO CRIADA ✅' : `CRIADA ❌`}`);
      console.log(`   - Resultado: ${productsC.length === 0 && !autoC ? '🎉 PASSOU' : '❌ FALHOU'}\n`);
    } else {
      console.log('❌ CENÁRIO C: Lead não encontrado\n');
    }

    console.log('═'.repeat(55) + '\n');

  } catch (error) {
    console.error('❌ Erro ao consultar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestResults();
