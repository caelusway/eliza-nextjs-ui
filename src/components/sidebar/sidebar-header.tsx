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
      {/* Expanded Mode - Logo + App Name */}
      {!isCollapsed && (
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg p-2 -m-2 transition-colors cursor-pointer"
        >
          <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
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
            </h1>
          </div>
        </button>
      )}

      {/* Collapsed Mode - Logo Only */}
      {isCollapsed && (
        <div className="hidden lg:flex lg:justify-center lg:items-center lg:w-full group relative">
          {/* Logo Button - Always visible */}
          <button
            onClick={handleLogoClick}
            className="w-10 h-10 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer group-hover:opacity-0 transition-opacity duration-200"
            title={brandingConfig.appName}
          >
            <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
              <Image
                src="/assets/logo_simple.png"
                alt="Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </button>

          {/* Expand button - Only visible on hover */}
          <button
            onClick={onToggleCollapse}
            className="absolute inset-0 w-full h-10 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all duration-200 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white opacity-0 group-hover:opacity-100"
            title={sidebarConfig.expandSidebarTitle}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
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

        {/* Desktop collapse/expand button - Hide when collapsed to make room for centered logo */}
        {!isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:block p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            aria-label={sidebarConfig.collapseSidebarTitle}
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
