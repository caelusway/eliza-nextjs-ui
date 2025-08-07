interface ProjectMetric {
  label: string;
  value: string | number;
}

const projectMetrics: ProjectMetric[] = [
  { label: 'IPTs minted', value: '21,400,424' },
  { label: 'Papers ingested', value: '21,400,424' },
  { label: 'Hypotheses generated', value: '21,400,424' },
  { label: 'Experiments designed', value: '21,400,424' },
  { label: 'Experiments executed', value: '400,424' },
  { label: 'Targets identified', value: '400,424' },
  { label: 'Failure records', value: '400,424' },
  { label: 'Aubrai mentions on X', value: '21,400,424' },
  { label: 'Monthly active scientists', value: '21,400,424' },
];

export function ProjectMetrics() {
  return (
    <div className="border bg-black/90 p-4 h-full">
      <div className="space-y-2 text-sm">
        {projectMetrics.map((metric, index) => (
          <div key={index} className="flex justify-between">
            <span>{metric.label}</span>
            <span className="text-accent">{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 