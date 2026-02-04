/**
 * Testes de Integração - Sistema de Recorrência de Leads
 *
 * Valida o fluxo completo:
 * 1. Captação de lead → Detecção de recorrência
 * 2. Seleção de template baseado em regras
 * 3. Incremento de score e prioridade
 * 4. Registro de histórico de capturas
 *
 * @requires prisma (banco de teste)
 */

import { leadRecurrenceService } from '../leadRecurrence.service';
import { recurrenceMessageTemplateService } from '../recurrenceMessageTemplate.service';
import { prisma } from '../../config/database';

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

describe('Lead Recurrence Integration Tests', () => {
  let testLeadId: string;
  let testTemplateId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Criar usuário admin de teste
    const user = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!user) {
      const created = await prisma.user.create({
        data: {
          name: 'Test Admin',
          username: 'test-admin',
          email: 'test-admin@test.com',
          password: 'hashed-password',
          role: 'ADMIN',
        }
      });
      testUserId = created.id;
    } else {
      testUserId = user.id;
    }

    // Criar template de recorrência para testes
    const template = await prisma.recurrenceMessageTemplate.create({
      data: {
        name: 'Template Teste 2ª Captura',
        description: 'Template para segunda captura',
        trigger: 'second_capture',
        minCaptures: 2,
        maxCaptures: 2,
        daysSinceLastCapture: null,
        conditions: JSON.stringify({ sameInterest: false }),
        content: 'Olá {{lead.name}}! Vi que você voltou a demonstrar interesse. Esta é sua {{captureNumber}}ª vez conosco!',
        priority: 10,
        isActive: true,
      }
    });
    testTemplateId = template.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testLeadId) {
      await prisma.leadCapture.deleteMany({ where: { leadId: testLeadId } });
      await prisma.lead.delete({ where: { id: testLeadId } }).catch(() => {});
    }
    if (testTemplateId) {
      await prisma.recurrenceMessageTemplate.delete({ where: { id: testTemplateId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Limpar lead entre testes
    if (testLeadId) {
      await prisma.leadCapture.deleteMany({ where: { leadId: testLeadId } });
      await prisma.lead.delete({ where: { id: testLeadId } }).catch(() => {});
      testLeadId = '';
    }
  });

  // ============================================================================
  // TESTE 1: Primeira Captura (Lead Novo)
  // ============================================================================

  test('Deve criar novo lead na primeira captura', async () => {
    const result = await leadRecurrenceService.handleLeadCapture({
      phone: '+5511999998888',
      name: 'João Teste',
      email: 'joao@test.com',
      source: 'landing-page',
      interest: ['Bebedouro', 'Resfriador'],
      metadata: { campaign: 'test-campaign' },
    });

    testLeadId = result.lead.id;

    // Verificações
    expect(result.isRecurrent).toBe(false);
    expect(result.captureNumber).toBe(1);
    expect(result.daysSinceLastCapture).toBeNull();
    expect(result.lead.captureCount).toBe(1);
    expect(result.lead.name).toBe('João Teste');
    expect(result.lead.phone).toBe('+5511999998888');

    // Verificar que LeadCapture foi criado
    const captures = await prisma.leadCapture.findMany({
      where: { leadId: testLeadId }
    });
    expect(captures).toHaveLength(1);
    expect(captures[0].captureNumber).toBe(1);
    expect(captures[0].source).toBe('landing-page');
  });

  // ============================================================================
  // TESTE 2: Segunda Captura (Detecção de Recorrência)
  // ============================================================================

  test('Deve detectar lead recorrente na segunda captura', async () => {
    // Primeira captura
    const first = await leadRecurrenceService.handleLeadCapture({
      phone: '+5511888887777',
      name: 'Maria Teste',
      email: 'maria@test.com',
      source: 'chatbot-web',
      interest: ['Ordenhadeira'],
    });
    testLeadId = first.lead.id;

    // Aguardar 1 segundo para diferenciar timestamps
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Segunda captura (mesmo telefone, interesse diferente)
    const second = await leadRecurrenceService.handleLeadCapture({
      phone: '+5511888887777',
      name: 'Maria Teste',
      source: 'landing-page',
      interest: ['Resfriador'], // Interesse mudou
    });

    // Verificações
    expect(second.isRecurrent).toBe(true);
    expect(second.captureNumber).toBe(2);
    expect(second.daysSinceLastCapture).toBeGreaterThanOrEqual(0);
    expect(second.interestChanged).toBe(true);
    expect(second.previousInterests).toContain('Ordenhadeira');
    expect(second.lead.captureCount).toBe(2);
    expect(second.lead.leadScore).toBeGreaterThan(first.lead.leadScore); // Score incrementado

    // Verificar histórico de capturas
    const captures = await prisma.leadCapture.findMany({
      where: { leadId: testLeadId },
      orderBy: { captureNumber: 'asc' }
    });
    expect(captures).toHaveLength(2);
    expect(captures[0].captureNumber).toBe(1);
    expect(captures[1].captureNumber).toBe(2);
  });

  // ============================================================================
  // TESTE 3: Incremento de Score e Prioridade
  // ============================================================================

  test('Deve incrementar score e prioridade corretamente', async () => {
    const phone = '+5511777776666';

    // 1ª captura
    const capture1 = await leadRecurrenceService.handleLeadCapture({
      phone,
      name: 'Pedro Teste',
      source: 'landing-page',
      interest: ['Bebedouro'],
    });
    testLeadId = capture1.lead.id;
    const initialScore = capture1.lead.leadScore;
    expect(capture1.lead.priority).toBe('MEDIUM');

    // 2ª captura (score +10)
    await new Promise(resolve => setTimeout(resolve, 100));
    const capture2 = await leadRecurrenceService.handleLeadCapture({
      phone,
      name: 'Pedro Teste',
      source: 'landing-page',
      interest: ['Resfriador'],
    });
    expect(capture2.lead.leadScore).toBe(initialScore + 10);
    expect(capture2.lead.priority).toBe('MEDIUM'); // Ainda MEDIUM (precisa 3+)

    // 3ª captura (score +20, prioridade HIGH)
    await new Promise(resolve => setTimeout(resolve, 100));
    const capture3 = await leadRecurrenceService.handleLeadCapture({
      phone,
      name: 'Pedro Teste',
      source: 'landing-page',
      interest: ['Ordenhadeira'],
    });
    expect(capture3.lead.leadScore).toBe(initialScore + 10 + 20);
    expect(capture3.lead.priority).toBe('HIGH'); // Agora HIGH (3+ capturas)

    // 4ª captura (score +30)
    await new Promise(resolve => setTimeout(resolve, 100));
    const capture4 = await leadRecurrenceService.handleLeadCapture({
      phone,
      name: 'Pedro Teste',
      source: 'landing-page',
    });
    expect(capture4.lead.leadScore).toBe(initialScore + 10 + 20 + 30);
    expect(capture4.lead.captureCount).toBe(4);
  });

  // ============================================================================
  // TESTE 4: Seleção de Template Baseado em Regras
  // ============================================================================

  test('Deve selecionar template correto baseado em captureNumber', async () => {
    const phone = '+5511666665555';

    // 1ª captura
    const capture1 = await leadRecurrenceService.handleLeadCapture({
      phone,
      name: 'Ana Teste',
      source: 'landing-page',
      interest: ['Bebedouro'],
    });
    testLeadId = capture1.lead.id;

    // Template não deve ser selecionado (minCaptures = 2)
    const template1 = await recurrenceMessageTemplateService.selectBestTemplate(
      capture1,
      capture1.lead.leadScore
    );
    expect(template1).toBeNull(); // Não elegível

    // 2ª captura
    await new Promise(resolve => setTimeout(resolve, 100));
    const capture2 = await leadRecurrenceService.handleLeadCapture({
      phone,
      name: 'Ana Teste',
      source: 'landing-page',
      interest: ['Resfriador'], // Interesse mudou
    });

    // Template DEVE ser selecionado (minCaptures = 2, maxCaptures = 2)
    const template2 = await recurrenceMessageTemplateService.selectBestTemplate(
      capture2,
      capture2.lead.leadScore
    );
    expect(template2).not.toBeNull();
    expect(template2!.template.id).toBe(testTemplateId);
    expect(template2!.matchScore).toBeGreaterThan(0);
    expect(template2!.reason).toContain('captura #2');
  });

  // ============================================================================
  // TESTE 5: Processamento de Template com Variáveis
  // ============================================================================

  test('Deve processar template substituindo variáveis', async () => {
    const template = 'Olá {{lead.name}}! Esta é sua {{captureNumber}}ª captura. ' +
                     'Você demonstrou interesse em {{currentInterest}}.';

    const processed = recurrenceMessageTemplateService.processTemplate(template, {
      lead: {
        name: 'Carlos Teste',
        phone: '+5511555554444',
        email: 'carlos@test.com',
      },
      captureNumber: 3,
      daysSinceLastCapture: 7,
      previousInterests: ['Bebedouro', 'Resfriador'],
      currentInterest: ['Ordenhadeira'],
    });

    expect(processed).toContain('Carlos Teste');
    expect(processed).toContain('3ª captura');
    expect(processed).toContain('Ordenhadeira');
  });

  // ============================================================================
  // TESTE 6: Estatísticas de Recorrência
  // ============================================================================

  test('Deve calcular estatísticas de recorrência corretamente', async () => {
    // Criar múltiplos leads para teste
    const phones = ['+5511111111111', '+5511222222222', '+5511333333333'];

    for (const phone of phones) {
      // 1ª captura
      const capture1 = await leadRecurrenceService.handleLeadCapture({
        phone,
        name: `Lead ${phone}`,
        source: 'landing-page',
      });

      // 2ª captura (apenas para os 2 primeiros)
      if (phone !== '+5511333333333') {
        await new Promise(resolve => setTimeout(resolve, 100));
        await leadRecurrenceService.handleLeadCapture({
          phone,
          name: `Lead ${phone}`,
          source: 'landing-page',
        });
      }

      // Guardar IDs para limpeza
      if (!testLeadId) {
        testLeadId = capture1.lead.id;
      }
    }

    // Buscar estatísticas
    const stats = await leadRecurrenceService.getRecurrenceStats();

    expect(stats.totalLeads).toBeGreaterThanOrEqual(3);
    expect(stats.recurrentLeads).toBeGreaterThanOrEqual(2); // 2 leads com 2+ capturas
    expect(stats.avgCapturesPerLead).toBeGreaterThan(1);

    // Limpar leads de teste
    await prisma.leadCapture.deleteMany({
      where: { lead: { phone: { in: phones } } }
    });
    await prisma.lead.deleteMany({
      where: { phone: { in: phones } }
    });
  });

  // ============================================================================
  // TESTE 7: Tendências de Capturas (Nova API)
  // ============================================================================

  test('Deve calcular tendências de capturas por período', async () => {
    // Criar capturas em datas diferentes
    const phone = '+5511444443333';

    // 1ª captura
    const capture1 = await leadRecurrenceService.handleLeadCapture({
      phone,
      name: 'Teste Trends',
      source: 'landing-page',
    });
    testLeadId = capture1.lead.id;

    // 2ª captura
    await new Promise(resolve => setTimeout(resolve, 100));
    await leadRecurrenceService.handleLeadCapture({
      phone,
      name: 'Teste Trends',
      source: 'landing-page',
    });

    // Buscar tendências
    const trends = await leadRecurrenceService.getCaptureTrends('7d', 'day');

    expect(trends).toBeInstanceOf(Array);
    expect(trends.length).toBeGreaterThan(0);

    // Verificar estrutura
    if (trends.length > 0) {
      expect(trends[0]).toHaveProperty('period');
      expect(trends[0]).toHaveProperty('newLeads');
      expect(trends[0]).toHaveProperty('recurrentLeads');
      expect(trends[0]).toHaveProperty('totalCaptures');
    }
  });

  // ============================================================================
  // TESTE 8: Filtro de Período nas Estatísticas
  // ============================================================================

  test('Deve filtrar estatísticas por período', async () => {
    const phone = '+5511555556666';

    // Criar lead
    const capture = await leadRecurrenceService.handleLeadCapture({
      phone,
      name: 'Teste Filtro',
      source: 'landing-page',
    });
    testLeadId = capture.lead.id;

    // Estatísticas de 7 dias
    const stats7d = await leadRecurrenceService.getRecurrenceStats('7d');
    expect(stats7d.totalLeads).toBeGreaterThanOrEqual(1);

    // Estatísticas de todos os períodos
    const statsAll = await leadRecurrenceService.getRecurrenceStats('all');
    expect(statsAll.totalLeads).toBeGreaterThanOrEqual(stats7d.totalLeads);
  });

  // ============================================================================
  // TESTE 9: Normalização de Telefone
  // ============================================================================

  test('Deve normalizar telefones com diferentes formatos', async () => {
    const formats = [
      '11999998888',
      '(11) 99999-8888',
      '11 99999-8888',
      '+5511999998888',
    ];

    // Todos devem resultar no mesmo lead
    let firstLeadId: string | null = null;

    for (const phone of formats) {
      const result = await leadRecurrenceService.handleLeadCapture({
        phone,
        name: 'Teste Normalização',
        source: 'landing-page',
      });

      if (!firstLeadId) {
        firstLeadId = result.lead.id;
        testLeadId = firstLeadId;
      } else {
        expect(result.lead.id).toBe(firstLeadId); // Mesmo lead
      }
    }

    // Deve ter 4 capturas do mesmo lead
    const finalLead = await prisma.lead.findUnique({
      where: { id: firstLeadId! }
    });
    expect(finalLead!.captureCount).toBe(4);
  });

  // ============================================================================
  // TESTE 10: Validação de Interest (Schema)
  // ============================================================================

  test('Deve aceitar interest como string ou array', async () => {
    const phone1 = '+5511777778888';
    const phone2 = '+5511888889999';

    // Interest como string
    const result1 = await leadRecurrenceService.handleLeadCapture({
      phone: phone1,
      name: 'Teste String',
      source: 'landing-page',
      interest: 'Bebedouro, Resfriador', // String separada por vírgula
    });

    // Interest como array
    const result2 = await leadRecurrenceService.handleLeadCapture({
      phone: phone2,
      name: 'Teste Array',
      source: 'landing-page',
      interest: ['Bebedouro', 'Resfriador'], // Array
    });

    // Ambos devem funcionar
    expect(result1.lead.id).toBeTruthy();
    expect(result2.lead.id).toBeTruthy();

    // Limpar
    await prisma.leadCapture.deleteMany({ where: { leadId: result1.lead.id } });
    await prisma.lead.delete({ where: { id: result1.lead.id } });
    await prisma.leadCapture.deleteMany({ where: { leadId: result2.lead.id } });
    await prisma.lead.delete({ where: { id: result2.lead.id } });
  });
});
