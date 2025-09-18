import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import logoFerraco from '@/assets/logo-ferraco.webp';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validações básicas
    if (!username.trim()) {
      setError('Nome de usuário é obrigatório');
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('Senha é obrigatória');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      await login(username.trim(), password, rememberMe);

      // Redirecionar após login bem-sucedido
      const from = location.state?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Erro no login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoUsername: string, demoPassword: string) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
    setError('');
  };

  const goToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img
              src={logoFerraco}
              alt="Metalúrgica FerrAço"
              className="h-16 w-auto"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground">
              Acesse o sistema de gestão do FerrAço CRM
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Login Seguro</span>
            </CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar o painel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu nome de usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  autoComplete="username"
                  autoFocus
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 pr-10"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="remember-me"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Manter-me conectado por mais tempo
                </Label>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full transition-all duration-200 hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <Link
                  to="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
            </form>

            {/* Demo Accounts */}
            <div className="pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-3 text-center">
                Contas de demonstração:
              </p>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('admin', 'Admin123!')}
                  disabled={isLoading}
                  className="justify-start text-xs"
                >
                  <Shield className="mr-2 h-3 w-3" />
                  <span className="font-medium">admin</span>
                  <span className="ml-2 text-muted-foreground">(Administrador)</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('vendedor', 'Vend123!')}
                  disabled={isLoading}
                  className="justify-start text-xs"
                >
                  <Shield className="mr-2 h-3 w-3" />
                  <span className="font-medium">vendedor</span>
                  <span className="ml-2 text-muted-foreground">(Vendas)</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('consultor', 'Cons123!')}
                  disabled={isLoading}
                  className="justify-start text-xs"
                >
                  <Shield className="mr-2 h-3 w-3" />
                  <span className="font-medium">consultor</span>
                  <span className="ml-2 text-muted-foreground">(Consulta)</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={goToHome}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Site
          </Button>
        </div>

        {/* Footer Info */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>Sistema seguro com autenticação JWT</p>
          <p>© {new Date().getFullYear()} Metalúrgica FerrAço - CRM</p>
        </div>
      </div>
    </div>
  );
};

export default Login;