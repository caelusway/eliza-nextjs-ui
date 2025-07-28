'use client';

import { ArrowUpIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { SpeechToTextButton } from '@/components/ui/speech-to-text-button';
import { DeepResearchButton } from '@/components/ui/deep-research-button';
import { FileUploadButton } from '@/components/ui/file-upload-button';
import { useUIConfigSection } from '@/hooks/use-ui-config';

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
  const brandingConfig = useUIConfigSection('branding');

  // Helper function to get darker shade for hover states
  const getDarkerShade = (color: string) => {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const num = parseInt(hex, 16);
      const r = Math.max(0, (num >> 16) - 20);
      const g = Math.max(0, ((num >> 8) & 0x00ff) - 20);
      const b = Math.max(0, (num & 0x0000ff) - 20);
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    return color;
  };
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
                <div
                  className={clsx(
                    'transition-opacity duration-200',
                    disabled || isLoading || isFileUploading
                      ? 'opacity-40 cursor-not-allowed'
                      : 'opacity-100 hover:opacity-90'
                  )}
                >
                  <div
                    className={clsx(
                      'relative',
                      isFileUploading && !disabled && 'border rounded-lg'
                    )}
                    style={
                      isFileUploading && !disabled
                        ? { borderColor: brandingConfig.primaryColor }
                        : {}
                    }
                  >
                    <FileUploadButton
                      onFileUpload={onFileUpload}
                      disabled={disabled || isLoading || isFileUploading}
                      isUploading={isFileUploading}
                      onUploadStateChange={onFileUploadStateChange}
                      className={clsx(
                        'border relative overflow-hidden',
                        isFileUploading && !disabled
                          ? 'bg-zinc-900 text-white border-transparent'
                          : disabled || isLoading
                            ? 'bg-zinc-900 border-zinc-700 text-zinc-500'
                            : 'bg-zinc-900 border-zinc-600 hover:border-zinc-400 text-zinc-300 hover:text-white'
                      )}
                    />
                  </div>
                  {/* Active indicator */}
                  {isFileUploading && (
                    <div
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: brandingConfig.primaryColor }}
                    >
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
          {false && onDeepResearchToggle && (
            <div className="relative">
              <div
                className="inline-block"
                onMouseEnter={() => setHoveredButton('deep-research')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <div
                  className={clsx(
                    'transition-opacity duration-200',
                    disabled || isLoading || isFileUploading
                      ? 'cursor-not-allowed opacity-40'
                      : 'opacity-100 hover:opacity-90'
                  )}
                >
                  <DeepResearchButton
                    isActive={deepResearchEnabled || false}
                    onToggle={onDeepResearchToggle}
                    disabled={disabled || isLoading || isFileUploading}
                  />
                </div>
              </div>
              {hoveredButton === 'deep-research' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-sm text-xs text-zinc-100 dark:text-zinc-100 rounded-lg whitespace-nowrap pointer-events-none z-[100] shadow-lg border border-zinc-700/50 max-w-xs">
                  {disabled || isLoading || isFileUploading
                    ? 'Deep research disabled'
                    : deepResearchEnabled
                      ? 'Deep research enabled - Click to disable'
                      : 'Click to enable deep research for comprehensive analysis'}
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
                <div
                  className={clsx(
                    'transition-opacity duration-200',
                    disabled || isLoading || isFileUploading
                      ? 'opacity-40 cursor-not-allowed'
                      : 'opacity-100 hover:opacity-90'
                  )}
                >
                  <SpeechToTextButton
                    onTranscript={onTranscript}
                    disabled={disabled || isLoading || isFileUploading}
                  />
                </div>
              </div>
              {hoveredButton === 'speech-to-text' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-sm text-xs text-zinc-100 dark:text-zinc-100 rounded-lg whitespace-nowrap pointer-events-none z-[100] shadow-lg border border-zinc-700/50">
                  {disabled || isLoading || isFileUploading
                    ? 'Speech input disabled'
                    : 'Click and speak to convert speech to text'}
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
              onMouseEnter={(e) => {
                setHoveredButton('submit');
                if (input && !disabled && !isLoading && !isFileUploading) {
                  e.currentTarget.style.backgroundColor = getDarkerShade(
                    brandingConfig.primaryColor
                  );
                  e.currentTarget.style.borderColor = getDarkerShade(brandingConfig.primaryColor);
                }
              }}
              onMouseLeave={(e) => {
                setHoveredButton(null);
                if (input && !disabled && !isLoading && !isFileUploading) {
                  e.currentTarget.style.backgroundColor = brandingConfig.primaryColor;
                  e.currentTarget.style.borderColor = brandingConfig.primaryColor;
                }
              }}
              className={clsx(
                'size-10 transition-colors duration-200',
                'rounded-lg flex items-center justify-center',
                'border relative',
                // Clean states for submit button
                input && !disabled && !isLoading && !isFileUploading
                  ? 'text-white shadow-md'
                  : disabled || isLoading || isFileUploading
                    ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-500 cursor-not-allowed opacity-50'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-300'
              )}
              style={
                input && !disabled && !isLoading && !isFileUploading
                  ? {
                      backgroundColor: brandingConfig.primaryColor,
                      borderColor: brandingConfig.primaryColor,
                      boxShadow: `0 4px 6px -1px ${brandingConfig.primaryColor}33`,
                    }
                  : {}
              }
            >
              {isLoading || isFileUploading ? (
                <Loader2
                  className="!h-5 !w-5 !shrink-0 animate-spin"
                  style={{ color: brandingConfig.primaryColor }}
                />
              ) : (
                <ArrowUpIcon
                  className={clsx(
                    '!h-5 !w-5 !shrink-0',
                    input && !disabled && !isFileUploading ? 'text-white' : 'text-zinc-400'
                  )}
                />
              )}
            </button>
            {hoveredButton === 'submit' && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-sm text-xs text-zinc-100 dark:text-zinc-100 rounded-lg whitespace-nowrap pointer-events-none z-[100] shadow-lg border border-zinc-700/50">
                {isFileUploading
                  ? 'Uploading file...'
                  : isLoading
                    ? 'Processing your message...'
                    : disabled
                      ? 'Submit disabled'
                      : input
                        ? 'Send message (Enter)'
                        : 'Type a message to send'}
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
  const brandingConfig = useUIConfigSection('branding');
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
            'focus-within:ring-2',
            'border border-zinc-300 dark:border-zinc-600',
            'hover:border-zinc-400 dark:hover:border-zinc-500',
            'transition-colors duration-200',
            'shadow-sm hover:shadow-md focus-within:shadow-lg',
            'relative',
          ])}
          style={
            {
              '--tw-ring-color': `${brandingConfig.primaryColor}33`,
            } as React.CSSProperties & { '--tw-ring-color': string }
          }
          onFocus={(e) => {
            e.currentTarget.style.borderColor = `${brandingConfig.primaryColor}80`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '';
          }}
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
