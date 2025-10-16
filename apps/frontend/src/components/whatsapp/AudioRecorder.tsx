/**
 * AudioRecorder - Gravador de áudio PTT (Push-to-Talk) para WhatsApp
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, X, Send, Loader2 } from 'lucide-react';
import api from '@/lib/apiClient';
import { toast } from 'sonner';

interface AudioRecorderProps {
  conversationPhone: string;
  onAudioSent?: () => void;
}

const AudioRecorder = ({ conversationPhone, onAudioSent }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error('Erro ao acessar o microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    audioChunksRef.current = [];
    setDuration(0);
  };

  const sendAudio = async () => {
    stopRecording();

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });

    setIsSending(true);
    try {
      // Upload áudio
      const formData = new FormData();
      formData.append('file', audioFile);

      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const audioPath = uploadResponse.data.filePath;

      // Enviar via WhatsApp
      await api.post('/whatsapp/extended/messages/audio', {
        to: conversationPhone,
        audioPath,
        ptt: true, // Push-to-Talk
      });

      toast.success('Áudio enviado!');
      audioChunksRef.current = [];
      setDuration(0);
      onAudioSent?.();
    } catch (error: any) {
      console.error('Erro ao enviar áudio:', error);
      toast.error('Erro ao enviar áudio');
    } finally {
      setIsSending(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isSending) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-full">
        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
        <span className="text-sm text-green-600">Enviando...</span>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-full">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-red-600">
            {formatDuration(duration)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={cancelRecording}
        >
          <X className="h-5 w-5 text-red-600" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={sendAudio}
        >
          <Send className="h-5 w-5 text-green-600" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={startRecording}
      className="text-gray-500 hover:text-green-600"
    >
      <Mic className="h-5 w-5" />
    </Button>
  );
};

export default AudioRecorder;
