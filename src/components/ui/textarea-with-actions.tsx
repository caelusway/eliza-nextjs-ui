'use client';

import { ArrowUpIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { SpeechToTextButton } from '@/components/ui/speech-to-text-button';
import { DeepResearchButton } from '@/components/ui/deep-research-button';
import { FileUploadButton } from '@/components/ui/file-upload-button';

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
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const handleKeyDown = (e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
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
            <div className="relative">
              <div 
                className="inline-block"
                onMouseEnter={() => setHoveredButton('file-upload')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <FileUploadButton onFileUpload={onFileUpload} disabled={disabled || isLoading} />
              </div>
              {hoveredButton === 'file-upload' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-950 dark:bg-zinc-950 text-xs text-zinc-200 dark:text-zinc-200 rounded whitespace-nowrap pointer-events-none z-[100] shadow-lg border border-zinc-800">
                  Upload files, images, or documents
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onDeepResearchToggle && (
            <div className="relative">
              <div 
                className="inline-block"
                onMouseEnter={() => setHoveredButton('deep-research')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <DeepResearchButton
                  isActive={deepResearchEnabled || false}
                  onToggle={onDeepResearchToggle}
                  disabled={disabled || isLoading}
                />
              </div>
              {hoveredButton === 'deep-research' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-950 dark:bg-zinc-950 text-xs text-zinc-200 dark:text-zinc-200 rounded whitespace-nowrap pointer-events-none z-[100] shadow-lg border border-zinc-800">
                  {deepResearchEnabled ? 'Disable deep research mode' : 'Enable deep research for comprehensive analysis'}
                </div>
              )}
            </div>
          )}
          {onTranscript && (
            <div className="relative">
              <div 
                className="inline-block"
                onMouseEnter={() => setHoveredButton('speech-to-text')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <SpeechToTextButton onTranscript={onTranscript} disabled={disabled || isLoading} />
              </div>
              {hoveredButton === 'speech-to-text' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-950 dark:bg-zinc-950 text-xs text-zinc-200 dark:text-zinc-200 rounded whitespace-nowrap pointer-events-none z-[100] shadow-lg border border-zinc-800">
                  Click and speak to convert speech to text
                </div>
              )}
            </div>
          )}
          <div className="relative">
            <button
              type="submit"
              disabled={!input || disabled || isLoading}
              aria-label="Submit"
              onMouseEnter={() => setHoveredButton('submit')}
              onMouseLeave={() => setHoveredButton(null)}
              className={clsx(
                "size-10 transition-all duration-200 hover:scale-105",
                "rounded-md flex items-center justify-center",
                "border border-zinc-700 dark:border-zinc-700",
                input 
                  ? "bg-brand hover:bg-brand/90 text-white border-brand hover:border-brand/90 shadow-lg shadow-brand/25" 
                  : "bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-400 dark:text-zinc-500",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="!h-5 !w-5 !shrink-0 animate-spin" />
              ) : (
                <ArrowUpIcon className="!h-5 !w-5 !shrink-0" />
              )}
            </button>
            {hoveredButton === 'submit' && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-950 dark:bg-zinc-950 text-xs text-zinc-200 dark:text-zinc-200 rounded whitespace-nowrap pointer-events-none z-[100] shadow-lg border border-zinc-800">
                {isLoading ? 'Processing your message...' : input ? 'Send message (Enter)' : 'Type a message to send'}
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
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
            'relative block size-full appearance-none overflow-visible rounded-2xl',
            'text-base leading-3 text-white placeholder:text-zinc-500 dark:text-white dark:placeholder:text-zinc-500',
            'bg-zinc-100 dark:bg-zinc-800',
            'focus:outline-none',
            'data-[invalid]:border-red-500 data-[invalid]:data-[hover]:border-red-500 data-[invalid]:dark:border-red-600 data-[invalid]:data-[hover]:dark:border-red-600',
            'disabled:border-zinc-800/50 disabled:dark:border-zinc-800/50 disabled:dark:bg-zinc-950/50 dark:data-[hover]:disabled:border-zinc-800/50',
            'ring-offset-background',
            'focus-within:ring-2 focus-within:ring-zinc-500/20 dark:focus-within:ring-zinc-400/20',
            'border-1 border-zinc-200 dark:border-zinc-800',
            'hover:border-zinc-700 dark:hover:border-zinc-700',
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
