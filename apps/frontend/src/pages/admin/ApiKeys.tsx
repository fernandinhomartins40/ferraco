import React, { useState, useEffect } from 'react';
import { Plus, Copy, Eye, EyeOff, Trash2, RotateCw, Key, Calendar, Activity } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';

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

export default function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState<ApiKey | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

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
      const response = await api.get('/api/api-keys');
      setApiKeys(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar API Keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    try {
      const response = await api.post('/api/api-keys', formData);
      setNewKeyData(response.data.data);
      setFormData({
        name: '',
        scopes: [],
        rateLimitPerHour: 1000,
        rateLimitPerDay: 10000,
      });
      loadApiKeys();
    } catch (error: any) {
      alert('Erro ao criar API Key: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    if (!confirm('Tem certeza que deseja revogar esta API Key? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await api.post(`/api/api-keys/${id}/revoke`);
      loadApiKeys();
    } catch (error: any) {
      alert('Erro ao revogar API Key: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRotateApiKey = async (id: string) => {
    if (!confirm('Tem certeza que deseja rotacionar esta API Key? A chave antiga será invalidada.')) {
      return;
    }

    try {
      const response = await api.post(`/api/api-keys/${id}/rotate`);
      setNewKeyData(response.data.data);
      loadApiKeys();
    } catch (error: any) {
      alert('Erro ao rotacionar API Key: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta API Key permanentemente?')) {
      return;
    }

    try {
      await api.delete(`/api/api-keys/${id}`);
      loadApiKeys();
    } catch (error: any) {
      alert('Erro ao deletar API Key: ' + (error.response?.data?.error || error.message));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para área de transferência!');
  };

  const toggleSecretVisibility = (id: string) => {
    const newSet = new Set(visibleSecrets);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setVisibleSecrets(newSet);
  };

  const toggleScope = (scope: string) => {
    if (formData.scopes.includes(scope)) {
      setFormData({ ...formData, scopes: formData.scopes.filter(s => s !== scope) });
    } else {
      setFormData({ ...formData, scopes: [...formData.scopes, scope] });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">API Externa</h1>
        <p className="text-gray-600">
          Gerencie chaves de API para integração com sistemas externos
        </p>
      </div>

      {/* Actions */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            Criar API Key
          </button>
          <a
            href="/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Key className="w-4 h-4" />
            Documentação Swagger
          </a>
        </div>
      </div>

      {/* API Keys List */}
      <div className="grid gap-4">
        {apiKeys.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">Nenhuma API Key criada ainda</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Criar Primeira API Key
            </button>
          </div>
        ) : (
          apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{apiKey.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded ${
                      apiKey.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      apiKey.status === 'REVOKED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {apiKey.status}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {apiKey.type}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRotateApiKey(apiKey.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Rotacionar chave"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRevokeApiKey(apiKey.id)}
                    className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                    title="Revogar"
                    disabled={apiKey.status === 'REVOKED'}
                  >
                    <Key className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteApiKey(apiKey.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Deletar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* API Key */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-50 rounded border text-sm font-mono">
                    {apiKey.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(apiKey.key)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scopes */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Permissões</label>
                <div className="flex flex-wrap gap-2">
                  {apiKey.scopes.map((scope) => (
                    <span key={scope} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                      {scope}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Rate Limit</span>
                  <p className="font-medium">{apiKey.rateLimitPerHour}/hora</p>
                </div>
                <div>
                  <span className="text-gray-600">Uso Total</span>
                  <p className="font-medium">{apiKey.usageCount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Último Uso</span>
                  <p className="font-medium">
                    {apiKey.lastUsedAt ? format(new Date(apiKey.lastUsedAt), 'dd/MM/yyyy HH:mm') : 'Nunca'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Criada em</span>
                  <p className="font-medium">{format(new Date(apiKey.createdAt), 'dd/MM/yyyy')}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create API Key */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Criar Nova API Key</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Integração Zapier, Sistema Externo..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissões (Scopes)</label>
                <div className="space-y-2">
                  {scopeOptions.map((option) => (
                    <label key={option.value} className="flex items-start gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.scopes.includes(option.value)}
                        onChange={() => toggleScope(option.value)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-gray-600">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit (por hora)</label>
                  <input
                    type="number"
                    value={formData.rateLimitPerHour}
                    onChange={(e) => setFormData({ ...formData, rateLimitPerHour: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit (por dia)</label>
                  <input
                    type="number"
                    value={formData.rateLimitPerDay}
                    onChange={(e) => setFormData({ ...formData, rateLimitPerDay: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCreateApiKey}
                disabled={!formData.name || formData.scopes.length === 0}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                Criar API Key
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New API Key Created */}
      {newKeyData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4 text-green-600">✅ API Key Criada com Sucesso!</h2>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-yellow-800 mb-2">⚠️ IMPORTANTE: Salve estas credenciais agora!</p>
              <p className="text-xs text-yellow-700">
                O secret não será mostrado novamente. Guarde em local seguro.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key (Público)</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-50 rounded border text-sm font-mono break-all">
                    {newKeyData.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newKeyData.key)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {newKeyData.secret && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secret (Privado)</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-red-50 rounded border border-red-200 text-sm font-mono break-all">
                      {newKeyData.secret}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newKeyData.secret!)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-800 mb-2">📚 Como usar:</p>
                <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`curl http://seu-site.com/api/v1/external/leads \\
  -H "X-API-Key: ${newKeyData.key}" \\
  -H "X-API-Secret: ${newKeyData.secret || 'sk_live_...'}"

Ou:

curl http://seu-site.com/api/v1/external/leads \\
  -H "Authorization: Bearer ${newKeyData.key}:${newKeyData.secret || 'sk_live_...'}"

Documentação completa: /api-docs`}</pre>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setNewKeyData(null)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Entendi, Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
