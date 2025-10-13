/**
 * ImageUploader - Upload e gerenciamento de imagens
 */

import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { ImageConfig } from '@/types/landingPage';
import axios from 'axios';

interface ImageUploaderProps {
  label: string;
  value: ImageConfig;
  onChange: (image: ImageConfig) => void;
  description?: string;
  acceptedFormats?: string[];
}

export const ImageUploader = ({
  label,
  value,
  onChange,
  description,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
}: ImageUploaderProps) => {
  const [preview, setPreview] = useState(value.url);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!acceptedFormats.includes(file.type)) {
      alert('Formato de arquivo não suportado');
      return;
    }

    // Criar preview local imediatamente
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload para o servidor usando axios (que tem interceptor de auth configurado)
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data.data.url;

      // Atualizar com URL real do servidor
      setPreview(imageUrl);
      onChange({
        ...value,
        url: imageUrl,
      });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      const errorMsg = error.response?.data?.message || 'Erro ao fazer upload da imagem. Tente novamente.';
      alert(errorMsg);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUrlChange = (url: string) => {
    setPreview(url);
    onChange({
      ...value,
      url,
    });
  };

  const handleClear = () => {
    setPreview('');
    onChange({
      ...value,
      url: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      {/* Preview */}
      {preview && (
        <div className="relative rounded-lg border overflow-hidden bg-muted">
          <img
            src={preview}
            alt={value.alt || 'Preview'}
            className="w-full h-48 object-cover"
          />
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors
          ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'}
          ${!preview ? 'block' : 'hidden'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-1">
          Arraste uma imagem ou clique para selecionar
        </p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WebP ou SVG (máx. 5MB)
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      {/* URL Input */}
      <div className="space-y-2">
        <Label>URL da Imagem</Label>
        <Input
          type="url"
          value={value.url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg"
        />
      </div>

      {/* Alt Text */}
      <div className="space-y-2">
        <Label>Texto Alternativo (Alt)</Label>
        <Input
          type="text"
          value={value.alt}
          onChange={(e) =>
            onChange({
              ...value,
              alt: e.target.value,
            })
          }
          placeholder="Descrição da imagem"
        />
      </div>

      {/* Object Fit */}
      <div className="space-y-2">
        <Label>Ajuste da Imagem</Label>
        <select
          value={value.objectFit || 'cover'}
          onChange={(e) =>
            onChange({
              ...value,
              objectFit: e.target.value as ImageConfig['objectFit'],
            })
          }
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        >
          <option value="cover">Cobrir (Cover)</option>
          <option value="contain">Conter (Contain)</option>
          <option value="fill">Preencher (Fill)</option>
          <option value="none">Original (None)</option>
          <option value="scale-down">Reduzir (Scale Down)</option>
        </select>
      </div>
    </div>
  );
};
