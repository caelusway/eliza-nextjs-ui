'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

import { Paper } from '@/types/chat-message';

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

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-[#1a1a1a] rounded-xl max-w-2xl w-full p-8 shadow-2xl border border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800">
                  <svg
                    className="w-5 h-5 text-gray-400"
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
                  <h2 className="text-2xl font-semibold text-white tracking-tight">
                    Research Paper
                  </h2>
                  <p className="text-sm text-gray-400">Paper details and abstract</p>
                </div>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-800/50"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Title</label>
                <div className="w-full px-4 py-3 bg-[#2a2a2a] dark:bg-[#2a2a2a] rounded-xl text-white border border-gray-600 dark:border-gray-600">
                  {paper.title}
                </div>
              </div>

              {paper.doi && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">DOI</label>
                  {canViewPaper ? (
                    <a
                      href={paperUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-3 bg-[#2a2a2a] dark:bg-[#2a2a2a] hover:bg-[#333] dark:hover:bg-[#333] rounded-xl text-blue-400 hover:text-blue-300 border border-gray-600 dark:border-gray-600 font-mono text-sm break-all transition-all duration-200 cursor-pointer"
                    >
                      {paper.doi}
                    </a>
                  ) : (
                    <div className="w-full px-4 py-3 bg-[#2a2a2a] dark:bg-[#2a2a2a] rounded-xl text-gray-300 border border-gray-600 dark:border-gray-600 font-mono text-sm break-all">
                      {paper.doi}
                    </div>
                  )}
                </div>
              )}

              {paper.abstract && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">Abstract</label>
                  <div className="w-full px-4 py-3 bg-[#2a2a2a] dark:bg-[#2a2a2a] rounded-xl text-white border border-gray-600 dark:border-gray-600 leading-relaxed max-h-48 overflow-y-auto">
                    {paper.abstract}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <div className="flex-1 text-sm text-gray-400">Access the full research paper</div>
              {canViewPaper ? (
                <button
                  onClick={() => window.open(paperUrl, '_blank', 'noopener,noreferrer')}
                  className="bg-[#FF6E71] hover:bg-[#FF6E71]/90 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
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
                  className="bg-gray-700 text-gray-400 px-6 py-3 rounded-xl text-sm font-medium cursor-not-allowed flex items-center gap-2"
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
        </div>
      )}
    </>
  );
}
