import { ArrowRightIcon, ChevronDownIcon, ChevronUpIcon, HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpIconSolid, HandThumbDownIcon as HandThumbDownIconSolid } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { memo, useState, useEffect } from 'react';

import { CodeBlock, toast, ChatMarkdown } from '@/components/ui';
import { PaperCard } from '@/components/ui';
import { PlaySoundButton } from '@/components/ui';
import { ChatMessage as ChatMessageType } from '@/types/chat-message';
import { assert } from '@/utils/assert';
import { useUserManager } from '@/lib/user-manager';
import { getUserRowIdByPrivyId } from '@/services/user-service';
import { getVoteStats, getUserVote, toggleVote } from '@/services/vote-service';
import { VoteStats } from '@/lib/supabase/types';

// Get agent ID from environment
const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID;
console.log('[ChatMessage] AGENT_ID loaded:', AGENT_ID);

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
  
  // Voting state
  const [vote, setVote] = useState<'up' | 'down' | null>(message.userVote || null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteStats, setVoteStats] = useState<VoteStats | null>(null);
  const [loadingVotes, setLoadingVotes] = useState(false);
  
  // User management
  const { getUserId, isUserAuthenticated } = useUserManager();
  const [userRowId, setUserRowId] = useState<string | null>(null);
  
  const userId = getUserId();
  const authenticated = isUserAuthenticated();
  const responseId = message.responseId || message.id; // Use responseId if available, fallback to message id
  
  // Debug logging
  console.log('[ChatMessage] Render:', { 
    messageId: message.id, 
    senderId: message.senderId, 
    isAgent: isAgentMessage(message), 
    authenticated, 
    userId,
    userRowId 
  });

  // Get user's database row ID for voting
  useEffect(() => {
    const fetchUserRowId = async () => {
      console.log('[ChatMessage] fetchUserRowId called:', { authenticated, userId });
      if (authenticated && userId) {
        try {
          console.log('[ChatMessage] Fetching user row ID for userId:', userId);
          const rowId = await getUserRowIdByPrivyId(userId);
          console.log('[ChatMessage] Got user row ID:', rowId);
          
          if (!rowId) {
            console.log('[ChatMessage] No user row ID found, attempting to create user in Supabase...');
            // Import ensureSupabaseUser dynamically to avoid circular dependencies
            const { ensureSupabaseUser } = await import('@/services/user-service');
            
            try {
              await ensureSupabaseUser(userId);
              console.log('[ChatMessage] User created in Supabase, retrying rowId fetch...');
              
              // Retry getting the row ID after user creation
              const newRowId = await getUserRowIdByPrivyId(userId);
              console.log('[ChatMessage] New user row ID:', newRowId);
              setUserRowId(newRowId);
            } catch (createError) {
              console.error('[ChatMessage] Failed to create user in Supabase:', createError);
              // Continue without voting functionality
              setUserRowId(null);
            }
          } else {
            setUserRowId(rowId);
          }
        } catch (error) {
          console.error('[ChatMessage] Failed to get user row ID:', error);
          setUserRowId(null);
        }
      } else {
        console.log('[ChatMessage] Not fetching user row ID - conditions not met');
        setUserRowId(null);
      }
    };
    
    fetchUserRowId();
  }, [authenticated, userId]);

  // Load vote data when component mounts
  useEffect(() => {
    const loadVoteData = async () => {
      if (!isAgentMessage(message) || !responseId) return;
      
      setLoadingVotes(true);
      try {
        // Load vote statistics
        const stats = await getVoteStats(responseId);
        if (stats) {
          setVoteStats(stats);
        }

        // Load user's existing vote if authenticated
        if (authenticated && userRowId) {
          const userVoteData = await getUserVote(userRowId, responseId);
          if (userVoteData?.exists && userVoteData.vote) {
            setVote(userVoteData.vote.value === 1 ? 'up' : 'down');
          }
        }
      } catch (error) {
        console.error('[ChatMessage] Failed to load vote data:', error);
      } finally {
        setLoadingVotes(false);
      }
    };

    loadVoteData();
  }, [message, responseId, authenticated, userRowId]);

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

  // Voting handlers
  const handleThumbsUp = async () => {
    if (!authenticated || isVoting || !userRowId || !responseId) {
      if (!authenticated) toast.error('Please log in to vote');
      else if (!userRowId) toast.error('Unable to load user profile. Please refresh and try again.');
      return;
    }

    setIsVoting(true);

    try {
      const result = await toggleVote(userRowId, responseId, 1);
      
      if (result.success) {
        // Update local state based on result
        if (result.stats) {
          setVoteStats(prev => prev ? { ...prev, ...result.stats! } : null);
        }
        
        // Toggle vote state
        setVote(vote === 'up' ? null : 'up');
        
        if (vote !== 'up') {
          toast.success('Thank you for your feedback!');
        }
      } else {
        toast.error(result.error || 'Failed to record vote. Please try again.');
      }
    } catch (error) {
      console.error('[ChatMessage] Failed to toggle upvote:', error);
      toast.error('Failed to record vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleThumbsDown = async () => {
    if (!authenticated || isVoting || !userRowId || !responseId) {
      if (!authenticated) toast.error('Please log in to vote');
      else if (!userRowId) toast.error('Unable to load user profile. Please refresh and try again.');
      return;
    }

    setIsVoting(true);

    try {
      const result = await toggleVote(userRowId, responseId, -1);
      
      if (result.success) {
        // Update local state based on result
        if (result.stats) {
          setVoteStats(prev => prev ? { ...prev, ...result.stats! } : null);
        }
        
        // Toggle vote state
        setVote(vote === 'down' ? null : 'down');
        
        if (vote !== 'down') {
          toast.success('Thank you for your feedback!');
        }
      } else {
        toast.error(result.error || 'Failed to record vote. Please try again.');
      }
    } catch (error) {
      console.error('[ChatMessage] Failed to toggle downvote:', error);
      toast.error('Failed to record vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

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
              <div className="text-white text-sm">
                <ChatMarkdown content={message.text ?? ''} />
              </div>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 px-2 font-medium">
              {formattedTime}
            </div>
          </div>
        </div>
      ) : (
        // Agent Message - Aligned with header
        <div className="mb-3">
          {/* Message Content */}
          <div className="text-sm">
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

               {/* Voting buttons - only show for authenticated users with valid userRowId and agent messages */}
               {authenticated && userRowId && isAgentMessage(message) && (
                 <>
                   <button
                     onClick={handleThumbsUp}
                     disabled={isVoting || loadingVotes}
                     className={clsx(
                       "flex items-center gap-1 text-xs transition-colors p-1 rounded",
                       vote === 'up' 
                         ? "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20" 
                         : "text-zinc-500 hover:text-green-600 dark:text-zinc-400 dark:hover:text-green-400 hover:bg-zinc-200 dark:hover:bg-zinc-700",
                       (isVoting || loadingVotes) && "opacity-50 cursor-not-allowed"
                     )}
                     title={`Helpful${voteStats?.upvotes ? ` (${voteStats.upvotes})` : ''}`}
                   >
                     {vote === 'up' ? (
                       <HandThumbUpIconSolid className="w-3 h-3" />
                     ) : (
                       <HandThumbUpIcon className="w-3 h-3" />
                     )}
                     <span>Helpful</span>
                     {voteStats && voteStats.upvotes > 1 && (
                       <span className="ml-1 text-xs opacity-75">({voteStats.upvotes})</span>
                     )}
                   </button>
                   
                   <button
                     onClick={handleThumbsDown}
                     disabled={isVoting || loadingVotes}
                     className={clsx(
                       "flex items-center gap-1 text-xs transition-colors p-1 rounded",
                       vote === 'down' 
                         ? "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20" 
                         : "text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-zinc-200 dark:hover:bg-zinc-700",
                       (isVoting || loadingVotes) && "opacity-50 cursor-not-allowed"
                     )}
                     title={`Not helpful${voteStats?.downvotes ? ` (${voteStats.downvotes})` : ''}`}
                   >
                     {vote === 'down' ? (
                       <HandThumbDownIconSolid className="w-3 h-3" />
                     ) : (
                       <HandThumbDownIcon className="w-3 h-3" />
                     )}
                     <span>Not helpful</span>
                     {voteStats && voteStats.downvotes > 1 && (
                       <span className="ml-1 text-xs opacity-75">({voteStats.downvotes})</span>
                     )}
                   </button>
                 </>
               )}

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
