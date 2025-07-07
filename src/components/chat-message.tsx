import {
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { memo } from "react";
import Image from "next/image";

import { CodeBlock } from "@/components/code-block";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { ChatMessage as ChatMessageType } from "@/types/chat-message";
import { assert } from "@/utils/assert";

// Define constants if needed, or use literals directly
const USER_NAME = "User";
// const ASSISTANT_NAME = "Agent"; // Or get from message if dynamic

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

  assert(
    message && typeof message === "object",
    `[ChatMessage Render] Invalid 'message' prop: ${typeof message}`
  );
  if (!message) return null;
  assert(
    typeof message.name === "string",
    `[ChatMessage Render] Invalid message.name: ${typeof message.name}`
  );
  assert(
    typeof message.text === "string" ||
      message.text === null ||
      message.text === undefined,
    `[ChatMessage Render] Invalid message.text: ${typeof message.text}`
  );
  assert(
    typeof i === "number",
    `[ChatMessage Render] Invalid 'i' prop: ${typeof i}`
  );
  assert(
    !followUpPrompts || Array.isArray(followUpPrompts),
    `[ChatMessage Render] Invalid 'followUpPrompts' prop type: ${typeof followUpPrompts}`
  );
  assert(
    !onFollowUpClick || typeof onFollowUpClick === "function",
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


  const formattedTime = new Date(message.createdAt).toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }
  );

  return (
    <div
      className={clsx(
        "w-full",
        message.name === USER_NAME && i !== 0
          ? "border-t pt-4 border-zinc-950/5 dark:border-white/5"
          : ""
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8">
          <Image
            src={
              message.name === USER_NAME
                ? "/assets/user.png"
                : process.env.NEXT_PUBLIC_AGENT_LOGO || "/assets/bot.png"
            }
            alt={`${message.name} logo`}
            width={64}
            height={64}
            className="rounded-full"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg text-zinc-700 dark:text-zinc-300 font-bold">
              {message.name === USER_NAME
                ? USER_NAME
                : process.env.NEXT_PUBLIC_AGENT_NAME}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {formattedTime}
            </span>
          </div>
          <div className="font-mono text-white">
            <div
              className={clsx(
                "prose prose-zinc dark:prose-invert !max-w-full",
                "prose-headings:mt-0 prose-headings:mb-0 prose-headings:my-0 prose-p:mt-0"
              )}
            >
              <MemoizedMarkdown
                id={message.id || `msg-${i}-${message.createdAt}`}
                content={message.text ?? ""}
                options={markdownOptions}
              />
            </div>
          </div>


          {message.name !== USER_NAME && followUpPrompts?.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-col divide-y divide-zinc-950/5 dark:divide-white/5">
                {followUpPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => onFollowUpClick?.(prompt)}
                    className={clsx([
                      "flex items-center justify-between",
                      "py-2",
                      "bg-transparent",
                      "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200",
                      "transition-colors",
                      "group cursor-pointer",
                      "text-left text-sm",
                      "w-full",
                    ])}
                  >
                    <span>{prompt}</span>
                    <ArrowRightIcon className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
