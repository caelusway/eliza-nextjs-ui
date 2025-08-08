export function XPostsSection() {
  const posts = [
    { username: '@kol-username', text: '"Stop waiting—fund repair biology."' },
    { username: '@kol-username', text: '"Stop waiting—fund repair biology."' },
    { username: '@kol-username', text: '"Stop waiting—fund repair biology."' },
    { username: '@kol-username', text: '"Stop waiting—fund repair biology."' },
    { username: '@kol-username', text: '"Stop waiting—fund repair biology."' },
    { username: '@kol-username', text: '"Stop waiting—fund repair biology."' },
    { username: '@kol-username', text: '"Stop waiting—fund repair biology."' },
    { username: '@kol-username', text: '"Stop waiting—fund repair biology."' },
  ];

  return (
    <div className="flex items-center gap-4">
      {posts.map((post, index) => (
        <div key={index} className="border border-white/10 bg-black p-4 rounded-none h-[86px] flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm text-white font-acumin-pro font-normal leading-[1.6]">
                {post.username}
              </span>
            </div>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" className="text-white">
              <path d="M3.5 0.5L8.5 0.5L8.5 5.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.5 0.5L0.5 8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          {/* Text */}
          <p className="text-sm text-[#757575] font-acumin-pro font-normal leading-[1.6]">
            {post.text}
          </p>
        </div>
      ))}
    </div>
  );
} 