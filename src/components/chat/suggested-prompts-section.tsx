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
  const brandingConfig = useUIConfigSection('branding');

  return (
    <div className="w-full flex justify-center">
      <div className="flex flex-row gap-6 overflow-x-auto pb-4 px-4 md:px-0">
        {prompts.slice(0, 4).map((prompt, index) => {
          const isPromptLoading = clickedPrompt === prompt;
          return (
            <button
              key={index}
              onClick={() => onPromptClick(prompt)}
              disabled={isLoading || isFileUploading}
              className={`group relative flex flex-row gap-3 px-3 py-4 text-left rounded-xl border transition-all duration-500 ease-out w-80 min-w-[280px] min-h-[4.5rem] flex-shrink-0 ${
                isLoading || isFileUploading ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                isPromptLoading
                  ? 'bg-black border-white/10 shadow-lg'
                  : 'bg-black border-white/10 shadow-sm hover:border-white/20'
              }`}
            >
              {/* Arrow icon positioned on the right */}
              <div className="flex-1 flex items-start">
                <p className="text-sm font-normal text-[#757575] leading-relaxed">
                  {prompt}
                </p>
              </div>
              
              {/* Arrow icon */}
              <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
                <svg
                  width="11"
                  height="12"
                  viewBox="0 0 11 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[#E9FF98]"
                >
                  <path
                    d="M2.83 2L10.37 6L2.83 10L2.83 2Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
