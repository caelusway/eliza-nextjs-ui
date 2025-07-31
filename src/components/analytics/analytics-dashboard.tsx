'use client';

import { useEffect, useState } from 'react';
import {
  Eye,
  Users,
  Clock,
  TrendingUp,
  Globe,
  ExternalLink,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { useAuthenticatedFetch } from '@/lib/authenticated-fetch';

interface AnalyticsData {
  summary: {
    uniqueVisitors: number;
    totalViews: number;
    avgSessionDuration: number;
  };
  topReferrers: Array<{ referrer: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
  visitsByHour: Array<{ hour: number; count: number }>;
  visitsByDay: Array<{ date: string; visits: number; uniqueVisitors: number }>;
  recentVisits: Array<{
    id: string;
    visitor_id: string;
    visited_at: string;
    referrer: string | null;
    country: string | null;
    session_duration: number | null;
  }>;
}

interface AnalyticsDashboardProps {
  sharedSessionId: string;
  userId: string;
  title: string;
}

export const AnalyticsDashboard = ({ sharedSessionId, userId, title }: AnalyticsDashboardProps) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(
          `/api/analytics/${sharedSessionId}?userId=${encodeURIComponent(userId)}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch analytics');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [sharedSessionId, userId, authenticatedFetch]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-muted/50 rounded-xl p-6">
        <p className="text-muted-foreground text-center">No analytics data available</p>
      </div>
    );
  }

  const maxVisitsInDay = Math.max(...data.visitsByDay.map((d) => d.visits));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Analytics for &quot;{title}&quot;
        </h3>
        <p className="text-muted-foreground">
          Insights and visitor data for your shared chat session
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold text-foreground">
                {data.summary.totalViews.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-muted-foreground">Unique Visitors</p>
              <p className="text-2xl font-bold text-foreground">
                {data.summary.uniqueVisitors.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-muted-foreground">Avg. Duration</p>
              <p className="text-2xl font-bold text-foreground">
                {formatDuration(data.summary.avgSessionDuration)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visits by Day Chart */}
      <div className="bg-card rounded-xl p-6">
        <h4 className="text-lg font-semibold text-foreground mb-4">Daily Visits</h4>
        <div className="space-y-2">
          {data.visitsByDay.map((day) => (
            <div key={day.date} className="flex items-center gap-3">
              <div className="w-16 text-sm text-muted-foreground">{formatDate(day.date)}</div>
              <div className="flex-1 bg-muted rounded-full h-2 relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-[#FF6E71] rounded-full transition-all duration-300"
                  style={{
                    width: `${maxVisitsInDay > 0 ? (day.visits / maxVisitsInDay) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="w-12 text-sm text-foreground font-medium text-right">
                {day.visits}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Referrers and Countries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <div className="bg-card rounded-xl p-6">
          <h4 className="text-lg font-semibold text-foreground mb-4">Top Referrers</h4>
          <div className="space-y-3">
            {data.topReferrers.length > 0 ? (
              data.topReferrers.map((referrer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground truncate">
                      {referrer.referrer || 'Direct'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {referrer.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No referrer data available</p>
            )}
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-card rounded-xl p-6">
          <h4 className="text-lg font-semibold text-foreground mb-4">Top Countries</h4>
          <div className="space-y-3">
            {data.topCountries.length > 0 ? (
              data.topCountries.map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground truncate">
                      {country.country || 'Unknown'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{country.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No country data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Visits */}
      <div className="bg-card rounded-xl p-6">
        <h4 className="text-lg font-semibold text-foreground mb-4">Recent Visits</h4>
        <div className="space-y-3">
          {data.recentVisits.length > 0 ? (
            data.recentVisits.map((visit) => (
              <div
                key={visit.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm text-foreground">{visit.country || 'Unknown Location'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(visit.visited_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {visit.session_duration && (
                    <p className="text-sm text-muted-foreground">
                      {formatDuration(visit.session_duration)}
                    </p>
                  )}
                  {visit.referrer && (
                    <p className="text-xs text-muted-foreground truncate max-w-24">
                      from {visit.referrer}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recent visits</p>
          )}
        </div>
      </div>
    </div>
  );
};
