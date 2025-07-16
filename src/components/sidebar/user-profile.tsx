'use client';

import Link from 'next/link';
import { User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfileProps {
  isCollapsed: boolean;
  userName: string;
  userId: string | null;
  onLogout: () => void;
}

export function UserProfile({ isCollapsed, userName, userId, onLogout }: UserProfileProps) {
  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 p-4">
      {!isCollapsed && (
        <Link href="/account" className="block mb-3">
          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
              <User className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                {userName}
              </p>
            </div>
          </div>
        </Link>
      )}
      <button
        onClick={onLogout}
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors",
          isCollapsed ? "justify-center w-full" : "w-full"
        )}
      >
        <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center">
          <LogOut className="w-4 h-4" />
        </div>
        {!isCollapsed && <span className="text-sm">Log Out</span>}
      </button>
    </div>
  );
} 