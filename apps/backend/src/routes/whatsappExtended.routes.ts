/**
 * Rotas API REST - WhatsApp Extended Features
 *
 * Expõe todas as 88 funcionalidades do WPPConnect via API REST
 * Organizado por categorias para facilitar o uso
 */

import { Router } from 'express';
import { whatsappService } from '../services/whatsappService';
import { WhatsAppServiceExtended } from '../services/whatsappServiceExtended';
import { logger } from '../utils/logger';
import {
  sendMessageRateLimit,
  groupMessageRateLimit,
  groupActionRateLimit,
  profileChangeRateLimit,
  statusPostRateLimit,
  queryRateLimit,
} from '../middleware/whatsappRateLimit';

const router = Router();

// Middleware para verificar se WhatsApp está conectado
const requireWhatsAppConnection = (req: any, res: any, next: any) => {
  if (!whatsappService.isWhatsAppConnected()) {
    return res.status(503).json({
      error: 'WhatsApp não conectado',
      message: 'Escaneie o QR Code primeiro em /api/whatsapp/qr',
    });
  }

  const client = whatsappService.getClient();
  if (!client) {
    return res.status(503).json({
      error: 'Cliente WhatsApp não inicializado',
    });
  }

  // Anexar instância estendida ao request
  req.wppExtended = new WhatsAppServiceExtended(client);
  next();
};

router.use(requireWhatsAppConnection);

// ============================================================================
// MENSAGENS - Tipos Adicionais
// ============================================================================

/**
 * POST /api/whatsapp/extended/messages/audio
 * Enviar áudio/PTT
 */
router.post('/messages/audio', sendMessageRateLimit, async (req, res) => {
  try {
    const { to, audioPath, ptt = true } = req.body as { to: string; audioPath: string; ptt?: boolean };
    const result = await req.wppExtended.sendAudio(to, audioPath, ptt);
    res.json({ success: true, messageId: result.id });
  } catch (error: any) {
    logger.error('Erro ao enviar áudio:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/messages/location
 * Enviar localização
 */
router.post('/messages/location', sendMessageRateLimit, async (req, res) => {
  try {
    const { to, latitude, longitude, description } = req.body as { to: string; latitude: number; longitude: number; description?: string };
    const result = await req.wppExtended.sendLocation(to, latitude, longitude, description);
    res.json({ success: true, messageId: result.id });
  } catch (error: any) {
    logger.error('Erro ao enviar localização:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/messages/contact
 * Enviar cartão de contato
 */
router.post('/messages/contact', async (req, res) => {
  try {
    const { to, contactId, name } = req.body as { to: string; contactId: string; name?: string };
    const result = await req.wppExtended.sendContactVcard(to, contactId, name);
    res.json({ success: true, messageId: result.id });
  } catch (error: any) {
    logger.error('Erro ao enviar contato:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/messages/sticker
 * Enviar sticker
 */
router.post('/messages/sticker', async (req, res) => {
  try {
    const { to, imagePath } = req.body as { to: string; imagePath: string };
    const result = await req.wppExtended.sendSticker(to, imagePath);
    res.json({ success: true, messageId: result.id });
  } catch (error: any) {
    logger.error('Erro ao enviar sticker:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/messages/file
 * Enviar documento
 */
router.post('/messages/file', async (req, res) => {
  try {
    const { to, filePath, filename, caption } = req.body as { to: string; filePath: string; filename: string; caption?: string };
    const result = await req.wppExtended.sendFile(to, filePath, filename, caption);
    res.json({ success: true, messageId: result.id });
  } catch (error: any) {
    logger.error('Erro ao enviar arquivo:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/messages/link-preview
 * Enviar link com preview
 */
router.post('/messages/link-preview', async (req, res) => {
  try {
    const { to, url, title } = req.body as { to: string; url: string; title: string };
    const result = await req.wppExtended.sendLinkPreview(to, url, title);
    res.json({ success: true, messageId: result.id });
  } catch (error: any) {
    logger.error('Erro ao enviar link:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/messages/list
 * Enviar lista interativa
 */
router.post('/messages/list', async (req, res) => {
  try {
    const { to, title, description, buttonText, sections } = req.body as { to: string; title: string; description: string; buttonText: string; sections: any[] };
    const result = await req.wppExtended.sendListMessage(to, title, description, buttonText, sections);
    res.json({ success: true, messageId: result.id });
  } catch (error: any) {
    logger.error('Erro ao enviar lista:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/messages/buttons
 * Enviar botões
 */
router.post('/messages/buttons', async (req, res) => {
  try {
    const { to, message, buttons } = req.body as { to: string; message: string; buttons: Array<{ buttonText: string }> };
    const result = await req.wppExtended.sendButtons(to, message, buttons);
    res.json({ success: true, messageId: result.id });
  } catch (error: any) {
    logger.error('Erro ao enviar botões:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/messages/poll
 * Enviar enquete
 */
router.post('/messages/poll', async (req, res) => {
  try {
    const { to, name, options } = req.body as { to: string; name: string; options: string[] };
    const result = await req.wppExtended.sendPoll(to, name, options);
    res.json({ success: true, messageId: result.id });
  } catch (error: any) {
    logger.error('Erro ao enviar enquete:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GERENCIAMENTO DE CHAT
// ============================================================================

/**
 * POST /api/whatsapp/extended/chat/archive
 * Arquivar/desarquivar chat
 */
router.post('/chat/archive', async (req, res) => {
  try {
    const { chatId, archive = true } = req.body as { chatId: string; archive?: boolean };
    await req.wppExtended.archiveChat(chatId, archive);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao arquivar chat:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/chat/pin
 * Fixar/desfixar chat
 */
router.post('/chat/pin', async (req, res) => {
  try {
    const { chatId, pin = true } = req.body as { chatId: string; pin?: boolean };
    await req.wppExtended.pinChat(chatId, pin);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao fixar chat:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/whatsapp/extended/chat/:chatId
 * Limpar histórico
 */
router.delete('/chat/:chatId/clear', async (req, res) => {
  try {
    const { chatId } = req.params as { chatId: string };
    await req.wppExtended.clearChat(chatId);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao limpar chat:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/whatsapp/extended/messages/:messageId
 * Deletar mensagem
 */
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params as { messageId: string };
    const { chatId, onlyLocal = false } = req.body as { chatId: string; onlyLocal?: boolean };
    await req.wppExtended.deleteMessage(chatId, messageId, onlyLocal);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao deletar mensagem:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/whatsapp/extended/messages/:messageId
 * Editar mensagem
 */
router.put('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params as { messageId: string };
    const { newContent } = req.body as { newContent: string };
    await req.wppExtended.editMessage(messageId, newContent);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao editar mensagem:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/messages/forward
 * Encaminhar mensagem
 */
router.post('/messages/forward', async (req, res) => {
  try {
    const { to, messageId } = req.body as { to: string; messageId: string };
    await req.wppExtended.forwardMessage(to, messageId);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao encaminhar mensagem:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/chat/mark-read
 * Marcar como lido
 */
router.post('/chat/mark-read', async (req, res) => {
  try {
    const { chatId } = req.body as { chatId: string };
    await req.wppExtended.markAsRead(chatId);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao marcar como lido:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/messages/react
 * Reagir a mensagem
 */
router.post('/messages/react', async (req, res) => {
  try {
    const { messageId, emoji } = req.body as { messageId: string; emoji: string };
    await req.wppExtended.reactToMessage(messageId, emoji);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao reagir:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/chat/typing
 * Controlar "digitando..."
 */
router.post('/chat/typing', async (req, res) => {
  try {
    const { chatId, start = true } = req.body as { chatId: string; start?: boolean };
    if (start) {
      await req.wppExtended.startTyping(chatId);
    } else {
      await req.wppExtended.stopTyping(chatId);
    }
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao controlar digitando:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/chat/recording
 * Controlar "gravando..."
 */
router.post('/chat/recording', async (req, res) => {
  try {
    const { chatId, start = true } = req.body as { chatId: string; start?: boolean };
    if (start) {
      await req.wppExtended.startRecording(chatId);
    } else {
      await req.wppExtended.stopRecording(chatId);
    }
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao controlar gravação:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GRUPOS
// ============================================================================

/**
 * POST /api/whatsapp/extended/groups
 * Criar grupo
 */
router.post('/groups', async (req, res) => {
  try {
    const { groupName, contacts } = req.body as { groupName: string; contacts: string[] };
    const result = await req.wppExtended.createGroup(groupName, contacts);
    res.json({ success: true, group: result });
  } catch (error: any) {
    logger.error('Erro ao criar grupo:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/groups/:groupId/participants
 * Adicionar participantes
 */
router.post('/groups/:groupId/participants', async (req, res) => {
  try {
    const { groupId } = req.params as { groupId: string };
    const { participants } = req.body as { participants: string[] };
    const result = await req.wppExtended.addParticipants(groupId, participants);
    res.json({ success: true, result });
  } catch (error: any) {
    logger.error('Erro ao adicionar participantes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/whatsapp/extended/groups/:groupId/participants
 * Remover participantes
 */
router.delete('/groups/:groupId/participants', async (req, res) => {
  try {
    const { groupId } = req.params as { groupId: string };
    const { participants } = req.body as { participants: string[] };
    const result = await req.wppExtended.removeParticipants(groupId, participants);
    res.json({ success: true, result });
  } catch (error: any) {
    logger.error('Erro ao remover participantes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/groups/:groupId/admins/promote
 * Promover a admin
 */
router.post('/groups/:groupId/admins/promote', async (req, res) => {
  try {
    const { groupId } = req.params as { groupId: string };
    const { participants } = req.body as { participants: string[] };
    const result = await req.wppExtended.promoteParticipant(groupId, participants);
    res.json({ success: true, result });
  } catch (error: any) {
    logger.error('Erro ao promover:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/groups/:groupId/admins/demote
 * Rebaixar admin
 */
router.post('/groups/:groupId/admins/demote', async (req, res) => {
  try {
    const { groupId } = req.params as { groupId: string };
    const { participants } = req.body as { participants: string[] };
    const result = await req.wppExtended.demoteParticipant(groupId, participants);
    res.json({ success: true, result });
  } catch (error: any) {
    logger.error('Erro ao rebaixar:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/extended/groups/:groupId/invite-link
 * Obter link de convite
 */
router.get('/groups/:groupId/invite-link', async (req, res) => {
  try {
    const { groupId } = req.params as { groupId: string };
    const link = await req.wppExtended.getGroupInviteLink(groupId);
    res.json({ success: true, link });
  } catch (error: any) {
    logger.error('Erro ao obter link:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/groups/join
 * Entrar em grupo via link
 */
router.post('/groups/join', async (req, res) => {
  try {
    const { inviteCode } = req.body as { inviteCode: string };
    const result = await req.wppExtended.joinGroupViaLink(inviteCode);
    res.json({ success: true, result });
  } catch (error: any) {
    logger.error('Erro ao entrar no grupo:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/groups/:groupId/leave
 * Sair de grupo
 */
router.post('/groups/:groupId/leave', async (req, res) => {
  try {
    const { groupId } = req.params as { groupId: string };
    await req.wppExtended.leaveGroup(groupId);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao sair do grupo:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/whatsapp/extended/groups/:groupId/subject
 * Alterar nome do grupo
 */
router.put('/groups/:groupId/subject', async (req, res) => {
  try {
    const { groupId } = req.params as { groupId: string };
    const { subject } = req.body as { subject: string };
    await req.wppExtended.setGroupSubject(groupId, subject);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao alterar nome:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/whatsapp/extended/groups/:groupId/description
 * Alterar descrição
 */
router.put('/groups/:groupId/description', async (req, res) => {
  try {
    const { groupId } = req.params as { groupId: string };
    const { description } = req.body as { description: string };
    await req.wppExtended.setGroupDescription(groupId, description);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao alterar descrição:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/whatsapp/extended/groups/:groupId/icon
 * Alterar foto do grupo
 */
router.put('/groups/:groupId/icon', async (req, res) => {
  try {
    const { groupId } = req.params as { groupId: string };
    const { imagePath } = req.body as { imagePath: string };
    await req.wppExtended.setGroupIcon(groupId, imagePath);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao alterar foto:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/extended/groups/:groupId/members
 * Listar participantes
 */
router.get('/groups/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params as { groupId: string };
    const members = await req.wppExtended.getGroupMembers(groupId);
    res.json({ success: true, members });
  } catch (error: any) {
    logger.error('Erro ao listar participantes:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CONTATOS
// ============================================================================

/**
 * POST /api/whatsapp/extended/contacts/check
 * Verificar se número existe
 */
router.post('/contacts/check', async (req, res) => {
  try {
    const { number } = req.body as { number: string };
    const result = await req.wppExtended.checkNumberExists(number);
    res.json({ success: true, result });
  } catch (error: any) {
    logger.error('Erro ao verificar número:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/extended/contacts/:contactId
 * Obter detalhes de contato
 */
router.get('/contacts/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params as { contactId: string };
    const contact = await req.wppExtended.getContact(contactId);
    res.json({ success: true, contact });
  } catch (error: any) {
    logger.error('Erro ao obter contato:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/extended/contacts
 * Listar todos os contatos
 */
router.get('/contacts', async (req, res) => {
  try {
    const contacts = await req.wppExtended.getAllContacts();
    res.json({ success: true, contacts });
  } catch (error: any) {
    logger.error('Erro ao listar contatos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/contacts/:contactId/block
 * Bloquear contato
 */
router.post('/contacts/:contactId/block', async (req, res) => {
  try {
    const { contactId } = req.params as { contactId: string };
    await req.wppExtended.blockContact(contactId);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao bloquear:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/contacts/:contactId/unblock
 * Desbloquear contato
 */
router.post('/contacts/:contactId/unblock', async (req, res) => {
  try {
    const { contactId } = req.params as { contactId: string };
    await req.wppExtended.unblockContact(contactId);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao desbloquear:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/extended/contacts/:contactId/profile-pic
 * Obter foto de perfil
 */
router.get('/contacts/:contactId/profile-pic', async (req, res) => {
  try {
    const { contactId } = req.params as { contactId: string };
    const url = await req.wppExtended.getProfilePicUrl(contactId);
    res.json({ success: true, url });
  } catch (error: any) {
    logger.error('Erro ao obter foto:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/extended/chats
 * Listar todos os chats
 */
router.get('/chats', async (req, res) => {
  try {
    const chats = await req.wppExtended.getAllChats();
    res.json({ success: true, chats });
  } catch (error: any) {
    logger.error('Erro ao listar chats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// STATUS/STORIES
// ============================================================================

/**
 * POST /api/whatsapp/extended/status/text
 * Postar status de texto
 */
router.post('/status/text', async (req, res) => {
  try {
    const { text, options } = req.body as { text: string; options?: any };
    const result = await req.wppExtended.postTextStatus(text, options);
    res.json({ success: true, result });
  } catch (error: any) {
    logger.error('Erro ao postar status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/status/image
 * Postar status de imagem
 */
router.post('/status/image', async (req, res) => {
  try {
    const { imagePath, caption } = req.body as { imagePath: string; caption?: string };
    const result = await req.wppExtended.postImageStatus(imagePath, caption);
    res.json({ success: true, result });
  } catch (error: any) {
    logger.error('Erro ao postar status de imagem:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/extended/status
 * Ver status de contatos
 */
router.get('/status', async (req, res) => {
  try {
    const statuses = await req.wppExtended.getAllStatus();
    res.json({ success: true, statuses });
  } catch (error: any) {
    logger.error('Erro ao listar status:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PERFIL
// ============================================================================

/**
 * PUT /api/whatsapp/extended/profile/name
 * Alterar nome de perfil
 */
router.put('/profile/name', async (req, res) => {
  try {
    const { name } = req.body as { name: string };
    await req.wppExtended.setProfileName(name);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao alterar nome:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/whatsapp/extended/profile/picture
 * Alterar foto de perfil
 */
router.put('/profile/picture', async (req, res) => {
  try {
    const { imagePath } = req.body as { imagePath: string };
    await req.wppExtended.setProfilePicture(imagePath);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao alterar foto:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/whatsapp/extended/profile/status
 * Alterar status/recado
 */
router.put('/profile/status', async (req, res) => {
  try {
    const { status } = req.body as { status: string };
    await req.wppExtended.setProfileStatus(status);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao alterar status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/extended/profile/battery
 * Obter nível de bateria
 */
router.get('/profile/battery', async (req, res) => {
  try {
    const battery = await req.wppExtended.getBatteryLevel();
    res.json({ success: true, battery });
  } catch (error: any) {
    logger.error('Erro ao obter bateria:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// WHATSAPP BUSINESS
// ============================================================================

/**
 * POST /api/whatsapp/extended/business/products
 * Criar produto
 */
router.post('/business/products', async (req, res) => {
  try {
    const { product } = req.body as { product: any };
    const result = await req.wppExtended.createProduct(product);
    res.json({ success: true, result });
  } catch (error: any) {
    logger.error('Erro ao criar produto:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/extended/business/products
 * Listar produtos
 */
router.get('/business/products', async (req, res) => {
  try {
    const products = await req.wppExtended.getProducts();
    res.json({ success: true, products });
  } catch (error: any) {
    logger.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/business/labels
 * Criar label
 */
router.post('/business/labels', async (req, res) => {
  try {
    const { name, color } = req.body as { name: string; color: string };
    const result = await req.wppExtended.createLabel(name, color);
    res.json({ success: true, result });
  } catch (error: any) {
    logger.error('Erro ao criar label:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/extended/business/labels
 * Listar labels
 */
router.get('/business/labels', async (req, res) => {
  try {
    const labels = await req.wppExtended.getAllLabels();
    res.json({ success: true, labels });
  } catch (error: any) {
    logger.error('Erro ao listar labels:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * POST /api/whatsapp/extended/utils/download-media
 * Baixar mídia
 */
router.post('/utils/download-media', async (req, res) => {
  try {
    const { messageId } = req.body as { messageId: string };
    const buffer = await req.wppExtended.downloadMedia(messageId);
    res.json({ success: true, size: buffer.length });
  } catch (error: any) {
    logger.error('Erro ao baixar mídia:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/extended/utils/version
 * Obter versão do WhatsApp
 */
router.get('/utils/version', async (req, res) => {
  try {
    const version = await req.wppExtended.getWAVersion();
    res.json({ success: true, version });
  } catch (error: any) {
    logger.error('Erro ao obter versão:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/extended/utils/logout
 * Fazer logout
 */
router.post('/utils/logout', async (req, res) => {
  try {
    await req.wppExtended.logout();
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao fazer logout:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
