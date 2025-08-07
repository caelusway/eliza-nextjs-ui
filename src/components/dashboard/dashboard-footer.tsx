import Link from 'next/link';

export function DashboardFooter() {
  return (
    <div className="border-t-2 border-white-400/30 mt-8 bg-black/90">
      <div className="max-w-7xl mx-auto px-4 py-3">
        
        <div className="flex items-center justify-center gap-8 text-xs mt-2">
          <div className="flex items-center gap-2">
            <span className="text-white-400/70">©</span>
            <span className="text-white-400">2025 AUBRAI</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-white-400/70">Treasury</span>
            <span className="text-orange-400 font-mono">0xTREA5...sure</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-white-400/70">Contract</span>
            <span className="text-orange-400 font-mono">0xC0N7...tract</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-white-400/70">Built on</span>
            <span className="text-white-400">Base</span>
          </div>
          
          <span className="text-white-400/70">•</span>
          
          <Link 
            href="/docs" 
            className="text-white-400 hover:text-white-300 transition-colors"
          >
            Docs
          </Link>
          
          <span className="text-white-400/70">•</span>
          
          <Link 
            href="/privacy" 
            className="text-white-400 hover:text-white-300 transition-colors"
          >
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
}