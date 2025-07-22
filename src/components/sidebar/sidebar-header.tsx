'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, PanelLeftClose, PanelLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isConnected: boolean;
  isMobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

export function SidebarHeader({ 
  isCollapsed, 
  onToggleCollapse, 
  isConnected,
  isMobileMenuOpen = false,
  onMobileMenuToggle 
}: SidebarHeaderProps) {
  const router = useRouter();

  const handleLogoClick = () => {
    router.push('/chat');
    // Close mobile menu if it's open
    if (onMobileMenuToggle) {
      onMobileMenuToggle();
    }
  };

  return (
    <div className="flex items-center justify-between p-4 dark:border-zinc-700">
      {!isCollapsed && (
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg p-2 -m-2 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="font-semibold text-zinc-900 dark:text-white">AUBRAI</h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {isConnected ? 'Connected' : 'Connecting...'}
            </p>
          </div>
        </button>
      )}
      <div className="flex items-center gap-2">
        {/* Mobile close button */}
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            aria-label="Close mobile menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {/* Desktop collapse/expand button */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:block p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
} 