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
  followUpPromptsMap: Record<number, string[]>;
  onFollowUpClick: (prompt: string) => void;
}

export function ChatMessages({ messages, followUpPromptsMap, onFollowUpClick }: ChatMessagesProps) {
  assert(
    Array.isArray(messages),
    `[ChatMessages] 'messages' prop is not an array: ${typeof messages}`
  );
  assert(
    typeof followUpPromptsMap === 'object' && followUpPromptsMap !== null,
    `[ChatMessages] 'followUpPromptsMap' prop is not an object: ${typeof followUpPromptsMap}`
  );
  assert(
    typeof onFollowUpClick === 'function',
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
      window.scrollTo({
        top: document.documentElement.scrollHeight + 400,
        behavior,
      });
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
      scrollToBottom('instant');
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

    if (isAgentMessage(lastMessage)) {
      const isAtBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;

      if (isAtBottom) {
        scrollToBottom();
      }
    }
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

        return (
          <div key={messageKey} ref={i === messages.length - 1 ? messagesEndRef : undefined}>
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
