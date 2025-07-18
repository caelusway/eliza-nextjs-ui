'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

import { Paper } from '@/types/chat-message';
import { Dialog, DialogTitle, DialogBody, DialogActions } from '@/components/dialogs';
import { Button } from '@/components/ui';

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
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900',
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
        className="px-4 py-2"
      >
        <div className="relative">
          {/* Close button */}
          <button
            onClick={() => setIsDialogOpen(false)}
            className="absolute top-0 right-0 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <DialogTitle>Paper Details</DialogTitle>

          <DialogBody>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  TITLE
                </h3>
                <p className="text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed">
                  {paper.title}
                </p>
              </div>

              {/* DOI */}
              {paper.doi && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    DOI
                  </h3>
                  <p className="text-sm text-zinc-900 dark:text-zinc-100 font-mono break-all">
                    {paper.doi}
                  </p>
                </div>
              )}

              {/* Abstract */}
              {paper.abstract && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    ABSTRACT
                  </h3>
                  <p className="text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed">
                    {paper.abstract}
                  </p>
                </div>
              )}
            </div>
          </DialogBody>

          <DialogActions>
            <div className="w-full flex justify-center">
              {canViewPaper ? (
                <Button
                  color="blue"
                  onClick={() => window.open(paperUrl, '_blank', 'noopener,noreferrer')}
                >
                  View Paper
                </Button>
              ) : (
                <Button color="zinc" disabled>
                  View Paper
                </Button>
              )}
            </div>
          </DialogActions>
        </div>
      </Dialog>
    </>
  );
}
