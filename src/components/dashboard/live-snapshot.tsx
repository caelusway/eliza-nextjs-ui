interface Metric {
  label: string;
  value: string | number;
  isHighlight?: boolean;
  trend?: string;
}

const metrics: Metric[] = [
  { label: 'IPTs minted', value: '21,400,424', isHighlight: true },
  { label: 'Papers ingested', value: '21,400,424', isHighlight: true },
  { label: 'Hypotheses generated', value: '21,400,424', isHighlight: true },
  { label: 'Experiments designed', value: '21,400,424', isHighlight: true },
  { label: 'Experiments executed', value: '21,400,424', isHighlight: true },
  { label: 'Targets identified', value: '21,400,424', isHighlight: true },
  { label: 'Failure records', value: '21,400,424', isHighlight: true },
  { label: 'Aubrai mentions on X', value: '21,400,424', isHighlight: true },
  { label: 'Monthly active scientists', value: '21,400,424', isHighlight: true },
];

export function LiveSnapshot() {
  return (
    <div className="border border-white/20 bg-black p-6 rounded-none h-[600px] flex flex-col">
      <div className="flex-1 flex flex-col">
        <div className="flex-1">
          <div className="space-y-3">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">
                  {metric.label}
                </span>
                <span className="text-sm text-[#E9FF98] font-red-hat-mono font-normal leading-[0.9] text-right">
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}