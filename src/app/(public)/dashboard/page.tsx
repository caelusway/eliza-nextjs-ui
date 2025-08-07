import { Metadata } from 'next';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardFooter } from '@/components/dashboard/dashboard-footer';
import { StatusBanner } from '@/components/dashboard/status-banner';
import { LiveSnapshot } from '@/components/dashboard/live-snapshot';
import { ArtworkSection } from '@/components/dashboard/artwork-section';
import { PartnersSection } from '@/components/dashboard/partners-section';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'System monitoring dashboard',
};

export default function DashboardPage() {
  return (
    <div className="w-full min-h-screen p-4 flex flex-col justify-between">
      <div>
        <DashboardHeader />

        <StatusBanner />

        {/* Main Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column - Metrics */}
          <LiveSnapshot />

          {/* Right Column - Artwork & Partners */}
          <div className="space-y-4">
            <ArtworkSection />
            <PartnersSection />
          </div>
        </div>
      </div>
      <DashboardFooter />
    </div>
  );
}
