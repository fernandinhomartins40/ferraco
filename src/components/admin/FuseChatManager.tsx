import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, Shield, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { aiChatStorage } from '@/utils/aiChatStorage';

/**
 * Componente para gerenciar integração com FuseChat RAG
 */
export function FuseChatManager() {
  const [apiKey, setApiKey] = useState(aiChatStorage.getAIConfig()?.fuseChatApiKey || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL ||
                 (import.meta.env.PROD ? '/api' : 'http://localhost:3002/api');

  /**
   * Salvar API Key
   */
  const handleSaveApiKey = () => {
    const config = aiChatStorage.getAIConfig() || {
      id: '1',
      fuseChatApiKey: '',
      greetingMessage: '',
      isActive: true
    };

    config.fuseChatApiKey = apiKey;

    aiChatStorage.saveAIConfig(config);

    setSyncResult({
      type: 'success',
      message: 'API Key salva com sucesso!'
    });

    setTimeout(() => setSyncResult(null), 3000);
  };

  /**
   * Sincronizar Knowledge Base
   */
  const handleSyncKnowledge = async () => {
    if (!apiKey) {
      setSyncResult({
        type: 'error',
        message: 'Configure a API Key primeiro'
      });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch(`${apiUrl}/chatbot/fusechat/sync-knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey })
      });

      const data = await response.json();

      if (data.success) {
        setSyncResult({
          type: 'success',
          message: `${data.message}. Produtos: ${data.stats?.products}, FAQs: ${data.stats?.faqs}`
        });
      } else {
        setSyncResult({
          type: 'error',
          message: data.error || 'Erro ao sincronizar'
        });
      }
    } catch (error: any) {
      setSyncResult({
        type: 'error',
        message: `Erro: ${error.message}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Configurar Guardrails
   */
  const handleSyncGuardrails = async () => {
    if (!apiKey) {
      setSyncResult({
        type: 'error',
        message: 'Configure a API Key primeiro'
      });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch(`${apiUrl}/chatbot/fusechat/sync-guardrails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey })
      });

      const data = await response.json();

      if (data.success) {
        setSyncResult({
          type: 'success',
          message: data.message
        });
      } else {
        setSyncResult({
          type: 'error',
          message: data.error || 'Erro ao configurar guardrails'
        });
      }
    } catch (error: any) {
      setSyncResult({
        type: 'error',
        message: `Erro: ${error.message}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Sincronizar tudo de uma vez
   */
  const handleSyncAll = async () => {
    await handleSyncKnowledge();

    setTimeout(async () => {
      await handleSyncGuardrails();
    }, 2000);
  };

  /**
   * Buscar estatísticas
   */
  const handleGetStats = async () => {
    if (!apiKey) {
      setSyncResult({
        type: 'error',
        message: 'Configure a API Key primeiro'
      });
      return;
    }

    setLoadingStats(true);

    try {
      const response = await fetch(`${apiUrl}/chatbot/fusechat/stats`, {
        headers: {
          'X-API-Key': apiKey
        }
      });

      const data = await response.json();
      setStats(data);
    } catch (error: any) {
      setSyncResult({
        type: 'error',
        message: `Erro ao buscar estatísticas: ${error.message}`
      });
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração FuseChat RAG</CardTitle>
          <CardDescription>
            Gerencie a integração com FuseChat para IA conversacional com RAG (Retrieval-Augmented Generation)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key do FuseChat</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type="password"
                placeholder="pk_sua_chave_aqui"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <Button onClick={handleSaveApiKey} variant="outline">
                Salvar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Obtenha sua API Key em{' '}
              <a
                href="https://digiurbis.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                digiurbis.com.br
              </a>
            </p>
          </div>

          {/* Resultados */}
          {syncResult && (
            <Alert variant={syncResult.type === 'success' ? 'default' : 'destructive'}>
              {syncResult.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{syncResult.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Sincronização */}
      <Card>
        <CardHeader>
          <CardTitle>Sincronização</CardTitle>
          <CardDescription>
            Sincronize produtos, FAQs e regras de comportamento com FuseChat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={handleSyncKnowledge}
              disabled={isSyncing || !apiKey}
              className="w-full"
              variant="outline"
            >
              {isSyncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              Knowledge Base
            </Button>

            <Button
              onClick={handleSyncGuardrails}
              disabled={isSyncing || !apiKey}
              className="w-full"
              variant="outline"
            >
              {isSyncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Shield className="mr-2 h-4 w-4" />
              )}
              Guardrails
            </Button>

            <Button
              onClick={handleSyncAll}
              disabled={isSyncing || !apiKey}
              className="w-full"
            >
              {isSyncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Sincronizar Tudo
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="font-semibold mb-2">📚 O que é sincronizado?</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <strong>Knowledge Base:</strong> Produtos, FAQs, informações da empresa</li>
              <li>• <strong>Guardrails:</strong> Regras de comportamento, tópicos permitidos/proibidos</li>
              <li>• <strong>Scripts:</strong> Instruções de captação de leads</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
          <CardDescription>
            Uso da API Key e métricas de conversação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGetStats}
            disabled={loadingStats || !apiKey}
            variant="outline"
            className="mb-4"
          >
            {loadingStats ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BarChart3 className="mr-2 h-4 w-4" />
            )}
            Atualizar Estatísticas
          </Button>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Total de Mensagens</p>
                <p className="text-2xl font-bold">{stats.total_messages || 0}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Documentos na KB</p>
                <p className="text-2xl font-bold">{stats.knowledge_base_docs || 0}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Rate Limit</p>
                <p className="text-2xl font-bold">{stats.rate_limit_remaining || 0}/60</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Modelo</p>
                <p className="text-sm font-mono">{stats.model || 'N/A'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentação */}
      <Card>
        <CardHeader>
          <CardTitle>Como funciona o RAG?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>RAG (Retrieval-Augmented Generation)</strong> permite que a IA busque automaticamente
            informações relevantes na Knowledge Base antes de responder.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <p><strong>1. Cliente pergunta:</strong> "Quanto custa um portão?"</p>
            <p><strong>2. FuseChat busca:</strong> Documentos sobre portões na Knowledge Base</p>
            <p><strong>3. IA responde:</strong> Com informações precisas e atualizadas</p>
          </div>
          <p>
            <strong>Benefícios:</strong> Respostas mais precisas, menor latência, controle total sobre o conhecimento da IA.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
