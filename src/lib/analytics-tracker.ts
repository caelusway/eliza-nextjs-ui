import { supabase } from '@/lib/supabase/client';

interface AnalyticsData {
  sharedSessionId: string;
  visitorId: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  city?: string;
}

interface LocationData {
  country?: string;
  city?: string;
}

class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  private visitorId: string | null = null;
  private sessionStartTime: number | null = null;

  private constructor() {}

  static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  private generateVisitorId(): string {
    // Try to get existing visitor ID from localStorage
    if (typeof window !== 'undefined') {
      const existingId = localStorage.getItem('visitor_id');
      if (existingId) {
        return existingId;
      }

      // Generate new visitor ID
      const newId = crypto.randomUUID();
      localStorage.setItem('visitor_id', newId);
      return newId;
    }

    // Fallback for server-side or when localStorage is unavailable
    return crypto.randomUUID();
  }

  private async getLocationData(ipAddress?: string): Promise<LocationData> {
    // In a real implementation, you might use a service like ipapi.co or similar
    // For now, we'll just return empty data
    // You could also use the browser's geolocation API with user permission

    try {
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        // Note: This requires user permission and doesn't give country/city directly
        // You'd need to use a reverse geocoding service
      }
    } catch (error) {
      console.warn('Could not get location data:', error);
    }

    return {};
  }

  private getUserAgent(): string {
    if (typeof window !== 'undefined') {
      return navigator.userAgent;
    }
    return '';
  }

  private getReferrer(): string {
    if (typeof window !== 'undefined') {
      return document.referrer;
    }
    return '';
  }

  async trackPageView(sharedSessionId: string, ipAddress?: string): Promise<boolean> {
    try {
      if (!this.visitorId) {
        this.visitorId = this.generateVisitorId();
      }

      this.sessionStartTime = Date.now();

      const locationData = await this.getLocationData(ipAddress);

      const analyticsData: AnalyticsData = {
        sharedSessionId,
        visitorId: this.visitorId,
        ipAddress,
        userAgent: this.getUserAgent(),
        referrer: this.getReferrer(),
        country: locationData.country,
        city: locationData.city,
      };

      const { error } = await supabase.from('shared_chat_analytics').insert({
        shared_session_id: analyticsData.sharedSessionId,
        visitor_id: analyticsData.visitorId,
        ip_address: analyticsData.ipAddress,
        user_agent: analyticsData.userAgent,
        referrer: analyticsData.referrer,
        country: analyticsData.country,
        city: analyticsData.city,
      });

      if (error) {
        console.error('Error tracking page view:', error);
        return false;
      }

      // Set up beforeunload to track session duration
      if (typeof window !== 'undefined') {
        const handleBeforeUnload = () => {
          this.trackSessionEnd(sharedSessionId);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // Also track on visibility change (when user switches tabs)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            this.trackSessionEnd(sharedSessionId);
          }
        });
      }

      return true;
    } catch (error) {
      console.error('Error in trackPageView:', error);
      return false;
    }
  }

  private async trackSessionEnd(sharedSessionId: string): Promise<void> {
    if (!this.visitorId || !this.sessionStartTime) {
      return;
    }

    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);

    try {
      // Update the most recent analytics record for this visitor and session
      const { error } = await supabase
        .from('shared_chat_analytics')
        .update({ session_duration: sessionDuration })
        .eq('shared_session_id', sharedSessionId)
        .eq('visitor_id', this.visitorId)
        .order('visited_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error updating session duration:', error);
      }
    } catch (error) {
      console.error('Error in trackSessionEnd:', error);
    }
  }

  async getAnalytics(sharedSessionId: string): Promise<any> {
    try {
      // Get basic analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('shared_chat_analytics')
        .select('*')
        .eq('shared_session_id', sharedSessionId);

      if (analyticsError) {
        console.error('Error fetching analytics:', analyticsError);
        return null;
      }

      // Get daily aggregated data
      const { data: dailyData, error: dailyError } = await supabase
        .from('daily_analytics')
        .select('*')
        .eq('shared_session_id', sharedSessionId)
        .order('date', { ascending: false });

      if (dailyError) {
        console.error('Error fetching daily analytics:', dailyError);
      }

      // Calculate summary stats
      const uniqueVisitors = new Set(analyticsData?.map((record) => record.visitor_id)).size;
      const totalViews = analyticsData?.length || 0;
      const avgSessionDuration =
        analyticsData?.reduce((acc, record) => {
          return acc + (record.session_duration || 0);
        }, 0) / (analyticsData?.filter((record) => record.session_duration).length || 1);

      // Get top referrers
      const referrerCounts = analyticsData?.reduce((acc: Record<string, number>, record) => {
        if (record.referrer) {
          acc[record.referrer] = (acc[record.referrer] || 0) + 1;
        }
        return acc;
      }, {});

      const topReferrers = Object.entries(referrerCounts || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([referrer, count]) => ({ referrer, count }));

      // Get top countries
      const countryCounts = analyticsData?.reduce((acc: Record<string, number>, record) => {
        if (record.country) {
          acc[record.country] = (acc[record.country] || 0) + 1;
        }
        return acc;
      }, {});

      const topCountries = Object.entries(countryCounts || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([country, count]) => ({ country, count }));

      return {
        summary: {
          uniqueVisitors,
          totalViews,
          avgSessionDuration: Math.round(avgSessionDuration),
        },
        dailyData: dailyData || [],
        topReferrers,
        topCountries,
        rawData: analyticsData || [],
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return null;
    }
  }
}

export default AnalyticsTracker;
