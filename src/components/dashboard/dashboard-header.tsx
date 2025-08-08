import { StatsRow } from '@/components/dashboard/header/stats-row';
import { DashboardNavigation } from '@/components/dashboard/header/dashboard-navigation';

export function DashboardHeader() {
  return (
    <div className="border border-white/20 bg-black p-3 rounded-none">
      <DashboardNavigation />
      <div className="border-b border-[#141B34] my-3" />
      <StatsRow />
    </div>
  );
}
