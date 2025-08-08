import { Metadata } from 'next';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardFooter } from '@/components/dashboard/dashboard-footer';
import { StatusBanner } from '@/components/dashboard/status-banner';
import { ArtworkSection } from '@/components/dashboard/artwork-section';
import { PartnersSection } from '@/components/dashboard/partners-section';
import { InferenceSection } from '@/components/dashboard/inference-section';
import { ProgressSection } from '@/components/dashboard/progress-section';
import { SocialMentions } from '@/components/dashboard/social-mentions';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Aubrai Longeivty Agent Dashboard',
};

export default function DashboardPage() {
  return (
    <DashboardLoader>
      <div className="bg-black text-white w-full lg:h-screen lg:overflow-hidden">
        {/* Main Container - Mobile: Scrollable, Desktop: Fixed Height */}
        <div className="min-h-screen lg:h-full flex flex-col p-2">
        {/* Header Section */}
        <div className="flex-shrink-0 mb-1">
          <DashboardHeader />
          <StatusBanner />
        </div>

        {/* Main Content - Mobile: Natural height, Desktop: Calculated height */}
        <div className="flex-1 flex flex-col lg:min-h-0">
          {/* Mobile: Image first, then stack sections. Desktop: Three columns */}
          <div className="flex-1 flex flex-col gap-1 lg:grid lg:grid-cols-12 lg:min-h-0">
            {/* Mobile Only - Robot Artwork at the top */}
            <div className="w-full min-h-[300px] md:min-h-[350px] lg:hidden flex items-center justify-center">
              <ArtworkSection />
            </div>

            {/* Left Panel - Inference with integrated metrics */}
            <div className="w-full min-h-[400px] lg:flex-1 lg:col-span-4 lg:min-h-0">
              <InferenceSection />
            </div>

            {/* Center and Right Panel Container */}
            <div className="w-full flex flex-col gap-1 lg:flex-1 lg:col-span-8 lg:min-h-0">
              {/* Mobile: Stack vertically, Desktop: Center artwork and right progress */}
              <div className="flex flex-col gap-1 lg:flex-1 md:grid md:grid-cols-4 lg:min-h-0">
                {/* Center Panel - Robot Artwork (Desktop only) */}
                <div className="hidden md:flex md:col-span-3 lg:min-h-0 items-center justify-center">
                  <ArtworkSection />
                </div>

                {/* Right Panel - Progress */}
                <div className="w-full min-h-[400px] lg:flex-1 md:col-span-1 lg:min-h-0">
                  <ProgressSection />
                </div>
              </div>

              {/* Partners Section - Under center and right only */}
              <div className="h-[38.5px] flex-shrink-0">
                <PartnersSection />
              </div>
            </div>
          </div>

          {/* Social Mentions Section - Dynamic Twitter Integration */}
          <SocialMentions />
        </div>

        {/* Footer Section */}
        <div className="flex-shrink-0 mt-1">
          <DashboardFooter />
        </div>
      </div>
    </div>
    </DashboardLoader>
  );
}
