'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

import { Paper } from '@/types/chat-message';
import { Dialog } from '@/components/dialogs';

interface PaperCardProps {
  paper: Paper;
  className?: string;
}

const truncateTitle = (title: string, maxLength: number = 60) => {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength).trim() + '...';
};

const isValidURL = (doi: string): boolean => {
  try {
    // Check if it's already a full URL
    if (doi.startsWith('http://') || doi.startsWith('https://')) {
      new URL(doi);
      return true;
    }
    // Check if it's a valid DOI format that we can make into a URL
    if (doi.match(/^10\.\d+\/.+/)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

const getDOIUrl = (doi: string): string => {
  if (doi.startsWith('http://') || doi.startsWith('https://')) {
    return doi;
  }
  // Convert DOI to URL
  return `https://doi.org/${doi}`;
};

export function PaperCard({ paper, className }: PaperCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const canViewPaper = isValidURL(paper.doi);
  const paperUrl = canViewPaper ? getDOIUrl(paper.doi) : '';

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className={clsx(
          'w-full text-left p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer',
          'hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800',
          'transition-all duration-200',
          'focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 focus:shadow-sm',
          className
        )}
      >
        <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
          {truncateTitle(paper.title)}
        </h4>
        {paper.doi && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate break-all">
            DOI: {paper.doi}
          </p>
        )}
      </button>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        size="2xl"
        className="bg-white dark:bg-[#1f1f1f] border border-zinc-200 dark:border-zinc-600 !fixed !left-[18rem] !top-0 !w-[calc(100vw-18rem)] !h-screen !max-w-none !flex !items-center !justify-center lg:!left-72 lg:!w-[calc(100vw-18rem)] xl:!left-80 xl:!w-[calc(100vw-20rem)]"
      >
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1f1f1f] rounded-2xl p-8 shadow-xl border border-zinc-200 dark:border-zinc-600">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-100 dark:bg-[#333333]">
                <svg
                  className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Research Paper
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Paper details and abstract
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDialogOpen(false)}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#404040] transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6 mb-6">
            {/* Title */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                Title
              </h3>
              <p className="text-base text-zinc-900 dark:text-zinc-100 leading-relaxed">
                {paper.title}
              </p>
            </div>

            {/* DOI */}
            {paper.doi && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  DOI
                </h3>
                <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-[#333333] rounded-lg px-3 py-2 break-all">
                  {paper.doi}
                </p>
              </div>
            )}

            {/* Abstract */}
            {paper.abstract && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Abstract
                </h3>
                <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-normal">
                  {paper.abstract}
                </div>
              </div>
            )}
          </div>

          {/* Footer with action button */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-600">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Access the full research paper
            </div>
            {canViewPaper ? (
              <button
                onClick={() => window.open(paperUrl, '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                View Paper
              </button>
            ) : (
              <button
                disabled
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-[#404040] text-zinc-500 dark:text-zinc-400 text-sm font-medium rounded-lg cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Unavailable
              </button>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}
