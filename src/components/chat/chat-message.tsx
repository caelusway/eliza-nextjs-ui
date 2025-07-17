import { ArrowRightIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { memo, useState } from 'react';

import { CodeBlock } from '@/components/ui';
import { MemoizedMarkdown } from '@/components/ui';
import { PaperCard } from '@/components/ui';
import { PlaySoundButton } from '@/components/ui';
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
        isAgentMessage(message) ? 'mb-6' : 'mb-2'
      )}
    >
      <div className={clsx(
        'flex items-start gap-3',
        isUserMessage(message) ? 'flex-row-reverse' : 'flex-row'
      )}>

        <div className={clsx(
          'flex-1 min-w-0 overflow-hidden',
          isUserMessage(message) ? 'flex flex-col items-end max-w-[80%]' : 'flex flex-col items-start max-w-[90%]'
        )}>
                     <div className={clsx(
             'font-inter rounded-2xl shadow-sm max-w-full',
             isUserMessage(message) 
               ? 'bg-zinc-100 text-white dark:bg-zinc-800 dark:shadow-lg px-4 py-3' 
               : ' text-zinc-800 dark:text-zinc-200 backdrop-blur-sm dark:shadow-xl px-6 py-6'
           )}>
            <div
              className={clsx(
                'prose prose-zinc !max-w-full',
                'prose-headings:mt-0 prose-headings:mb-0 prose-headings:my-0 prose-p:mt-0 prose-p:mb-0',
                // Use consistent font and sizing
                'prose-base font-inter',
                // Override specific elements for better consistency
                'prose-code:text-sm prose-code:font-mono',
                'prose-h1:text-lg prose-h1:font-inter prose-h1:font-bold',
                'prose-h2:text-base prose-h2:font-inter prose-h2:font-bold',
                'prose-h3:text-base prose-h3:font-inter prose-h3:font-semibold',
                // Prevent overflow and improve text wrapping
                'overflow-hidden break-words hyphens-auto',
                // Color overrides based on message type - using zinc palette
                isUserMessage(message) 
                  ? 'prose-invert prose-p:text-white prose-li:text-white prose-headings:text-white prose-strong:text-white prose-em:text-zinc-200'
                  : 'dark:prose-invert prose-p:text-zinc-900 dark:prose-p:text-zinc-100 prose-li:text-zinc-900 dark:prose-li:text-zinc-100 prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100 prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-em:text-zinc-700 dark:prose-em:text-zinc-300'
              )}
            >
              <MemoizedMarkdown
                id={message.id || `msg-${i}-${message.createdAt}`}
                content={message.text ?? ''}
                options={markdownOptions}
              />
            </div>
          </div>
          
          {/* Timestamp below the message bubble */}
          <div className={clsx(
            'text-xs font-inter text-zinc-500 dark:text-zinc-400 mt-1 px-2',
            isUserMessage(message) ? 'text-right' : 'text-left'
          )}>
            {formattedTime}
          </div>

          {/* Play Sound Button - only for agent messages */}
          {isAgentMessage(message) && message.text && message.text.trim() && (
            <div className="flex items-center gap-2 mt-2">
              <PlaySoundButton text={message.text} />
                             <span className="text-xs font-inter text-zinc-500 dark:text-zinc-400">Play audio</span>
            </div>
          )}

          {/* Follow-up prompts - only for agent messages */}
          {isAgentMessage(message) && followUpPrompts?.length > 0 && (
            <div className="mt-2 w-full">
              <div className="flex flex-col divide-y divide-zinc-950/5 dark:divide-white/5">
                {followUpPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => onFollowUpClick?.(prompt)}
                    className={clsx([
                      'flex items-center justify-between',
                      'py-2',
                      'bg-transparent',
                                             'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
                      'font-inter text-base',
                      'transition-colors',
                      'group cursor-pointer',
                      'text-left',
                      'w-full',
                    ])}
                  >
                    <span>{prompt}</span>
                    <ArrowRightIcon className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Papers Section - only for agent messages */}
          {isAgentMessage(message) && message.papers && message.papers.length > 0 && (
            <div className="mt-4 w-full">
              <div className="flex items-center gap-2 mb-3">
                                 <span className="text-sm font-inter font-medium text-zinc-900 dark:text-zinc-100">
                   RELEVANT PAPERS ({message.papers.length})
                 </span>
                {message.papers.length > 3 && (
                  <button
                    onClick={() => setShowAllPapers(!showAllPapers)}
                                         className="flex items-center gap-1 text-sm font-inter text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
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
