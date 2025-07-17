'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TextareaWithActions } from '@/components/ui/textarea-with-actions';
import { useSessions } from '@/contexts/SessionsContext';

interface NewChatWelcomeProps {
  userId: string;
}

const SUGGESTED_PROMPTS = [
  "What drug combinations show synergistic effects for longevity?",
  "Analyze the latest research on NAD+ precursors",
  "Design a compound targeting cellular senescence",
  "Find clinical trials for age-related diseases",
];

export function NewChatWelcome({ userId }: NewChatWelcomeProps) {
  const router = useRouter();
  const { addNewSession } = useSessions();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clickedPrompt, setClickedPrompt] = useState<string | null>(null);

  const handlePromptClick = async (prompt: string) => {
    if (!userId || isLoading) return;

    setClickedPrompt(prompt);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat-session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          initialMessage: prompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create chat session');
      }

      // Add new session to sidebar immediately without API call
      const newSession = {
        id: data.data.sessionId,
        channelId: data.data.channelId,
        title: prompt,
        messageCount: 0,
        lastActivity: new Date().toISOString(),
        preview: prompt.substring(0, 100),
        isFromAgent: false,
        metadata: {
          initialMessage: prompt,
        },
      };
      addNewSession(newSession);

      // Redirect to the new session
      router.push(`/chat/${data.data.sessionId}`);
    } catch (err) {
      console.error('[NewChatWelcome] Error creating session:', err);
      setIsLoading(false);
      setClickedPrompt(null);
    }
  };

  const handleDirectSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    
    if (!userId || !input.trim() || isLoading) return;

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/chat-session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          initialMessage: input.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create chat session');
      }

      // Add new session to sidebar immediately without API call
      const newSession = {
        id: data.data.sessionId,
        channelId: data.data.channelId,
        title: input.trim(),
        messageCount: 0,
        lastActivity: new Date().toISOString(),
        preview: input.trim().substring(0, 100),
        isFromAgent: false,
        metadata: {
          initialMessage: input.trim(),
        },
      };
      addNewSession(newSession);

      // Redirect to the new session
      router.push(`/chat/${data.data.sessionId}`);
    } catch (err) {
      console.error('[NewChatWelcome] Error creating session:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-full p-3 sm:p-4 lg:p-8">
      <div className="w-full max-w-2xl lg:max-w-3xl">
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white mb-3 sm:mb-4 leading-tight">
            Welcome to <span className="text-brand">AUBRAI</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-zinc-600 dark:text-zinc-400 max-w-sm sm:max-w-md lg:max-w-xl mx-auto px-2 sm:px-0">
            Your AI research assistant for longevity science and anti-aging research
          </p>
        </div>

        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-zinc-900 dark:text-white mb-2 sm:mb-3">
              Try asking about:
            </h2>
            <div className="w-8 sm:w-12 h-0.5 bg-brand mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
            {SUGGESTED_PROMPTS.map((prompt, index) => {
              const isPromptLoading = clickedPrompt === prompt;
              return (
                <button
                  key={index}
                  onClick={() => handlePromptClick(prompt)}
                  disabled={isLoading}
                  className={`group relative p-3 sm:p-4 lg:p-5 text-left bg-white dark:bg-zinc-800 rounded-lg sm:rounded-xl border border-zinc-200 dark:border-zinc-600 transition-all duration-200 cursor-pointer ${
                    isLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:shadow-md hover:border-brand/30'
                  } ${
                    isPromptLoading
                      ? 'bg-brand/10 border-brand/50 dark:bg-brand/20'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center w-4 sm:w-5 h-4 sm:h-5 mt-1">
                      {isPromptLoading ? (
                        <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-brand rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white leading-relaxed">
                      {prompt}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <div className="mb-4 sm:mb-6">
            <TextareaWithActions
              input={input}
              onInputChange={(e) => setInput(e.target.value)}
              onSubmit={handleDirectSubmit}
              isLoading={isLoading}
              placeholder="Ask me anything about longevity research, anti-aging therapies, or health optimization..."
              disabled={isLoading}
            />
          </div>
          
          {/* Loading feedback */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-brand text-sm">
              <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
              <span>Creating your chat session...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 