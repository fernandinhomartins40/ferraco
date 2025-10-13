/**
 * ImageUploader - Upload e gerenciamento de imagens
 */

import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, Crop } from 'lucide-react';
import { ImageConfig } from '@/types/landingPage';
import { apiClient } from '@/lib/apiClient';
import { ImageCropModal } from '@/components/ImageCropModal';

interface ImageUploaderProps {
  label: string;
  value: ImageConfig;
  onChange: (image: ImageConfig) => void;
  description?: string;
  acceptedFormats?: string[];
  enableCrop?: boolean;
  cropAspectRatio?: number;
  cropTargetWidth?: number;
  cropTargetHeight?: number;
  cropTitle?: string;
}

export const ImageUploader = ({
  label,
  value,
  onChange,
  description,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  enableCrop = false,
  cropAspectRatio = 16 / 9,
  cropTargetWidth = 1200,
  cropTargetHeight = 675,
  cropTitle = 'Recortar Imagem',
}: ImageUploaderProps) => {
  const [preview, setPreview] = useState(value.url);
  const [isDragging, setIsDragging] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!acceptedFormats.includes(file.type)) {
      alert('Formato de arquivo não suportado');
      return;
    }

    // Se crop está habilitado, abrir modal
    if (enableCrop) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempImageSrc(e.target?.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Se não tem crop, fazer upload direto
    // Criar preview local imediatamente
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload para o servidor usando apiClient centralizado (com auth automático)
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiClient.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data.data.url;

      console.log('✅ Upload bem-sucedido!', {
        imageUrl,
        fullResponse: response.data,
        currentValue: value,
      });

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

  const handleCropComplete = async (croppedBlob: Blob, croppedUrl: string) => {
    // Mostrar preview local
    setPreview(croppedUrl);

    // Upload da imagem cropada
    try {
      // Converter blob para base64
      const reader = new FileReader();
      reader.readAsDataURL(croppedBlob);
      reader.onload = async () => {
        const base64Image = reader.result as string;

        const response = await apiClient.post('/upload/image-crop', {
          image: base64Image,
          width: cropTargetWidth,
          height: cropTargetHeight,
          quality: 85,
        });

        const imageUrl = response.data.data.url;

        console.log('✅ Upload com crop bem-sucedido!', {
          imageUrl,
          dimensions: `${cropTargetWidth}x${cropTargetHeight}`,
        });

        // Atualizar com URL real do servidor
        setPreview(imageUrl);
        onChange({
          ...value,
          url: imageUrl,
        });
      };
    } catch (error: any) {
      console.error('Erro no upload com crop:', error);
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
    <>
      <div className="space-y-2">
        <Label>{label}</Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}

        {enableCrop && (
          <p className="text-xs text-muted-foreground">
            🔧 Crop ativo: {cropTargetWidth}x{cropTargetHeight}px (Aspecto: {cropAspectRatio.toFixed(2)})
          </p>
        )}

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

    {/* Crop Modal */}
    {enableCrop && (
      <ImageCropModal
        open={cropModalOpen}
        onClose={() => {
          setCropModalOpen(false);
          setTempImageSrc('');
        }}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={cropAspectRatio}
        targetWidth={cropTargetWidth}
        targetHeight={cropTargetHeight}
        title={cropTitle}
      />
    )}
    </>
  );
};
