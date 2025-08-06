import { Metadata } from 'next';
import Image from 'next/image';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardFooter } from '@/components/dashboard/dashboard-footer';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'System monitoring dashboard',
};

export default function DashboardPage() {
  return (
    <div className="w-full min-h-screen p-4 flex flex-col justify-between">
      <div>
        <DashboardHeader />

        {/* Status Banner */}
        <div className="border border-green-400/30 bg-black/90 p-2 mb-4 text-xs">
          <div>Last hypothesis #1,265 generated 2.0 min</div>
          <div>ATOM-driven autophagy in microglia</div>
        </div>

        {/* Main Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column - Metrics */}
          <div className="border border-green-400/30 bg-black/90 p-4">
            <div className="text-center mb-4">
              <div className="text-sm mb-2">YOUR LONGEVITY CO-PILOT</div>
              <div className="text-xs text-green-400/70">Expert AI for Dr de Grey&apos;s work</div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="border-t border-green-400/20 pt-3">
                <div>LIVE Snapshot</div>
                <div className="ml-4 space-y-1 mt-2">
                  <div>
                    • IPTs launched <span className="text-orange-400">14</span>
                  </div>
                  <div>
                    • Aubrai mentions on X <span className="text-orange-400">214</span>
                  </div>
                  <div>
                    • Failure records <span className="text-orange-400">60003</span>
                  </div>
                  <div>
                    • Hypotheses generated <span className="text-orange-400">4982</span>
                  </div>
                  <div>
                    • Targets identified <span className="text-orange-400">116</span>
                  </div>
                  <div>
                    • Hits discovered <span className="text-orange-400">24</span>
                  </div>
                  <div>
                    • Papers indexed <span className="text-orange-400">12 475</span>
                  </div>
                  <div>
                    • Clinicial Trials Indexed <span className="text-orange-400">4112</span>
                  </div>
                  <div>
                    • Verified Researchers <span className="text-orange-400">2012</span>
                  </div>
                  <div>
                    • Monthly active Scientists <span className="text-orange-400">216</span>
                  </div>
                  <div>
                    • Latest KDLI 'Stop waiting-fund repair biology.' -{' '}
                    <span className="text-blue-400">@longev_max</span>
                  </div>
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
                  <div>VitaDAO - LEVF - BioProtocol</div>
                  <div>Eliza Framework - [logo row]</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DashboardFooter />
    </div>
  );
}
