'use client';

import { useEffect, useRef } from 'react';

import { ChatMessage } from '@/components/chat';
import { ChatMessage as ChatMessageType } from '@/types/chat-message';
import { assert } from '@/utils/assert';

// Get agent ID from environment
const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID;

// Helper function to check if message is from agent
const isAgentMessage = (message: ChatMessageType) => {
  return message.senderId === AGENT_ID;
};

interface ChatMessagesProps {
  messages: ChatMessageType[];
  followUpPromptsMap?: Record<number, string[]>;
  onFollowUpClick?: (prompt: string) => void;
  lastUserMessageRef?: React.RefObject<HTMLDivElement>;
  latestMessageRef?: React.RefObject<HTMLDivElement>;
  showDynamicSpacing?: boolean;
}

export function ChatMessages({
  messages,
  followUpPromptsMap = {},
  onFollowUpClick,
  lastUserMessageRef,
  latestMessageRef,
  showDynamicSpacing = false,
}: ChatMessagesProps) {
  assert(
    Array.isArray(messages),
    `[ChatMessages] 'messages' prop is not an array: ${typeof messages}`
  );
  assert(
    typeof followUpPromptsMap === 'object' && followUpPromptsMap !== null,
    `[ChatMessages] 'followUpPromptsMap' prop is not an object: ${typeof followUpPromptsMap}`
  );
  assert(
    onFollowUpClick === undefined || typeof onFollowUpClick === 'function',
    `[ChatMessages] 'onFollowUpClick' prop is not a function: ${typeof onFollowUpClick}`
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string>('');
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'instant') => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior });
      }
    }, 100);
  };

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    assert(
      lastMessage && typeof lastMessage === 'object',
      `[ChatMessages Effect 1] Invalid lastMessage (index ${messages.length - 1})`
    );
    if (!lastMessage) return;
    assert(
      typeof lastMessage.text === 'string' ||
        lastMessage.text === null ||
        lastMessage.text === undefined,
      `[ChatMessages Effect 1] Invalid lastMessage.text (index ${messages.length - 1}): ${typeof lastMessage.text}`
    );

    const currentText = lastMessage.text ?? '';
    const isNewMessage = currentText !== lastMessageRef.current;

    if (isNewMessage) {
      lastMessageRef.current = currentText;
      // Disable auto-scroll for new messages to prevent forced scrolling
      // scrollToBottom('instant');
    }
  }, [messages]);

  useEffect(() => {
    if (!messages.length) return;
    const lastMessage = messages[messages.length - 1];
    assert(
      lastMessage && typeof lastMessage === 'object',
      `[ChatMessages Effect 2] Invalid lastMessage (index ${messages.length - 1})`
    );
    if (!lastMessage) return;
    assert(
      typeof lastMessage.name === 'string',
      `[ChatMessages Effect 2] Invalid lastMessage.name (index ${messages.length - 1}): ${typeof lastMessage.name}`
    );
    assert(
      typeof lastMessage.text === 'string' ||
        lastMessage.text === null ||
        lastMessage.text === undefined,
      `[ChatMessages Effect 2] Invalid lastMessage.text (index ${messages.length - 1}): ${typeof lastMessage.text}`
    );

    // Disable auto-scroll for agent messages to prevent forced scrolling
    // Users can manually scroll using the scroll to bottom button
    // if (isAgentMessage(lastMessage)) {
    //   setTimeout(() => scrollToBottom('smooth'), 100);
    // }
  }, [messages[messages.length - 1]?.text]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message, i) => {
        assert(
          message && typeof message === 'object',
          `[ChatMessages Map] Invalid message at index ${i}`
        );
        if (!message) return null;
        const messageKey = message.id || message.createdAt;
        assert(
          messageKey,
          `[ChatMessages Map] Message at index ${i} lacks id and createdAt for key.`
        );
        assert(
          typeof message.name === 'string',
          `[ChatMessages Map] Invalid message.name at index ${i}: ${typeof message.name}`
        );

        const assistantIndex = isAgentMessage(message)
          ? messages.slice(0, i + 1).filter((m) => isAgentMessage(m)).length - 1
          : -1;

        // Check if this is the last user message for ChatGPT-like scroll behavior
        const isUserMessage = !isAgentMessage(message);

        // Find the last user message index
        let lastUserMessageIndex = -1;
        for (let j = messages.length - 1; j >= 0; j--) {
          if (!isAgentMessage(messages[j])) {
            lastUserMessageIndex = j;
            break;
          }
        }
        const isLastUserMessage = isUserMessage && i === lastUserMessageIndex;

        // Debug logging for ref assignment
        if (isLastUserMessage && lastUserMessageRef) {
          console.log('[ChatMessages] Assigning ref to last user message at index:', i, 'messageId:', messageKey);
        }

        // Calculate dynamic spacing for conversation block end (agent messages only)
        const getDynamicSpacing = () => {
          if (!showDynamicSpacing) return 0;
          
          // Check if this is the last message in the conversation
          const isLastMessage = i === messages.length - 1;
          if (!isLastMessage) return 0;
          
          // Only apply spacing to agent messages (end of conversation block)
          // User messages are part of the block but don't get bottom spacing
          const isAgentMsg = isAgentMessage(message);
          if (!isAgentMsg) return 0;
          
          // Use viewport height to calculate optimal spacing
          const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
          // Reserve 60-70% of viewport height for next conversation block
          const dynamicSpacing = Math.min(viewportHeight * 0.65, 600); // Max 600px
          
          console.log('[ChatMessages] Adding dynamic spacing to conversation block end (agent response):', {
            messageIndex: i,
            messageType: 'agent',
            viewportHeight,
            dynamicSpacing,
            showDynamicSpacing,
            isLastMessage,
            isAgentMessage: isAgentMsg
          });
          
          return dynamicSpacing;
        };

        const spacing = getDynamicSpacing();

        // Check if this is the last message overall
        const isLastMessage = i === messages.length - 1;

        // Assign refs based on message type and position
        const getMessageRef = () => {
          if (isLastUserMessage && lastUserMessageRef) {
            return lastUserMessageRef; // For scroll targeting user messages
          }
          if (isLastMessage && latestMessageRef) {
            return latestMessageRef; // For scroll targeting latest message (user or agent)
          }
          if (isLastMessage) {
            return messagesEndRef; // Fallback for scroll to bottom
          }
          return undefined;
        };

        return (
          <div
            key={messageKey}
            data-message-sender={message.senderId}
            data-message-index={i}
            ref={getMessageRef()}
            style={spacing > 0 ? { marginBottom: `${spacing}px` } : undefined}
          >
            <ChatMessage
              message={message}
              i={i}
              followUpPrompts={
                isAgentMessage(message) ? followUpPromptsMap[assistantIndex] : undefined
              }
              onFollowUpClick={onFollowUpClick}
            />
          </div>
        );
      })}
    </div>
  );
}
