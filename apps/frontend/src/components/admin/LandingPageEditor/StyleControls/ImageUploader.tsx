/**
 * ImageUploader - Upload e gerenciamento de imagens
 *
 * MELHORIAS (FASE 4):
 * - Loading state visual durante upload
 * - Retry automático em caso de falha
 * - Confirmação antes de remover imagem
 * - Backup da imagem antiga antes de substituir
 * - Melhor tratamento de erros
 */

import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, Crop, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { ImageConfig } from '@/types/landingPage';
import { apiClient } from '@/lib/apiClient';
import { ImageCropModal } from '@/components/ImageCropModal';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  // FASE 4: Novos estados
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previousImage, setPreviousImage] = useState<ImageConfig | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  /**
   * FASE 4: Upload com retry automático e logging detalhado
   */
  const uploadImage = async (file: File, attempt = 1): Promise<string> => {
    const timestamp = Date.now();
    console.log(`[ImageUploader] 🔄 Upload tentativa ${attempt}/${MAX_RETRIES}`, {
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`,
      fileType: file.type,
    });

    try {
      setUploadProgress(10);

      const formData = new FormData();
      formData.append('image', file);

      setUploadProgress(30);

      const response = await apiClient.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(Math.min(percentCompleted, 90));
          }
        },
      });

      setUploadProgress(100);

      const imageUrl = response.data.data.url;

      console.log(`[ImageUploader] ✅ Upload bem-sucedido em ${Date.now() - timestamp}ms`, {
        imageUrl,
        attempt,
      });

      return imageUrl;
    } catch (error: any) {
      console.error(`[ImageUploader] ❌ Erro na tentativa ${attempt}:`, error);

      // Retry automático se não excedeu o limite
      if (attempt < MAX_RETRIES) {
        const retryDelay = attempt * 1000; // 1s, 2s, 3s
        console.log(`[ImageUploader] ⏳ Tentando novamente em ${retryDelay}ms...`);

        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return uploadImage(file, attempt + 1);
      }

      throw error;
    }
  };

  const handleFileSelect = async (file: File) => {
    // Reset error state
    setUploadError(null);
    setRetryCount(0);

    if (!acceptedFormats.includes(file.type)) {
      setUploadError('Formato de arquivo não suportado. Use JPG, PNG, WebP ou SVG.');
      return;
    }

    // Validar tamanho do arquivo (máx 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB em bytes
    if (file.size > maxSize) {
      setUploadError(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo: 5MB.`);
      return;
    }

    // FASE 4: Backup da imagem anterior antes de substituir
    if (value.url) {
      setPreviousImage({ ...value });
      console.log('[ImageUploader] 💾 Backup da imagem anterior criado:', value.url);
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
    setIsUploading(true);
    setUploadProgress(0);

    // Criar preview local imediatamente
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const imageUrl = await uploadImage(file);

      // Atualizar com URL real do servidor
      setPreview(imageUrl);
      onChange({
        ...value,
        url: imageUrl,
      });

      setUploadError(null);
    } catch (error: any) {
      console.error('[ImageUploader] ❌ Upload falhou após todas as tentativas:', error);

      const errorMsg = error.response?.data?.message || 'Erro ao fazer upload da imagem após múltiplas tentativas.';
      setUploadError(errorMsg);

      // Restaurar preview anterior se houver
      if (previousImage) {
        setPreview(previousImage.url);
        console.log('[ImageUploader] ↩️ Imagem anterior restaurada');
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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

  /**
   * FASE 4: Confirmação antes de remover imagem
   */
  const handleClear = () => {
    if (!value.url) return;

    const confirmMessage = previousImage
      ? 'Tem certeza que deseja remover esta imagem? Uma versão anterior foi salva e poderá ser restaurada.'
      : 'Tem certeza que deseja remover esta imagem? Esta ação não pode ser desfeita.';

    if (!confirm(confirmMessage)) {
      return;
    }

    console.log('[ImageUploader] 🗑️ Removendo imagem:', value.url);

    // Salvar como backup antes de limpar
    if (value.url && !previousImage) {
      setPreviousImage({ ...value });
    }

    setPreview('');
    onChange({
      ...value,
      url: '',
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setUploadError(null);
  };

  /**
   * FASE 4: Restaurar imagem anterior (undo)
   */
  const handleRestorePrevious = () => {
    if (!previousImage) return;

    console.log('[ImageUploader] ↩️ Restaurando imagem anterior:', previousImage.url);

    setPreview(previousImage.url);
    onChange(previousImage);
    setPreviousImage(null);
    setUploadError(null);
  };

  /**
   * FASE 4: Retry manual do upload
   */
  const handleRetryUpload = () => {
    if (fileInputRef.current?.files?.[0]) {
      handleFileSelect(fileInputRef.current.files[0]);
    } else {
      fileInputRef.current?.click();
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

        {/* FASE 4: Erro de Upload */}
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{uploadError}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryUpload}
                className="ml-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Tentar Novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* FASE 4: Botão para restaurar imagem anterior */}
        {previousImage && !preview && (
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm">Imagem anterior disponível para restauração</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestorePrevious}
              >
                ↩️ Restaurar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Preview com Loading State */}
        {preview && (
          <div className="relative rounded-lg border overflow-hidden bg-muted">
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
                <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
                <p className="text-white text-sm font-medium">
                  Enviando imagem... {uploadProgress}%
                </p>
                <div className="w-3/4 h-2 bg-gray-300 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
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
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
            {previousImage && (
              <Button
                size="sm"
                variant="secondary"
                className="absolute bottom-2 right-2"
                onClick={handleRestorePrevious}
                disabled={isUploading}
              >
                ↩️ Desfazer
              </Button>
            )}
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
