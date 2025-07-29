'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIConfigSection } from '@/hooks/use-ui-config';

interface NavigationMenuProps {
  onMobileMenuClose?: () => void;
}

export function NavigationMenu({ onMobileMenuClose }: NavigationMenuProps) {
  const pathname = usePathname();
  const sidebarConfig = useUIConfigSection('sidebar');
  const isOnInvitesPage = pathname === '/invites';

  return (
    <div className="px-4 py-2 space-y-1">
      {/* Invite Friends */}
      <Link
        href="/invites"
        onClick={() => onMobileMenuClose?.()}
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-lg transition-colors',
          isOnInvitesPage
            ? 'bg-zinc-200 dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white font-medium'
            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white opacity-70 hover:opacity-100'
        )}
      >
        <Users className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">{sidebarConfig.inviteFriendsText}</span>
        {isOnInvitesPage && (
          <div className="flex-shrink-0 ml-auto">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        )}
      </Link>
    </div>
  );
}
