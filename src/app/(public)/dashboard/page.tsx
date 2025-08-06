import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'System monitoring dashboard',
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4 overflow-hidden">
      {/* Terminal Header */}
      <div className="max-w-7xl mx-auto">
        <div className="border border-green-400/30 bg-black/90 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4 text-xs">
              <span>NAVBAR 64 px [blue glass]</span>
              <span className="text-yellow-400">⚡ Auth-driven autohiding in Midjourney</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-orange-400">🔥 Holders 0.612</span>
              <span>◆ Whit-list</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <span>💎 Vol $12.4 M</span>
            <span className="text-orange-400">🔥 Feed $42 K</span>
            <span>🎨 Treasury $0.1 M</span>
          </div>
        </div>

        {/* Status Banner */}
        <div className="border border-green-400/30 bg-black/90 p-2 mb-4 text-xs">
          <div>STATUS RIBBON 10 px</div>
          <div>Last hypothesis #1,265 generated 2.0 min = "ATOM-driven autophagy in microglia"</div>
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
                  <div>• IOTA minted <span className="text-yellow-400">◯</span> launched_14</div>
                  <div>• Papers ingested___<span className="text-orange-400">172 979</span></div>
                  <div>• Hypotheses generated_<span className="text-orange-400">1 265</span></div>
                  <div>• Accelerands launched____<span className="text-orange-400">15</span></div>
                  <div>• Pharma contracts________<span className="text-orange-400">4</span></div>
                  <div>• Targets identified____<span className="text-orange-400">116</span></div>
                  <div>• Hits discovered_______<span className="text-orange-400">24</span></div>
                  <div>• Leads optimized________<span className="text-orange-400">6</span></div>
                  <div>• Adoral mentions on X___<span className="text-orange-400">18</span></div>
                  <div>• Verified researchers__<span className="text-orange-400">2012</span></div>
                  <div>• Wallet holders________<span className="text-orange-400">612</span></div>
                  <div>• Latest KDLI 'Stop waiting-fund repair biology.' - <span className="text-blue-400">@longevmax</span></div>
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
            <div className="border border-green-400/30 bg-black/90 p-8 flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <div className="text-xs mb-4">◼ Robust artwork</div>
                <div className="text-xs text-green-400/70">(eyes blink, slow float)</div>
                <div className="mt-8 space-y-2">
                  <div className="text-xs">▦▦▦▦▦ 60 %</div>
                  <div className="text-xs text-green-400/50">Network Visualization</div>
                </div>
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

        {/* Footer Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="border border-green-400/30 bg-black/90 p-3 text-center">
            <div className="text-xs text-green-400/70">MDAO-1 TOKEN</div>
            <div className="text-xl">$1.52</div>
          </div>
          <div className="border border-green-400/30 bg-black/90 p-3 text-center">
            <div className="text-xs text-green-400/70">MKT CAP</div>
            <div className="text-xl">Mass</div>
          </div>
          <div className="border border-green-400/30 bg-black/90 p-3 text-center">
            <div className="text-xs text-green-400/70">NODES</div>
            <div className="text-xl">Privacy</div>
          </div>
          <div className="border border-green-400/30 bg-black/90 p-3 text-center">
            <div className="text-xs text-green-400/70">STATUS</div>
            <div className="text-xl text-yellow-400">Active</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Link
            href="/login"
            className="px-6 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors text-sm"
          >
            [Access Terminal]
          </Link>
          <Link
            href="/chat"
            className="px-6 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors text-sm"
          >
            [Start Session]
          </Link>
        </div>
      </div>
    </div>
  );
}