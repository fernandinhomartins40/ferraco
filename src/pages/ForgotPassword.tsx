import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Mail, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { securityLogger, SecurityEventType, SecurityLevel } from '@/utils/securityLogger';
import logoFerraco from '@/assets/logo-ferraco.webp';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validação básica
    if (!email.trim()) {
      setError('Email é obrigatório');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email deve ter um formato válido');
      setIsLoading(false);
      return;
    }

    try {
      // Simular envio de email de recuperação
      // Em produção, isso faria uma chamada ao backend
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Log da tentativa de recuperação
      securityLogger.logEvent(
        SecurityEventType.USER_ACTION,
        SecurityLevel.MEDIUM,
        'Solicitação de recuperação de senha',
        {
          email,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          ipAddress: 'localhost' // Em produção, seria obtido do servidor
        }
      );

      setIsSuccess(true);

      toast({
        title: 'Email enviado',
        description: 'Se o email existe em nosso sistema, você receberá instruções para redefinir sua senha.',
      });

      console.log('📧 Email de recuperação enviado para:', email);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao enviar email de recuperação';
      setError(errorMessage);

      // Log da falha na recuperação
      securityLogger.logEvent(
        SecurityEventType.ERROR_OCCURRED,
        SecurityLevel.HIGH,
        `Falha na recuperação de senha: ${errorMessage}`,
        {
          email,
          error: err.message,
          timestamp: new Date().toISOString()
        }
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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-4">
            <img
              src={logoFerraco}
              alt="FerrAço CRM"
              className="h-16 w-auto object-contain"
            />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">
                Email Enviado
              </h1>
              <p className="text-muted-foreground">
                Verifique sua caixa de entrada
              </p>
            </div>
          </div>

          {/* Success Card */}
          <Card className="shadow-lg border-border/50">
            <CardHeader className="text-center space-y-1">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-green-800">Email Enviado com Sucesso</CardTitle>
              <CardDescription>
                Se o email {email} está cadastrado em nosso sistema, você receberá as instruções para redefinir sua senha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  <strong>Não recebeu o email?</strong> Verifique sua pasta de spam ou lixo eletrônico.
                  O email pode levar até 5 minutos para chegar.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail('');
                    setError('');
                  }}
                >
                  Tentar com outro email
                </Button>
                <Link to="/login" className="block">
                  <Button variant="default" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao Login
                  </Button>
                </Link>
              </div>
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
          <img
            src={logoFerraco}
            alt="FerrAço CRM"
            className="h-16 w-auto object-contain"
          />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">
              Recuperar Senha
            </h1>
            <p className="text-muted-foreground">
              Digite seu email para receber instruções
            </p>
          </div>
        </div>

        {/* Recovery Form */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-primary" />
              <span>Recuperação de Senha</span>
            </CardTitle>
            <CardDescription>
              Enviaremos um link para redefinir sua senha
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

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Link de Recuperação
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

        {/* Instructions */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Informações Importantes
                </p>
                <ul className="text-blue-700 dark:text-blue-300 mt-1 space-y-1 text-xs">
                  <li>• O link de recuperação expira em 1 hora</li>
                  <li>• Apenas um link por email pode estar ativo</li>
                  <li>• Verifique sua pasta de spam</li>
                  <li>• Entre em contato com o suporte se necessário</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;