'use client';

import { ArrowUpIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SpeechToTextButton } from '@/components/ui/speech-to-text-button';
import { DeepResearchButton } from '@/components/ui/deep-research-button';
import { FileUploadButton } from '@/components/ui/file-upload-button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

const ChatForm = function ChatForm({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  placeholder,
  onTranscript,
  deepResearchEnabled,
  onDeepResearchToggle,
  onFileUpload,
  disabled,
}: {
  input: string;
  onInputChange: (e: { target: { value: string } }) => void;
  onSubmit: (e: { preventDefault: () => void }) => void;
  isLoading: boolean;
  placeholder?: string;
  onTranscript?: (text: string) => void;
  deepResearchEnabled?: boolean;
  onDeepResearchToggle?: () => void;
  onFileUpload?: (file: File, uploadResult: any) => void;
  disabled?: boolean;
}) {
  const handleKeyDown = (e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <TooltipProvider>
      <form onSubmit={onSubmit} className="flex flex-col items-center justify-center">
        <div className="relative min-h-[50px] w-full mb-3">
          <textarea
            autoFocus
            aria-label="Prompt"
            value={input}
            onChange={onInputChange}
            placeholder={placeholder || 'Ask a follow up...'}
            disabled={disabled}
            className={clsx([
              'size-full',
              'relative block size-full appearance-none',
              'font-inter text-white dark:text-white',
              'placeholder:text-gray-400 dark:placeholder:text-gray-400',
              'bg-transparent',
              'resize-none',
              'focus:outline-none',
              'scrollbar scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-thumb-rounded-full scrollbar-w-[4px]',
              'text-base leading-6',
              'border-none outline-none focus:outline-none focus:ring-0 focus:ring-offset-0',
              'p-0 px-5 pt-4',
              'field-sizing-content resize-none',
              'scrollbar-thin scrollbar-thumb-rounded-md',
              'max-h-[48vh]',
              disabled && 'opacity-30 cursor-not-allowed',
            ])}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex w-full items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-3">
            {onFileUpload && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-block">
                    <FileUploadButton onFileUpload={onFileUpload} disabled={disabled || isLoading} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Upload files, images, or documents</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onDeepResearchToggle && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-block">
                    <DeepResearchButton
                      isActive={deepResearchEnabled || false}
                      onToggle={onDeepResearchToggle}
                      disabled={disabled || isLoading}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{deepResearchEnabled ? 'Disable deep research mode' : 'Enable deep research for comprehensive analysis'}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {onTranscript && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-block">
                    <SpeechToTextButton onTranscript={onTranscript} disabled={disabled || isLoading} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Click and speak to convert speech to text</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="submit"
                  disabled={!input || disabled || isLoading}
                  aria-label="Submit"
                  className={clsx(
                    "size-10 transition-all duration-200 hover:scale-105",
                    "rounded-md flex items-center justify-center",
                    "border border-gray-300 dark:border-gray-600",
                    input 
                      ? "bg-blue-500 hover:bg-blue-600 text-white" 
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="!h-5 !w-5 !shrink-0 animate-spin" />
                  ) : (
                    <ArrowUpIcon className="!h-5 !w-5 !shrink-0" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{isLoading ? 'Processing your message...' : input ? 'Send message (Enter)' : 'Type a message to send'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </form>
    </TooltipProvider>
  );
};

export const TextareaWithActions = function TextareaWithActions({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  placeholder,
  onTranscript,
  deepResearchEnabled,
  onDeepResearchToggle,
  onFileUpload,
  disabled,
}: {
  input: string;
  onInputChange: (e: { target: { value: string } }) => void;
  onSubmit: (e: { preventDefault: () => void }) => void;
  isLoading: boolean;
  placeholder?: string;
  onTranscript?: (text: string) => void;
  deepResearchEnabled?: boolean;
  onDeepResearchToggle?: () => void;
  onFileUpload?: (file: File, uploadResult: any) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col w-full">
      <span
        data-slot="control"
        className={clsx([
          'relative block w-full',
          'dark:before:hidden',
          'before:has-[[data-disabled]]:bg-gray-950/5 before:has-[[data-disabled]]:shadow-none',
        ])}
      >
        <div
          className={clsx([
            'relative block size-full appearance-none overflow-hidden rounded-xl',
            'text-base leading-6 text-white placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-400',
            'bg-zinc-900 dark:bg-zinc-900',
            'focus:outline-none',
            'data-[invalid]:border-red-500 data-[invalid]:data-[hover]:border-red-500 data-[invalid]:dark:border-red-600 data-[invalid]:data-[hover]:dark:border-red-600',
            'disabled:border-gray-950/20 disabled:dark:border-white/15 disabled:dark:bg-white/[2.5%] dark:data-[hover]:disabled:border-white/15',
            'ring-offset-background',
            'focus-within:ring-2 focus-within:ring-blue-500/20 dark:focus-within:ring-blue-400/20',
            'border-2 border-gray-700 dark:border-gray-800',
            'hover:border-gray-600 dark:hover:border-gray-600',
            'transition-all duration-200',
            'shadow-sm hover:shadow-md',
            'relative',
          ])}
        >
          <ChatForm
            input={input}
            onInputChange={onInputChange}
            onSubmit={onSubmit}
            isLoading={isLoading}
            placeholder={placeholder}
            onTranscript={onTranscript}
            deepResearchEnabled={deepResearchEnabled}
            onDeepResearchToggle={onDeepResearchToggle}
            onFileUpload={onFileUpload}
            disabled={disabled}
          />
        </div>
      </span>
    </div>
  );
};
