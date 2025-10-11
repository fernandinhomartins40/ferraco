import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Icon/Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-destructive p-4 rounded-xl shadow-lg">
              <ShieldAlert className="h-10 w-10 text-destructive-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar este recurso
          </p>
        </div>

        {/* Info Card */}
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Área Restrita</CardTitle>
            <CardDescription>
              Esta página requer permissões especiais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta área do sistema é restrita. Se você acredita que deveria ter acesso,
              entre em contato com o administrador do sistema.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={() => navigate('/')}
              >
                <Home className="mr-2 h-4 w-4" />
                Página Inicial
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Precisa de ajuda? Entre em contato com o suporte</p>
        </div>
      </div>
    </div>
  );
}
