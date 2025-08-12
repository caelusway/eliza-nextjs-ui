'use client';
import React, { useState, useRef, useCallback } from 'react';
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import clsx from 'clsx';
import { PostHogTracking } from '@/lib/posthog';
import { useAuthenticatedFetch } from '@/lib/authenticated-fetch';

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
  const recordingStartTimeRef = useRef<number | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const transcribeAudio = useCallback(
    async (audioBlob: Blob) => {
      setIsTranscribing(true);
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        const res = await authenticatedFetch('/api/transcribe', {
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
    },
    [onTranscript, authenticatedFetch]
  );

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
      recordingStartTimeRef.current = Date.now();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [transcribeAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      const duration = recordingStartTimeRef.current
        ? Date.now() - recordingStartTimeRef.current
        : 0;

      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Track voice message recording
      PostHogTracking.getInstance().voiceMessageRecorded(duration);

      // Check if this is first time using voice feature
      const hasUsedVoice = localStorage.getItem('discovered_voice_recording');
      if (!hasUsedVoice) {
        PostHogTracking.getInstance().featureDiscovered('voice_recording');
        localStorage.setItem('discovered_voice_recording', 'true');
      }
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
        'size-6 rounded-lg border focus:outline-none transition-colors duration-200 relative',
        isRecording && !disabled
          ? 'bg-brand hover:bg-brand-hover border-brand text-white shadow-md shadow-brand/20'
          : 'bg-black hover:bg-black/80 border-white/20 hover:border-white/40 text-[#757575] hover:text-white',
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
        <MicrophoneIcon
          className={clsx(
            '!h-4 !w-4 !shrink-0',
            isRecording && !disabled ? 'text-white' : 'text-[#757575]'
          )}
        />
      )}

      {/* Clean recording indicator */}
      {isRecording && !disabled && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </Button>
  );
}

export { SpeechToTextButton };
