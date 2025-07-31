'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PanelLeftClose, PanelLeft, X } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useUIConfigSection } from '@/hooks/use-ui-config';

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
  onMobileMenuToggle,
}: SidebarHeaderProps) {
  const router = useRouter();

  const sidebarConfig = useUIConfigSection('sidebar');
  const brandingConfig = useUIConfigSection('branding');

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
          className="flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg p-2 -m-2 transition-colors cursor-pointer"
        >
          <div className="w-7 h-7  flex items-center justify-center flex-shrink-0">
            <Image
              src="/assets/logo_simple.png"
              alt="Logo"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <div className="flex items-center min-w-0">
            <h1 className="font-semibold text-zinc-900 dark:text-white leading-tight text-xl">
              {brandingConfig.appName}
            </h1>{' '}
            {/*
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
             isConnected ? sidebarConfig.connectedText : sidebarConfig.connectingText
            </p>*/}
          </div>
        </button>
      )}
      <div className="flex items-center gap-2">
        {/* Mobile close button */}
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            aria-label={sidebarConfig.closeMobileMenuTitle}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Desktop collapse/expand button */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:block p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          aria-label={
            isCollapsed ? sidebarConfig.expandSidebarTitle : sidebarConfig.collapseSidebarTitle
          }
        >
          {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
