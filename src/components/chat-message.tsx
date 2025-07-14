import { ArrowRightIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { memo, useState } from 'react';
import Image from 'next/image';

import { CodeBlock } from '@/components/code-block';
import { MemoizedMarkdown } from '@/components/memoized-markdown';
import { PaperCard } from '@/components/paper-card';
import PlaySoundButton from '@/components/play-sound-button';
import { ChatMessage as ChatMessageType } from '@/types/chat-message';
import { assert } from '@/utils/assert';

// Get agent ID from environment
const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID;

// Helper function to check if message is from agent
const isAgentMessage = (message: ChatMessageType) => {
  return message.senderId === AGENT_ID;
};

// Helper function to check if message is from user
const isUserMessage = (message: ChatMessageType) => {
  return message.senderId !== AGENT_ID;
};

interface ChatMessageProps {
  message: ChatMessageType;
  i: number;
  followUpPrompts?: string[];
  onFollowUpClick?: (prompt: string) => void;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  i,
  followUpPrompts,
  onFollowUpClick,
}: ChatMessageProps) {
  const [showAllPapers, setShowAllPapers] = useState(false);

  assert(
    message && typeof message === 'object',
    `[ChatMessage Render] Invalid 'message' prop: ${typeof message}`
  );
  if (!message) return null;
  assert(
    typeof message.name === 'string',
    `[ChatMessage Render] Invalid message.name: ${typeof message.name}`
  );
  assert(
    typeof message.text === 'string' || message.text === null || message.text === undefined,
    `[ChatMessage Render] Invalid message.text: ${typeof message.text}`
  );
  assert(typeof i === 'number', `[ChatMessage Render] Invalid 'i' prop: ${typeof i}`);
  assert(
    !followUpPrompts || Array.isArray(followUpPrompts),
    `[ChatMessage Render] Invalid 'followUpPrompts' prop type: ${typeof followUpPrompts}`
  );
  assert(
    !onFollowUpClick || typeof onFollowUpClick === 'function',
    `[ChatMessage Render] Invalid 'onFollowUpClick' prop type: ${typeof onFollowUpClick}`
  );

  const markdownOptions = {
    forceBlock: true,
    overrides: {
      code: {
        component: CodeBlock,
      },
    },
  };

  const formattedTime = new Date(message.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div
      className={clsx(
        'w-full max-w-full overflow-hidden',
        isUserMessage(message) && i !== 0
          ? 'border-t pt-4 border-zinc-950/5 dark:border-white/5'
          : ''
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8">
          <Image
            src={
              isUserMessage(message)
                ? '/assets/user.png'
                : process.env.NEXT_PUBLIC_AGENT_LOGO || '/assets/bot.png'
            }
            alt={`${message.name} logo`}
            width={64}
            height={64}
            className="rounded-full"
          />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm md:text-base lg:text-lg text-zinc-700 dark:text-zinc-300 font-bold">
              {isUserMessage(message) ? 'User' : process.env.NEXT_PUBLIC_AGENT_NAME}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{formattedTime}</span>
          </div>
          <div className="font-mono text-white">
            <div
              className={clsx(
                'prose prose-zinc dark:prose-invert !max-w-full',
                'prose-headings:mt-0 prose-headings:mb-0 prose-headings:my-0 prose-p:mt-0',
                // Responsive text sizing
                'prose-sm md:prose-base lg:prose-lg',
                // Override specific elements for better mobile readability
                'prose-p:text-sm md:prose-p:text-base lg:prose-p:text-lg',
                'prose-li:text-sm md:prose-li:text-base lg:prose-li:text-lg',
                'prose-code:text-xs md:prose-code:text-sm lg:prose-code:text-base',
                // Prevent overflow
                'overflow-hidden break-words'
              )}
            >
              <MemoizedMarkdown
                id={message.id || `msg-${i}-${message.createdAt}`}
                content={message.text ?? ''}
                options={markdownOptions}
              />
            </div>
          </div>

          {/* Play Sound Button - only for agent messages */}
          {isAgentMessage(message) && message.text && message.text.trim() && (
            <div className="flex items-center gap-2 mt-2">
              <PlaySoundButton text={message.text} />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Play audio</span>
            </div>
          )}

          {isAgentMessage(message) && followUpPrompts?.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-col divide-y divide-zinc-950/5 dark:divide-white/5">
                {followUpPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => onFollowUpClick?.(prompt)}
                    className={clsx([
                      'flex items-center justify-between',
                      'py-2',
                      'bg-transparent',
                      'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200',
                      'transition-colors',
                      'group cursor-pointer',
                      'text-left text-xs md:text-sm lg:text-base',
                      'w-full',
                    ])}
                  >
                    <span>{prompt}</span>
                    <ArrowRightIcon className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Papers Section */}
          {isAgentMessage(message) && message.papers && message.papers.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs md:text-sm lg:text-base font-medium text-zinc-700 dark:text-zinc-300">
                  RELEVANT PAPERS ({message.papers.length})
                </span>
                {message.papers.length > 3 && (
                  <button
                    onClick={() => setShowAllPapers(!showAllPapers)}
                    className="flex items-center gap-1 text-xs md:text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    {showAllPapers ? (
                      <>
                        <span>Show less</span>
                        <ChevronUpIcon className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <span>View all</span>
                        <ChevronDownIcon className="w-3 h-3" />
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-2 max-w-full overflow-hidden">
                {(showAllPapers ? message.papers : message.papers.slice(0, 3)).map(
                  (paper, index) => (
                    <div key={`${paper.doi}-${index}`} className="w-full min-w-0">
                      <PaperCard paper={paper} />
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
