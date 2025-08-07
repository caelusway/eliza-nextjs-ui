import Link from 'next/link';
import Image from 'next/image';

export function DashboardHeader() {
  return (
    <div className="border border-white-400/30 bg-black/90 p-3 mb-4">
      <div className="flex items-center justify-between">

        {/* Center Section - AUBRAI Title */}
        <div className="flex items-center gap-3 text-xs">
          <div className="relative h-6 w-20">
            <Image
              src="/assets/logo_text.png"
              alt="AUBRAI"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-white">YOUR LONGEVITY CO-PILOT</span>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3 text-xs">
          <Link 
            href="/discord" 
            className="text-white hover:text-white-300 transition-colors"
          >
            Discord
          </Link>
          <Link 
            href="/login" 
            className="text-white hover:text-white-300 transition-colors"
          >
            Login
          </Link>
          <button className="px-3 py-1 border border-white-400 text-white hover:bg-white-400 hover:text-black transition-colors">
            $GET AUBRAI
          </button>
          <button className="px-3 py-1 text-white/70 hover:text-white transition-colors flex items-center gap-1">
            <span className="text-white">●</span> WAITLIST
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-6 text-xs mt-3 pt-3 border-t border-white-400/20">
        <div className="flex items-center gap-2">
          <span className="text-orange-400">💰</span>
          <span className="text-white/70">Vol</span>
          <span className="text-orange-400">$12.3 M</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-orange-400">🔥</span>
          <span className="text-white/70">Fees</span>
          <span className="text-orange-400">$42 K</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-orange-400">🏦</span>
          <span className="text-white/70">Treasury</span>
          <span className="text-orange-400">$8.1 M</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/70">◆</span>
          <span className="text-white/70">Holders</span>
          <span className="text-orange-400">8 612</span>
        </div>
      </div>
    </div>
  );
}