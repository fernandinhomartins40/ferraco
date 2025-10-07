import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, Eye, EyeOff, Key, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
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

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
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
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');

    if (!tokenParam || !emailParam) {
      setError('Link de recuperação inválido. Solicite um novo link.');
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam);

    // Validar token (mock - em produção seria validado no backend)
    validateToken(tokenParam, emailParam);
  }, [searchParams]);

  const validateToken = async (token: string, email: string) => {
    try {
      // Simular validação de token
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock: token válido se tiver mais de 20 caracteres
      if (token.length > 20) {
        setIsValidToken(true);

        securityLogger.logEvent(
          SecurityEventType.USER_ACTION,
          SecurityLevel.MEDIUM,
          'Token de recuperação validado',
          { email, tokenLength: token.length },
        );
      } else {
        throw new Error('Token expirado ou inválido');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage || 'Token inválido');

      securityLogger.logEvent(
        SecurityEventType.ERROR_OCCURRED,
        SecurityLevel.HIGH,
        `Token de recuperação inválido: ${errorMessage}`,
        { email, token: token.substring(0, 10) + '...' }
      );
    }
  };

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
    if (password) {
      setPasswordStrength(calculatePasswordStrength(password));
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validações
    if (!password.trim()) {
      setError('Nova senha é obrigatória');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    if (passwordStrength.score < 3) {
      setError('A senha deve ser mais forte. Verifique os requisitos abaixo.');
      setIsLoading(false);
      return;
    }

    try {
      // Simular redefinição de senha no backend
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Log da redefinição bem-sucedida
      securityLogger.logEvent(
        SecurityEventType.USER_ACTION,
        SecurityLevel.HIGH,
        'Senha redefinida com sucesso',
        {
          email,
          passwordStrength: passwordStrength.strength,
          timestamp: new Date().toISOString()
        }
      );

      setIsSuccess(true);

      toast({
        title: 'Senha redefinida',
        description: 'Sua senha foi alterada com sucesso. Faça login com a nova senha.',
      });

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Senha redefinida com sucesso. Faça login com sua nova senha.'
          }
        });
      }, 3000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao redefinir senha';
      setError(errorMessage);

      securityLogger.logEvent(
        SecurityEventType.ERROR_OCCURRED,
        SecurityLevel.HIGH,
        `Falha na redefinição de senha: ${errorMessage}`,
        { email, error: errorMessage }
      );

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Estado de token inválido
  if (!isValidToken && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <img src={logoFerraco} alt="FerrAço CRM" className="h-16 w-auto object-contain" />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">Link Inválido</h1>
            </div>
          </div>

          <Card className="shadow-lg border-border/50">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-red-800">Token Inválido ou Expirado</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/forgot-password" className="block">
                <Button className="w-full">
                  Solicitar Novo Link
                </Button>
              </Link>
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Estado de sucesso
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <img src={logoFerraco} alt="FerrAço CRM" className="h-16 w-auto object-contain" />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">Senha Redefinida</h1>
            </div>
          </div>

          <Card className="shadow-lg border-border/50">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-green-800">Sucesso!</CardTitle>
              <CardDescription>
                Sua senha foi alterada com sucesso. Você será redirecionado para o login.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Ir para Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Loading state para validação de token
  if (!isValidToken && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <Card className="shadow-lg border-border/50">
            <CardContent className="p-6 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
              <p>Validando link de recuperação...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-4">
          <img src={logoFerraco} alt="FerrAço CRM" className="h-16 w-auto object-contain" />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Nova Senha</h1>
            <p className="text-muted-foreground">Defina uma senha segura</p>
          </div>
        </div>

        {/* Reset Form */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-primary" />
              <span>Redefinir Senha</span>
            </CardTitle>
            <CardDescription>
              Email: {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua nova senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
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
                    <Progress
                      value={(passwordStrength.score / 5) * 100}
                      className="h-2"
                    />
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <div className={`flex items-center space-x-1 ${passwordStrength.checks.length ? 'text-green-600' : ''}`}>
                        <span>{passwordStrength.checks.length ? '✓' : '○'}</span>
                        <span>Pelo menos 8 caracteres</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${passwordStrength.checks.uppercase ? 'text-green-600' : ''}`}>
                        <span>{passwordStrength.checks.uppercase ? '✓' : '○'}</span>
                        <span>Uma letra maiúscula</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${passwordStrength.checks.lowercase ? 'text-green-600' : ''}`}>
                        <span>{passwordStrength.checks.lowercase ? '✓' : '○'}</span>
                        <span>Uma letra minúscula</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${passwordStrength.checks.number ? 'text-green-600' : ''}`}>
                        <span>{passwordStrength.checks.number ? '✓' : '○'}</span>
                        <span>Um número</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${passwordStrength.checks.special ? 'text-green-600' : ''}`}>
                        <span>{passwordStrength.checks.special ? '✓' : '○'}</span>
                        <span>Um caractere especial</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                {confirmPassword && (
                  <div className={`text-xs ${
                    password === confirmPassword ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {password === confirmPassword ? '✓ Senhas coincidem' : '○ Senhas não coincidem'}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || passwordStrength.score < 3 || password !== confirmPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Redefinir Senha
                  </>
                )}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="text-center">
              <Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar ao login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;