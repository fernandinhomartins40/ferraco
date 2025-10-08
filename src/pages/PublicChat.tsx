import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatWidget } from '@/components/ChatWidget';
import { aiChatStorage } from '@/utils/aiChatStorage';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, MessageCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Página pública do chat acessível via link /chat/:shortCode
 */
export default function PublicChat() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [linkData, setLinkData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string>('');

  useEffect(() => {
    const validateLink = async () => {
      if (!shortCode) {
        setError('Link inválido');
        setIsValidating(false);
        return;
      }

      try {
        // Buscar link pelo shortCode
        const links = aiChatStorage.getChatLinks();
        const link = links.find(l => l.shortCode === shortCode && l.isActive);

        if (!link) {
          setError('Link não encontrado ou inativo');
          setIsValidating(false);
          return;
        }

        // Registrar clique
        aiChatStorage.updateChatLink(link.id, {
          clicks: link.clicks + 1
        });

        // Criar um lead temporário para este chat
        const tempLeadId = `chat-${shortCode}-${Date.now()}`;
        setLeadId(tempLeadId);
        setLinkData(link);
        setIsValidating(false);

      } catch (err) {
        console.error('Erro ao validar link:', err);
        setError('Erro ao carregar chat');
        setIsValidating(false);
      }
    };

    validateLink();
  }, [shortCode]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-purple-600 animate-pulse" />
            <p className="text-lg text-muted-foreground">Carregando chat...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !linkData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Link inválido'}
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-sm text-purple-600 hover:underline"
              >
                Voltar para página inicial
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Obter dados da empresa para personalizar o chat
  const companyData = aiChatStorage.getCompanyData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <Card className="mb-4">
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-purple-600" />
            <h1 className="text-2xl font-bold mb-2">
              {companyData?.name || 'Chat de Atendimento'}
            </h1>
            <p className="text-muted-foreground">
              {companyData?.description || 'Entre em contato conosco através do chat'}
            </p>
          </CardContent>
        </Card>

        {/* Chat Widget em modo fullscreen */}
        <Card className="shadow-2xl">
          <CardContent className="p-0">
            <ChatWidget
              leadId={leadId}
              initialOpen={true}
              className="h-[600px] rounded-lg"
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>
            Origem: {linkData.name} •
            {companyData?.workingHours && ` ${companyData.workingHours}`}
          </p>
        </div>
      </div>
    </div>
  );
}
