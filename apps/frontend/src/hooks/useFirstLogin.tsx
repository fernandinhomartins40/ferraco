import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { securityLogger, SecurityEventType, SecurityLevel } from '@/utils/securityLogger';
import { logger } from '@/lib/logger';

interface FirstLoginStatus {
  isFirstLogin: boolean;
  isCheckingFirstLogin: boolean;
  markFirstLoginComplete: () => void;
}

/**
 * Hook para detectar e gerenciar o primeiro login de usuários
 * Força os usuários a alterar senha padrão e completar perfil no primeiro acesso
 */
export const useFirstLogin = (): FirstLoginStatus => {
  const { user, isAuthenticated } = useAuth();
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isCheckingFirstLogin, setIsCheckingFirstLogin] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsCheckingFirstLogin(false);
      setIsFirstLogin(false);
      return;
    }

    checkFirstLoginStatus();
  }, [isAuthenticated, user]);

  const checkFirstLoginStatus = async () => {
    if (!user) return;

    setIsCheckingFirstLogin(true);

    try {
      // Verificar se o usuário já completou o primeiro login
      const firstLoginKey = `firstLogin_${user.id}`;
      const hasCompletedFirstLogin = localStorage.getItem(firstLoginKey);

      if (hasCompletedFirstLogin === 'completed') {
        setIsFirstLogin(false);
        return;
      }

      // Detectar primeiro login baseado em diferentes critérios
      const isFirstLoginDetected = await detectFirstLogin(user);

      if (isFirstLoginDetected) {
        setIsFirstLogin(true);

        // Log da detecção do primeiro login
        securityLogger.logEvent(
          SecurityEventType.USER_ACTION,
          SecurityLevel.HIGH,
          'Primeiro login detectado para usuário',
          {
            userId: user.id,
            username: user.username,
            role: user.role,
            detectionMethod: 'localStorage_check',
            timestamp: new Date().toISOString()
          },
          user.id,
          user.username,
          user.role
        );
      } else {
        setIsFirstLogin(false);
      }
    } catch (error) {
      logger.error('Erro ao verificar primeiro login:', error);

      securityLogger.logEvent(
        SecurityEventType.ERROR_OCCURRED,
        SecurityLevel.MEDIUM,
        'Erro na detecção de primeiro login',
        {
          userId: user?.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        user?.id,
        user?.username
      );

      // Em caso de erro, assumir que não é primeiro login para não bloquear o usuário
      setIsFirstLogin(false);
    } finally {
      setIsCheckingFirstLogin(false);
    }
  };

  const detectFirstLogin = async (user: any): Promise<boolean> => {
    // Critério 1: Verificar se há registro de conclusão no localStorage
    const firstLoginKey = `firstLogin_${user.id}`;
    const hasCompletedFirstLogin = localStorage.getItem(firstLoginKey);

    if (hasCompletedFirstLogin === 'completed') {
      return false;
    }

    // Critério 2: Verificar se está usando senha padrão (mock)
    // Em produção, isso seria verificado no backend
    const defaultPasswords = ['Admin123!', 'Vend123!', 'Cons123!'];
    const userHasDefaultPassword = true; // Mock - assumir que sempre tem senha padrão na primeira vez

    // Critério 3: Verificar se o perfil está incompleto
    const hasIncompleteProfile = !user.email || user.email.includes('@ferraco.com') ||
                               user.name === 'Administrador' || user.name === 'Vendedor' || user.name === 'Consultor';

    // É primeiro login se não há registro de conclusão E (tem senha padrão OU perfil incompleto)
    return userHasDefaultPassword || hasIncompleteProfile;
  };

  const markFirstLoginComplete = () => {
    if (!user) return;

    const firstLoginKey = `firstLogin_${user.id}`;
    localStorage.setItem(firstLoginKey, 'completed');
    setIsFirstLogin(false);

    // Log da conclusão do primeiro login
    securityLogger.logEvent(
      SecurityEventType.USER_ACTION,
      SecurityLevel.MEDIUM,
      'Primeiro login marcado como concluído',
      {
        userId: user.id,
        username: user.username,
        timestamp: new Date().toISOString()
      },
      user.id,
      user.username,
      user.role
    );

    logger.debug('✅ Primeiro login marcado como concluído para usuário:', user.username);
  };

  return {
    isFirstLogin,
    isCheckingFirstLogin,
    markFirstLoginComplete
  };
};

/**
 * Hook para forçar o primeiro login em componentes específicos
 */
export const useEnforceFirstLogin = () => {
  const { isFirstLogin, isCheckingFirstLogin } = useFirstLogin();
  const { user } = useAuth();

  useEffect(() => {
    if (isFirstLogin && user) {
      // Log que o componente está forçando o primeiro login
      securityLogger.logEvent(
        SecurityEventType.USER_ACTION,
        SecurityLevel.MEDIUM,
        'Redirecionamento forçado para setup de primeiro login',
        {
          userId: user.id,
          component: 'useEnforceFirstLogin',
          timestamp: new Date().toISOString()
        },
        user.id,
        user.username,
        user.role
      );
    }
  }, [isFirstLogin, user]);

  return {
    shouldRedirectToSetup: isFirstLogin,
    isCheckingFirstLogin
  };
};

/**
 * Utilitário para resetar o status de primeiro login (para desenvolvimento/testes)
 */
export const resetFirstLoginStatus = (userId: string) => {
  const firstLoginKey = `firstLogin_${userId}`;
  localStorage.removeItem(firstLoginKey);

  securityLogger.logEvent(
    SecurityEventType.USER_ACTION,
    SecurityLevel.LOW,
    'Status de primeiro login resetado (desenvolvimento)',
    { userId, resetTime: new Date().toISOString() }
  );

  logger.debug('🔄 Status de primeiro login resetado para usuário:', userId);
};

export default useFirstLogin;