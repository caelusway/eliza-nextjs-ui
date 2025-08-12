export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author: {
    username: string;
    name: string;
    profile_image_url?: string;
  };
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
  entities?: {
    urls?: Array<{
      expanded_url: string;
      display_url: string;
    }>;
    hashtags?: Array<{
      tag: string;
    }>;
    mentions?: Array<{
      username: string;
    }>;
  };
}

export interface CachedTweets {
  data: Tweet[];
  timestamp: number;
}

interface TwitterApiResponse {
  data?: Array<{
    id: string;
    text: string;
    created_at?: string;
    author_id?: string;
    public_metrics?: {
      retweet_count: number;
      like_count: number;
      reply_count: number;
      quote_count: number;
    };
    entities?: {
      urls?: Array<{
        expanded_url: string;
        display_url: string;
      }>;
      hashtags?: Array<{
        tag: string;
      }>;
      mentions?: Array<{
        username: string;
      }>;
    };
  }>;
  includes?: {
    users?: Array<{
      id: string;
      username: string;
      name: string;
      profile_image_url?: string;
    }>;
  };
  errors?: Array<{
    title: string;
    detail: string;
  }>;
}

interface TwitterUser {
  data?: {
    id: string;
    username: string;
    name: string;
    profile_image_url?: string;
  };
  errors?: Array<{
    title: string;
    detail: string;
  }>;
}

class TwitterService {
  private cache: Map<string, CachedTweets> = new Map();
  private readonly CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  private readonly BASE_URL = 'https://api.twitter.com/2';
  
  private bearerToken: string;

  constructor() {
    // Create Bearer Token from API Key and Secret
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET_KEY) {
      throw new Error('Twitter API credentials are required');
    }
    
    const credentials = Buffer.from(
      `${process.env.TWITTER_API_KEY}:${process.env.TWITTER_API_SECRET_KEY}`
    ).toString('base64');
    
    this.bearerToken = `Basic ${credentials}`;
  }

  private async getBearerToken(): Promise<string> {
    try {
      const response = await fetch('https://api.twitter.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': this.bearerToken,
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Failed to get bearer token: ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('[TwitterService] Error getting bearer token:', error);
      throw error;
    }
  }

  private async makeTwitterRequest(endpoint: string, params?: Record<string, string>): Promise<any> {
    try {
      const bearerToken = await this.getBearerToken();
      
      const url = new URL(`${this.BASE_URL}${endpoint}`);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Twitter API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[TwitterService] API request failed:', error);
      throw error;
    }
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  private getCacheKey(username: string): string {
    return `tweets_${username}`;
  }

  private cleanText(text: string): string {
    // Remove URLs, extra whitespace, and clean up text
    return text
      .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
      .replace(/\n+/g, ' ') // Replace newlines with space
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  async getUserTweets(username: string, count: number = 10): Promise<Tweet[]> {
    try {
      const cacheKey = this.getCacheKey(username);
      const cached = this.cache.get(cacheKey);

      // Return cached data if valid
      if (cached && this.isCacheValid(cached.timestamp)) {
        console.log(`[TwitterService] Returning cached tweets for @${username}`);
        return cached.data;
      }

      console.log(`[TwitterService] Fetching fresh tweets for @${username}`);

      // Get user by username first
      const userResponse: TwitterUser = await this.makeTwitterRequest(`/users/by/username/${username}`, {
        'user.fields': 'profile_image_url,name,username'
      });

      if (!userResponse.data) {
        throw new Error(`User @${username} not found: ${userResponse.errors?.[0]?.detail || 'Unknown error'}`);
      }

      const user = userResponse.data;

      // Fetch user's tweets
      const tweetsResponse: TwitterApiResponse = await this.makeTwitterRequest(`/users/${user.id}/tweets`, {
        'max_results': Math.min(count, 100).toString(),
        'tweet.fields': 'created_at,public_metrics,entities,text',
        'user.fields': 'profile_image_url,name,username',
        'expansions': 'author_id',
        'exclude': 'retweets'
      });

      if (!tweetsResponse.data || tweetsResponse.data.length === 0) {
        console.log(`[TwitterService] No tweets found for @${username}`);
        return [];
      }

      // Transform tweets to our interface
      const transformedTweets: Tweet[] = tweetsResponse.data.map(tweet => ({
        id: tweet.id,
        text: this.cleanText(tweet.text),
        created_at: tweet.created_at || new Date().toISOString(),
        author: {
          username: user.username,
          name: user.name,
          profile_image_url: user.profile_image_url
        },
        public_metrics: tweet.public_metrics || {
          retweet_count: 0,
          like_count: 0,
          reply_count: 0,
          quote_count: 0
        },
        entities: tweet.entities
      }));

      // Cache the results
      this.cache.set(cacheKey, {
        data: transformedTweets,
        timestamp: Date.now()
      });

      console.log(`[TwitterService] Cached ${transformedTweets.length} tweets for @${username}`);
      return transformedTweets;

    } catch (error) {
      console.error(`[TwitterService] Error fetching tweets for @${username}:`, error);
      
      // Return cached data if available, even if expired
      const cacheKey = this.getCacheKey(username);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log(`[TwitterService] Returning expired cached tweets for @${username}`);
        return cached.data;
      }

      // Return empty array as fallback
      return [];
    }
  }

  // Get cache status for debugging
  getCacheStatus(username: string) {
    const cacheKey = this.getCacheKey(username);
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      return { cached: false, timestamp: null, valid: false };
    }

    return {
      cached: true,
      timestamp: cached.timestamp,
      valid: this.isCacheValid(cached.timestamp),
      age: Date.now() - cached.timestamp
    };
  }

  // Clear cache for a specific user
  clearCache(username: string) {
    const cacheKey = this.getCacheKey(username);
    this.cache.delete(cacheKey);
    console.log(`[TwitterService] Cache cleared for @${username}`);
  }

  // Clear all cache
  clearAllCache() {
    this.cache.clear();
    console.log(`[TwitterService] All cache cleared`);
  }
}

// Singleton instance
const twitterService = new TwitterService();
export default twitterService;