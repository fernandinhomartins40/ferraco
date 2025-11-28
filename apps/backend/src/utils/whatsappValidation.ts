/**
 * WhatsApp Validation Utilities
 *
 * Funções para validar números de telefone e verificar se são válidos para WhatsApp
 */

import { logger } from './logger';

/**
 * Valida se um número de telefone é um WhatsApp válido
 *
 * @param phone - Número de telefone (pode conter formatação)
 * @returns true se o número é válido para WhatsApp
 */
export function isValidWhatsAppNumber(phone: string | null | undefined): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Remove caracteres não numéricos
  const clean = phone.replace(/\D/g, '');

  // Telefone deve ter 10-15 dígitos (formato internacional)
  if (clean.length < 10 || clean.length > 15) {
    logger.debug(`❌ Telefone inválido (${clean.length} dígitos): ${phone}`);
    return false;
  }

  // ✅ VALIDAÇÃO BRASILEIRA ESPECÍFICA
  // Se o número tem 12-13 dígitos e começa com 55 (Brasil)
  if (clean.length >= 12 && clean.startsWith('55')) {
    // Formato: 55 + DDD (2) + 9 + número (8)
    // Exemplo: 5511999998888
    const ddd = clean.substring(2, 4);
    const ninthDigit = clean[4];

    // DDDs válidos no Brasil (11-99)
    const dddNum = parseInt(ddd);
    if (dddNum < 11 || dddNum > 99) {
      logger.debug(`❌ DDD inválido (${ddd}): ${phone}`);
      return false;
    }

    // Celulares brasileiros devem ter 9 como 5º dígito (após DDD)
    // Telefones fixos não são WhatsApp
    if (ninthDigit !== '9') {
      logger.debug(`❌ Telefone fixo detectado (9º dígito não é 9): ${phone}`);
      return false;
    }
  }

  // ✅ Para números internacionais não-brasileiros, aceitar se estiver no range válido
  logger.debug(`✅ Telefone válido para WhatsApp: ${phone}`);
  return true;
}

/**
 * Normaliza número de telefone para formato internacional
 *
 * @param phone - Número de telefone
 * @returns Número normalizado (apenas dígitos)
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Formata número de telefone para exibição
 *
 * @param phone - Número de telefone
 * @returns Número formatado (ex: +55 11 99999-8888)
 */
export function formatPhoneNumber(phone: string): string {
  const clean = normalizePhoneNumber(phone);

  // Formato brasileiro: +55 11 99999-8888
  if (clean.length === 13 && clean.startsWith('55')) {
    const ddd = clean.substring(2, 4);
    const part1 = clean.substring(4, 9);
    const part2 = clean.substring(9, 13);
    return `+55 ${ddd} ${part1}-${part2}`;
  }

  // Formato brasileiro sem código do país: 11 99999-8888
  if (clean.length === 11) {
    const ddd = clean.substring(0, 2);
    const part1 = clean.substring(2, 7);
    const part2 = clean.substring(7, 11);
    return `${ddd} ${part1}-${part2}`;
  }

  // Outros formatos: retornar com + no início
  return `+${clean}`;
}

/**
 * Verifica se o lead tem WhatsApp opt-in válido
 *
 * @param lead - Objeto lead do Prisma
 * @returns true se o lead autorizou contato via WhatsApp
 */
export function hasWhatsAppOptIn(lead: {
  whatsappOptIn?: boolean;
  phone?: string | null;
}): boolean {
  return lead.whatsappOptIn === true && isValidWhatsAppNumber(lead.phone);
}
