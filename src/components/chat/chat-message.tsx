import { ArrowRightIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { memo, useState } from 'react';

import { CodeBlock, toast, ChatMarkdown } from '@/components/ui';
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
    <div className="w-full max-w-full overflow-hidden mb-3">
      {isUserMessage(message) ? (
        // User Message - Right aligned with bubble
        <div className="flex justify-end mb-2">
          <div className="flex flex-col items-end max-w-[80%]">
            <div className="bg-zinc-100 dark:bg-zinc-800 text-white rounded-2xl px-4 py-3 shadow-sm">
              <div className="text-white">
                <ChatMarkdown content={message.text ?? ''} />
              </div>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 px-2">
              {formattedTime}
            </div>
          </div>
        </div>
      ) : (
        // Agent Message - ChatGPT-like design
        <div className="flex items-start gap-4 mb-3">


                      {/* Message Content */}
            <div className="flex-1 min-w-0">
              <ChatMarkdown content={message.text ?? ''} />

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-3">
              {/* Play Sound Button */}
              {message.text && message.text.trim() && (
                <div className="flex items-center gap-1">
                  <PlaySoundButton text={message.text} />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Play audio</span>
                </div>
              )}

                             {/* Copy Button */}
               <button
                 onClick={() => {
                   if (message.text) {
                     navigator.clipboard.writeText(message.text);
                     toast.success('Copied to clipboard');
                   }
                 }}
                 className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
               >
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                 </svg>
                 <span>Copy</span>
               </button>

            </div>

            {/* Follow-up prompts */}
            {followUpPrompts?.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-2 font-medium">
                  Suggested follow-ups:
                </div>
                                 <div className="flex flex-wrap gap-2">
                   {followUpPrompts.map((prompt, index) => (
                     <button
                       key={index}
                       onClick={() => onFollowUpClick?.(prompt)}
                       className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-full transition-colors border border-zinc-300 dark:border-zinc-600"
                     >
                       <span>{prompt}</span>
                       <ArrowRightIcon className="w-3 h-3" />
                     </button>
                   ))}
                 </div>
              </div>
            )}

            {/* Papers Section */}
            {message.papers && message.papers.length > 0 && (
              <div className="mt-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Research Papers ({message.papers.length})
                  </span>
                  {message.papers.length > 3 && (
                                         <button
                       onClick={() => setShowAllPapers(!showAllPapers)}
                       className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
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

                <div className="space-y-2">
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
      )}
    </div>
  );
});
