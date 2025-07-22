'use client';

import { PaperClipIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useUserManager } from '@/lib/user-manager';

interface FileUploadButtonProps {
  onFileUpload: (file: File, uploadResult: any) => void;
  disabled?: boolean;
  className?: string;
  isUploading?: boolean;
  onUploadStateChange?: (isUploading: boolean) => void;
}

const SUPPORTED_MIME_TYPES = [
  // Text files (all text/* MIME types are supported via UTF-8 decoding)
  'text/plain',
  'text/markdown', 
  'text/html',
  'text/csv', // ✅ Supported by document processor (contentType.includes('text/'))
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Data formats
  'application/json',
  'application/xml',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const FileUploadButton = ({ 
  onFileUpload, 
  disabled, 
  className, 
  isUploading: externalIsUploading, 
  onUploadStateChange 
}: FileUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [internalIsUploading, setInternalIsUploading] = useState(false);
  const { getUserId } = useUserManager();

  // Use external state if provided, otherwise use internal state
  const isUploading = externalIsUploading !== undefined ? externalIsUploading : internalIsUploading;

  const handleButtonClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input value so the same file can be selected again
    event.target.value = '';

    // Validate file type
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      alert(`Unsupported file type: ${file.type}`);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert('File is too large. Maximum size is 50MB.');
      return;
    }

    // Set uploading state
    if (onUploadStateChange) {
      onUploadStateChange(true);
    } else {
      setInternalIsUploading(true);
    }

    try {
      const agentId = process.env.NEXT_PUBLIC_AGENT_ID;
      const userId = getUserId();

      if (!agentId) {
        throw new Error('Agent ID not configured');
      }

      if (!userId) {
        throw new Error('User ID not available');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('files', file); // Note: 'files' not 'file' for knowledge upload

      // Upload via the dedicated upload API route
      const response = await fetch(
        `/api/upload-media?agentId=${agentId}&userId=${encodeURIComponent(userId)}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Upload failed: ${response.status}`);
      }

      const result = await response.json();

      // Always call the callback with the result (success or failure)
      onFileUpload(file, result);

      // If upload failed, the parent will handle error display
      
    } catch (error) {
      console.error('File upload error:', error);
      
      // Create an error result object and pass it to the callback
      const errorResult = {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
      
      onFileUpload(file, errorResult);
    } finally {
      // Clear uploading state
      if (onUploadStateChange) {
        onUploadStateChange(false);
      } else {
        setInternalIsUploading(false);
      }
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled || isUploading}
        aria-label="Upload file"
        className={clsx(
          'size-10 group relative overflow-hidden',
          disabled && 'opacity-60 cursor-not-allowed',
          className
        )}
      >
        {isUploading && !disabled ? (
          <Loader2 className="!h-5 !w-5 !shrink-0 animate-spin" />
        ) : (
          <PaperClipIcon className={clsx(
            "!h-5 !w-5 !shrink-0 transition-all duration-300 ease-out",
            disabled 
              ? "text-zinc-500"
              : " hover:text-brand-hover"
          )} />
        )}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept={[
          ...SUPPORTED_MIME_TYPES,
        ].join(',')}
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
};

export default FileUploadButton;
