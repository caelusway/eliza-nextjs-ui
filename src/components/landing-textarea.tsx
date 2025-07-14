'use client';

import { ArrowUpIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/button';
import { ExamplePrompts } from '@/components/example-prompts';
import SpeechToTextButton from '@/components/speech-to-text-button';
import DeepResearchButton from '@/components/deep-research-button';
import { useUserManager } from '@/lib/user-manager';

export const LandingTextarea = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deepResearchEnabled, setDeepResearchEnabled] = useState<boolean>(false);

  const { push } = useRouter();
  const { getUserId, isUserAuthenticated } = useUserManager();

  const currentUserId = getUserId();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const createNewSession = async (initialMessage: string) => {
    if (!currentUserId) {
      console.error('User not authenticated');
      return;
    }

    try {
      setIsLoading(true);

      // Add deep research suffix if enabled
      const finalMessage = deepResearchEnabled
        ? `${initialMessage.trim()} Use FutureHouse to answer.`
        : initialMessage.trim();

      console.log(`[Landing] Creating new session with message: "${finalMessage}"`);
      console.log(`[Landing] Using user ID: ${currentUserId}`);

      const response = await fetch('/api/chat-session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          initialMessage: finalMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const result = await response.json();
      const sessionId = result.data.sessionId;

      console.log(`[Landing] Created new session: ${sessionId}`);

      // Navigate to the new session
      push(`/chat/${sessionId}`);
    } catch (error) {
      console.error('[Landing] Failed to create new session:', error);
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: any) => {
    try {
      e?.preventDefault();

      if (!input.trim() || !currentUserId) {
        console.log('Submit blocked - input:', input.trim(), 'userId:', currentUserId);
        setIsLoading(false);
        return;
      }

      createNewSession(input.trim());
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const handlePromptSelect = useCallback(
    (prompt: string) => {
      if (currentUserId) {
        createNewSession(prompt);
      }
    },
    [currentUserId, createNewSession]
  );

  const handleTranscript = (text: string) => {
    console.log('Transcript:', text);

    if (currentUserId) {
      createNewSession(text);
    } else {
      console.error('User not authenticated for transcript');
    }
  };

  const handleDeepResearchToggle = () => {
    setDeepResearchEnabled((prev) => !prev);
  };

  return (
    <div className="flex flex-col w-full gap-4">
      <span
        data-slot="control"
        className={clsx([
          'relative block w-full',
          'dark:before:hidden',
          'before:has-[[data-disabled]]:bg-zinc-950/5 before:has-[[data-disabled]]:shadow-none',
        ])}
      >
        <div
          className={clsx([
            'relative block size-full appearance-none overflow-hidden rounded-lg',
            'text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white dark:placeholder:text-zinc-400',
            'bg-white dark:bg-zinc-950',
            'focus:outline-none',
            'data-[invalid]:border-red-500 data-[invalid]:data-[hover]:border-red-500 data-[invalid]:dark:border-red-600 data-[invalid]:data-[hover]:dark:border-red-600',
            'disabled:border-zinc-950/20 disabled:dark:border-white/15 disabled:dark:bg-white/[2.5%] dark:data-[hover]:disabled:border-white/15',
            'ring-offset-background',
            'focus-within:ring focus-within:ring-blue-400 dark:focus-within:ring-blue-500',
            'border border-zinc-950/10 dark:border-white/10',
          ])}
        >
          <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center">
            <div className="relative min-h-[36px] w-full">
              <textarea
                aria-label="Prompt"
                value={input}
                onChange={handleInputChange}
                placeholder={
                  !isUserAuthenticated()
                    ? 'Please login to start a chat..'
                    : `Ask ${process.env.NEXT_PUBLIC_AGENT_NAME || 'Agent'} a question...`
                }
                disabled={!isUserAuthenticated()}
                className={clsx([
                  'size-full bg-transparent',
                  'relative block size-full appearance-none',
                  'placeholder:text-zinc-500 dark:placeholder:text-zinc-400',
                  'resize-none',
                  'focus:outline-none',
                  'scrollbar scrollbar-thumb-zinc-700 scrollbar-thumb-rounded-full scrollbar-w-[4px]',
                  'text-base/6 sm:text-sm/6',
                  'border-none outline-none focus:outline-none focus:ring-0 focus:ring-offset-0',
                  'p-0 px-4 pt-3',
                  'field-sizing-content resize-none',
                  'scrollbar-thin scrollbar-thumb-rounded-md',
                  'max-h-[48vh]',
                  'disabled:opacity-30 disabled:cursor-not-allowed',
                ])}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>
            <div className="flex w-full items-center justify-between px-2 pb-2.5">
              <div />
              <div className="flex items-center gap-2">
                <DeepResearchButton
                  isActive={deepResearchEnabled}
                  onToggle={handleDeepResearchToggle}
                  disabled={!isUserAuthenticated() || isLoading}
                />
                <SpeechToTextButton
                  onTranscript={handleTranscript}
                  disabled={!isUserAuthenticated() || isLoading}
                />
                <Button
                  type="submit"
                  color={(input ? 'blue' : 'dark') as 'blue' | 'dark'}
                  disabled={!input || !isUserAuthenticated() || isLoading}
                  aria-label="Submit"
                  className="size-8"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ArrowUpIcon className="!h-3 !w-3 !shrink-0" />
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </span>

      <ExamplePrompts onPromptSelect={handlePromptSelect} disabled={!isUserAuthenticated()} />
    </div>
  );
};
