/**
 * FASE 6 - Testes Unitários do WhatsAppService
 *
 * Testes com WPPConnect mockado para validar:
 * - Funções core (sendText, sendImage, sendFile)
 * - Validações (formatPhoneNumber, validateConnection)
 * - Tratamento de erros
 * - Stateless architecture
 */

import { whatsappService } from '../whatsappService';
import type { Whatsapp } from '@wppconnect-team/wppconnect';

// Mock do WPPConnect
const mockClient = {
  sendText: jest.fn(),
  sendImage: jest.fn(),
  sendFile: jest.fn(),
  sendFileFromBase64: jest.fn(),
  sendVoice: jest.fn(),
  sendSeen: jest.fn(),
  sendLocation: jest.fn(),
  sendContactVcard: jest.fn(),
  archiveChat: jest.fn(),
  pinChat: jest.fn(),
  unpinChat: jest.fn(),
  getAllChats: jest.fn(),
  getMessages: jest.fn(),
  getAllContacts: jest.fn(),
  getGroupMembers: jest.fn(),
  getNumberProfile: jest.fn(),
  editMessage: jest.fn(),
  clearChat: jest.fn(),
  deleteChat: jest.fn(),
  getProfilePicFromServer: jest.fn(),
  getStatus: jest.fn(),
  sendMute: jest.fn(),
  blockContact: jest.fn(),
  unblockContact: jest.fn(),
  getBlockList: jest.fn(),
  getGroupInviteLink: jest.fn(),
  revokeGroupInviteLink: jest.fn(),
  leaveGroup: jest.fn(),
  close: jest.fn()
} as unknown as Whatsapp;

// Mock do Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    whatsAppMetadata: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn()
    }
  }))
}));

// Mock do Socket.IO
jest.mock('../../server', () => ({
  io: {
    emit: jest.fn()
  }
}));

describe('WhatsAppService - FASE 6 Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Simular cliente conectado
    (whatsappService as any).client = mockClient;
    (whatsappService as any).isConnected = true;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('1. Validação de Conexão', () => {
    it('deve lançar erro se cliente não estiver inicializado', async () => {
      (whatsappService as any).client = null;

      await expect(
        whatsappService.sendTextMessage('5511999999999', 'Teste')
      ).rejects.toThrow('Cliente WhatsApp não inicializado');
    });

    it('deve lançar erro se WhatsApp não estiver conectado', async () => {
      (whatsappService as any).isConnected = false;

      await expect(
        whatsappService.sendTextMessage('5511999999999', 'Teste')
      ).rejects.toThrow('WhatsApp não conectado');
    });
  });

  describe('2. Formatação de Número de Telefone', () => {
    it('deve formatar número brasileiro corretamente (com @c.us)', () => {
      const formatted = (whatsappService as any).formatPhoneNumber('11999999999');
      expect(formatted).toBe('5511999999999@c.us');
    });

    it('deve formatar número já formatado (não duplicar @c.us)', () => {
      const formatted = (whatsappService as any).formatPhoneNumber('5511999999999@c.us');
      expect(formatted).toBe('5511999999999@c.us');
    });

    it('deve formatar número com código do país', () => {
      const formatted = (whatsappService as any).formatPhoneNumber('5511987654321');
      expect(formatted).toBe('5511987654321@c.us');
    });

    it('deve formatar número de grupo (com @g.us)', () => {
      const formatted = (whatsappService as any).formatPhoneNumber('120363044123456789@g.us');
      expect(formatted).toBe('120363044123456789@g.us');
    });
  });

  describe('3. Envio de Mensagem de Texto (sendTextMessage)', () => {
    it('deve enviar mensagem de texto corretamente', async () => {
      (mockClient.sendText as jest.Mock).mockResolvedValue({
        id: 'msg123',
        ack: 1
      });

      const result = await whatsappService.sendTextMessage('5511999999999', 'Olá, tudo bem?');

      expect(mockClient.sendText).toHaveBeenCalledWith(
        '5511999999999@c.us',
        'Olá, tudo bem?',
        undefined
      );
      expect(result.id).toBe('msg123');
    });

    it('deve lançar erro ao tentar enviar mensagem vazia', async () => {
      await expect(
        whatsappService.sendTextMessage('5511999999999', '')
      ).rejects.toThrow('Mensagem vazia não pode ser enviada');

      await expect(
        whatsappService.sendTextMessage('5511999999999', '   ')
      ).rejects.toThrow('Mensagem vazia não pode ser enviada');
    });

    it('deve passar options para sendText se fornecido', async () => {
      (mockClient.sendText as jest.Mock).mockResolvedValue({ id: 'msg456' });

      await whatsappService.sendTextMessage('5511999999999', 'Teste', {
        linkPreview: false
      });

      expect(mockClient.sendText).toHaveBeenCalledWith(
        '5511999999999@c.us',
        'Teste',
        { linkPreview: false }
      );
    });
  });

  describe('4. Envio de Imagem (sendImage)', () => {
    it('deve enviar imagem corretamente', async () => {
      (mockClient.sendImage as jest.Mock).mockResolvedValue({ id: 'img123' });

      const result = await whatsappService.sendImage(
        '5511999999999',
        'https://example.com/image.jpg',
        'image.jpg',
        'Legenda da imagem'
      );

      expect(mockClient.sendImage).toHaveBeenCalledWith(
        '5511999999999@c.us',
        'https://example.com/image.jpg',
        'image.jpg',
        'Legenda da imagem'
      );
      expect(result.id).toBe('img123');
    });

    it('deve enviar imagem sem legenda', async () => {
      (mockClient.sendImage as jest.Mock).mockResolvedValue({ id: 'img456' });

      await whatsappService.sendImage(
        '5511999999999',
        'path/to/image.png',
        'image.png'
      );

      expect(mockClient.sendImage).toHaveBeenCalledWith(
        '5511999999999@c.us',
        'path/to/image.png',
        'image.png',
        ''
      );
    });
  });

  describe('5. Envio de Arquivo (sendFile)', () => {
    it('deve enviar arquivo corretamente', async () => {
      (mockClient.sendFile as jest.Mock).mockResolvedValue({ id: 'file123' });

      const result = await whatsappService.sendFile(
        '5511999999999',
        'path/to/document.pdf',
        'document.pdf',
        'Documento importante'
      );

      expect(mockClient.sendFile).toHaveBeenCalledWith(
        '5511999999999@c.us',
        'path/to/document.pdf',
        'document.pdf',
        'Documento importante'
      );
      expect(result.id).toBe('file123');
    });
  });

  describe('6. Envio de Áudio (sendAudio)', () => {
    it('deve enviar áudio corretamente', async () => {
      ((mockClient as any).sendVoice as jest.Mock).mockResolvedValue({ id: 'audio123' });

      const result = await whatsappService.sendAudio(
        '5511999999999',
        'path/to/audio.mp3'
      );

      expect((mockClient as any).sendVoice).toHaveBeenCalledWith(
        '5511999999999@c.us',
        'path/to/audio.mp3'
      );
      expect(result.id).toBe('audio123');
    });
  });

  describe('7. Marcar como Lido (markAsRead)', () => {
    it('deve marcar chat como lido', async () => {
      (mockClient.sendSeen as jest.Mock).mockResolvedValue(true);

      const result = await whatsappService.markAsRead('5511999999999@c.us');

      expect(mockClient.sendSeen).toHaveBeenCalledWith('5511999999999@c.us');
      expect(result).toBe(true);
    });
  });

  describe('8. Localização (sendLocation)', () => {
    it('deve enviar localização corretamente', async () => {
      (mockClient.sendLocation as jest.Mock).mockResolvedValue({ id: 'loc123' });

      const result = await whatsappService.sendLocation(
        '5511999999999',
        -23.5505,
        -46.6333,
        'São Paulo, SP'
      );

      expect(mockClient.sendLocation).toHaveBeenCalledWith(
        '5511999999999@c.us',
        '-23.5505',
        '-46.6333',
        'São Paulo, SP'
      );
      expect(result.id).toBe('loc123');
    });
  });

  describe('9. Contato VCard (sendContactVcard)', () => {
    it('deve enviar vCard corretamente', async () => {
      (mockClient.sendContactVcard as jest.Mock).mockResolvedValue({ id: 'vcard123' });

      const result = await whatsappService.sendContactVcard(
        '5511999999999',
        '5511888888888@c.us',
        'João Silva'
      );

      expect(mockClient.sendContactVcard).toHaveBeenCalledWith(
        '5511999999999@c.us',
        '5511888888888@c.us',
        'João Silva'
      );
      expect(result.id).toBe('vcard123');
    });
  });

  describe('10. Arquivar Chat (archiveChat)', () => {
    it('deve arquivar chat corretamente', async () => {
      (mockClient.archiveChat as jest.Mock).mockResolvedValue(true);

      const result = await whatsappService.archiveChat('5511999999999@c.us', true);

      expect(mockClient.archiveChat).toHaveBeenCalledWith('5511999999999@c.us', true);
      expect(result).toBe(true);
    });

    it('deve desarquivar chat corretamente', async () => {
      (mockClient.archiveChat as jest.Mock).mockResolvedValue(true);

      const result = await whatsappService.archiveChat('5511999999999@c.us', false);

      expect(mockClient.archiveChat).toHaveBeenCalledWith('5511999999999@c.us', false);
      expect(result).toBe(true);
    });
  });

  describe('11. Fixar Chat (pinChat/unpinChat)', () => {
    it('deve fixar chat corretamente', async () => {
      (mockClient.pinChat as jest.Mock).mockResolvedValue(true);

      const result = await whatsappService.pinChat('5511999999999@c.us', true);

      expect(mockClient.pinChat).toHaveBeenCalledWith('5511999999999@c.us', true);
      expect(result).toBe(true);
    });

    it('deve desafixar chat corretamente', async () => {
      ((mockClient as any).unpinChat as jest.Mock).mockResolvedValue(true);

      const result = await (whatsappService as any).unpinChat('5511999999999@c.us');

      expect((mockClient as any).unpinChat).toHaveBeenCalledWith('5511999999999@c.us');
      expect(result).toBe(true);
    });
  });

  describe('12. Buscar Conversas (getAllConversations) - STATELESS', () => {
    it('deve buscar conversas direto do WhatsApp (não do PostgreSQL)', async () => {
      const mockChats = [
        { id: { _serialized: '5511999999999@c.us' }, name: 'João' },
        { id: { _serialized: '5511888888888@c.us' }, name: 'Maria' }
      ];

      (mockClient.getAllChats as jest.Mock).mockResolvedValue(mockChats);

      const result = await whatsappService.getAllConversations();

      // Deve chamar getAllChats do WPPConnect (stateless)
      expect(mockClient.getAllChats).toHaveBeenCalled();
      expect(result.length).toBe(2);
    });
  });

  describe('13. Buscar Mensagens (getChatMessages) - STATELESS', () => {
    it('deve buscar mensagens direto do WhatsApp (não do PostgreSQL)', async () => {
      const mockMessages = [
        { id: 'msg1', body: 'Oi' },
        { id: 'msg2', body: 'Tudo bem?' }
      ];

      (mockClient.getMessages as jest.Mock).mockResolvedValue(mockMessages);

      const result = await whatsappService.getChatMessages('5511999999999@c.us', 50);

      // Deve chamar getMessages do WPPConnect (stateless)
      expect(mockClient.getMessages).toHaveBeenCalledWith('5511999999999@c.us', { count: 50 });
      expect(result.length).toBe(2);
    });
  });

  describe('14. Buscar Contatos (getContacts)', () => {
    it('deve buscar todos os contatos', async () => {
      const mockContacts = [
        { id: { _serialized: '5511999999999@c.us' }, name: 'João' },
        { id: { _serialized: '5511888888888@c.us' }, name: 'Maria' }
      ];

      (mockClient.getAllContacts as jest.Mock).mockResolvedValue(mockContacts);

      const result = await whatsappService.getContacts();

      expect(mockClient.getAllContacts).toHaveBeenCalled();
      expect(result).toEqual(mockContacts);
    });
  });

  describe('15. Participantes de Grupo (getGroupParticipants)', () => {
    it('deve buscar participantes de grupo', async () => {
      const mockMembers = [
        { id: '5511999999999@c.us', isAdmin: true },
        { id: '5511888888888@c.us', isAdmin: false }
      ];

      (mockClient.getGroupMembers as jest.Mock).mockResolvedValue(mockMembers);

      const result = await whatsappService.getGroupParticipants('120363044123456789@g.us');

      expect(mockClient.getGroupMembers).toHaveBeenCalledWith('120363044123456789@g.us');
      expect(result).toEqual(mockMembers);
    });
  });

  describe('16. FASE 5 - Novas Funções', () => {
    it('deve editar mensagem corretamente', async () => {
      (mockClient.editMessage as jest.Mock).mockResolvedValue({ success: true });

      await whatsappService.editMessage('msg123', 'Texto editado');

      expect(mockClient.editMessage).toHaveBeenCalledWith('msg123', 'Texto editado');
    });

    it('deve limpar chat mantendo mensagens estreladas', async () => {
      (mockClient.clearChat as jest.Mock).mockResolvedValue(true);

      const result = await whatsappService.clearChat('5511999999999@c.us', true);

      expect(mockClient.clearChat).toHaveBeenCalledWith('5511999999999@c.us', true);
      expect(result).toBe(true);
    });

    it('deve deletar chat corretamente', async () => {
      (mockClient.deleteChat as jest.Mock).mockResolvedValue(true);

      const result = await whatsappService.deleteChat('5511999999999@c.us');

      expect(mockClient.deleteChat).toHaveBeenCalledWith('5511999999999@c.us');
      expect(result).toBe(true);
    });

    it('deve buscar URL da foto de perfil', async () => {
      (mockClient.getProfilePicFromServer as jest.Mock).mockResolvedValue({
        eurl: 'https://example.com/profile.jpg',
        imgFull: 'https://example.com/profile_full.jpg'
      });

      const result = await whatsappService.getProfilePicUrl('5511999999999@c.us');

      expect(result).toBe('https://example.com/profile.jpg');
    });

    it('deve silenciar chat por tempo determinado', async () => {
      (mockClient.sendMute as jest.Mock).mockResolvedValue({ success: true });

      await whatsappService.muteChat('5511999999999@c.us', 3600);

      expect(mockClient.sendMute).toHaveBeenCalledWith('5511999999999@c.us', 3600, 1);
    });

    it('deve bloquear contato', async () => {
      (mockClient.blockContact as jest.Mock).mockResolvedValue(true);

      const result = await whatsappService.blockContact('5511999999999@c.us');

      expect(mockClient.blockContact).toHaveBeenCalledWith('5511999999999@c.us');
      expect(result).toBe(true);
    });

    it('deve desbloquear contato', async () => {
      (mockClient.unblockContact as jest.Mock).mockResolvedValue(true);

      const result = await whatsappService.unblockContact('5511999999999@c.us');

      expect(mockClient.unblockContact).toHaveBeenCalledWith('5511999999999@c.us');
      expect(result).toBe(true);
    });

    it('deve obter link de convite do grupo', async () => {
      (mockClient.getGroupInviteLink as jest.Mock).mockResolvedValue('https://chat.whatsapp.com/abc123');

      const result = await whatsappService.getGroupInviteLink('120363044123456789@g.us');

      expect(result).toBe('https://chat.whatsapp.com/abc123');
    });

    it('deve revogar link de convite do grupo', async () => {
      (mockClient.revokeGroupInviteLink as jest.Mock).mockResolvedValue('https://chat.whatsapp.com/xyz789');

      const result = await whatsappService.revokeGroupInviteLink('120363044123456789@g.us');

      expect(result).toBe('https://chat.whatsapp.com/xyz789');
    });

    it('deve sair do grupo', async () => {
      (mockClient.leaveGroup as jest.Mock).mockResolvedValue(true);

      const result = await whatsappService.leaveGroup('120363044123456789@g.us');

      expect(result).toBe(true);
    });
  });

  describe('17. Tratamento de Erros', () => {
    it('deve propagar erro do WPPConnect corretamente', async () => {
      (mockClient.sendText as jest.Mock).mockRejectedValue(new Error('Erro no WPPConnect'));

      await expect(
        whatsappService.sendTextMessage('5511999999999', 'Teste')
      ).rejects.toThrow('Erro no WPPConnect');
    });

    it('deve tratar erro de timeout gracefully', async () => {
      (mockClient.sendText as jest.Mock).mockRejectedValue(new Error('Timeout'));

      await expect(
        whatsappService.sendTextMessage('5511999999999', 'Teste')
      ).rejects.toThrow('Timeout');
    });
  });
});
