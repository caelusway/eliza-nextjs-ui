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
        <div className="flex items-center gap-2">
          {onFileUpload && (
            <div className="relative">
              <div 
                className="inline-block"
                onMouseEnter={() => setHoveredButton('file-upload')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <div className={clsx(
                  "relative rounded-lg group",
                  disabled || isLoading || isFileUploading 
                    ? "opacity-60 cursor-not-allowed" 
                    : "opacity-100"
                )}>
                  <FileUploadButton 
                    onFileUpload={onFileUpload} 
                    disabled={disabled || isLoading || isFileUploading} 
                    isUploading={isFileUploading}
                    onUploadStateChange={onFileUploadStateChange}
                    className={clsx(
                      "border relative overflow-hidden",
                      isFileUploading && !disabled
                        ? "bg-zinc-900 border-brand text-white"
                        : disabled || isLoading
                        ? "bg-zinc-900 border-zinc-700 text-zinc-500"
                        : "bg-zinc-900 border-zinc-600 hover:border-zinc-400 text-zinc-300 hover:text-white"
                    )}
                  />
                  {/* Active indicator */}
                  {isFileUploading && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  )}

                </div>
              </div>
              {hoveredButton === 'file-upload' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 text-xs text-zinc-200 rounded-lg whitespace-nowrap pointer-events-none z-[100] shadow-xl border border-zinc-700 backdrop-blur-sm">
                  {isFileUploading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Uploading file...
                    </span>
                  ) : disabled || isLoading ? (
                    <span className="text-zinc-400">File upload disabled</span>
                  ) : (
                    <span>Upload files, images, or documents</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onDeepResearchToggle && (
            <div className="relative">
              <div 
                className="inline-block"
                onMouseEnter={() => setHoveredButton('deep-research')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <div className={clsx(
                  "relative rounded-lg",
                  disabled || isLoading || isFileUploading 
                    ? "opacity-60 cursor-not-allowed" 
                    : "opacity-100 hover:shadow-lg hover:shadow-zinc-900/25"
                )}>
                  <div className={clsx(
                    "relative",
                    deepResearchEnabled && !disabled && !isLoading && !isFileUploading
                      ? "ring-2 ring-brand/40 rounded-lg shadow-lg shadow-brand/20"
                      : ""
                  )}>
                    <DeepResearchButton
                      isActive={deepResearchEnabled || false}
                      onToggle={onDeepResearchToggle}
                      disabled={disabled || isLoading || isFileUploading}
                    />
                    {/* Active indicator */}
                    {deepResearchEnabled && !disabled && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                    {/* Subtle glow effect when enabled but not active */}

                  </div>
                </div>
              </div>
              {hoveredButton === 'deep-research' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 text-xs text-zinc-200 rounded-lg whitespace-nowrap pointer-events-none z-[100] shadow-xl border border-zinc-700 backdrop-blur-sm max-w-xs">
                  {disabled || isLoading || isFileUploading ? (
                    <span className="text-zinc-400">Deep research disabled</span>
                  ) : deepResearchEnabled ? (
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-brand rounded-full"></div>
                      Deep research enabled - Click to disable
                    </span>
                  ) : (
                    <span>Click to enable deep research for comprehensive analysis</span>
                  )}
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
                  "relative rounded-lg group",
                  disabled || isLoading || isFileUploading 
                    ? "opacity-60 cursor-not-allowed" 
                    : "opacity-100"
                )}>
                                                        <div className={clsx(
                    "rounded-lg relative overflow-hidden",
                    disabled || isLoading || isFileUploading
                      ? "bg-zinc-900 border border-zinc-700"
                      : "bg-zinc-900 border border-zinc-600 hover:border-zinc-400"
                  )}>
                      <SpeechToTextButton 
                        onTranscript={onTranscript} 
                        disabled={disabled || isLoading || isFileUploading}
                        className={clsx(
                          disabled || isLoading || isFileUploading
                            ? "text-zinc-500"
                            : "text-zinc-300 hover:text-white"
                        )}
                      />

                  </div>
                </div>
              </div>
              {hoveredButton === 'speech-to-text' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 text-xs text-zinc-200 rounded-lg whitespace-nowrap pointer-events-none z-[100] shadow-xl border border-zinc-700 backdrop-blur-sm">
                  {disabled || isLoading || isFileUploading ? (
                    <span className="text-zinc-400">Speech input disabled</span>
                  ) : (
                    <span>Click and speak to convert speech to text</span>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="relative">
            <div className={clsx(
              "relative rounded-lg group"
            )}>
              <button
                type="submit"
                disabled={!input || disabled || isLoading || isFileUploading}
                aria-label="Submit"
                onMouseEnter={() => setHoveredButton('submit')}
                onMouseLeave={() => setHoveredButton(null)}
                className={clsx(
                  "size-10 relative z-10",
                  "rounded-lg flex items-center justify-center",
                  "border group overflow-hidden",
                  input && !disabled && !isLoading && !isFileUploading
                    ? "bg-zinc-900 border-brand text-white"
                    : disabled || isLoading || isFileUploading || !input
                    ? "bg-zinc-900 border-zinc-700 text-zinc-500 cursor-not-allowed opacity-60"
                    : "bg-zinc-900 border-zinc-600 hover:border-zinc-400 text-zinc-300 hover:text-white",
                  "focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-zinc-800"
                )}
              >
                {isLoading || isFileUploading ? (
                  <Loader2 className={clsx(
                    "!h-5 !w-5 !shrink-0 animate-spin",
                    isFileUploading ? "text-red-400" : "text-zinc-300"
                  )} />
                ) : (
                  <ArrowUpIcon className={clsx(
                    "!h-5 !w-5 !shrink-0",
                    input && !disabled && !isFileUploading 
                      ? "text-white" 
                      : "text-zinc-500"
                  )} />
                )}
                
                {/* Ready indicator when input is present */}
                {input && !disabled && !isLoading && !isFileUploading && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                )}
              </button>
              

            </div>
            
            {hoveredButton === 'submit' && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-zinc-900 text-xs text-zinc-200 rounded-lg whitespace-nowrap pointer-events-none z-[100] shadow-xl border border-zinc-700 backdrop-blur-sm">
                {isFileUploading ? (
                  <span className="flex items-center gap-2 text-blue-300">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Uploading file...
                  </span>
                ) : isLoading ? (
                  <span className="flex items-center gap-2 text-brand">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processing your message...
                  </span>
                ) : disabled ? (
                  <span className="text-zinc-400">Submit disabled</span>
                ) : input ? (
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand rounded-full animate-pulse"></div>
                    Send message (Enter)
                  </span>
                ) : (
                  <span className="text-zinc-400">Type a message to send</span>
                )}
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
            disabled={disabled || isFileUploading}
            isFileUploading={isFileUploading}
            onFileUploadStateChange={onFileUploadStateChange}
          />
        </div>
      </span>
    </div>
  );
};
