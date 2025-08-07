import Link from 'next/link';
import Image from 'next/image';

export function DashboardNavigation() {
  return (
    <div className="flex justify-between items-center w-full h-10">
      {/* Left Section - AUBRAI Title */}
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
        <div>
          <span className="text-white leading-none ">your longevity co-pilot</span>
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-3 text-xs">
        <Link href="/discord" className="text-white hover:text-white-300 transition-colors">
          Science Chat
        </Link>
        <Link href="/login" className="text-white hover:text-white-300 transition-colors">
          Twitter
        </Link>

        <button className="px-3 py-1  hover:text-white transition-colors flex items-center gap-1">
          <span className="text-white">●</span> Waitlist
        </button>
        <button className="px-3 py-1 border border-white font-semibold text-white hover:bg-white-400 hover:text-black transition-colors">
          GET $AUBRAI
        </button>
      </div>
    </div>
  );
}
