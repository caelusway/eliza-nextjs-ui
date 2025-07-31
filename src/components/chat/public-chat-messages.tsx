'use client';

import React from 'react';
import Image from 'next/image';
import { ChatMarkdown } from '@/components/ui';
import { ChatMessage as ChatMessageType } from '@/types/chat-message';
import { assert } from '@/utils/assert';

// Get agent ID from environment
const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID;

// Helper function to check if message is from agent
const isAgentMessage = (message: ChatMessageType) => {
  return message.senderId === AGENT_ID;
};

interface PublicChatMessagesProps {
  messages: ChatMessageType[];
}

export function PublicChatMessages({ messages }: PublicChatMessagesProps) {
  assert(
    Array.isArray(messages),
    `[PublicChatMessages] 'messages' prop is not an array: ${typeof messages}`
  );

  // Remove automatic scrolling to allow free user scrolling

  const formatFullDateTime = (timestamp: any) => {
    try {
      let date: Date;

      // Handle different timestamp formats
      if (typeof timestamp === 'number') {
        // Unix timestamp (seconds or milliseconds)
        date = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
      } else if (typeof timestamp === 'string') {
        // String date
        date = new Date(timestamp);
      } else {
        // Fallback to current time
        date = new Date();
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      // Format time part (12:25 PM)
      const timeString = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      // Format date part (7/30/2025)
      const dateString = date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      });

      return `${timeString}, ${dateString}`;
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-8 mt-4">
      {messages.map((message, index) => {
        const isAgent = isAgentMessage(message);

        return (
          <div
            key={`${message.id}-${index}`}
            className="group relative animate-in fade-in duration-300"
          >
            {isAgent ? (
              // Agent Message - Left aligned with logo
              <div className="flex flex-col gap-1">
                {/* Avatar and Name Row */}
                <div className="flex items-center gap-1 mb-2">
                  {/* Agent Avatar with AUBRAI Logo */}
                  <div className="flex-shrink-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full overflow-hidden  p-1  flex items-center justify-center">
                      <Image
                        src="/assets/new_logo.png"
                        alt="AUBRAI"
                        width={24}
                        height={24}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white text-base leading-none">
                    AUBRAI
                  </span>
                </div>

                {/* Message Content */}
                <div className="rounded-2xl">
                  <div className="max-w-none text-gray-900 dark:text-gray-100 leading-relaxed">
                    <ChatMarkdown content={message.text ?? ''} />
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatFullDateTime(message.createdAt)}</span>
                </div>
              </div>
            ) : (
              // User Message - Right aligned, no avatar
              <div className="flex justify-end mt-4">
                <div className="max-w-lg">
                  <div className="bg-white dark:bg-zinc-700 rounded-2xl p-3">
                    <div className="prose prose-base dark:prose-invert max-w-none text-gray-900 dark:text-gray-100 leading-relaxed">
                      <ChatMarkdown content={message.text ?? ''} />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <span>{formatFullDateTime(message.createdAt)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
