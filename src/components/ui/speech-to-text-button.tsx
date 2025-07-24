'use client';
import React, { useState, useRef, useCallback } from 'react';
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import clsx from 'clsx';

interface SpeechToTextButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function SpeechToTextButton({
  onTranscript,
  disabled = false,
  className,
}: SpeechToTextButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      const transcript = data.text || data.transcript || '';
      console.log('Received transcript:', transcript);

      if (transcript) {
        onTranscript(transcript);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
    } finally {
      setIsTranscribing(false);
    }
  }, [onTranscript]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [transcribeAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled || isTranscribing}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      className={clsx(
        'size-10 rounded-lg border focus:outline-none transition-colors duration-200 relative',
        isRecording && !disabled
          ? 'bg-brand hover:bg-brand-hover border-brand text-white shadow-md shadow-brand/20'
          : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-300',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isTranscribing ? (
        <div className="flex space-x-0.5">
          <div className="w-1 h-1 bg-current rounded-full opacity-60" />
          <div className="w-1 h-1 bg-current rounded-full opacity-80" />
          <div className="w-1 h-1 bg-current rounded-full" />
        </div>
      ) : (
        <MicrophoneIcon className={clsx(
          "!h-5 !w-5 !shrink-0",
          isRecording && !disabled 
            ? "text-white" 
            : "text-zinc-400"
        )} />
      )}
      
      {/* Clean recording indicator */}
      {isRecording && !disabled && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </Button>
  );
}

export { SpeechToTextButton };
