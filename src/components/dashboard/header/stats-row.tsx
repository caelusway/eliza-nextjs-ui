import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon';

export function StatsRow() {
  const stats = [
    { icon: "volume", label: "Vol", value: "$12.3 M" },
    { icon: "chart", label: "Fees", value: "$42 K" },
    { icon: "bank", label: "Treasury", value: "$8.1 M" },
    { icon: "pie-chart", label: "Holders", value: "8 612" },
  ];

  return (
    <div className="flex items-center gap-6 text-xs mt-3 py-2 px-1 border border-white-400/20">
      {stats.map((stat, index) => (
        <div key={index} className="flex items-center gap-2">
          <DynamicSvgIcon iconName={stat.icon} />
          <span className="leading-none">{stat.label}</span>
          <span className="text-accent leading-none">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}