import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ImageCropModalProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob, croppedImageUrl: string) => void;
  aspectRatio?: number;
  cropShape?: 'rect' | 'round';
  title?: string;
  targetWidth?: number;
  targetHeight?: number;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  open,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 16 / 9,
  cropShape = 'rect',
  title = 'Recortar Imagem',
  targetWidth = 1200,
  targetHeight = 675,
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [quality, setQuality] = useState(85);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && imageSrc) {
      // Reset crop when modal opens
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [open, imageSrc]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspectRatio));
  }

  async function handleCropConfirm() {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Set canvas size to target dimensions
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Calculate crop dimensions in natural size
    const sourceX = crop.x * scaleX;
    const sourceY = crop.y * scaleY;
    const sourceWidth = crop.width * scaleX;
    const sourceHeight = crop.height * scaleY;

    // Draw the cropped and resized image
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );

    // Convert canvas to blob with quality setting
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('Falha ao criar blob da imagem');
          return;
        }
        const croppedImageUrl = URL.createObjectURL(blob);
        onCropComplete(blob, croppedImageUrl);
        onClose();
      },
      'image/jpeg',
      quality / 100
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Crop Area */}
          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              circularCrop={cropShape === 'round'}
            >
              <img
                ref={imgRef}
                alt="Imagem para recortar"
                src={imageSrc}
                onLoad={onImageLoad}
                className="max-h-[400px] w-auto"
              />
            </ReactCrop>
          </div>

          {/* Quality Slider */}
          <div className="space-y-2">
            <Label htmlFor="quality">
              Qualidade: {quality}%
            </Label>
            <Slider
              id="quality"
              min={10}
              max={100}
              step={5}
              value={[quality]}
              onValueChange={(value) => setQuality(value[0])}
            />
            <p className="text-xs text-muted-foreground">
              Dimensões finais: {targetWidth}x{targetHeight}px
            </p>
          </div>

          {/* Hidden Canvas for Processing */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleCropConfirm} disabled={!completedCrop}>
            Confirmar Recorte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
