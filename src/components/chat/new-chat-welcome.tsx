'use client';

import { Button } from '@/components/ui';
import { useRouter } from 'next/navigation';

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

  const handlePromptClick = async (prompt: string) => {
    if (!userId) return;

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

      // Redirect to the new session
      router.push(`/chat/${data.data.sessionId}`);
    } catch (err) {
      console.error('[NewChatWelcome] Error creating session:', err);
    }
  };

  const handleNewChat = async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/chat-session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          initialMessage: 'Hello! I would like to chat about longevity research.',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create chat session');
      }

      // Redirect to the new session
      router.push(`/chat/${data.data.sessionId}`);
    } catch (err) {
      console.error('[NewChatWelcome] Error creating session:', err);
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
            {SUGGESTED_PROMPTS.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handlePromptClick(prompt)}
                className="group relative p-3 sm:p-4 lg:p-5 text-left bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg sm:rounded-xl border border-zinc-200 dark:border-zinc-600 transition-all duration-200 hover:shadow-md hover:border-brand/30 cursor-pointer"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex-shrink-0 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-brand rounded-full mt-1.5 sm:mt-2 opacity-60 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white leading-relaxed">
                    {prompt}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
            <p className="text-zinc-700 dark:text-zinc-300 mb-4 sm:mb-6 text-sm sm:text-base lg:text-lg">
              Ready to start your research journey?
            </p>
            <Button
              color="brand"
              onClick={handleNewChat}
              className="px-3 sm:px-5 lg:px-7 py-2 sm:py-1.5 lg:py-2.5 text-xs sm:text-sm lg:text-base font-medium rounded-md sm:rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              Start New Chat
            </Button>
          </div>
          
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 px-2 sm:px-0">
            Ask me anything about longevity research, anti-aging therapies, or health optimization
          </p>
        </div>
      </div>
    </div>
  );
} 