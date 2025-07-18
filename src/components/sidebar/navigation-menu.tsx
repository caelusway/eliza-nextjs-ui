'use client';

import React from 'react';
import Link from 'next/link';
import { Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationMenuProps {
  onMobileMenuClose?: () => void;
}

export function NavigationMenu({ onMobileMenuClose }: NavigationMenuProps) {
  return (
    <div className="px-4 py-2 space-y-1">
      {/* Invite Friends */}
      <Link
        href="/invites"
        onClick={() => onMobileMenuClose?.()}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
          "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
        )}
      >
        <Users className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">Invite Friends</span>
      </Link>

      {/* Account */}
      <Link
        href="/account"
        onClick={() => onMobileMenuClose?.()}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
          "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
        )}
      >
        <User className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">Account</span>
      </Link>
    </div>
  );
} 