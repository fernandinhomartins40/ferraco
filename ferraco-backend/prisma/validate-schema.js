// Script de Validação do Schema Prisma Phase 3
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function validateSchema() {
  console.log('🔍 Validando Schema Prisma Phase 3...\n');

  const tests = [
    // Modelos Existentes (Base)
    { model: 'user', name: 'Users', phase: 'Base' },
    { model: 'lead', name: 'Leads', phase: 'Base' },
    { model: 'tag', name: 'Tags', phase: 'Base' },
    { model: 'communication', name: 'Communications', phase: 'Base' },
    { model: 'automation', name: 'Automations', phase: 'Base' },
    { model: 'integration', name: 'Integrations', phase: 'Base' },
    { model: 'report', name: 'Reports', phase: 'Base' },

    // Phase 3.1 - Core Features
    { model: 'digitalSignature', name: 'Digital Signatures', phase: '3.1' },
    { model: 'userPreferences', name: 'User Preferences', phase: '3.1' },
    { model: 'notificationSettings', name: 'Notification Settings', phase: '3.1' },
    { model: 'interactionFile', name: 'Interaction Files', phase: '3.1' },

    // Phase 3.2 - AI Features
    { model: 'aIAnalysis', name: 'AI Analysis', phase: '3.2' },
    { model: 'aIRecommendation', name: 'AI Recommendations', phase: '3.2' },
    { model: 'conversionPrediction', name: 'Conversion Predictions', phase: '3.2' },
    { model: 'conversionFactor', name: 'Conversion Factors', phase: '3.2' },
    { model: 'leadScoring', name: 'Lead Scoring', phase: '3.2' },
    { model: 'scoringFactor', name: 'Scoring Factors', phase: '3.2' },
    { model: 'scoreHistory', name: 'Score History', phase: '3.2' },
    { model: 'duplicateDetection', name: 'Duplicate Detections', phase: '3.2' },
    { model: 'duplicateMatch', name: 'Duplicate Matches', phase: '3.2' },

    // Phase 3.3 - Chatbot
    { model: 'chatbotConfig', name: 'Chatbot Configs', phase: '3.3' },
    { model: 'chatbotQuestion', name: 'Chatbot Questions', phase: '3.3' },
    { model: 'chatbotRule', name: 'Chatbot Rules', phase: '3.3' },
    { model: 'businessHours', name: 'Business Hours', phase: '3.3' },

    // Phase 3.4 - Analytics
    { model: 'advancedAnalytics', name: 'Advanced Analytics', phase: '3.4' },
    { model: 'sourceAnalytics', name: 'Source Analytics', phase: '3.4' },
    { model: 'teamPerformanceRecord', name: 'Team Performance', phase: '3.4' },
    { model: 'predictiveInsight', name: 'Predictive Insights', phase: '3.4' },
    { model: 'benchmark', name: 'Benchmarks', phase: '3.4' },

    // Phase 3.5 - Integrations
    { model: 'googleAnalyticsConfig', name: 'Google Analytics Configs', phase: '3.5' },
    { model: 'gAEvent', name: 'GA Events', phase: '3.5' },
    { model: 'gAGoal', name: 'GA Goals', phase: '3.5' },
    { model: 'facebookAdsConfig', name: 'Facebook Ads Configs', phase: '3.5' },
    { model: 'fBCampaign', name: 'FB Campaigns', phase: '3.5' },
    { model: 'fBLeadForm', name: 'FB Lead Forms', phase: '3.5' },
  ];

  const results = {
    base: { success: 0, failed: 0 },
    '3.1': { success: 0, failed: 0 },
    '3.2': { success: 0, failed: 0 },
    '3.3': { success: 0, failed: 0 },
    '3.4': { success: 0, failed: 0 },
    '3.5': { success: 0, failed: 0 },
  };

  for (const test of tests) {
    try {
      const count = await prisma[test.model].count();
      console.log(`✅ [${test.phase}] ${test.name}: ${count} registros`);
      results[test.phase === 'Base' ? 'base' : test.phase].success++;
    } catch (error) {
      console.log(`❌ [${test.phase}] ${test.name}: ERRO`);
      console.log(`   ${error.message}`);
      results[test.phase === 'Base' ? 'base' : test.phase].failed++;
    }
  }

  console.log('\n📊 Resumo da Validação:\n');
  console.log(`Base Models:       ${results.base.success}/${results.base.success + results.base.failed} ✅`);
  console.log(`Phase 3.1 (Core):  ${results['3.1'].success}/${results['3.1'].success + results['3.1'].failed} ✅`);
  console.log(`Phase 3.2 (AI):    ${results['3.2'].success}/${results['3.2'].success + results['3.2'].failed} ✅`);
  console.log(`Phase 3.3 (Chat):  ${results['3.3'].success}/${results['3.3'].success + results['3.3'].failed} ✅`);
  console.log(`Phase 3.4 (Analyt):${results['3.4'].success}/${results['3.4'].success + results['3.4'].failed} ✅`);
  console.log(`Phase 3.5 (Integr):${results['3.5'].success}/${results['3.5'].success + results['3.5'].failed} ✅`);

  const totalSuccess = Object.values(results).reduce((sum, r) => sum + r.success, 0);
  const totalTests = tests.length;

  console.log(`\n🎯 Total: ${totalSuccess}/${totalTests} modelos validados com sucesso!`);

  if (totalSuccess === totalTests) {
    console.log('\n🎉 TODOS OS MODELOS FORAM CRIADOS COM SUCESSO! 🎉\n');
  } else {
    console.log('\n⚠️ Alguns modelos falharam na validação.\n');
  }

  await prisma.$disconnect();
}

validateSchema()
  .catch((error) => {
    console.error('❌ Erro na validação:', error);
    process.exit(1);
  });
