interface TweetCard {
  username: string;
  quote: string;
}

const sampleTweets: TweetCard[] = [
  { username: '@kol-username', quote: 'Stop waiting—fund repair biology.' },
  { username: '@scientist-1', quote: 'The future of longevity is now.' },
  { username: '@researcher-2', quote: 'AI-driven discovery accelerates breakthroughs.' },
  { username: '@investor-3', quote: 'Aubrai is revolutionizing the field.' },
  { username: '@expert-4', quote: 'This changes everything we know.' },
  { username: '@analyst-5', quote: 'The data speaks for itself.' },
];

export function TweetBar() {
  return (
    <div className="border p-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {sampleTweets.map((tweet, index) => (
          <div key={index} className="flex-shrink-0 border bg-black/50 p-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2  mt-1 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{tweet.username}</span>
                  <svg className="w-3 h-3 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 11l5-5m0 0l5 5m-5-5v12"
                    />
                  </svg>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">&quot;{tweet.quote}&quot;</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
