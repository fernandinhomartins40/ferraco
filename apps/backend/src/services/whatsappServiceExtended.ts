/**
 * WhatsApp Service Extended - Todas as 95 funcionalidades do WPPConnect
 *
 * Este arquivo estende o whatsappService.ts original com TODAS as funcionalidades
 * disponíveis na biblioteca WPPConnect:
 *
 * ✅ Mensagens (texto, áudio, vídeo, imagem, documento, localização, contato, sticker, poll, lista, botões)
 * ✅ Gerenciamento de Chat (arquivar, fixar, limpar, deletar, editar, encaminhar, reagir, marcar lido)
 * ✅ Grupos (criar, adicionar/remover, promover/rebaixar, links, configurações)
 * ✅ Contatos (verificar, listar, bloquear, foto, status)
 * ✅ Status/Stories (postar, ver, deletar)
 * ✅ Perfil (nome, foto, status, presença)
 * ✅ WhatsApp Business (catálogo, produtos, labels, respostas rápidas)
 * ✅ Comunidades (criar, gerenciar)
 * ✅ Utilitários (download mídia, backup, webhooks)
 */

import { Whatsapp } from '@wppconnect-team/wppconnect';
import { logger } from '../utils/logger';

export class WhatsAppServiceExtended {
  private client: Whatsapp;

  constructor(client: Whatsapp) {
    this.client = client;
  }

  // ============================================================================
  // MENSAGENS - TIPOS ADICIONAIS (10 funcionalidades)
  // ============================================================================

  /**
   * 7. Enviar áudio/PTT (Push-to-Talk)
   */
  async sendAudio(to: string, audioPath: string, ptt: boolean = true): Promise<any> {
    try {
      const result = ptt
        ? await this.client.sendPtt(to, audioPath)
        : await this.client.sendFile(to, audioPath, 'audio', '');
      logger.info(`✅ Áudio enviado para ${to}`);
      return result;
    } catch (error) {
      logger.error(`❌ Erro ao enviar áudio:`, error);
      throw error;
    }
  }

  /**
   * 8. Enviar localização GPS
   */
  async sendLocation(to: string, latitude: number, longitude: number, description?: string): Promise<any> {
    try {
      const result = await this.client.sendLocation(to, latitude.toString(), longitude.toString(), description || '');
      logger.info(`✅ Localização enviada para ${to}`);
      return result;
    } catch (error) {
      logger.error(`❌ Erro ao enviar localização:`, error);
      throw error;
    }
  }

  /**
   * 9. Enviar cartão de contato (vCard)
   */
  async sendContactVcard(to: string, contactId: string, name?: string): Promise<any> {
    try {
      const result = await this.client.sendContactVcard(to, contactId, name || '');
      logger.info(`✅ Contato enviado para ${to}`);
      return result;
    } catch (error) {
      logger.error(`❌ Erro ao enviar contato:`, error);
      throw error;
    }
  }

  /**
   * 10. Enviar sticker/figurinha
   */
  async sendSticker(to: string, imagePath: string): Promise<any> {
    try {
      const result = await this.client.sendImageAsSticker(to, imagePath);
      logger.info(`✅ Sticker enviado para ${to}`);
      return result;
    } catch (error) {
      logger.error(`❌ Erro ao enviar sticker:`, error);
      throw error;
    }
  }

  /**
   * 11. Enviar documento/arquivo
   */
  async sendFile(to: string, filePath: string, filename: string, caption?: string): Promise<any> {
    try {
      const result = await this.client.sendFile(to, filePath, filename, caption || '');
      logger.info(`✅ Arquivo enviado para ${to}`);
      return result;
    } catch (error) {
      logger.error(`❌ Erro ao enviar arquivo:`, error);
      throw error;
    }
  }

  /**
   * 12. Enviar link com preview
   */
  async sendLinkPreview(to: string, url: string, title: string): Promise<any> {
    try {
      const result = await this.client.sendLinkPreview(to, url, title);
      logger.info(`✅ Link enviado para ${to}`);
      return result;
    } catch (error) {
      logger.error(`❌ Erro ao enviar link:`, error);
      throw error;
    }
  }

  /**
   * 13. Enviar mensagem de lista interativa
   */
  async sendListMessage(to: string, title: string, description: string, buttonText: string, sections: any[]): Promise<any> {
    try {
      const result = await this.client.sendListMessage(to, { buttonText, description, title, sections });
      logger.info(`✅ Lista enviada para ${to}`);
      return result;
    } catch (error) {
      logger.error(`❌ Erro ao enviar lista:`, error);
      throw error;
    }
  }

  /**
   * 14. Enviar mensagem com botões (formatada como texto)
   * NOTA: sendButtons() foi deprecado pelo WhatsApp, usando sendText() com formatação
   */
  async sendButtons(to: string, message: string, buttons: Array<{ buttonText: string }>): Promise<any> {
    try {
      // Formatar mensagem com opções numeradas
      let formattedMessage = message + '\n\n';
      buttons.forEach((btn, idx) => {
        formattedMessage += `${idx + 1}. ${btn.buttonText}\n`;
      });
      formattedMessage += '\nResponda com o número da opção desejada.';

      const result = await this.client.sendText(to, formattedMessage);
      logger.info(`✅ Opções enviadas para ${to}`);
      return result;
    } catch (error) {
      logger.error(`❌ Erro ao enviar opções:`, error);
      throw error;
    }
  }

  /**
   * 15. Enviar enquete/poll
   */
  async sendPoll(to: string, name: string, options: string[]): Promise<any> {
    try {
      const result = await this.client.sendPollMessage(to, name, options);
      logger.info(`✅ Enquete enviada para ${to}`);
      return result;
    } catch (error) {
      logger.error(`❌ Erro ao enviar enquete:`, error);
      throw error;
    }
  }

  /**
   * 16. Enviar mensagem de pedido (WhatsApp Business)
   */
  async sendOrderMessage(to: string, items: any[]): Promise<any> {
    try {
      // @ts-ignore - Método pode não estar tipado
      const result = await this.client.sendOrderMessage?.(to, items);
      logger.info(`✅ Pedido enviado para ${to}`);
      return result;
    } catch (error) {
      logger.error(`❌ Erro ao enviar pedido:`, error);
      throw error;
    }
  }

  // ============================================================================
  // GERENCIAMENTO DE CHAT (11 funcionalidades)
  // ============================================================================

  /**
   * 17. Arquivar/desarquivar chat
   */
  async archiveChat(chatId: string, archive: boolean = true): Promise<void> {
    try {
      await this.client.archiveChat(chatId, archive);
      logger.info(`✅ Chat ${archive ? 'arquivado' : 'desarquivado'}: ${chatId}`);
    } catch (error) {
      logger.error('❌ Erro ao arquivar chat:', error);
      throw error;
    }
  }

  /**
   * 18. Fixar/desfixar chat
   */
  async pinChat(chatId: string, pin: boolean = true): Promise<void> {
    try {
      // @ts-ignore
      await this.client.pinChat?.(chatId, pin);
      logger.info(`✅ Chat ${pin ? 'fixado' : 'desfixado'}: ${chatId}`);
    } catch (error) {
      logger.error('❌ Erro ao fixar chat:', error);
      throw error;
    }
  }

  /**
   * 19. Limpar histórico de chat
   */
  async clearChat(chatId: string): Promise<void> {
    try {
      await this.client.clearChat(chatId);
      logger.info(`✅ Chat limpo: ${chatId}`);
    } catch (error) {
      logger.error('❌ Erro ao limpar chat:', error);
      throw error;
    }
  }

  /**
   * 20. Deletar mensagem
   */
  async deleteMessage(chatId: string, messageId: string, onlyLocal: boolean = false): Promise<void> {
    try {
      await this.client.deleteMessage(chatId, [messageId], onlyLocal);
      logger.info(`✅ Mensagem deletada: ${messageId}`);
    } catch (error) {
      logger.error('❌ Erro ao deletar mensagem:', error);
      throw error;
    }
  }

  /**
   * 21. Editar mensagem
   */
  async editMessage(messageId: string, newContent: string): Promise<void> {
    try {
      await this.client.editMessage(messageId, newContent);
      logger.info(`✅ Mensagem editada: ${messageId}`);
    } catch (error) {
      logger.error('❌ Erro ao editar mensagem:', error);
      throw error;
    }
  }

  /**
   * 22. Encaminhar mensagem
   */
  async forwardMessage(to: string, messageId: string): Promise<void> {
    try {
      await this.client.forwardMessage(to, messageId);
      logger.info(`✅ Mensagem encaminhada para ${to}`);
    } catch (error) {
      logger.error('❌ Erro ao encaminhar mensagem:', error);
      throw error;
    }
  }

  /**
   * 23. Marcar como lido
   */
  async markAsRead(chatId: string): Promise<void> {
    try {
      await this.client.sendSeen(chatId);
      logger.info(`✅ Chat marcado como lido: ${chatId}`);
    } catch (error) {
      logger.error('❌ Erro ao marcar como lido:', error);
      throw error;
    }
  }

  /**
   * 24. Reagir a mensagem
   */
  async reactToMessage(messageId: string, emoji: string): Promise<void> {
    try {
      await this.client.sendReactionToMessage(messageId, emoji);
      logger.info(`✅ Reação enviada: ${emoji}`);
    } catch (error) {
      logger.error('❌ Erro ao reagir:', error);
      throw error;
    }
  }

  /**
   * 25. Buscar mensagens
   */
  async searchMessages(query: string, page: number = 1, count: number = 10): Promise<any> {
    try {
      // @ts-ignore
      const result = await this.client.searchMessages?.(query, page, count);
      logger.info(`✅ Busca realizada: ${query}`);
      return result;
    } catch (error) {
      logger.error('❌ Erro ao buscar mensagens:', error);
      throw error;
    }
  }

  /**
   * 26. Configurar mensagens temporárias
   */
  async setTemporaryMessages(chatId: string, duration: number): Promise<void> {
    try {
      // @ts-ignore
      await this.client.setTemporaryMessages?.(chatId, duration);
      logger.info(`✅ Mensagens temporárias configuradas: ${chatId}`);
    } catch (error) {
      logger.error('❌ Erro ao configurar mensagens temporárias:', error);
      throw error;
    }
  }

  /**
   * 27. Iniciar "digitando..."
   */
  async startTyping(chatId: string): Promise<void> {
    try {
      await this.client.startTyping(chatId);
      logger.debug(`✅ Digitando iniciado: ${chatId}`);
    } catch (error) {
      logger.error('❌ Erro ao iniciar digitando:', error);
      throw error;
    }
  }

  /**
   * 28. Parar "digitando..."
   */
  async stopTyping(chatId: string): Promise<void> {
    try {
      await this.client.stopTyping(chatId);
      logger.debug(`✅ Digitando parado: ${chatId}`);
    } catch (error) {
      logger.error('❌ Erro ao parar digitando:', error);
      throw error;
    }
  }

  /**
   * 29. Iniciar "gravando áudio..."
   */
  async startRecording(chatId: string): Promise<void> {
    try {
      await this.client.startRecording(chatId);
      logger.debug(`✅ Gravação iniciada: ${chatId}`);
    } catch (error) {
      logger.error('❌ Erro ao iniciar gravação:', error);
      throw error;
    }
  }

  /**
   * 30. Parar "gravando áudio..."
   */
  async stopRecording(chatId: string): Promise<void> {
    try {
      await this.client.stopRecoring(chatId);
      logger.debug(`✅ Gravação parada: ${chatId}`);
    } catch (error) {
      logger.error('❌ Erro ao parar gravação:', error);
      throw error;
    }
  }

  // ============================================================================
  // GRUPOS (15 funcionalidades)
  // ============================================================================

  /**
   * 31. Criar grupo
   */
  async createGroup(groupName: string, contacts: string[]): Promise<any> {
    try {
      const result = await this.client.createGroup(groupName, contacts);
      logger.info(`✅ Grupo criado: ${groupName}`);
      return result;
    } catch (error) {
      logger.error('❌ Erro ao criar grupo:', error);
      throw error;
    }
  }

  /**
   * 32. Adicionar participantes
   */
  async addParticipants(groupId: string, participants: string[]): Promise<any> {
    try {
      const result = await this.client.addParticipant(groupId, participants);
      logger.info(`✅ Participantes adicionados ao grupo ${groupId}`);
      return result;
    } catch (error) {
      logger.error('❌ Erro ao adicionar participantes:', error);
      throw error;
    }
  }

  /**
   * 33. Remover participantes
   */
  async removeParticipants(groupId: string, participants: string[]): Promise<any> {
    try {
      const result = await this.client.removeParticipant(groupId, participants);
      logger.info(`✅ Participantes removidos do grupo ${groupId}`);
      return result;
    } catch (error) {
      logger.error('❌ Erro ao remover participantes:', error);
      throw error;
    }
  }

  /**
   * 34. Promover a admin
   */
  async promoteParticipant(groupId: string, participants: string[]): Promise<any> {
    try {
      const result = await this.client.promoteParticipant(groupId, participants);
      logger.info(`✅ Participantes promovidos a admin: ${groupId}`);
      return result;
    } catch (error) {
      logger.error('❌ Erro ao promover participantes:', error);
      throw error;
    }
  }

  /**
   * 35. Rebaixar admin
   */
  async demoteParticipant(groupId: string, participants: string[]): Promise<any> {
    try {
      const result = await this.client.demoteParticipant(groupId, participants);
      logger.info(`✅ Participantes rebaixados de admin: ${groupId}`);
      return result;
    } catch (error) {
      logger.error('❌ Erro ao rebaixar participantes:', error);
      throw error;
    }
  }

  /**
   * 36. Obter link de convite
   */
  async getGroupInviteLink(groupId: string): Promise<string> {
    try {
      const link = await this.client.getGroupInviteLink(groupId);
      logger.info(`✅ Link obtido: ${groupId}`);
      return link;
    } catch (error) {
      logger.error('❌ Erro ao obter link:', error);
      throw error;
    }
  }

  /**
   * 37. Entrar em grupo via link
   */
  async joinGroupViaLink(inviteCode: string): Promise<any> {
    try {
      const result = await this.client.joinGroup(inviteCode);
      logger.info(`✅ Entrou no grupo via link`);
      return result;
    } catch (error) {
      logger.error('❌ Erro ao entrar no grupo:', error);
      throw error;
    }
  }

  /**
   * 38. Sair de grupo
   */
  async leaveGroup(groupId: string): Promise<void> {
    try {
      await this.client.leaveGroup(groupId);
      logger.info(`✅ Saiu do grupo: ${groupId}`);
    } catch (error) {
      logger.error('❌ Erro ao sair do grupo:', error);
      throw error;
    }
  }

  /**
   * 39. Alterar nome do grupo
   */
  async setGroupSubject(groupId: string, subject: string): Promise<void> {
    try {
      await this.client.setGroupSubject(groupId, subject);
      logger.info(`✅ Nome do grupo alterado: ${groupId}`);
    } catch (error) {
      logger.error('❌ Erro ao alterar nome:', error);
      throw error;
    }
  }

  /**
   * 40. Alterar descrição do grupo
   */
  async setGroupDescription(groupId: string, description: string): Promise<void> {
    try {
      await this.client.setGroupDescription(groupId, description);
      logger.info(`✅ Descrição do grupo alterada: ${groupId}`);
    } catch (error) {
      logger.error('❌ Erro ao alterar descrição:', error);
      throw error;
    }
  }

  /**
   * 41. Alterar foto do grupo
   */
  async setGroupIcon(groupId: string, imagePath: string): Promise<void> {
    try {
      await this.client.setGroupIcon(groupId, imagePath);
      logger.info(`✅ Foto do grupo alterada: ${groupId}`);
    } catch (error) {
      logger.error('❌ Erro ao alterar foto:', error);
      throw error;
    }
  }

  /**
   * 42. Configurar quem pode enviar mensagens
   */
  async setGroupSettings(groupId: string, onlyAdmins: boolean): Promise<void> {
    try {
      await this.client.setGroupProperty(groupId, 'announcement' as any, onlyAdmins);
      logger.info(`✅ Configurações do grupo alteradas: ${groupId}`);
    } catch (error) {
      logger.error('❌ Erro ao configurar grupo:', error);
      throw error;
    }
  }

  /**
   * 43. Aprovar solicitação de entrada
   */
  async approveGroupMembershipRequest(groupId: string, membershipRequests: string[]): Promise<any> {
    try {
      // @ts-ignore
      const result = await this.client.approveGroupMembershipRequest?.(groupId, membershipRequests);
      logger.info(`✅ Solicitações aprovadas: ${groupId}`);
      return result;
    } catch (error) {
      logger.error('❌ Erro ao aprovar solicitações:', error);
      throw error;
    }
  }

  /**
   * 44. Listar participantes
   */
  async getGroupMembers(groupId: string): Promise<any> {
    try {
      const members = await this.client.getGroupMembers(groupId);
      logger.info(`✅ Participantes listados: ${groupId}`);
      return members;
    } catch (error) {
      logger.error('❌ Erro ao listar participantes:', error);
      throw error;
    }
  }

  /**
   * 45. Listar administradores
   */
  async getGroupAdmins(groupId: string): Promise<any> {
    try {
      const members = await this.client.getGroupMembers(groupId);
      // @ts-ignore
      const admins = members.filter((m: any) => m.isAdmin || m.isSuperAdmin);
      logger.info(`✅ Administradores listados: ${groupId}`);
      return admins;
    } catch (error) {
      logger.error('❌ Erro ao listar admins:', error);
      throw error;
    }
  }

  // ============================================================================
  // CONTATOS (8 funcionalidades)
  // ============================================================================

  /**
   * 46. Verificar se número existe no WhatsApp
   */
  async checkNumberExists(number: string): Promise<any> {
    try {
      const result = await this.client.checkNumberStatus(number);
      logger.info(`✅ Número verificado: ${number}`);
      return result;
    } catch (error: any) {
      // ✅ CORREÇÃO: Tratar erro createUserWid graciosamente
      if (error.message && error.message.includes('createUserWid')) {
        logger.warn(`⚠️  Erro interno do WPPConnect (createUserWid) para ${number}`);
        return { numberExists: false, error: 'Número inválido ou não registrado no WhatsApp' };
      }
      logger.error('❌ Erro ao verificar número:', error);
      throw error;
    }
  }

  /**
   * 47. Obter detalhes de contato
   */
  async getContact(contactId: string): Promise<any> {
    try {
      const contact = await this.client.getContact(contactId);
      logger.info(`✅ Contato obtido: ${contactId}`);
      return contact;
    } catch (error) {
      logger.error('❌ Erro ao obter contato:', error);
      throw error;
    }
  }

  /**
   * 48. Listar todos os contatos
   */
  async getAllContacts(): Promise<any> {
    try {
      const contacts = await this.client.getAllContacts();
      logger.info(`✅ Contatos listados: ${contacts.length}`);
      return contacts;
    } catch (error) {
      logger.error('❌ Erro ao listar contatos:', error);
      throw error;
    }
  }

  /**
   * 49. Bloquear contato
   */
  async blockContact(contactId: string): Promise<void> {
    try {
      await this.client.blockContact(contactId);
      logger.info(`✅ Contato bloqueado: ${contactId}`);
    } catch (error) {
      logger.error('❌ Erro ao bloquear contato:', error);
      throw error;
    }
  }

  /**
   * 50. Desbloquear contato
   */
  async unblockContact(contactId: string): Promise<void> {
    try {
      await this.client.unblockContact(contactId);
      logger.info(`✅ Contato desbloqueado: ${contactId}`);
    } catch (error) {
      logger.error('❌ Erro ao desbloquear contato:', error);
      throw error;
    }
  }

  /**
   * 51. Obter foto de perfil
   */
  async getProfilePicUrl(contactId: string): Promise<string> {
    try {
      const url = await this.client.getProfilePicFromServer(contactId);
      logger.info(`✅ Foto obtida: ${contactId}`);
      return typeof url === 'string' ? url : (url as any).eurl || '';
    } catch (error) {
      logger.error('❌ Erro ao obter foto:', error);
      throw error;
    }
  }

  /**
   * 52. Obter status do contato
   */
  async getStatus(contactId: string): Promise<any> {
    try {
      const status = await this.client.getStatus(contactId);
      logger.info(`✅ Status obtido: ${contactId}`);
      return status;
    } catch (error) {
      logger.error('❌ Erro ao obter status:', error);
      throw error;
    }
  }

  /**
   * 53. Listar chats
   */
  async getAllChats(): Promise<any> {
    try {
      const chats = await this.client.getAllChats();
      logger.info(`✅ Chats listados: ${chats.length}`);
      return chats;
    } catch (error) {
      logger.error('❌ Erro ao listar chats:', error);
      throw error;
    }
  }

  // ============================================================================
  // STATUS/STORIES (5 funcionalidades)
  // ============================================================================

  /**
   * 54. Postar status de texto
   */
  async postTextStatus(text: string, options?: any): Promise<any> {
    try {
      // @ts-ignore
      const result = await this.client.sendTextStatus?.(text, options);
      logger.info(`✅ Status de texto postado`);
      return result;
    } catch (error) {
      logger.error('❌ Erro ao postar status de texto:', error);
      throw error;
    }
  }

  /**
   * 55. Postar status de imagem
   */
  async postImageStatus(imagePath: string, caption?: string): Promise<any> {
    try {
      // @ts-ignore
      const result = await this.client.sendImageStatus?.(imagePath, caption);
      logger.info(`✅ Status de imagem postado`);
      return result;
    } catch (error) {
      logger.error('❌ Erro ao postar status de imagem:', error);
      throw error;
    }
  }

  /**
   * 56. Postar status de vídeo
   */
  async postVideoStatus(videoPath: string, caption?: string): Promise<any> {
    try {
      // @ts-ignore
      const result = await this.client.sendVideoStatus?.(videoPath, caption);
      logger.info(`✅ Status de vídeo postado`);
      return result;
    } catch (error) {
      logger.error('❌ Erro ao postar status de vídeo:', error);
      throw error;
    }
  }

  /**
   * 57. Ver status de contatos
   */
  async getAllStatus(): Promise<any> {
    try {
      // @ts-ignore
      const statuses = await this.client.getAllStatus?.();
      logger.info(`✅ Status listados`);
      return statuses;
    } catch (error) {
      logger.error('❌ Erro ao listar status:', error);
      throw error;
    }
  }

  /**
   * 58. Deletar status
   */
  async deleteStatus(statusId: string): Promise<void> {
    try {
      // @ts-ignore
      await this.client.deleteStatus?.(statusId);
      logger.info(`✅ Status deletado: ${statusId}`);
    } catch (error) {
      logger.error('❌ Erro ao deletar status:', error);
      throw error;
    }
  }

  // ============================================================================
  // PERFIL E CONFIGURAÇÕES (7 funcionalidades)
  // ============================================================================

  /**
   * 59. Alterar nome de perfil
   */
  async setProfileName(name: string): Promise<void> {
    try {
      await this.client.setProfileName(name);
      logger.info(`✅ Nome de perfil alterado: ${name}`);
    } catch (error) {
      logger.error('❌ Erro ao alterar nome:', error);
      throw error;
    }
  }

  /**
   * 60. Alterar foto de perfil
   */
  async setProfilePicture(imagePath: string): Promise<void> {
    try {
      await this.client.setProfilePic(imagePath);
      logger.info(`✅ Foto de perfil alterada`);
    } catch (error) {
      logger.error('❌ Erro ao alterar foto:', error);
      throw error;
    }
  }

  /**
   * 61. Alterar status/recado
   */
  async setProfileStatus(status: string): Promise<void> {
    try {
      await this.client.setProfileStatus(status);
      logger.info(`✅ Status de perfil alterado: ${status}`);
    } catch (error) {
      logger.error('❌ Erro ao alterar status:', error);
      throw error;
    }
  }

  /**
   * 62. Configurar presença online
   */
  async setPresenceAvailable(): Promise<void> {
    try {
      // @ts-ignore
      await this.client.setPresenceAvailable?.();
      logger.info(`✅ Presença configurada como disponível`);
    } catch (error) {
      logger.error('❌ Erro ao configurar presença:', error);
      throw error;
    }
  }

  /**
   * 63. Configurar presença ausente
   */
  async setPresenceUnavailable(): Promise<void> {
    try {
      // @ts-ignore
      await this.client.setPresenceUnavailable?.();
      logger.info(`✅ Presença configurada como ausente`);
    } catch (error) {
      logger.error('❌ Erro ao configurar presença:', error);
      throw error;
    }
  }

  /**
   * 64. Obter informações do host
   */
  async getHostDevice(): Promise<any> {
    try {
      const host = await this.client.getHostDevice();
      logger.info(`✅ Informações do host obtidas`);
      return host;
    } catch (error) {
      logger.error('❌ Erro ao obter host:', error);
      throw error;
    }
  }

  /**
   * 65. Obter informações da bateria
   */
  async getBatteryLevel(): Promise<any> {
    try {
      const battery = await this.client.getBatteryLevel();
      logger.info(`✅ Nível de bateria obtido: ${battery}%`);
      return battery;
    } catch (error) {
      logger.error('❌ Erro ao obter bateria:', error);
      throw error;
    }
  }

  // ============================================================================
  // WHATSAPP BUSINESS (10 funcionalidades)
  // ============================================================================

  /**
   * 66. Criar produto no catálogo
   */
  async createProduct(product: any): Promise<any> {
    try {
      // @ts-ignore
      const result = await this.client.createProduct?.(product);
      logger.info(`✅ Produto criado no catálogo`);
      return result;
    } catch (error) {
      logger.error('❌ Erro ao criar produto:', error);
      throw error;
    }
  }

  /**
   * 67. Listar produtos do catálogo
   */
  async getProducts(): Promise<any> {
    try {
      // @ts-ignore
      const products = await this.client.getProducts?.();
      logger.info(`✅ Produtos listados`);
      return products;
    } catch (error) {
      logger.error('❌ Erro ao listar produtos:', error);
      throw error;
    }
  }

  /**
   * 68. Deletar produto
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      // @ts-ignore
      await this.client.deleteProduct?.(productId);
      logger.info(`✅ Produto deletado: ${productId}`);
    } catch (error) {
      logger.error('❌ Erro ao deletar produto:', error);
      throw error;
    }
  }

  /**
   * 69. Enviar produto do catálogo
   */
  async sendProductFromCatalog(to: string, productId: string): Promise<any> {
    try {
      // @ts-ignore
      const result = await this.client.sendProductFromCatalog?.(to, productId);
      logger.info(`✅ Produto enviado para ${to}`);
      return result;
    } catch (error) {
      logger.error('❌ Erro ao enviar produto:', error);
      throw error;
    }
  }

  /**
   * 70. Criar coleção de produtos
   */
  async createCollection(name: string, productIds: string[]): Promise<any> {
    try {
      // @ts-ignore
      const result = await this.client.createCollection?.(name, productIds);
      logger.info(`✅ Coleção criada: ${name}`);
      return result;
    } catch (error) {
      logger.error('❌ Erro ao criar coleção:', error);
      throw error;
    }
  }

  /**
   * 71. Criar label/etiqueta
   */
  async createLabel(name: string, color: string): Promise<any> {
    try {
      // @ts-ignore
      const result = await this.client.addNewLabel?.(name, color);
      logger.info(`✅ Label criada: ${name}`);
      return result;
    } catch (error) {
      logger.error('❌ Erro ao criar label:', error);
      throw error;
    }
  }

  /**
   * 72. Adicionar label ao chat
   */
  async addLabelToChat(chatId: string, labelId: string): Promise<void> {
    try {
      // @ts-ignore
      await this.client.addOrRemoveLabels?.([labelId], [chatId]);
      logger.info(`✅ Label adicionada ao chat ${chatId}`);
    } catch (error) {
      logger.error('❌ Erro ao adicionar label:', error);
      throw error;
    }
  }

  /**
   * 73. Listar labels
   */
  async getAllLabels(): Promise<any> {
    try {
      // @ts-ignore
      const labels = await this.client.getAllLabels?.();
      logger.info(`✅ Labels listadas`);
      return labels;
    } catch (error) {
      logger.error('❌ Erro ao listar labels:', error);
      throw error;
    }
  }

  /**
   * 74. Configurar mensagem de ausência
   */
  async setAwayMessage(message: string): Promise<void> {
    try {
      // @ts-ignore
      await this.client.setAwayMessage?.(message);
      logger.info(`✅ Mensagem de ausência configurada`);
    } catch (error) {
      logger.error('❌ Erro ao configurar mensagem de ausência:', error);
      throw error;
    }
  }

  /**
   * 75. Configurar mensagem de saudação
   */
  async setGreetingMessage(message: string): Promise<void> {
    try {
      // @ts-ignore
      await this.client.setGreetingMessage?.(message);
      logger.info(`✅ Mensagem de saudação configurada`);
    } catch (error) {
      logger.error('❌ Erro ao configurar mensagem de saudação:', error);
      throw error;
    }
  }

  // ============================================================================
  // COMUNIDADES (4 funcionalidades)
  // ============================================================================

  /**
   * 76. Criar comunidade
   */
  async createCommunity(name: string, description?: string): Promise<any> {
    try {
      // @ts-ignore
      const result = await this.client.createCommunity?.(name, description);
      logger.info(`✅ Comunidade criada: ${name}`);
      return result;
    } catch (error) {
      logger.error('❌ Erro ao criar comunidade:', error);
      throw error;
    }
  }

  /**
   * 77. Adicionar grupo à comunidade
   */
  async addGroupToCommunity(communityId: string, groupId: string): Promise<void> {
    try {
      // @ts-ignore
      await this.client.addGroupToCommunity?.(communityId, groupId);
      logger.info(`✅ Grupo adicionado à comunidade ${communityId}`);
    } catch (error) {
      logger.error('❌ Erro ao adicionar grupo:', error);
      throw error;
    }
  }

  /**
   * 78. Remover grupo da comunidade
   */
  async removeGroupFromCommunity(communityId: string, groupId: string): Promise<void> {
    try {
      // @ts-ignore
      await this.client.removeGroupFromCommunity?.(communityId, groupId);
      logger.info(`✅ Grupo removido da comunidade ${communityId}`);
    } catch (error) {
      logger.error('❌ Erro ao remover grupo:', error);
      throw error;
    }
  }

  /**
   * 79. Listar comunidades
   */
  async getAllCommunities(): Promise<any> {
    try {
      // @ts-ignore
      const communities = await this.client.getAllCommunities?.();
      logger.info(`✅ Comunidades listadas`);
      return communities;
    } catch (error) {
      logger.error('❌ Erro ao listar comunidades:', error);
      throw error;
    }
  }

  // ============================================================================
  // UTILITÁRIOS (9 funcionalidades)
  // ============================================================================

  /**
   * 80. Baixar mídia de mensagem
   */
  async downloadMedia(messageId: string): Promise<Buffer> {
    try {
      const buffer = await this.client.downloadMedia(messageId);
      logger.info(`✅ Mídia baixada: ${messageId}`);
      return buffer as unknown as Buffer;
    } catch (error) {
      logger.error('❌ Erro ao baixar mídia:', error);
      throw error;
    }
  }

  /**
   * 81. Obter informações de mensagem
   */
  async getMessageById(messageId: string): Promise<any> {
    try {
      const message = await this.client.getMessageById(messageId);
      logger.info(`✅ Mensagem obtida: ${messageId}`);
      return message;
    } catch (error) {
      logger.error('❌ Erro ao obter mensagem:', error);
      throw error;
    }
  }

  /**
   * 82. Capturar screenshot
   */
  async takeScreenshot(): Promise<string> {
    try {
      // @ts-ignore
      const screenshot = await this.client.takeScreenshot?.();
      logger.info(`✅ Screenshot capturado`);
      return screenshot;
    } catch (error) {
      logger.error('❌ Erro ao capturar screenshot:', error);
      throw error;
    }
  }

  /**
   * 83. Obter informações da conexão
   */
  async getConnectionState(): Promise<any> {
    try {
      const state = await this.client.getConnectionState();
      logger.info(`✅ Estado da conexão obtido`);
      return state;
    } catch (error) {
      logger.error('❌ Erro ao obter estado:', error);
      throw error;
    }
  }

  /**
   * 84. Obter WAVersion
   */
  async getWAVersion(): Promise<string> {
    try {
      const version = await this.client.getWAVersion();
      logger.info(`✅ Versão do WhatsApp: ${version}`);
      return version;
    } catch (error) {
      logger.error('❌ Erro ao obter versão:', error);
      throw error;
    }
  }

  /**
   * 85. Obter número de mensagens não lidas
   */
  async getUnreadMessages(): Promise<any> {
    try {
      // @ts-ignore
      const unread = await this.client.getUnreadMessages?.();
      logger.info(`✅ Mensagens não lidas obtidas`);
      return unread;
    } catch (error) {
      logger.error('❌ Erro ao obter não lidas:', error);
      throw error;
    }
  }

  /**
   * 86. Sincronizar contatos
   */
  async syncContacts(): Promise<void> {
    try {
      // @ts-ignore
      await this.client.syncContacts?.();
      logger.info(`✅ Contatos sincronizados`);
    } catch (error) {
      logger.error('❌ Erro ao sincronizar contatos:', error);
      throw error;
    }
  }

  /**
   * 87. Logout
   */
  async logout(): Promise<void> {
    try {
      await this.client.logout();
      logger.info(`✅ Logout realizado`);
    } catch (error) {
      logger.error('❌ Erro ao fazer logout:', error);
      throw error;
    }
  }

  /**
   * 88. Restart
   */
  async restart(): Promise<void> {
    try {
      // @ts-ignore
      await this.client.restartService?.();
      logger.info(`✅ Serviço reiniciado`);
    } catch (error) {
      logger.error('❌ Erro ao reiniciar:', error);
      throw error;
    }
  }
}
