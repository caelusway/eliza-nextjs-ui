import { Metadata } from 'next';
import Image from 'next/image';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'System monitoring dashboard',
};

export default function DashboardPage() {
  return (
    <div className="p-4 bg-red-200 w-full h-full">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader />

        {/* Status Banner */}
        <div className="border border-green-400/30 bg-black/90 p-2 mb-4 text-xs">
          <div>Last hypothesis #1,265 generated 2.0 min</div>
          <div>"ATOM-driven autophagy in microglia"</div>
        </div>

        {/* Main Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column - Metrics */}
          <div className="border border-green-400/30 bg-black/90 p-4">
            <div className="text-center mb-4">
              <div className="text-sm mb-2">YOUR LONGEVITY CO-PILOT</div>
              <div className="text-xs text-green-400/70">Expert AI for Grey's work</div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="border-t border-green-400/20 pt-3">
                <div>- LIVE SNAPSHOT</div>
                <div className="ml-4 space-y-1 mt-2">
                  <div>
                    • IOTA minted <span className="text-yellow-400">◯</span> launched_14
                  </div>
                  <div>
                    • Papers ingested___<span className="text-orange-400">172 979</span>
                  </div>
                  <div>
                    • Hypotheses generated_<span className="text-orange-400">1 265</span>
                  </div>
                  <div>
                    • Accelerands launched____<span className="text-orange-400">15</span>
                  </div>
                  <div>
                    • Pharma contracts________<span className="text-orange-400">4</span>
                  </div>
                  <div>
                    • Targets identified____<span className="text-orange-400">116</span>
                  </div>
                  <div>
                    • Hits discovered_______<span className="text-orange-400">24</span>
                  </div>
                  <div>
                    • Leads optimized________<span className="text-orange-400">6</span>
                  </div>
                  <div>
                    • Adoral mentions on X___<span className="text-orange-400">18</span>
                  </div>
                  <div>
                    • Verified researchers__<span className="text-orange-400">2012</span>
                  </div>
                  <div>
                    • Wallet holders________<span className="text-orange-400">612</span>
                  </div>
                  <div>
                    • Latest KDLI 'Stop waiting-fund repair biology.' -{' '}
                    <span className="text-blue-400">@longevmax</span>
                  </div>
                </div>
              </div>

              {/* Bottom Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-green-400/20">
                <div>
                  <div className="text-green-400/70">PAPERS DB</div>
                  <div className="text-lg">172,979</div>
                </div>
                <div>
                  <div className="text-green-400/70">RECENT LEADS</div>
                  <div className="text-lg">6</div>
                </div>
                <div>
                  <div className="text-green-400/70">AGENTS</div>
                  <div className="text-lg">4</div>
                </div>
                <div>
                  <div className="text-green-400/70">TREASURY</div>
                  <div className="text-lg">$0.1M</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Artwork & Partners */}
          <div className="space-y-4">
            {/* Artwork */}
            <div className="border border-green-400/30 bg-black/90 p-8 flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative w-48 h-48">
                <Image
                  src="/assets/aubrai-character-one.png"
                  alt="Aubrai Character"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Partners */}
            <div className="border border-green-400/30 bg-black/90 p-4">
              <div className="text-center">
                <div className="text-sm mb-4">PARTNERS</div>
                <div className="text-xs space-y-2">
                  <div>VitaDAO - LEVF - BioProtocol ×</div>
                  <div>Filio Framework - [logo row]</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Action Buttons */}
      </div>
    </div>
  );
}
