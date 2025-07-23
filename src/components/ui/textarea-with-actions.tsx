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
  isFileUploading,
  onFileUploadStateChange,
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
  isFileUploading?: boolean;
  onFileUploadStateChange?: (isUploading: boolean) => void;
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
          disabled={disabled || isFileUploading}
          className={clsx([
            'size-full',
            'relative block size-full appearance-none',
            'text-white dark:text-white',
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
            (disabled || isFileUploading) && 'opacity-30 cursor-not-allowed',
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
                <div className={clsx(
                  "transition-opacity duration-200",
                  disabled || isLoading || isFileUploading 
                    ? "opacity-40 cursor-not-allowed" 
                    : "opacity-100 hover:opacity-90"
                )}>
                  <FileUploadButton 
                    onFileUpload={onFileUpload} 
                    disabled={disabled || isLoading || isFileUploading} 
                    isUploading={isFileUploading}
                    onUploadStateChange={onFileUploadStateChange}
                  />
                </div>
              </div>
              {hoveredButton === 'file-upload' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-sm text-xs text-zinc-100 dark:text-zinc-100 rounded-lg whitespace-nowrap pointer-events-none z-[100] shadow-lg border border-zinc-700/50">
                  {isFileUploading ? 'Uploading file...' : 
                   disabled || isLoading ? 'File upload disabled' : 
                   'Upload files, images, or documents'}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-zinc-900/95 dark:bg-zinc-900/95 rotate-45 border-r border-b border-zinc-700/50"></div>
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
                <div className={clsx(
                  "transition-opacity duration-200",
                  disabled || isLoading || isFileUploading 
                    ? "cursor-not-allowed opacity-40" 
                    : "opacity-100 hover:opacity-90"
                )}>
                  <DeepResearchButton
                    isActive={deepResearchEnabled || false}
                    onToggle={onDeepResearchToggle}
                    disabled={disabled || isLoading || isFileUploading}
                  />
                </div>
              </div>
              {hoveredButton === 'deep-research' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-sm text-xs text-zinc-100 dark:text-zinc-100 rounded-lg whitespace-nowrap pointer-events-none z-[100] shadow-lg border border-zinc-700/50 max-w-xs">
                  {disabled || isLoading || isFileUploading ? 'Deep research disabled' : 
                   deepResearchEnabled ? 'Deep research enabled - Click to disable' : 'Click to enable deep research for comprehensive analysis'}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-zinc-900/95 dark:bg-zinc-900/95 rotate-45 border-r border-b border-zinc-700/50"></div>
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
                <div className={clsx(
                  "transition-opacity duration-200",
                  disabled || isLoading || isFileUploading 
                    ? "opacity-40 cursor-not-allowed" 
                    : "opacity-100 hover:opacity-90"
                )}>
                  <SpeechToTextButton onTranscript={onTranscript} disabled={disabled || isLoading || isFileUploading} />
                </div>
              </div>
              {hoveredButton === 'speech-to-text' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-sm text-xs text-zinc-100 dark:text-zinc-100 rounded-lg whitespace-nowrap pointer-events-none z-[100] shadow-lg border border-zinc-700/50">
                  {disabled || isLoading || isFileUploading ? 'Speech input disabled' : 'Click and speak to convert speech to text'}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-zinc-900/95 dark:bg-zinc-900/95 rotate-45 border-r border-b border-zinc-700/50"></div>
                </div>
              )}
            </div>
          )}
          <div className="relative">
            <button
              type="submit"
              disabled={!input || disabled || isLoading || isFileUploading}
              aria-label="Submit"
              onMouseEnter={() => setHoveredButton('submit')}
              onMouseLeave={() => setHoveredButton(null)}
              className={clsx(
                "size-10 transition-colors duration-200",
                "rounded-lg flex items-center justify-center",
                "border relative",
                // Clean states for submit button using brand colors
                input && !disabled && !isLoading && !isFileUploading
                  ? "bg-brand hover:bg-brand-hover text-white border-brand hover:border-brand-hover shadow-md shadow-brand/20" 
                  : disabled || isLoading || isFileUploading
                  ? "bg-zinc-800/60 border-zinc-700/60 text-zinc-500 cursor-not-allowed opacity-50"
                  : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-300"
              )}
            >
              {isLoading || isFileUploading ? (
                <Loader2 className="!h-5 !w-5 !shrink-0 animate-spin text-brand" />
              ) : (
                <ArrowUpIcon className={clsx(
                  "!h-5 !w-5 !shrink-0",
                  input && !disabled && !isFileUploading 
                    ? "text-white" 
                    : "text-zinc-400"
                )} />
              )}
            </button>
            {hoveredButton === 'submit' && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-sm text-xs text-zinc-100 dark:text-zinc-100 rounded-lg whitespace-nowrap pointer-events-none z-[100] shadow-lg border border-zinc-700/50">
                {isFileUploading ? 'Uploading file...' :
                 isLoading ? 'Processing your message...' : 
                 disabled ? 'Submit disabled' :
                 input ? 'Send message (Enter)' : 'Type a message to send'}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-zinc-900/95 dark:bg-zinc-900/95 rotate-45 border-r border-b border-zinc-700/50"></div>
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
  isFileUploading,
  onFileUploadStateChange,
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
  isFileUploading?: boolean;
  onFileUploadStateChange?: (isUploading: boolean) => void;
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
            'text-base leading-relaxed text-zinc-900 placeholder:text-zinc-500 dark:text-white dark:placeholder:text-zinc-400',
            'bg-white dark:bg-zinc-800/90 backdrop-blur-sm',
            'focus:outline-none',
            'data-[invalid]:border-red-500 data-[invalid]:data-[hover]:border-red-500 data-[invalid]:dark:border-red-600 data-[invalid]:data-[hover]:dark:border-red-600',
            'disabled:border-zinc-300/50 disabled:bg-zinc-50 disabled:dark:border-zinc-700/50 disabled:dark:bg-zinc-900/50',
            'ring-offset-background',
            'focus-within:ring-2 focus-within:ring-brand/20 dark:focus-within:ring-brand/30',
            'focus-within:border-brand/50 dark:focus-within:border-brand/60',
            'border border-zinc-300 dark:border-zinc-600',
            'hover:border-zinc-400 dark:hover:border-zinc-500',
            'transition-colors duration-200',
            'shadow-sm hover:shadow-md focus-within:shadow-lg',
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
            disabled={disabled || isFileUploading}
            isFileUploading={isFileUploading}
            onFileUploadStateChange={onFileUploadStateChange}
          />
        </div>
      </span>
    </div>
  );
};
