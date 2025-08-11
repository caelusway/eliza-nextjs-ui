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
      <div className="bg-black text-white w-full h-screen flex flex-col overflow-hidden">
        {/* Main Container - Properly aligned elements */}
        <div className="flex flex-col p-2 gap-1 h-full">
          {/* Header Section */}
          <div className="flex-shrink-0">
            <DashboardHeader />
          </div>

          {/* Top Row - Status Banner and Progress side by side */}
          <div className="flex flex-col lg:flex-row gap-1 flex-1 lg:min-h-0">
            {/* Left Column - Status Banner + Sections below */}
            <div className="flex-1 lg:flex-[3] flex flex-col gap-1 h-full">
              {/* Status Banner */}
              <div className="flex-shrink-0">
                <StatusBanner />
              </div>
              
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
                
                {/* Artwork Section - Right side with Partners below - fills full height */}
                <div className="w-full lg:flex-1 flex flex-col gap-1 lg:h-full">
                  {/* Robot Artwork - expands to fill available space */}
                  <div className="hidden lg:flex items-center justify-center flex-1 lg:min-h-0">
                    <ArtworkSection />
                  </div>
                  
                  {/* Partners Section - Fixed height at bottom */}
                  <div className="h-[38.5px] flex-shrink-0">
                    <PartnersSection />
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
