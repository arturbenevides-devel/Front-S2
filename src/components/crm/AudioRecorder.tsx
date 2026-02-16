import { useState, useRef, useCallback } from 'react';
import { Mic, Square, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
  onSend: (audioBase64: string) => Promise<void>;
  sending: boolean;
}

export function AudioRecorder({ onSend, sending }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      
      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }, []);

  const stopAndSend = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          await onSend(base64);
          resolve();
        };
        reader.readAsDataURL(blob);

        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current!.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    });
  }, [onSend]);

  const cancel = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    setDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (sending) {
    return (
      <Button size="icon" variant="ghost" disabled className="h-8 w-8 sm:h-10 sm:w-10">
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2 flex-1">
        <Button size="icon" variant="ghost" onClick={cancel} className="h-8 w-8 text-destructive">
          <X className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm text-destructive font-medium">{formatTime(duration)}</span>
        </div>
        <Button size="icon" onClick={stopAndSend} className="h-8 w-8 sm:h-10 sm:w-10 bg-primary hover:bg-primary/90">
          <Square className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={startRecording}
      className="text-muted-foreground hover:text-primary h-8 w-8 sm:h-10 sm:w-10"
    >
      <Mic className="h-5 w-5" />
    </Button>
  );
}
