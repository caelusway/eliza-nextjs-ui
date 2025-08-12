import { Metadata } from 'next';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardFooter } from '@/components/dashboard/dashboard-footer';
import { HypothesisBanner } from '@/components/dashboard/hypothesis-banner';
import { ArtworkSection } from '@/components/dashboard/artwork-section';
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
            <HypothesisBanner />
          </div>

          {/* Top Row - Progress side by side */}
          <div className="flex flex-col lg:flex-row gap-1 flex-1 lg:min-h-0">
            {/* Left Column - Sections below */}
            <div className="flex-1 lg:flex-[3] flex flex-col gap-1 h-full">
              
              {/* Mobile Only - Robot Artwork */}
              <div className="w-full min-h-[300px] md:min-h-[350px] lg:hidden flex items-center justify-center">
                <ArtworkSection />
              </div>

              {/* Inference and Artwork side by side - fills remaining height */}
              <div className="flex flex-col lg:flex-row gap-1 flex-1 lg:min-h-0">
                {/* Inference Section - Left side - fills full height */}
                <div className="w-full lg:flex-1 flex flex-col min-h-[400px] lg:min-h-0 lg:h-full">
                  <InferenceSection />
                </div>
                
                {/* Artwork Section - Right side - fills full height */}
                <div className="w-full lg:flex-1 lg:h-full">
                  {/* Robot Artwork with Partners integrated - fills full height */}
                  <div className="hidden lg:flex h-full">
                    <ArtworkSection />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Progress Section - fills full height */}
            <div className="w-full lg:w-80 lg:h-full">
              <ProgressSection />
            </div>
          </div>

          {/* Social Mentions Section - Positioned properly */}
          <div className="flex-shrink-0">
            <SocialMentions />
          </div>

          {/* Footer Section */}
          <div className="flex-shrink-0">
            <DashboardFooter />
          </div>
        </div>
      </div>
    </DashboardLoader>
  );
}
