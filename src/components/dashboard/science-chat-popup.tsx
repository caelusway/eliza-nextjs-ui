'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface ScienceChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement>;
}

export function ScienceChatPopup({ isOpen, onClose, triggerRef }: ScienceChatPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking on the trigger button
      if (triggerRef?.current && triggerRef.current.contains(event.target as Node)) {
        return;
      }
      
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  // Close popup when pressing Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const features = [
    'Comprehensive project analysis',
    'Chat with AIXBT',
    'Discord & Telegram integrations',
    'Alerts for tracked projects',
    '3 custom daily reports',
    'MCP'
  ];

  return (
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 z-50">
      {/* Popup Container */}
      <div 
        ref={popupRef}
        className="relative w-[345px] bg-black border border-white/20 rounded-lg"
      >
        {/* Triangle Pointer */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-white/20"></div>
          <div className="absolute top-[1px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[15px] border-r-[15px] border-b-[15px] border-l-transparent border-r-transparent border-b-black"></div>
        </div>

        {/* Popup Content */}
        <div className="flex flex-col items-center gap-6 p-4 pt-8">
          {/* Science Chat Image */}
          <div className="w-full h-[174px] border-3 border-white/20 rounded-lg overflow-hidden">
            <Image
              src="/science-chat-asset 2.png"
              alt="Science Chat"
              width={307}
              height={174}
              className="w-full h-full object-cover"
              priority
            />
          </div>

          {/* Content Section */}
          <div className="w-full flex flex-col gap-8 py-6">
            {/* Title and Description */}
            <div className="flex flex-col gap-2">
              <h2 className="text-[#E9FF98] text-3xl font-medium font-red-hat-mono leading-tight">
                Science chat
              </h2>
              <p className="text-white text-sm font-red-hat-mono leading-tight">
                Currently exclusively available for curated number of scientists and KOLs
              </p>
            </div>

            {/* Features List */}
            <div className="flex flex-col gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                    <CheckIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white text-sm font-red-hat-mono leading-tight">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
