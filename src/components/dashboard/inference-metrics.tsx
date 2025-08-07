interface InferenceMetric {
  label: string;
  value: string | number;
  unit?: string;
}

const inferenceMetrics: InferenceMetric[] = [
  { label: 'AI models used', value: '21,400,424' },
  { label: 'Aubrai is inferencing', value: '21,400,424' },
  { label: 'Tokens per second', value: '21,400,424' },
  { label: 'Last hp generated', value: '11:00' },
];

const modelInfo = [
  { model: 'LARGE_MODEL: anthropic/claude', time: '4,2 s' },
  { model: 'SMALL_MODEL: openai/gpt-oss-12', time: '4,2 s' },
];

export function InferenceMetrics() {
  return (
    <div className="border bg-black/90 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-2xl font-bold">Inference</div>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        {modelInfo.map((info, index) => (
          <div key={index} className="flex justify-between">
            <span>{info.model}</span>
            <span>{info.time}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-sm">
        {inferenceMetrics.map((metric, index) => (
          <div key={index} className="flex justify-between">
            <span>{metric.label}</span>
            <span className="text-accent">{metric.value}{metric.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 