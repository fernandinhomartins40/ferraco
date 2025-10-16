/**
 * MediaUploader - Componente para upload de imagens, vídeos, áudios e documentos
 */

import { useState, useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Paperclip, Image, Video, Mic, FileText, Loader2 } from 'lucide-react';
import api from '@/lib/apiClient';
import { toast } from 'sonner';

interface MediaUploaderProps {
  conversationPhone: string;
  onMediaSent?: () => void;
}

const MediaUploader = ({ conversationPhone, onMediaSent }: MediaUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    type: 'image' | 'video' | 'document' | null;
    file: File | null;
    preview: string | null;
  }>({
    open: false,
    type: null,
    file: null,
    preview: null,
  });
  const [caption, setCaption] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (type: 'image' | 'video' | 'document', file: File) => {
    const preview = type === 'image' || type === 'video'
      ? URL.createObjectURL(file)
      : null;

    setPreviewDialog({
      open: true,
      type,
      file,
      preview,
    });
  };

  const handleSendMedia = async () => {
    if (!previewDialog.file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', previewDialog.file);
      formData.append('to', conversationPhone);
      if (caption) formData.append('caption', caption);

      // Upload para servidor
      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const filePath = uploadResponse.data.filePath;

      // Enviar via WhatsApp
      if (previewDialog.type === 'image') {
        await api.post('/whatsapp/send', {
          to: conversationPhone,
          message: caption || '',
          mediaUrl: filePath,
          mediaType: 'image',
        });
      } else if (previewDialog.type === 'video') {
        await api.post('/whatsapp/send', {
          to: conversationPhone,
          message: caption || '',
          mediaUrl: filePath,
          mediaType: 'video',
        });
      } else if (previewDialog.type === 'document') {
        await api.post('/whatsapp/extended/messages/file', {
          to: conversationPhone,
          filePath,
          filename: previewDialog.file.name,
          caption: caption || '',
        });
      }

      toast.success('Mídia enviada com sucesso!');
      setPreviewDialog({ open: false, type: null, file: null, preview: null });
      setCaption('');
      onMediaSent?.();
    } catch (error: any) {
      console.error('Erro ao enviar mídia:', error);
      toast.error(error.response?.data?.message || 'Erro ao enviar mídia');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => imageInputRef.current?.click()}
          >
            <Image className="mr-2 h-4 w-4" />
            Imagem
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => videoInputRef.current?.click()}
          >
            <Video className="mr-2 h-4 w-4" />
            Vídeo
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => documentInputRef.current?.click()}
          >
            <FileText className="mr-2 h-4 w-4" />
            Documento
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect('image', file);
          e.target.value = '';
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect('video', file);
          e.target.value = '';
        }}
      />
      <input
        ref={documentInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect('document', file);
          e.target.value = '';
        }}
      />

      {/* Preview Dialog */}
      <Dialog open={previewDialog.open} onOpenChange={(open) => !isUploading && setPreviewDialog({ ...previewDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar {previewDialog.type === 'image' ? 'Imagem' : previewDialog.type === 'video' ? 'Vídeo' : 'Documento'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            {previewDialog.preview && previewDialog.type === 'image' && (
              <img
                src={previewDialog.preview}
                alt="Preview"
                className="w-full h-auto max-h-96 object-contain rounded-lg"
              />
            )}
            {previewDialog.preview && previewDialog.type === 'video' && (
              <video
                src={previewDialog.preview}
                controls
                className="w-full h-auto max-h-96 rounded-lg"
              />
            )}
            {previewDialog.type === 'document' && previewDialog.file && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FileText className="h-12 w-12 text-blue-500" />
                <div>
                  <p className="font-medium">{previewDialog.file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(previewDialog.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}

            {/* Caption */}
            <div>
              <Label htmlFor="caption">Legenda (opcional)</Label>
              <Input
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Adicione uma legenda..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewDialog({ open: false, type: null, file: null, preview: null })}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSendMedia} disabled={isUploading}>
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MediaUploader;
