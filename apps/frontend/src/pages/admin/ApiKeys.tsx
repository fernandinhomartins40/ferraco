/**
 * ApiKeys - Gerenciamento de API Keys para integração externa
 * Permite criar, visualizar, revogar e rotacionar chaves de API
 */

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Copy, Trash2, RotateCw, Key, ExternalLink, Loader2 } from 'lucide-react';
import api from '@/lib/apiClient';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  secret?: string;
  type: string;
  status: string;
  scopes: string[];
  rateLimitPerHour: number;
  rateLimitPerDay: number;
  lastUsedAt: string | null;
  usageCount: number;
  expiresAt: string | null;
  createdAt: string;
}

const scopeOptions = [
  { value: 'leads:read', label: 'Leads - Leitura', description: 'Listar e visualizar leads' },
  { value: 'leads:write', label: 'Leads - Escrita', description: 'Criar e atualizar leads' },
  { value: 'leads:delete', label: 'Leads - Exclusão', description: 'Deletar leads' },
  { value: 'communications:read', label: 'Comunicações - Leitura', description: 'Visualizar comunicações' },
  { value: 'communications:write', label: 'Comunicações - Escrita', description: 'Enviar WhatsApp, Email, SMS' },
  { value: 'tags:read', label: 'Tags - Leitura', description: 'Listar tags' },
  { value: 'tags:write', label: 'Tags - Escrita', description: 'Criar e atualizar tags' },
  { value: 'webhooks:manage', label: 'Webhooks - Gerenciar', description: 'Criar e gerenciar webhooks' },
  { value: '*:*', label: 'Admin - Acesso Total', description: 'Acesso completo à API' },
];

const ApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState<ApiKey | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const [formData, setFormData] = useState({
    name: '',
    scopes: [] as string[],
    rateLimitPerHour: 1000,
    rateLimitPerDay: 10000,
  });

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const response = await api.get('/api-keys');
      setApiKeys(response.data.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar API Keys:', error);
      toast.error('Erro ao carregar API Keys: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    try {
      const response = await api.post('/api-keys', formData);
      setNewKeyData(response.data.data);
      setShowCreateModal(false);
      setFormData({
        name: '',
        scopes: [],
        rateLimitPerHour: 1000,
        rateLimitPerDay: 10000,
      });
      toast.success('API Key criada com sucesso!');
      loadApiKeys();
    } catch (error: any) {
      toast.error('Erro ao criar API Key: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    try {
      await api.post(`/api-keys/${id}/revoke`);
      toast.success('API Key revogada com sucesso');
      loadApiKeys();
    } catch (error: any) {
      toast.error('Erro ao revogar API Key: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRotateApiKey = async (id: string) => {
    try {
      const response = await api.post(`/api-keys/${id}/rotate`);
      setNewKeyData(response.data.data);
      toast.success('API Key rotacionada com sucesso');
      loadApiKeys();
    } catch (error: any) {
      toast.error('Erro ao rotacionar API Key: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      await api.delete(`/api-keys/${id}`);
      toast.success('API Key deletada com sucesso');
      loadApiKeys();
    } catch (error: any) {
      toast.error('Erro ao deletar API Key: ' + (error.response?.data?.error || error.message));
    }
  };

  const confirmRevoke = (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Revogar API Key',
      description: 'Tem certeza que deseja revogar esta API Key? Esta ação não pode ser desfeita.',
      onConfirm: () => {
        handleRevokeApiKey(id);
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const confirmRotate = (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Rotacionar API Key',
      description: 'Tem certeza que deseja rotacionar esta API Key? A chave antiga será invalidada.',
      onConfirm: () => {
        handleRotateApiKey(id);
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const confirmDelete = (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Deletar API Key',
      description: 'Tem certeza que deseja deletar esta API Key permanentemente? Esta ação não pode ser desfeita.',
      onConfirm: () => {
        handleDeleteApiKey(id);
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para área de transferência!');
  };

  const toggleScope = (scope: string) => {
    if (formData.scopes.includes(scope)) {
      setFormData({ ...formData, scopes: formData.scopes.filter(s => s !== scope) });
    } else {
      setFormData({ ...formData, scopes: [...formData.scopes, scope] });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Externa</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie chaves de API para integração com sistemas externos
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Criar API Key
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => window.open(`${window.location.protocol}//${window.location.host}/api-docs`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Documentação Swagger
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        )}

        {/* API Keys List */}
        {!loading && apiKeys.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhuma API Key criada ainda</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira API Key
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && apiKeys.length > 0 && (
          <div className="grid gap-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      <CardTitle className="break-words">{apiKey.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant={apiKey.status === 'ACTIVE' ? 'default' : 'destructive'}>
                          {apiKey.status}
                        </Badge>
                        <Badge variant="outline">{apiKey.type}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmRotate(apiKey.id)}
                        title="Rotacionar chave"
                        className="shrink-0"
                      >
                        <RotateCw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmRevoke(apiKey.id)}
                        title="Revogar"
                        disabled={apiKey.status === 'REVOKED'}
                        className="shrink-0"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(apiKey.id)}
                        title="Deletar"
                        className="shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* API Key */}
                  <div>
                    <Label className="text-sm font-medium">API Key</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
                        {apiKey.key}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(apiKey.key)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Scopes */}
                  <div>
                    <Label className="text-sm font-medium">Permissões</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {apiKey.scopes.map((scope) => (
                        <Badge key={scope} variant="secondary">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Rate Limit</p>
                      <p className="font-medium">{apiKey.rateLimitPerHour}/hora</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Uso Total</p>
                      <p className="font-medium">{apiKey.usageCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Último Uso</p>
                      <p className="font-medium text-sm break-words">
                        {apiKey.lastUsedAt ? format(new Date(apiKey.lastUsedAt), 'dd/MM/yyyy HH:mm') : 'Nunca'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Criada em</p>
                      <p className="font-medium">{format(new Date(apiKey.createdAt), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal: Create API Key */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>Criar Nova API Key</DialogTitle>
              <DialogDescription>
                Configure as permissões e limites para a nova chave de API
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Integração Zapier, Sistema Externo..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="mb-2">Permissões (Scopes)</Label>
                <div className="space-y-2 mt-2">
                  {scopeOptions.map((option) => (
                    <label key={option.value} className="flex items-start gap-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.scopes.includes(option.value)}
                        onChange={() => toggleScope(option.value)}
                        className="mt-1 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-sm break-words">{option.label}</div>
                        <div className="text-xs text-muted-foreground break-words">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rateHour">Rate Limit (por hora)</Label>
                  <Input
                    id="rateHour"
                    type="number"
                    value={formData.rateLimitPerHour}
                    onChange={(e) => setFormData({ ...formData, rateLimitPerHour: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="rateDay">Rate Limit (por dia)</Label>
                  <Input
                    id="rateDay"
                    type="number"
                    value={formData.rateLimitPerDay}
                    onChange={(e) => setFormData({ ...formData, rateLimitPerDay: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                onClick={handleCreateApiKey}
                disabled={!formData.name || formData.scopes.length === 0}
                className="w-full sm:w-auto"
              >
                Criar API Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: New API Key Created */}
        <Dialog open={!!newKeyData} onOpenChange={(open) => !open && setNewKeyData(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-green-600">✅ API Key Criada com Sucesso!</DialogTitle>
              <DialogDescription>
                Copie e salve estas credenciais em um local seguro
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 overflow-x-hidden">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                <p className="text-sm font-medium text-yellow-800 mb-1">⚠️ IMPORTANTE: Salve estas credenciais agora!</p>
                <p className="text-xs text-yellow-700">
                  O secret não será mostrado novamente. Guarde em local seguro.
                </p>
              </div>

              {newKeyData && (
                <>
                  <div>
                    <Label>API Key (Público)</Label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1">
                      <code className="flex-1 px-3 py-2 bg-muted rounded-md text-xs sm:text-sm font-mono break-all overflow-auto max-w-full">
                        {newKeyData.key}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 self-end sm:self-auto"
                        onClick={() => copyToClipboard(newKeyData.key)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {newKeyData.secret && (
                    <div>
                      <Label>Secret (Privado)</Label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1">
                        <code className="flex-1 px-3 py-2 bg-red-50 rounded-md border border-red-200 text-xs sm:text-sm font-mono break-all overflow-auto max-w-full">
                          {newKeyData.secret}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 self-end sm:self-auto"
                          onClick={() => copyToClipboard(newKeyData.secret!)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                    <p className="text-sm font-medium text-blue-800 mb-2">📚 Como usar:</p>
                    <div className="bg-white p-2 sm:p-3 rounded border overflow-x-auto">
                      <pre className="text-[10px] sm:text-xs whitespace-pre-wrap break-all">
{`curl http://seu-site.com/api/v1/external/leads \\
  -H "X-API-Key: ${newKeyData.key}" \\
  -H "X-API-Secret: ${newKeyData.secret || 'sk_live_...'}"

Ou:

curl http://seu-site.com/api/v1/external/leads \\
  -H "Authorization: Bearer ${newKeyData.key}:${newKeyData.secret || 'sk_live_...'}"

Documentação completa: /api-docs`}</pre>
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setNewKeyData(null)} className="w-full">
                Entendi, Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDialog.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDialog.onConfirm}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default ApiKeys;
