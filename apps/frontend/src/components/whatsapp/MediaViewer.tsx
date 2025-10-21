/**
 * MediaViewer - Visualizador de mídia (imagens, vídeos, áudios, documentos)
 */

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface MediaViewerProps {
  type: 'image' | 'video' | 'audio' | 'ptt' | 'document' | 'sticker';
  url: string;
  filename?: string;
  onDownload?: () => void;
}

const MediaViewer = ({ type, url, filename, onDownload }: MediaViewerProps) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration);

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', () => setIsPlaying(false));

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Image
  if (type === 'image') {
    return (
      <>
        <div
          className="relative cursor-pointer group"
          onClick={() => setIsLightboxOpen(true)}
        >
          <img
            src={url}
            alt="Imagem"
            className="max-w-sm max-h-64 rounded-lg object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
        </div>

        <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <DialogContent className="max-w-4xl">
            <img
              src={url}
              alt="Imagem"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            {onDownload && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onDownload}
                className="absolute top-4 right-4"
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar
              </Button>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Video
  if (type === 'video') {
    return (
      <div className="relative max-w-sm">
        <video
          ref={videoRef}
          src={url}
          controls
          className="w-full rounded-lg"
        />
        {onDownload && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onDownload}
            className="absolute top-2 right-2"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // Audio & PTT (Push-to-Talk)
  if (type === 'audio' || type === 'ptt') {
    return (
      <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-full max-w-xs">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 text-green-600" />
          ) : (
            <Play className="h-4 w-4 text-green-600" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="h-1 bg-green-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{
                width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
              }}
            />
          </div>
        </div>

        <span className="text-xs text-green-600 font-medium flex-shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <audio ref={audioRef} src={url} />

        {onDownload && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onDownload}
          >
            <Download className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  // Sticker
  if (type === 'sticker') {
    return (
      <div className="relative">
        <img
          src={url}
          alt="Sticker"
          className="max-w-[150px] max-h-[150px] object-contain"
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>
    );
  }

  // Document
  if (type === 'document') {
    return (
      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg max-w-xs">
        <FileText className="h-10 w-10 text-blue-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{filename || 'Documento'}</p>
          <p className="text-xs text-gray-500">Documento</p>
        </div>
        {onDownload && (
          <Button variant="ghost" size="icon" onClick={onDownload}>
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return null;
};

export default MediaViewer;
