import {
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
} from '@heroicons/react/24/outline';
import {
  HandThumbUpIcon as HandThumbUpIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid,
} from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { memo, useState, useEffect, useCallback, useMemo } from 'react';

import { toast, ChatMarkdown } from '@/components/ui';
import { PaperCard } from '@/components/ui';
import { PlaySoundButton } from '@/components/ui';
import { ChatMessage as ChatMessageType } from '@/types/chat-message';
import { assert } from '@/utils/assert';
import { useUserManager } from '@/lib/user-manager';
import { useUserData } from '@/contexts/UserDataContext';
import { getVoteStats, getUserVote, toggleVote } from '@/services/vote-service';
import { VoteStats } from '@/lib/supabase/types';
import { cleanTextForAudio } from '@/utils/clean-text-for-audio';
import { removeCitationsFromText } from '@/utils/clean-citations';

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

export const ChatMessage = memo(
  function ChatMessage({ message, i, followUpPrompts, onFollowUpClick }: ChatMessageProps) {
    const [showAllPapers, setShowAllPapers] = useState(false);
    const [showAllFollowUps, setShowAllFollowUps] = useState(false);

    // Voting state
    const [vote, setVote] = useState<'up' | 'down' | null>(message.userVote || null);
    const [isVoting, setIsVoting] = useState(false);
    const [voteStats, setVoteStats] = useState<VoteStats | null>(null);
    const [loadingVotes, setLoadingVotes] = useState(false);
    const [voteDataLoaded, setVoteDataLoaded] = useState(false);

    // User management - use centralized user data context
    const { isUserAuthenticated } = useUserManager();
    const { userRowId } = useUserData();

    const authenticated = isUserAuthenticated();
    const responseId = message.responseId || message.id;

    // Memoize whether this is an agent message to avoid recalculation
    const isAgent = useMemo(() => isAgentMessage(message), [message]);
    const isUser = useMemo(() => isUserMessage(message), [message]);

    // Memoize cleaned message text (remove citations for display)
    const cleanedMessageText = useMemo(() => {
      return message.text ? removeCitationsFromText(message.text) : '';
    }, [message.text]);

    // Lazy load vote data only when needed (when user hovers or interacts)
    const loadVoteData = useCallback(async () => {
      if (!isAgent || !responseId || voteDataLoaded) return;

      setLoadingVotes(true);
      setVoteDataLoaded(true);

      try {
        // Direct service calls with local caching
        const statsPromise = (async () => {
          const cacheKey = `vote-stats-${responseId}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { data, expiry } = JSON.parse(cached);
            if (Date.now() < expiry) {
              return data;
            }
          }

          const stats = await getVoteStats(responseId);
          if (stats) {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                data: stats,
                expiry: Date.now() + 60000, // 1 minute
              })
            );
          }
          return stats;
        })();

        const userVotePromise =
          authenticated && userRowId
            ? (async () => {
                const cacheKey = `user-vote-${userRowId}-${responseId}`;
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                  const { data, expiry } = JSON.parse(cached);
                  if (Date.now() < expiry) {
                    return data;
                  }
                }

                const userVoteData = await getUserVote(userRowId, responseId);
                if (userVoteData) {
                  localStorage.setItem(
                    cacheKey,
                    JSON.stringify({
                      data: userVoteData,
                      expiry: Date.now() + 300000, // 5 minutes
                    })
                  );
                }
                return userVoteData;
              })()
            : Promise.resolve(null);

        const [stats, userVoteData] = await Promise.all([statsPromise, userVotePromise]);

        if (stats) {
          setVoteStats(stats);
        }

        if (userVoteData?.exists && userVoteData.vote) {
          setVote(userVoteData.vote.value === 1 ? 'up' : 'down');
        }
      } catch (error) {
        console.error('[ChatMessage] Failed to load vote data:', error);
      } finally {
        setLoadingVotes(false);
      }
    }, [isAgent, responseId, voteDataLoaded, authenticated, userRowId]);

    // Load vote data when component becomes visible or user interacts
    useEffect(() => {
      // Only auto-load for agent messages that are likely visible
      if (isAgent && responseId && i < 5) {
        // Auto-load for first 5 messages
        loadVoteData();
      }
    }, [isAgent, responseId, i, loadVoteData]);

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
        else if (!userRowId)
          toast.error('Unable to load user profile. Please refresh and try again.');
        return;
      }

      setIsVoting(true);

      try {
        const result = await toggleVote(userRowId, responseId, 1);

        if (result.success) {
          // Update local state based on result
          if (result.stats) {
            setVoteStats((prev) => (prev ? { ...prev, ...result.stats! } : null));
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
        else if (!userRowId)
          toast.error('Unable to load user profile. Please refresh and try again.');
        return;
      }

      setIsVoting(true);

      try {
        const result = await toggleVote(userRowId, responseId, -1);

        if (result.success) {
          // Update local state based on result
          if (result.stats) {
            setVoteStats((prev) => (prev ? { ...prev, ...result.stats! } : null));
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

    const formattedTime = new Date(message.createdAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    return (
      <div
        className="w-full max-w-full overflow-hidden mb-3"
        data-message
        data-message-id={message.id}
      >
        {isUser ? (
          // User Message - Right aligned with bubble
          <div className="flex justify-end mb-2">
            <div className="flex flex-col items-end max-w-[80%]">
              <div className="bg-zinc-700 text-white rounded-2xl px-4 py-3 shadow-sm">
                <div className="text-white text-sm">
                  <ChatMarkdown content={cleanedMessageText} />
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
              <ChatMarkdown content={cleanedMessageText} />

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-3">
                {/* Play Sound Button */}
                {cleanedMessageText &&
                  cleanedMessageText.trim() &&
                  cleanTextForAudio(cleanedMessageText) && (
                    <PlaySoundButton
                      text={cleanedMessageText}
                      className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-200 dark:hover:bg-[#404040]"
                    />
                  )}

                {/* Copy Button */}
                <button
                  onClick={() => {
                    if (cleanedMessageText) {
                      navigator.clipboard.writeText(cleanedMessageText);
                      toast.success('Copied to clipboard');
                    }
                  }}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-200 dark:hover:bg-[#404040]"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Copy</span>
                </button>

                {/* Voting buttons - only show for authenticated users with valid userRowId and agent messages */}
                {isAgent && cleanedMessageText && cleanedMessageText.trim() && (
                  <>
                    <button
                      onClick={handleThumbsUp}
                      onMouseEnter={loadVoteData} // Lazy load on hover
                      disabled={isVoting || loadingVotes}
                      className={clsx(
                        'flex items-center gap-1 text-xs transition-colors p-1 rounded',
                        vote === 'up'
                          ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20'
                          : 'text-zinc-500 hover:text-green-600 dark:text-zinc-400 dark:hover:text-green-400 hover:bg-zinc-200 dark:hover:bg-[#404040]',
                        (isVoting || loadingVotes) && 'opacity-50 cursor-not-allowed'
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
                      onMouseEnter={loadVoteData} // Lazy load on hover
                      disabled={isVoting || loadingVotes}
                      className={clsx(
                        'flex items-center gap-1 text-xs transition-colors p-1 rounded',
                        vote === 'down'
                          ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
                          : 'text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-zinc-200 dark:hover:bg-[#404040]',
                        (isVoting || loadingVotes) && 'opacity-50 cursor-not-allowed'
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

              {/* Combined Follow-ups and Papers Section */}
              {(followUpPrompts?.length > 0 || (message.papers && message.papers.length > 0)) && (
                <div className="mt-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Papers Section */}
                    {message.papers && message.papers.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <svg
                            className="w-4 h-4 text-zinc-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            Research Papers ({message.papers.length})
                          </span>
                          {message.papers.length > 3 && (
                            <button
                              onClick={() => setShowAllPapers(!showAllPapers)}
                              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-[#404040]"
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

                    {/* Follow-up prompts */}
                    {followUpPrompts?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <svg
                            className="w-4 h-4 text-zinc-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            Continue exploring ({followUpPrompts.length})
                          </span>
                          {followUpPrompts.length > 3 && (
                            <button
                              onClick={() => setShowAllFollowUps(!showAllFollowUps)}
                              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-[#404040]"
                            >
                              {showAllFollowUps ? (
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
                          {(showAllFollowUps ? followUpPrompts : followUpPrompts.slice(0, 3)).map(
                            (prompt, index) => (
                              <button
                                key={index}
                                onClick={() => onFollowUpClick?.(prompt)}
                                className="group w-full text-left p-3 rounded-lg border border-zinc-200 dark:border-zinc-600 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-[#333333] transition-all duration-200 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-400 focus:shadow-sm"
                              >
                                <div className="flex items-start gap-3">
                                  <ArrowRightIcon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors duration-200 group-hover:translate-x-0.5 flex-shrink-0 mt-0.5" />
                                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
                                    {prompt}
                                  </span>
                                </div>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // More aggressive memoization - only re-render if essential props change
    // Shallow comparison for better performance
    const messageChanged =
      prevProps.message.id !== nextProps.message.id ||
      prevProps.message.text !== nextProps.message.text ||
      prevProps.message.isLoading !== nextProps.message.isLoading ||
      prevProps.message.thought !== nextProps.message.thought ||
      prevProps.message.senderId !== nextProps.message.senderId;

    const followUpChanged =
      prevProps.followUpPrompts?.length !== nextProps.followUpPrompts?.length ||
      (prevProps.followUpPrompts &&
        nextProps.followUpPrompts &&
        prevProps.followUpPrompts.some((prompt, i) => prompt !== nextProps.followUpPrompts![i]));

    const papersChanged = prevProps.message.papers?.length !== nextProps.message.papers?.length;

    // Return true if NO changes (React.memo behavior)
    return !messageChanged && !followUpChanged && !papersChanged;
  }
);
