'use client';

import Link from 'next/link';
import { User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIConfigSection } from '@/hooks/use-ui-config';

interface UserProfileProps {
  isCollapsed: boolean;
  userName: string;
  userId: string | null;
  onLogout: () => void;
}

export function UserProfile({ isCollapsed, userName, userId, onLogout }: UserProfileProps) {
  const sidebarConfig = useUIConfigSection('sidebar');
  
  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 p-2">
      {!isCollapsed && (
        <Link href="/account" className="block mb-1">
          <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
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
          "flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors",
          isCollapsed ? "justify-center w-full" : "w-full"
        )}
      >
        <div className="w-6 h-6 rounded-full bg-transparent flex items-center justify-center flex-shrink-0">
          <LogOut className="w-3.5 h-3.5" />
        </div>
        {!isCollapsed && <span className="text-sm">{sidebarConfig.logOutText}</span>}
      </button>
    </div>
  );
} 