import { StatsRow } from '@/components/dashboard/header/stats-row';
import { DashboardNavigation } from '@/components/dashboard/header/dashboard-navigation';

export function DashboardHeader() {
  return (
    <div className="border border-[#333] bg-black/90 p-3 mb-4">
      <DashboardNavigation />
      <div className="border-b border-[#141B34] my-3" />
      <StatsRow />
    </div>
  );
}
