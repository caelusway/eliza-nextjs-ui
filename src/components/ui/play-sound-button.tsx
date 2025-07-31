'use client';

import { SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { PostHogTracking } from '@/lib/posthog';
import { cleanTextForAudio } from '@/utils/clean-text-for-audio';
import { useAuthenticatedFetch } from '@/lib/authenticated-fetch';

interface PlaySoundButtonProps {
  text: string;
  className?: string;
  onPlay?: () => void;
}

export const PlaySoundButton = ({ text, className, onPlay }: PlaySoundButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const handlePlay = async () => {
    if (isLoading || isPlaying) return;

    // Call the onPlay callback if provided
    onPlay?.();

    try {
      setIsLoading(true);

      // Clean the text - remove citations, links, and other non-speakable content
      const cleanText = cleanTextForAudio(text);

      if (!cleanText) {
        console.warn('[PlaySound] No text to convert after cleaning');
        return;
      }

      // Check text length to prevent very long requests
      if (cleanText.length > 5000) {
        console.warn('[PlaySound] Text too long for TTS:', cleanText.length);
        alert(
          'Text is too long for audio conversion. Please try with shorter text (max 5000 characters).'
        );
        return;
      }

      console.log(
        `[PlaySound] Converting text to speech: "${cleanText.substring(0, 100)}..." (${cleanText.length} chars)`
      );

      // For longer texts, warn user that it might take a while
      if (cleanText.length > 1000) {
        console.log('[PlaySound] Long text detected - this may take a moment');
      }

      const response = await authenticatedFetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: cleanText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[PlaySound] TTS API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(errorData.error || `TTS failed: ${response.status} ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Create new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadstart = () => {
        setIsLoading(false);
        setIsPlaying(true);

        // Track TTS usage
        PostHogTracking.getInstance().textToSpeechUsed(cleanText.length);

        // Check if this is first time using TTS
        const hasUsedTTS = localStorage.getItem('discovered_text_to_speech');
        if (!hasUsedTTS) {
          PostHogTracking.getInstance().featureDiscovered('text_to_speech');
          localStorage.setItem('discovered_text_to_speech', 'true');
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (error) => {
        console.error('[PlaySound] Audio playback error:', error);
        setIsPlaying(false);
        setIsLoading(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error('[PlaySound] Error:', error);
      setIsLoading(false);
      setIsPlaying(false);

      // Show user-friendly error
      alert(`Failed to play audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <button
      type="button"
      onClick={isPlaying ? handleStop : handlePlay}
      disabled={isLoading}
      aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 shrink-0 animate-spin" />
      ) : (
        <SpeakerWaveIcon className={`w-3 h-3 shrink-0 ${isPlaying ? 'text-blue-500' : ''}`} />
      )}
      <span>Play audio</span>
    </button>
  );
};

export default PlaySoundButton;
