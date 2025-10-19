/**
 * AdvancedMessageMenu - Menu avançado com todas as opções do WPPConnect
 */

import { useState } from 'react';
import {
  MapPin,
  FileText,
  Image,
  Video,
  Mic,
  User,
  List,
  Square,
  BarChart3,
  Package,
  Tag,
  Users,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/apiClient';
import { toast } from 'sonner';

interface AdvancedMessageMenuProps {
  conversationPhone: string;
  onMessageSent?: () => void;
}

type DialogType =
  | 'location'
  | 'contact'
  | 'document'
  | 'list'
  | 'buttons'
  | 'poll'
  | null;

const AdvancedMessageMenu = ({
  conversationPhone,
  onMessageSent,
}: AdvancedMessageMenuProps) => {
  const [openDialog, setOpenDialog] = useState<DialogType>(null);
  const [isSending, setIsSending] = useState(false);

  // Location state
  const [location, setLocation] = useState({
    latitude: '',
    longitude: '',
    description: '',
  });

  // Contact state
  const [contact, setContact] = useState({
    contactId: '',
    name: '',
  });

  // Document state
  const [document, setDocument] = useState<{
    file: File | null;
    caption: string;
  }>({
    file: null,
    caption: '',
  });

  // List state
  const [list, setList] = useState({
    title: '',
    description: '',
    buttonText: 'Ver opções',
    sections: [
      {
        title: 'Seção 1',
        rows: [{ title: '', description: '', rowId: '' }],
      },
    ],
  });

  // Buttons state
  const [buttons, setButtons] = useState({
    message: '',
    buttons: ['', '', ''],
  });

  // Poll state
  const [poll, setPoll] = useState({
    name: '',
    options: ['', ''],
  });

  const handleSendLocation = async () => {
    try {
      setIsSending(true);
      await api.post('/whatsapp/send-location', {
        to: conversationPhone,
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        name: location.description,
      });

      toast.success('Localização enviada!');
      setOpenDialog(null);
      setLocation({ latitude: '', longitude: '', description: '' });
      onMessageSent?.();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao enviar localização');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendContact = async () => {
    try {
      setIsSending(true);
      await api.post('/whatsapp/send-contact', {
        to: conversationPhone,
        contactId: contact.contactId,
        name: contact.name,
      });

      toast.success('Contato enviado!');
      setOpenDialog(null);
      setContact({ contactId: '', name: '' });
      onMessageSent?.();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao enviar contato');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendDocument = async () => {
    if (!document.file) {
      toast.error('Selecione um arquivo');
      return;
    }

    try {
      setIsSending(true);

      // FASE B: Upload de mídia para o servidor WhatsApp
      const formData = new FormData();
      formData.append('media', document.file);

      const uploadResponse = await api.post('/whatsapp/upload-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const filePath = uploadResponse.data.data.filePath;

      // FASE A: Enviar arquivo via WhatsApp (endpoint correto)
      await api.post('/whatsapp/send-file', {
        to: conversationPhone,
        filePath,
        filename: document.file.name,
        caption: document.caption || undefined,
      });

      toast.success('Documento enviado!');
      setOpenDialog(null);
      setDocument({ file: null, caption: '' });
      onMessageSent?.();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao enviar documento');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendList = async () => {
    try {
      setIsSending(true);
      await api.post('/whatsapp/extended/messages/list', {
        to: conversationPhone,
        title: list.title,
        description: list.description,
        buttonText: list.buttonText,
        sections: list.sections,
      });

      toast.success('Lista enviada!');
      setOpenDialog(null);
      onMessageSent?.();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao enviar lista');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendButtons = async () => {
    try {
      setIsSending(true);
      const buttonList = buttons.buttons
        .filter((b) => b.trim())
        .map((b) => ({ buttonText: b }));

      await api.post('/whatsapp/extended/messages/buttons', {
        to: conversationPhone,
        message: buttons.message,
        buttons: buttonList,
      });

      toast.success('Botões enviados!');
      setOpenDialog(null);
      setButtons({ message: '', buttons: ['', '', ''] });
      onMessageSent?.();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao enviar botões');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendPoll = async () => {
    try {
      setIsSending(true);
      const options = poll.options.filter((o) => o.trim());

      await api.post('/whatsapp/extended/messages/poll', {
        to: conversationPhone,
        name: poll.name,
        options,
      });

      toast.success('Enquete enviada!');
      setOpenDialog(null);
      setPoll({ name: '', options: ['', ''] });
      onMessageSent?.();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao enviar enquete');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Square className="h-5 w-5 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Enviar Mídia</DropdownMenuLabel>
          <DropdownMenuItem>
            <Image className="mr-2 h-4 w-4" />
            <span>Imagem</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Video className="mr-2 h-4 w-4" />
            <span>Vídeo</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Mic className="mr-2 h-4 w-4" />
            <span>Áudio</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenDialog('document')}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Documento</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Mensagens Interativas</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setOpenDialog('list')}>
            <List className="mr-2 h-4 w-4" />
            <span>Lista Interativa</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenDialog('buttons')}>
            <Square className="mr-2 h-4 w-4" />
            <span>Botões</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenDialog('poll')}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Enquete</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Compartilhar</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setOpenDialog('location')}>
            <MapPin className="mr-2 h-4 w-4" />
            <span>Localização</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenDialog('contact')}>
            <User className="mr-2 h-4 w-4" />
            <span>Contato</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>WhatsApp Business</DropdownMenuLabel>
          <DropdownMenuItem>
            <Package className="mr-2 h-4 w-4" />
            <span>Produto do Catálogo</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Tag className="mr-2 h-4 w-4" />
            <span>Gerenciar Labels</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Location Dialog */}
      <Dialog open={openDialog === 'location'} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Localização</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={location.latitude}
                onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
                placeholder="-23.550520"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={location.longitude}
                onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
                placeholder="-46.633308"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                value={location.description}
                onChange={(e) => setLocation({ ...location, description: e.target.value })}
                placeholder="Nome do local"
              />
            </div>
            <Button
              onClick={handleSendLocation}
              disabled={isSending || !location.latitude || !location.longitude}
              className="w-full"
            >
              {isSending ? 'Enviando...' : 'Enviar Localização'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={openDialog === 'contact'} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Contato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contactId">Número do Contato (com código do país)</Label>
              <Input
                id="contactId"
                value={contact.contactId}
                onChange={(e) => setContact({ ...contact, contactId: e.target.value })}
                placeholder="5511999999999@c.us"
              />
            </div>
            <div>
              <Label htmlFor="contactName">Nome</Label>
              <Input
                id="contactName"
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                placeholder="João Silva"
              />
            </div>
            <Button
              onClick={handleSendContact}
              disabled={isSending || !contact.contactId}
              className="w-full"
            >
              {isSending ? 'Enviando...' : 'Enviar Contato'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Dialog */}
      <Dialog open={openDialog === 'document'} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Selecionar Arquivo</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setDocument({ ...document, file });
                  }
                }}
              />
              {document.file && (
                <p className="text-sm text-gray-500 mt-1">
                  {document.file.name} ({(document.file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="caption">Legenda (opcional)</Label>
              <Input
                id="caption"
                value={document.caption}
                onChange={(e) => setDocument({ ...document, caption: e.target.value })}
                placeholder="Segue o documento"
              />
            </div>
            <Button
              onClick={handleSendDocument}
              disabled={isSending || !document.file}
              className="w-full"
            >
              {isSending ? 'Enviando...' : 'Enviar Documento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Buttons Dialog */}
      <Dialog open={openDialog === 'buttons'} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Botões</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="buttonsMessage">Mensagem</Label>
              <Textarea
                id="buttonsMessage"
                value={buttons.message}
                onChange={(e) => setButtons({ ...buttons, message: e.target.value })}
                placeholder="Escolha uma opção:"
                rows={3}
              />
            </div>
            {buttons.buttons.map((btn, index) => (
              <div key={index}>
                <Label htmlFor={`button${index}`}>Botão {index + 1}</Label>
                <Input
                  id={`button${index}`}
                  value={btn}
                  onChange={(e) => {
                    const newButtons = [...buttons.buttons];
                    newButtons[index] = e.target.value;
                    setButtons({ ...buttons, buttons: newButtons });
                  }}
                  placeholder={`Texto do botão ${index + 1}`}
                />
              </div>
            ))}
            <Button
              onClick={handleSendButtons}
              disabled={isSending || !buttons.message || !buttons.buttons.some((b) => b.trim())}
              className="w-full"
            >
              {isSending ? 'Enviando...' : 'Enviar Botões'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Poll Dialog */}
      <Dialog open={openDialog === 'poll'} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Enquete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pollName">Pergunta</Label>
              <Input
                id="pollName"
                value={poll.name}
                onChange={(e) => setPoll({ ...poll, name: e.target.value })}
                placeholder="Qual seu horário preferido?"
              />
            </div>
            {poll.options.map((opt, index) => (
              <div key={index}>
                <Label htmlFor={`option${index}`}>Opção {index + 1}</Label>
                <Input
                  id={`option${index}`}
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...poll.options];
                    newOptions[index] = e.target.value;
                    setPoll({ ...poll, options: newOptions });
                  }}
                  placeholder={`Opção ${index + 1}`}
                />
              </div>
            ))}
            <Button
              onClick={() => setPoll({ ...poll, options: [...poll.options, ''] })}
              variant="outline"
              className="w-full"
            >
              Adicionar Opção
            </Button>
            <Button
              onClick={handleSendPoll}
              disabled={isSending || !poll.name || poll.options.filter((o) => o.trim()).length < 2}
              className="w-full"
            >
              {isSending ? 'Enviando...' : 'Enviar Enquete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdvancedMessageMenu;
