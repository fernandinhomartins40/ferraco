import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Loader2, Eye, EyeOff, User, Lock, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { securityLogger, SecurityEventType, SecurityLevel } from '@/utils/securityLogger';
import logoFerraco from '@/assets/logo-ferraco.webp';

interface PasswordStrength {
  score: number;
  strength: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

interface SetupFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  name: string;
  email: string;
}

const FirstLoginSetup = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<SetupFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    name: user?.name || '',
    email: user?.email || ''
  });
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    strength: 'muito fraca',
    checks: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  });

  useEffect(() => {
    // Log que o primeiro login foi detectado
    securityLogger.logEvent(
      SecurityEventType.USER_ACTION,
      SecurityLevel.HIGH,
      'Primeiro login detectado - Setup obrigatório iniciado',
      {
        userId: user?.id,
        username: user?.username,
        timestamp: new Date().toISOString()
      },
      user?.id,
      user?.username,
      user?.role
    );
  }, [user]);

  const calculatePasswordStrength = (pwd: string): PasswordStrength => {
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    };

    const score = Object.values(checks).filter(Boolean).length;
    const strength = score <= 2 ? 'muito fraca' : score <= 3 ? 'fraca' : score <= 4 ? 'média' : 'forte';

    return { score, strength, checks };
  };

  useEffect(() => {
    if (formData.newPassword) {
      setPasswordStrength(calculatePasswordStrength(formData.newPassword));
    }
  }, [formData.newPassword]);

  const handleInputChange = (field: keyof SetupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep1 = (): boolean => {
    if (!formData.currentPassword.trim()) {
      setError('Senha atual é obrigatória');
      return false;
    }

    if (!formData.newPassword.trim()) {
      setError('Nova senha é obrigatória');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }

    if (passwordStrength.score < 3) {
      setError('A nova senha deve ser mais forte. Verifique os requisitos.');
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('A nova senha deve ser diferente da senha atual');
      return false;
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email deve ter um formato válido');
      return false;
    }

    return true;
  };

  const handleStep1Submit = async () => {
    if (!validateStep1()) return;

    setIsLoading(true);
    setError('');

    try {
      // Simular verificação da senha atual e alteração
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock: verificar se a senha atual é uma das senhas demo
      const demoPasswords = ['Admin123!', 'Vend123!', 'Cons123!'];
      if (!demoPasswords.includes(formData.currentPassword)) {
        throw new Error('Senha atual incorreta');
      }

      // Log da alteração de senha no primeiro login
      securityLogger.logEvent(
        SecurityEventType.USER_ACTION,
        SecurityLevel.HIGH,
        'Senha alterada no primeiro login',
        {
          userId: user?.id,
          username: user?.username,
          passwordStrength: passwordStrength.strength,
          timestamp: new Date().toISOString()
        },
        user?.id,
        user?.username,
        user?.role
      );

      setStep(2);
      toast({
        title: 'Senha alterada',
        description: 'Sua senha foi alterada com sucesso. Agora complete seu perfil.',
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao alterar senha';
      setError(errorMessage);

      securityLogger.logEvent(
        SecurityEventType.ERROR_OCCURRED,
        SecurityLevel.HIGH,
        `Falha na alteração de senha no primeiro login: ${errorMessage}`,
        { userId: user?.id, error: err.message },
        user?.id,
        user?.username
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    if (!validateStep2()) return;

    setIsLoading(true);
    setError('');

    try {
      // Simular atualização do perfil
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log da conclusão do setup
      securityLogger.logEvent(
        SecurityEventType.USER_ACTION,
        SecurityLevel.MEDIUM,
        'Setup de primeiro login concluído',
        {
          userId: user?.id,
          username: user?.username,
          updatedName: formData.name,
          updatedEmail: formData.email,
          timestamp: new Date().toISOString()
        },
        user?.id,
        user?.username,
        user?.role
      );

      // Marcar que o usuário completou o primeiro login
      localStorage.setItem(`firstLogin_${user?.id}`, 'completed');

      toast({
        title: 'Configuração concluída',
        description: 'Sua conta foi configurada com sucesso. Bem-vindo ao FerrAço CRM!',
      });

      // Redirecionar para o dashboard
      navigate('/admin', { replace: true });
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar perfil';
      setError(errorMessage);

      securityLogger.logEvent(
        SecurityEventType.ERROR_OCCURRED,
        SecurityLevel.MEDIUM,
        `Falha na atualização do perfil no primeiro login: ${errorMessage}`,
        { userId: user?.id, error: err.message },
        user?.id,
        user?.username
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipToLogout = () => {
    securityLogger.logEvent(
      SecurityEventType.USER_ACTION,
      SecurityLevel.MEDIUM,
      'Setup de primeiro login cancelado - Logout executado',
      { userId: user?.id, step },
      user?.id,
      user?.username,
      user?.role
    );

    toast({
      title: 'Setup cancelado',
      description: 'Você precisa completar a configuração inicial para usar o sistema.',
      variant: 'destructive'
    });

    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo and Header */}
        <div className="flex flex-col items-center space-y-4">
          <img
            src={logoFerraco}
            alt="FerrAço CRM"
            className="h-16 w-auto object-contain"
          />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">
              Primeiro Acesso
            </h1>
            <p className="text-muted-foreground">
              Configure sua conta para continuar
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm text-muted-foreground">
                Etapa {step} de 2
              </span>
            </div>
            <Progress value={(step / 2) * 100} className="mb-3" />
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-green-600' : 'text-muted-foreground'}`}>
                {step > 1 ? <CheckCircle className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span>Alterar Senha</span>
              </div>
              <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-green-600' : 'text-muted-foreground'}`}>
                {step > 2 ? <CheckCircle className="w-3 h-3" /> : <User className="w-3 h-3" />}
                <span>Perfil</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Setup Card */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center space-x-2">
              {step === 1 ? (
                <>
                  <Lock className="h-5 w-5 text-primary" />
                  <span>Alterar Senha Padrão</span>
                </>
              ) : (
                <>
                  <User className="h-5 w-5 text-primary" />
                  <span>Completar Perfil</span>
                </>
              )}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? 'Por segurança, você deve alterar sua senha padrão'
                : 'Finalize a configuração do seu perfil'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Password Change */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Digite sua senha atual"
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      disabled={isLoading}
                      className="pr-10"
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      disabled={isLoading}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Digite sua nova senha"
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      disabled={isLoading}
                      className="pr-10"
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={isLoading}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Password Strength */}
                  {formData.newPassword && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Força da senha:</span>
                        <span className={
                          passwordStrength.score <= 2 ? 'text-red-600' :
                          passwordStrength.score <= 3 ? 'text-yellow-600' :
                          'text-green-600'
                        }>
                          {passwordStrength.strength}
                        </span>
                      </div>
                      <Progress value={(passwordStrength.score / 5) * 100} className="h-2" />
                      <div className="text-xs space-y-1 text-muted-foreground">
                        {Object.entries({
                          length: 'Pelo menos 8 caracteres',
                          uppercase: 'Uma letra maiúscula',
                          lowercase: 'Uma letra minúscula',
                          number: 'Um número',
                          special: 'Um caractere especial'
                        }).map(([key, label]) => (
                          <div key={key} className={`flex items-center space-x-1 ${
                            passwordStrength.checks[key as keyof typeof passwordStrength.checks]
                              ? 'text-green-600'
                              : ''
                          }`}>
                            <span>
                              {passwordStrength.checks[key as keyof typeof passwordStrength.checks] ? '✓' : '○'}
                            </span>
                            <span>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme sua nova senha"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      disabled={isLoading}
                      className="pr-10"
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Password Match Indicator */}
                  {formData.confirmPassword && (
                    <div className={`text-xs ${
                      formData.newPassword === formData.confirmPassword
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {formData.newPassword === formData.confirmPassword
                        ? '✓ Senhas coincidem'
                        : '○ Senhas não coincidem'}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleStep1Submit}
                  className="w-full"
                  disabled={isLoading || passwordStrength.score < 3 || formData.newPassword !== formData.confirmPassword}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Alterando senha...
                    </>
                  ) : (
                    'Alterar Senha e Continuar'
                  )}
                </Button>
              </div>
            )}

            {/* Step 2: Profile Setup */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Informações da Conta</Label>
                  <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Usuário:</span>
                      <span className="font-medium">{user?.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Função:</span>
                      <span className="font-medium">
                        {user?.role === 'admin' ? 'Administrador' :
                         user?.role === 'sales' ? 'Vendedor' :
                         user?.role === 'consultant' ? 'Consultor' : user?.role}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleStep2Submit}
                  className="w-full"
                  disabled={isLoading || !formData.name.trim() || !formData.email.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    'Finalizar Configuração'
                  )}
                </Button>
              </div>
            )}

            {/* Cancel/Logout Option */}
            <div className="pt-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={handleSkipToLogout}
                className="w-full text-muted-foreground"
                disabled={isLoading}
              >
                Cancelar e Sair
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Configuração Obrigatória
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  Por questões de segurança, todos os usuários devem alterar a senha padrão e
                  completar seu perfil no primeiro acesso ao sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FirstLoginSetup;