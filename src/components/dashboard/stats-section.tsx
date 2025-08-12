export function StatsSection() {
  const stats = [
    { label: 'IPTs minted', value: '21,400,424' },
    { label: 'Papers ingested', value: '21,400,424' },
    { label: 'Hypotheses generated', value: '21,400,424' },
    { label: 'Experiments designed', value: '21,400,424' },
    { label: 'Experiments executed', value: '21,400,424' },
    { label: 'Targets identified', value: '21,400,424' },
    { label: 'Failure records', value: '21,400,424' },
    { label: 'Aubrai mentions on X', value: '21,400,424' },
    { label: 'Monthly active scientists', value: '21,400,424' },
  ];

  return (
    <div className="border border-white/20 bg-black p-6 rounded-none">
      <div className="space-y-3">
        {stats.map((stat, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">
              {stat.label}
            </span>
            <span className="text-sm text-[#E9FF98] font-red-hat-mono font-normal leading-[0.9] text-right">
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 