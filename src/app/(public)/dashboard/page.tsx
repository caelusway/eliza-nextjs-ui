import { Metadata } from 'next';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardFooter } from '@/components/dashboard/dashboard-footer';
import { StatusBanner } from '@/components/dashboard/status-banner';
import { InferenceMetrics } from '@/components/dashboard/inference-metrics';
import { ProjectMetrics } from '@/components/dashboard/project-metrics';
import { ArtworkSection } from '@/components/dashboard/artwork-section';
import { ProgressMetrics } from '@/components/dashboard/progress-metrics';

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

        {/* Main Three Column Grid */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <InferenceMetrics />
            <ProjectMetrics />
          </div>

          <div className="col-span-12 lg:col-span-6">
            <ArtworkSection />
          </div>

          <div className="col-span-12 lg:col-span-2">
            <ProgressMetrics />
          </div>
        </div>

      </div>
      <DashboardFooter />
    </div>
  );
}
