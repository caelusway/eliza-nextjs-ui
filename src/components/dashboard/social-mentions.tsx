'use client';

import { useTRPCTweets } from '@/hooks/use-trpc-twitter';
import { formatDistanceToNow } from 'date-fns';

export function SocialMentions() {
  const { tweets, loading, error, lastFetched } = useTRPCTweets({
    username: 'AUBRAI_',
    count: 10, // Fetch 10 tweets for caching
    refreshInterval: 2 * 60 * 60 * 1000, // 2 hours
  });

  // Function to shorten tweet text for preview
  const shortenText = (text: string, maxLength: number = 60): string => {
    if (text.length <= maxLength) return text;

    // Find the last complete word within the limit
    const truncated = text.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    // If there's a space near the end, cut at the last word
    if (lastSpaceIndex > maxLength * 0.8) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }

    // Otherwise, just truncate and add ellipsis
    return truncated + '...';
  };

  // Fallback data in case of loading or error
  const fallbackTweets = [
    {
      id: '1',
      text: '"Stop waiting—fund repair biology."',
      username: '@samknowsscience',
      created_at: null,
      metrics: null,
    },
    {
      id: '2',
      text: '"Science moves forward when we fund bold research."',
      username: '@samknowsscience',
      created_at: null,
      metrics: null,
    },
    {
      id: '3',
      text: '"The future of longevity research is in our hands."',
      username: '@samknowsscience',
      created_at: null,
      metrics: null,
    },
    {
      id: '4',
      text: '"Every dollar invested in aging research saves lives."',
      username: '@samknowsscience',
      created_at: null,
      metrics: null,
    },
    {
      id: '5',
      text: '"We need to accelerate biomedical research now."',
      username: '@samknowsscience',
      created_at: null,
      metrics: null,
    },
  ];

  const displayTweets =
    error || loading || tweets.length === 0
      ? fallbackTweets.map((tweet) => ({
          ...tweet,
          url: `https://x.com/AUBRAI_`, // Fallback to profile
        }))
      : tweets.map((tweet) => {
          const tweetUrl = `https://x.com/${tweet.author.username}/status/${tweet.id}`;
          console.log(`[SocialMentions] Generated URL: ${tweetUrl} for tweet ID: ${tweet.id}`);
          return {
            id: tweet.id,
            text: `"${shortenText(tweet.text)}"`,
            username: `@${tweet.author.username}`,
            created_at: tweet.created_at,
            metrics: tweet.public_metrics,
            url: tweetUrl,
          };
        });

  // Log tweet data for debugging
  if (tweets.length > 0) {
    console.log(
      `[SocialMentions] Processing ${tweets.length} tweets:`,
      tweets.map((t) => ({
        id: t.id,
        username: t.author.username,
        text: t.text.substring(0, 50) + '...',
      }))
    );
  }

  return (
    <div className="h-[85px] w-full mt-3 mb-3 rounded-none  flex-shrink-0">
      <div className="h-full bg-black relative">
        {/* Loading indicator */}
        {loading && tweets.length === 0 && (
          <div className="absolute top-2 right-2 z-10">
            <div className="w-2 h-2 bg-green-500  animate-pulse"></div>
          </div>
        )}

        {/* Error indicator */}
        {error && (
          <div className="absolute top-2 right-2 z-10" title={`Error: ${error}`}>
            <div className="w-2 h-2 bg-red-500"></div>
          </div>
        )}

        <div className="flex items-center h-full py-2">
          <div className="flex items-center animate-scroll gap-4 md:gap-8">
            {/* Duplicate the content for seamless loop */}
            {Array.from({ length: 3 }).map((_, setIndex) => (
              <div key={setIndex} className="flex items-center gap-4 md:gap-8 whitespace-nowrap">
                {displayTweets.map((tweet, index) => (
                  <a
                    key={`${setIndex}-${tweet.id}-${index}`}
                    href={tweet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`View tweet: ${tweet.url}`}
                    className="bg-black p-4 md:p-3  flex flex-col min-w-[250px] md:min-w-[300px] cursor-pointer group border border-white/20"
                  >
                    <div className="flex items-center gap-2 mb-1 md:mb-2">
                      <span className="text-white font-red-hat-mono text-xs md:text-sm">
                        {tweet.username}
                      </span>
                      <div className="ml-auto flex items-center gap-1">
                        {/* Show engagement metrics for real tweets */}
                        {tweet.metrics && (
                          <span className="text-gray-500 font-red-hat-mono text-xs">
                            {tweet.metrics.like_count > 0 && `♥ ${tweet.metrics.like_count}`}
                          </span>
                        )}
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 12 12"
                          fill="none"
                          className="text-white md:w-3 md:h-3 group-hover:text-blue-400 transition-colors"
                        >
                          <path
                            d="M1 11L11 1M11 1H1M11 1V11"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="text-gray-400 font-red-hat-mono text-xs md:text-sm leading-tight">
                      {tweet.text}
                    </div>
                    {/* Show relative time for real tweets */}
                    {tweet.created_at && (
                      <div className="text-gray-600 font-red-hat-mono text-xs mt-1">
                        {formatDistanceToNow(new Date(tweet.created_at), { addSuffix: true })}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
