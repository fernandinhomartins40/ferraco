import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, KeyRound, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import { logger } from '@/lib/logger';

interface ProfileFormData {
  name: string;
  email: string;
  username: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AdminProfile = () => {
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'profile');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
      });
    }
  }, [user]);

  // Update active tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'password') {
      setActiveTab('password');
    }
  }, [searchParams]);

  const handleProfileChange = (field: keyof ProfileFormData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: keyof PasswordFormData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingProfile(true);

    try {
      const response = await apiClient.put('/auth/profile', profileData);

      if (response.success && response.data) {
        // Update user context with new data
        updateUser(response.data as any);
        toast.success('Perfil atualizado com sucesso!');
        logger.info('Perfil atualizado:', profileData);
      } else {
        throw new Error(response.message || 'Erro ao atualizar perfil');
      }
    } catch (error: any) {
      logger.error('Erro ao atualizar perfil:', error);
      toast.error(error.message || 'Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!passwordData.currentPassword) {
      toast.error('Digite sua senha atual');
      return;
    }

    if (!passwordData.newPassword) {
      toast.error('Digite a nova senha');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('A nova senha deve ser diferente da senha atual');
      return;
    }

    setIsLoadingPassword(true);

    try {
      const response = await apiClient.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        toast.success('Senha alterada com sucesso!');
        logger.info('Senha alterada com sucesso');

        // Limpar formulário
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        throw new Error(response.message || 'Erro ao alterar senha');
      }
    } catch (error: any) {
      logger.error('Erro ao alterar senha:', error);
      toast.error(error.message || 'Erro ao alterar senha. Verifique sua senha atual.');
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas informações pessoais e segurança da conta
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Dados Pessoais
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Alterar Senha
          </TabsTrigger>
        </TabsList>

        {/* Tab: Dados Pessoais */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize seus dados cadastrais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      type="text"
                      value={profileData.name}
                      onChange={(e) => handleProfileChange('name', e.target.value)}
                      placeholder="Digite seu nome completo"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="username">Nome de Usuário</Label>
                    <Input
                      id="username"
                      type="text"
                      value={profileData.username}
                      onChange={(e) => handleProfileChange('username', e.target.value)}
                      placeholder="Digite seu nome de usuário"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Função</Label>
                    <Input
                      value={user?.role === 'admin' ? 'Administrador' : user?.role === 'sales' ? 'Vendedor' : 'Consultor'}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-sm text-muted-foreground">
                      Entre em contato com um administrador para alterar sua função
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoadingProfile}>
                    {isLoadingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Alterar Senha */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>
                Altere sua senha para manter sua conta segura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      placeholder="Digite sua senha atual"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      placeholder="Digite a nova senha"
                      required
                      minLength={6}
                    />
                    <p className="text-sm text-muted-foreground">
                      A senha deve ter no mínimo 6 caracteres
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      placeholder="Digite a nova senha novamente"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoadingPassword}>
                    {isLoadingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Alterando...
                      </>
                    ) : (
                      <>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Alterar Senha
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminProfile;
