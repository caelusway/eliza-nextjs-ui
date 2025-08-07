interface ProgressMetric {
  label: string;
  value: string;
  percentage: string;
  conversionRate: string;
}

const progressMetrics: ProgressMetric[] = [
  { label: 'Papers Uploaded', value: '12,475', percentage: '7%', conversionRate: '40% conv.' },
  { label: 'Nodes in Knowledge Graph', value: '12,475', percentage: '7%', conversionRate: '40% conv.' },
  { label: 'Generated', value: '12,475', percentage: '7%', conversionRate: '40% conv.' },
  { label: 'Experiments designed', value: '12,475', percentage: '7%', conversionRate: '40% conv.' },
  { label: 'IPTs minted', value: '12,475', percentage: '7%', conversionRate: '40% conv.' },
  { label: 'Experiments started', value: '12,475', percentage: '7%', conversionRate: '40% conv.' },
];

export function ProgressMetrics() {
  return (
    <div className="space-y-3">
      {progressMetrics.map((metric, index) => (
        <div key={index} className="border  bg-black/90 p-4 ">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold">{metric.value}</span>
            <span className="text-green-400">↗ {metric.percentage}</span>
          </div>
          <div className="text-sm mb-1">{metric.label}</div>
          <div className="text-xs text-gray-400">{metric.conversionRate}</div>
        </div>
      ))}
    </div>
  );
} 