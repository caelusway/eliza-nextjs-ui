'use client';

import { CircleIndicator } from '@/components/ui/circle-indicator';
import { useUIConfigSection } from '@/hooks/use-ui-config';

interface SuggestedPromptsSectionProps {
  prompts: string[];
  onPromptClick: (prompt: string) => void;
  isLoading?: boolean;
  isFileUploading?: boolean;
  clickedPrompt?: string | null;
}

export function SuggestedPromptsSection({
  prompts,
  onPromptClick,
  isLoading = false,
  isFileUploading = false,
  clickedPrompt = null,
}: SuggestedPromptsSectionProps) {
  // const chatConfig = useUIConfigSection('chat'); // TODO: @caelusway - lets discuss if we need this hook
  const brandingConfig = useUIConfigSection('branding');

  return (
    <div className="w-full mb-12">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {prompts.map((prompt, index) => {
          const isPromptLoading = clickedPrompt === prompt;
          return (
            <button
              key={index}
              onClick={() => onPromptClick(prompt)}
              disabled={isLoading || isFileUploading}
              className={`group relative px-3 py-2 md:px-4 md:py-3 lg:px-5 lg:py-4 text-left rounded-xl border transition-all duration-500 ease-out min-h-[4.5rem] md:min-h-[5rem] lg:min-h-[5.5rem] flex items-start ${
                isLoading || isFileUploading ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                isPromptLoading
                  ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 shadow-lg'
                  : 'bg-zinc-50 dark:bg-[#1f1f1f] border-zinc-200 dark:border-zinc-800 shadow-sm'
              }`}
            >
              {/* Small circle positioned in top-left corner */}
              <div className="absolute top-3 left-3">
                <CircleIndicator
                  isLoading={isPromptLoading}
                  primaryColor={brandingConfig.primaryColor}
                  size="sm"
                />
              </div>
              <div className="pl-8 pr-2 w-full">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
                  {prompt}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
