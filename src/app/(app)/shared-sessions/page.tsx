'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Share2,
  RefreshCw,
  Plus,
  Search,
  Filter,
  HelpCircle,
  ArrowLeft,
  MessageSquare,
  TrendingUp,
  Eye,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { cn } from '@/lib/utils';
import { SharedSessionsList } from '@/components/shared-sessions/shared-sessions-list';

export default function SharedSessionsPage() {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/login');
    }
  }, [ready, authenticated, router]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Create a custom event to trigger refresh in the SharedSessionsList component
    window.dispatchEvent(new CustomEvent('refreshSharedSessions'));
    // Reset refresh state after a short delay
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  // Enhanced loading state with better UX
  if (!ready) {
    return (
      <div className="h-full bg-background overflow-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Loading header skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-muted animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
                <div className="h-4 w-96 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Loading content skeleton */}
          <div className="bg-card rounded-xl p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FF6E71] flex items-center justify-center">
              <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                Shared Sessions
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage and monitor your publicly shared conversations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors disabled:opacity-50 text-sm font-medium"
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
              <span className="sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Help Panel */}
        {showHelp && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">How Shared Sessions Work</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2"></span>
                    <span>
                      Share your chat conversations with a public link that anyone can access
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2"></span>
                    <span>
                      Track views, engagement, and visitor analytics for each shared session
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2"></span>
                    <span>Edit titles and descriptions anytime to improve discoverability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2"></span>
                    <span>Unshare sessions instantly to revoke public access</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search shared sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background shadow-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6E71]/50 focus:border-[#FF6E71] transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-background border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>

        {/* Main Content */}
        <SharedSessionsList userId={user?.id} searchQuery={searchQuery} />

        {/* Bottom spacing for mobile */}
        <div className="h-8 sm:h-4"></div>
      </div>
    </div>
  );
}
