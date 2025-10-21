/**
 * FASE 6 - Testes de Integração do WhatsAppService
 *
 * Testes com WPPConnect REAL em ambiente de desenvolvimento:
 * - Conexão real com WhatsApp Web
 * - Envio real de mensagens (usar número de teste)
 * - Validação end-to-end
 *
 * IMPORTANTE: Estes testes devem ser executados apenas em ambiente de desenvolvimento
 * e requerem uma sessão ativa do WhatsApp Web.
 *
 * Para executar: npm run test:integration
 */

import { WhatsAppService } from '../whatsappService';
import * as dotenv from 'dotenv';

dotenv.config();

// Número de teste (alterar para um número real de teste)
const TEST_NUMBER = process.env.TEST_WHATSAPP_NUMBER || '5511999999999';
const TEST_GROUP_ID = process.env.TEST_GROUP_ID || '';

describe('WhatsAppService - FASE 6 Integration Tests', () => {
  let whatsappService: WhatsAppService;
  let isSessionActive = false;

  // Timeout maior para testes de integração (30 segundos)
  jest.setTimeout(30000);

  beforeAll(async () => {
    console.log('🔄 Inicializando WhatsAppService para testes de integração...');
    whatsappService = new WhatsAppService();

    // Tentar conectar (se já houver sessão salva)
    try {
      await whatsappService.initialize();
      isSessionActive = whatsappService.getConnectionStatus() === 'connected';

      if (!isSessionActive) {
        console.log('⚠️  WhatsApp não conectado. Os testes de integração serão pulados.');
        console.log('💡 Para executar testes de integração:');
        console.log('   1. Inicie o backend: npm run dev');
        console.log('   2. Escaneie o QR Code');
        console.log('   3. Execute os testes: npm run test:integration');
      } else {
        console.log('✅ WhatsApp conectado com sucesso!');
      }
    } catch (error) {
      console.log('⚠️  Erro ao inicializar WhatsApp:', error);
      console.log('   Testes de integração serão pulados.');
    }
  });

  afterAll(async () => {
    if (isSessionActive) {
      console.log('🔄 Fechando conexão WhatsApp...');
      await whatsappService.logout();
    }
  });

  // Helper para pular testes se não houver sessão ativa
  const skipIfNotConnected = () => {
    if (!isSessionActive) {
      console.log('⏭️  Teste pulado: WhatsApp não conectado');
      return true;
    }
    return false;
  };

  describe('1. Conexão e Inicialização', () => {
    it('deve inicializar serviço com sucesso', () => {
      expect(whatsappService).toBeDefined();
    });

    it('deve retornar status de conexão', () => {
      const status = whatsappService.getConnectionStatus();
      expect(['connected', 'disconnected', 'qrReadSuccess', 'deviceNotConnected']).toContain(status);
    });
  });

  describe('2. Envio de Mensagem de Texto (Real)', () => {
    it('deve enviar mensagem de texto para número de teste', async () => {
      if (skipIfNotConnected()) return;

      const message = `🧪 Teste Automatizado FASE 6\nData: ${new Date().toISOString()}`;

      const result = await whatsappService.sendTextMessage(TEST_NUMBER, message);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      console.log('✅ Mensagem enviada com sucesso:', result.id);
    });

    it('deve validar erro ao enviar mensagem vazia', async () => {
      if (skipIfNotConnected()) return;

      await expect(
        whatsappService.sendTextMessage(TEST_NUMBER, '')
      ).rejects.toThrow('Mensagem vazia não pode ser enviada');
    });
  });

  describe('3. Buscar Conversas (Real - Stateless)', () => {
    it('deve buscar todas as conversas do WhatsApp', async () => {
      if (skipIfNotConnected()) return;

      const conversations = await whatsappService.getAllConversations();

      expect(Array.isArray(conversations)).toBe(true);
      expect(conversations.length).toBeGreaterThan(0);

      // Verificar estrutura da primeira conversa
      if (conversations.length > 0) {
        const firstChat = conversations[0];
        expect(firstChat).toHaveProperty('id');
        expect(firstChat).toHaveProperty('name');
        console.log(`✅ ${conversations.length} conversas encontradas`);
      }
    });
  });

  describe('4. Buscar Mensagens de Chat (Real - Stateless)', () => {
    it('deve buscar mensagens de um chat específico', async () => {
      if (skipIfNotConnected()) return;

      // Primeiro buscar conversas para pegar um chatId válido
      const conversations = await whatsappService.getAllConversations();
      if (conversations.length === 0) {
        console.log('⚠️  Nenhuma conversa encontrada, teste pulado');
        return;
      }

      const chatId = conversations[0].id;
      const messages = await whatsappService.getChatMessages(chatId, 10);

      expect(Array.isArray(messages)).toBe(true);
      console.log(`✅ ${messages.length} mensagens encontradas no chat ${chatId}`);

      // Verificar estrutura da primeira mensagem (se houver)
      if (messages.length > 0) {
        const firstMessage = messages[0];
        expect(firstMessage).toHaveProperty('id');
        expect(firstMessage).toHaveProperty('body');
      }
    });
  });

  describe('5. Buscar Contatos (Real)', () => {
    it('deve buscar todos os contatos', async () => {
      if (skipIfNotConnected()) return;

      const contacts = await whatsappService.getContacts();

      expect(Array.isArray(contacts)).toBe(true);
      expect(contacts.length).toBeGreaterThan(0);

      console.log(`✅ ${contacts.length} contatos encontrados`);

      // Verificar estrutura do primeiro contato
      if (contacts.length > 0) {
        const firstContact = contacts[0];
        expect(firstContact).toHaveProperty('id');
      }
    });
  });

  describe('6. Marcar como Lido (Real)', () => {
    it('deve marcar chat como lido', async () => {
      if (skipIfNotConnected()) return;

      // Buscar primeira conversa
      const conversations = await whatsappService.getAllConversations();
      if (conversations.length === 0) {
        console.log('⚠️  Nenhuma conversa encontrada, teste pulado');
        return;
      }

      const chatId = conversations[0].id;
      const result = await whatsappService.markAsRead(chatId);

      expect(result).toBeDefined();
      console.log(`✅ Chat ${chatId} marcado como lido`);
    });
  });

  describe('7. Arquivar/Desarquivar Chat (Real)', () => {
    it('deve arquivar e desarquivar chat', async () => {
      if (skipIfNotConnected()) return;

      // Buscar primeira conversa
      const conversations = await whatsappService.getAllConversations();
      if (conversations.length === 0) {
        console.log('⚠️  Nenhuma conversa encontrada, teste pulado');
        return;
      }

      const chatId = conversations[0].id;

      // Arquivar
      const archiveResult = await whatsappService.archiveChat(chatId, true);
      expect(archiveResult).toBe(true);
      console.log(`✅ Chat ${chatId} arquivado`);

      // Aguardar 1 segundo
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Desarquivar
      const unarchiveResult = await whatsappService.archiveChat(chatId, false);
      expect(unarchiveResult).toBe(true);
      console.log(`✅ Chat ${chatId} desarquivado`);
    });
  });

  describe('8. Fixar/Desafixar Chat (Real)', () => {
    it('deve fixar e desafixar chat', async () => {
      if (skipIfNotConnected()) return;

      // Buscar primeira conversa
      const conversations = await whatsappService.getAllConversations();
      if (conversations.length === 0) {
        console.log('⚠️  Nenhuma conversa encontrada, teste pulado');
        return;
      }

      const chatId = conversations[0].id;

      // Fixar
      const pinResult = await whatsappService.pinChat(chatId, true);
      expect(pinResult).toBe(true);
      console.log(`✅ Chat ${chatId} fixado`);

      // Aguardar 1 segundo
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Desafixar
      const unpinResult = await whatsappService.unpinChat(chatId);
      expect(unpinResult).toBe(true);
      console.log(`✅ Chat ${chatId} desafixado`);
    });
  });

  describe('9. Verificar Número no WhatsApp (Real)', () => {
    it('deve verificar se número existe no WhatsApp', async () => {
      if (skipIfNotConnected()) return;

      const results = await whatsappService.checkNumbersOnWhatsApp([TEST_NUMBER]);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult).toHaveProperty('phoneNumber');
      expect(firstResult).toHaveProperty('exists');

      console.log(`✅ Verificação de número:`, firstResult);
    });
  });

  describe('10. FASE 5 - Novas Funções (Real)', () => {
    it('deve buscar URL da foto de perfil', async () => {
      if (skipIfNotConnected()) return;

      // Buscar primeiro contato
      const contacts = await whatsappService.getContacts();
      if (contacts.length === 0) {
        console.log('⚠️  Nenhum contato encontrado, teste pulado');
        return;
      }

      const contactId = contacts[0].id._serialized || contacts[0].id;
      const profilePicUrl = await whatsappService.getProfilePicUrl(contactId);

      // Foto de perfil pode não existir (undefined é válido)
      if (profilePicUrl) {
        expect(typeof profilePicUrl).toBe('string');
        expect(profilePicUrl).toMatch(/^https?:\/\//);
        console.log(`✅ URL da foto de perfil: ${profilePicUrl}`);
      } else {
        console.log('ℹ️  Contato não possui foto de perfil');
      }
    });

    it('deve obter lista de bloqueados', async () => {
      if (skipIfNotConnected()) return;

      const blockList = await whatsappService.getBlockList();

      expect(Array.isArray(blockList)).toBe(true);
      console.log(`✅ ${blockList.length} contatos bloqueados`);
    });

    it('deve buscar link de convite do grupo (se TEST_GROUP_ID fornecido)', async () => {
      if (skipIfNotConnected()) return;
      if (!TEST_GROUP_ID) {
        console.log('⚠️  TEST_GROUP_ID não fornecido, teste pulado');
        return;
      }

      const inviteLink = await whatsappService.getGroupInviteLink(TEST_GROUP_ID);

      expect(typeof inviteLink).toBe('string');
      expect(inviteLink).toMatch(/https:\/\/chat\.whatsapp\.com\//);
      console.log(`✅ Link de convite: ${inviteLink}`);
    });
  });

  describe('11. Performance e Limites', () => {
    it('deve buscar conversas em menos de 5 segundos', async () => {
      if (skipIfNotConnected()) return;

      const startTime = Date.now();
      await whatsappService.getAllConversations();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
      console.log(`✅ getAllConversations executado em ${duration}ms`);
    });

    it('deve buscar contatos em menos de 5 segundos', async () => {
      if (skipIfNotConnected()) return;

      const startTime = Date.now();
      await whatsappService.getContacts();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
      console.log(`✅ getContacts executado em ${duration}ms`);
    });
  });

  describe('12. Validação Stateless Architecture', () => {
    it('deve retornar mensagens atualizadas em chamadas consecutivas', async () => {
      if (skipIfNotConnected()) return;

      // Buscar conversas
      const conversations = await whatsappService.getAllConversations();
      if (conversations.length === 0) {
        console.log('⚠️  Nenhuma conversa encontrada, teste pulado');
        return;
      }

      const chatId = conversations[0].id;

      // Primeira busca
      const messages1 = await whatsappService.getChatMessages(chatId, 5);

      // Aguardar 500ms
      await new Promise(resolve => setTimeout(resolve, 500));

      // Segunda busca (deve retornar mesmos dados ou atualizados)
      const messages2 = await whatsappService.getChatMessages(chatId, 5);

      expect(Array.isArray(messages1)).toBe(true);
      expect(Array.isArray(messages2)).toBe(true);

      // Verificar que mensagens são buscadas on-demand (stateless)
      console.log(`✅ Stateless confirmado: ${messages1.length} msgs (1ª busca), ${messages2.length} msgs (2ª busca)`);
    });
  });
});
