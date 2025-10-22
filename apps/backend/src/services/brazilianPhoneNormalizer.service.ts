/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Brazilian Phone Number Normalizer Service
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🇧🇷 CONTEXTO HISTÓRICO:
 * ----------------------
 * Em dezembro de 2010, a ANATEL (Agência Nacional de Telecomunicações)
 * anunciou a inclusão do nono dígito em números de telefonia móvel no Brasil.
 *
 * O dígito '9' foi gradualmente adicionado à esquerda de todos os números
 * móveis existentes em diferentes regiões do Brasil, independentemente de seus
 * dígitos iniciais anteriores.
 *
 * Exemplo: +55 (11) 8765-4321 → +55 (11) 98765-4321
 *
 * 📱 FORMATO ATUAL:
 * ----------------
 * Celular: +55 (DDD) 9XXXX-XXXX (13 dígitos total: 55 + 2 + 9)
 * Fixo:    +55 (DDD) XXXX-XXXX  (12 dígitos total: 55 + 2 + 8)
 *
 * ⚠️  PROBLEMA DO WHATSAPP:
 * ------------------------
 * Números registrados no WhatsApp ANTES da adição do nono dígito (pré-2012)
 * ainda usam o formato ANTIGO de 8 dígitos, mesmo que o número real agora
 * tenha 9 dígitos.
 *
 * Isso é especialmente verdadeiro para números FORA das áreas:
 * - São Paulo (DDDs 11-19)
 * - Rio de Janeiro (DDDs 21, 22, 24)
 * - Espírito Santo (DDDs 27, 28)
 *
 * ✅ SOLUÇÃO IMPLEMENTADA:
 * -----------------------
 * Este serviço verifica AMBOS os formatos (com e sem o nono dígito) usando
 * o método `checkNumberStatus()` do WPPConnect e utiliza o formato que o
 * WhatsApp reconhece.
 *
 * 🎯 ALGORITMO:
 * 1. Detecta se é número móvel brasileiro (13 dígitos começando com 55)
 * 2. Gera duas versões: com 9 dígitos (5511987654321) e sem 9 dígitos (551187654321)
 * 3. Verifica qual versão está registrada no WhatsApp
 * 4. Cache o resultado para evitar verificações repetidas
 * 5. Retorna o formato correto
 *
 * 📚 REFERÊNCIAS:
 * - https://www.gov.br/anatel/pt-br/regulado/numeracao/nono-digito
 * - https://github.com/pedroslopez/whatsapp-web.js/issues/1157
 * - https://github.com/pedroslopez/whatsapp-web.js/issues/1967
 * - https://www.zoko.io/learning-article/whatsapp-id-brazil-mexico
 */

import { logger } from '../utils/logger';

interface NormalizedNumber {
  original: string;
  normalized: string;
  hasNinthDigit: boolean;
  wasModified: boolean;
  ddd: string | null;
  reason: string;
}

interface CacheEntry {
  normalized: string;
  hasNinthDigit: boolean;
  timestamp: number;
}

export class BrazilianPhoneNormalizerService {
  // Cache de números já normalizados (válido por 24 horas)
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

  // DDDs brasileiros válidos (todos os estados)
  private readonly VALID_DDDS = new Set([
    // Região Sul
    '41', '42', '43', '44', '45', '46', // Paraná
    '47', '48', '49', // Santa Catarina
    '51', '53', '54', '55', // Rio Grande do Sul

    // Região Sudeste
    '11', '12', '13', '14', '15', '16', '17', '18', '19', // São Paulo
    '21', '22', '24', // Rio de Janeiro
    '27', '28', // Espírito Santo
    '31', '32', '33', '34', '35', '37', '38', // Minas Gerais

    // Região Centro-Oeste
    '61', // Distrito Federal e Goiás
    '62', // Goiás
    '64', // Goiás
    '65', '66', // Mato Grosso
    '67', // Mato Grosso do Sul

    // Região Nordeste
    '71', '73', '74', '75', '77', // Bahia
    '79', // Sergipe
    '81', '87', // Pernambuco
    '82', // Alagoas
    '83', // Paraíba
    '84', // Rio Grande do Norte
    '85', '88', // Ceará
    '86', '89', // Piauí
    '98', '99', // Maranhão

    // Região Norte
    '63', // Tocantins
    '68', // Acre
    '69', // Rondônia
    '91', '93', '94', // Pará
    '92', '97', // Amazonas
    '95', // Roraima
    '96', // Amapá
  ]);

  /**
   * Remove nono dígito de um número móvel brasileiro se presente
   */
  private removeNinthDigit(cleaned: string): string {
    // Formato: 55 + DDD(2) + 9 + NÚMERO(8) = 13 dígitos
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      const ddd = cleaned.substring(2, 4);
      const thirdDigit = cleaned.charAt(4);

      // Verificar se DDD é válido e terceiro dígito é '9' (nono dígito)
      if (this.VALID_DDDS.has(ddd) && thirdDigit === '9') {
        // Remover o '9': 55 + DDD + NÚMERO(8)
        return cleaned.substring(0, 4) + cleaned.substring(5);
      }
    }

    return cleaned;
  }

  /**
   * Adiciona nono dígito a um número móvel brasileiro se ausente
   */
  private addNinthDigit(cleaned: string): string {
    // Formato: 55 + DDD(2) + NÚMERO(8) = 12 dígitos
    if (cleaned.length === 12 && cleaned.startsWith('55')) {
      const ddd = cleaned.substring(2, 4);
      const firstDigit = cleaned.charAt(4);

      // Verificar se DDD é válido
      if (this.VALID_DDDS.has(ddd)) {
        // Números móveis geralmente começam com 6, 7, 8 ou 9
        // Se não tem o nono dígito, adicionar '9'
        if (['6', '7', '8', '9'].includes(firstDigit)) {
          return cleaned.substring(0, 4) + '9' + cleaned.substring(4);
        }
      }
    }

    return cleaned;
  }

  /**
   * Extrai DDD de um número brasileiro
   */
  private extractDDD(cleaned: string): string | null {
    if (cleaned.startsWith('55') && cleaned.length >= 4) {
      const ddd = cleaned.substring(2, 4);
      return this.VALID_DDDS.has(ddd) ? ddd : null;
    }
    return null;
  }

  /**
   * Determina se um número é celular ou fixo baseado no comprimento
   */
  private isMobileNumber(cleaned: string): boolean {
    // Móvel: 13 dígitos (com nono) ou 12 dígitos começando com 6-9
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return cleaned.charAt(4) === '9';
    }

    if (cleaned.length === 12 && cleaned.startsWith('55')) {
      const firstDigit = cleaned.charAt(4);
      return ['6', '7', '8', '9'].includes(firstDigit);
    }

    return false;
  }

  /**
   * Gera ambas as versões do número (com e sem nono dígito)
   */
  generateBothFormats(phoneNumber: string): { with9: string; without9: string } {
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Adicionar código do país se ausente
    if (!cleaned.startsWith('55')) {
      if (cleaned.length === 10 || cleaned.length === 11) {
        cleaned = '55' + cleaned;
      }
    }

    // Gerar versão sem nono dígito
    const without9 = this.removeNinthDigit(cleaned);

    // Gerar versão com nono dígito
    const with9 = this.addNinthDigit(without9);

    return {
      with9: `${with9}@c.us`,
      without9: `${without9}@c.us`,
    };
  }

  /**
   * Normaliza um número de telefone brasileiro
   *
   * IMPORTANTE: Este método apenas PREPARA o número, mas NÃO verifica no WhatsApp.
   * Use `normalizeAndVerify()` com checkFunction para verificação real.
   */
  normalize(phoneNumber: string): NormalizedNumber {
    logger.debug(`🇧🇷 Normalizando número brasileiro: ${phoneNumber}`);

    // Verificar cache primeiro
    const cached = this.cache.get(phoneNumber);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      logger.debug(`✅ Cache hit para ${phoneNumber}`);
      return {
        original: phoneNumber,
        normalized: cached.normalized,
        hasNinthDigit: cached.hasNinthDigit,
        wasModified: phoneNumber !== cached.normalized,
        ddd: this.extractDDD(cached.normalized.replace('@c.us', '')),
        reason: 'from_cache',
      };
    }

    // Limpar número (remover caracteres não numéricos)
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Validar comprimento
    if (cleaned.length < 10) {
      throw new Error(`Número muito curto: ${phoneNumber}. Mínimo 10 dígitos.`);
    }

    if (cleaned.length > 15) {
      throw new Error(`Número muito longo: ${phoneNumber}. Máximo 15 dígitos.`);
    }

    // Adicionar código do país se ausente
    if (!cleaned.startsWith('55')) {
      if (cleaned.length === 10 || cleaned.length === 11) {
        cleaned = '55' + cleaned;
      }
    }

    // Detectar se é número móvel brasileiro
    const isMobile = this.isMobileNumber(cleaned);
    const ddd = this.extractDDD(cleaned);

    let normalized: string;
    let hasNinthDigit: boolean;
    let reason: string;

    if (isMobile && cleaned.length === 13) {
      // Número móvel COM nono dígito - MANTER como está por padrão
      normalized = cleaned;
      hasNinthDigit = true;
      reason = 'mobile_with_ninth_digit';

      logger.debug(`📱 Número móvel com 9 dígitos detectado (DDD ${ddd}): ${normalized}`);
    } else if (isMobile && cleaned.length === 12) {
      // Número móvel SEM nono dígito - ADICIONAR por padrão
      normalized = this.addNinthDigit(cleaned);
      hasNinthDigit = true;
      reason = 'mobile_ninth_digit_added';

      logger.debug(`📱 Número móvel sem 9º dígito - adicionado (DDD ${ddd}): ${cleaned} → ${normalized}`);
    } else {
      // Número fixo ou internacional - manter como está
      normalized = cleaned;
      hasNinthDigit = false;
      reason = cleaned.startsWith('55') ? 'landline' : 'international';

      logger.debug(`📞 Número ${reason} detectado: ${normalized}`);
    }

    // Formatar para WhatsApp
    const formatted = `${normalized}@c.us`;

    // Adicionar ao cache
    this.cache.set(phoneNumber, {
      normalized: formatted,
      hasNinthDigit,
      timestamp: Date.now(),
    });

    return {
      original: phoneNumber,
      normalized: formatted,
      hasNinthDigit,
      wasModified: phoneNumber !== formatted,
      ddd,
      reason,
    };
  }

  /**
   * Normaliza e verifica qual formato está registrado no WhatsApp
   *
   * @param phoneNumber Número a ser normalizado
   * @param checkFunction Função que verifica se o número existe no WhatsApp (retorna boolean)
   * @returns Número normalizado no formato correto para WhatsApp
   */
  async normalizeAndVerify(
    phoneNumber: string,
    checkFunction: (formatted: string) => Promise<boolean>
  ): Promise<NormalizedNumber> {
    logger.info(`🔍 Normalizando e verificando número: ${phoneNumber}`);

    // Normalização básica
    const basic = this.normalize(phoneNumber);

    // Se não for número móvel brasileiro, retornar normalização básica
    if (!basic.hasNinthDigit && !basic.reason.includes('mobile')) {
      logger.debug(`📞 Número não-móvel, usando formato padrão: ${basic.normalized}`);
      return basic;
    }

    // Gerar ambas as versões
    const { with9, without9 } = this.generateBothFormats(phoneNumber);

    logger.debug(`🔄 Testando versões:
      - Com 9º dígito:  ${with9}
      - Sem 9º dígito:  ${without9}`);

    try {
      // Verificar versão COM nono dígito primeiro (formato moderno)
      logger.debug(`🔍 Verificando versão com 9º dígito: ${with9}`);
      const existsWith9 = await checkFunction(with9);

      if (existsWith9) {
        logger.info(`✅ Número encontrado COM 9º dígito: ${with9}`);

        // Atualizar cache
        this.cache.set(phoneNumber, {
          normalized: with9,
          hasNinthDigit: true,
          timestamp: Date.now(),
        });

        return {
          original: phoneNumber,
          normalized: with9,
          hasNinthDigit: true,
          wasModified: true,
          ddd: basic.ddd,
          reason: 'verified_with_ninth_digit',
        };
      }

      // Se não encontrou com 9, tentar SEM o nono dígito (formato antigo)
      logger.debug(`🔍 Verificando versão sem 9º dígito: ${without9}`);
      const existsWithout9 = await checkFunction(without9);

      if (existsWithout9) {
        logger.info(`✅ Número encontrado SEM 9º dígito (registro antigo): ${without9}`);

        // Atualizar cache
        this.cache.set(phoneNumber, {
          normalized: without9,
          hasNinthDigit: false,
          timestamp: Date.now(),
        });

        return {
          original: phoneNumber,
          normalized: without9,
          hasNinthDigit: false,
          wasModified: true,
          ddd: basic.ddd,
          reason: 'verified_without_ninth_digit',
        };
      }

      // Número não encontrado em nenhuma das versões
      logger.warn(`⚠️  Número não encontrado no WhatsApp em nenhum formato: ${phoneNumber}`);

      // Retornar formato moderno como fallback
      return {
        original: phoneNumber,
        normalized: with9,
        hasNinthDigit: true,
        wasModified: true,
        ddd: basic.ddd,
        reason: 'not_found_using_modern_format',
      };
    } catch (error) {
      logger.error(`❌ Erro ao verificar número ${phoneNumber}:`, error);

      // Em caso de erro, retornar normalização básica
      return basic;
    }
  }

  /**
   * Limpa cache de números antigos
   */
  cleanCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL_MS) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`🧹 Cache limpo: ${cleaned} entradas antigas removidas`);
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  getCacheStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());

    return {
      total: this.cache.size,
      withNinthDigit: entries.filter(e => e.hasNinthDigit).length,
      withoutNinthDigit: entries.filter(e => !e.hasNinthDigit).length,
      expired: entries.filter(e => now - e.timestamp > this.CACHE_TTL_MS).length,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null,
    };
  }
}

// Singleton instance
export const brazilianPhoneNormalizer = new BrazilianPhoneNormalizerService();
