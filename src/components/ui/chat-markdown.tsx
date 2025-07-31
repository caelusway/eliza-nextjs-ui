'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Check, Copy } from 'lucide-react';
import { Button } from './button';

// Import highlight.js CSS theme
import 'highlight.js/styles/github-dark.css';

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  inline?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children, className, inline }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(children));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (inline) {
    return (
      <code className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    );
  }

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-700 hover:bg-zinc-600 text-zinc-200"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 rounded-lg overflow-x-auto">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
};

export const ChatMarkdown: React.FC<ChatMarkdownProps> = ({ content, className = '' }) => {
  // Use content as-is without auto-structuring

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: CodeBlock,
          pre: ({ children }) => <>{children}</>,
          h1: ({ children }) => (
            <div className="border-b border-zinc-200 dark:border-zinc-700 pb-2 mb-4 mt-8 first:mt-0">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                {children}
              </h1>
            </div>
          ),
          h2: ({ children }) => (
            <div className="mb-3 mt-6 first:mt-0">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 pb-1">
                <span className="w-0.5 h-5 bg-zinc-400 dark:bg-zinc-500 rounded-full"></span>
                {children}
              </h2>
            </div>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2 mt-5 first:mt-0 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full"></span>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-zinc-700 dark:text-zinc-300 mb-4 leading-relaxed text-sm">
              {children}
            </p>
          ),
          ul: ({ children }) => <ul className="mb-4 space-y-2 pl-4">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 space-y-2 pl-4">{children}</ol>,
          li: ({ children }) => (
            <li className="text-zinc-700 dark:text-zinc-300 text-sm flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>{children}</span>
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/10 pl-4 pr-4 py-3 italic text-zinc-700 dark:text-zinc-300 mb-4 rounded-r-lg">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-zinc-700 dark:text-zinc-300">{children}</em>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border-collapse border border-zinc-300 dark:border-zinc-600">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-left font-semibold text-zinc-900 dark:text-zinc-100">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-zinc-700 dark:text-zinc-300">
              {children}
            </td>
          ),
          hr: () => <hr className="border-zinc-300 dark:border-zinc-600 my-6" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default ChatMarkdown;
