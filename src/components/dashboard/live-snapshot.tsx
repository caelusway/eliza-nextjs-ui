interface Metric {
  label: string;
  value: string | number;
  isHighlight?: boolean;
}

const metrics: Metric[] = [
  { label: 'IPTs minted', value: '0', isHighlight: true },
  { label: 'Aubrai mentions on X', value: '214', isHighlight: true },
  { label: 'Failure records', value: '60003', isHighlight: true },
  { label: 'Hypotheses generated', value: '4982', isHighlight: true },
  { label: 'Targets identified', value: '0', isHighlight: true },
  { label: 'Hits discovered', value: '0', isHighlight: true },
  { label: 'Papers indexed', value: '4000', isHighlight: true },
  { label: 'Clinical Trials Indexed', value: '4112', isHighlight: true },
  { label: 'Verified Researchers', value: '2012', isHighlight: true },
  { label: 'Monthly active Scientists', value: '216', isHighlight: true },
];

export function LiveSnapshot() {
  return (
    <div className="border border-white-400/30 bg-black/90 p-4">
      <div className="text-center mb-4">
        <div className="text-sm mb-2">YOUR LONGEVITY CO-PILOT</div>
        <div className="text-xs text-white-400/70">Expert AI for Dr de Grey&apos;s work</div>
      </div>

      <div className="space-y-3 text-xs">
        <div className="border-t border-white-400/20 pt-3">
          <div>LIVE Snapshot</div>
          <div className="ml-4 space-y-1 mt-2">
            {metrics.map((metric, index) => (
              <div key={index}>
                • {metric.label}{' '}
                <span className={metric.isHighlight ? 'text-orange-400' : ''}>
                  {metric.value}
                </span>
              </div>
            ))}
            <div>
              • Latest KDLI &apos;Stop waiting-fund repair biology.&apos; -{' '}
              <span className="text-blue-400">@longev_max</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}