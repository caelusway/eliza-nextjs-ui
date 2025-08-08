import Image from 'next/image';

export function InferenceSection() {
  const aiModels = [
    { name: 'LARGE_MODEL', model: 'anthropic/claude-opus-4', time: '4,2 s' },
    { name: 'SMALL_MODEL', model: 'openai/gpt-oss-120b', time: '4,2 s' },
  ];

  const inferenceMetrics = [
    { label: 'AI models used', value: '21,400,424' },
    { label: 'Aubrai is inferencing', value: '21,400,424' },
    { label: 'Tokens per second', value: '21,400,424' },
    { label: 'Last hp generated', value: '11:00' },
  ];

  const allMetrics = [
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

  return (
    <div className="h-full flex flex-col gap-1">
      {/* Top Section - Inference with AI Models and Metrics */}
      <div className="border border-white/20 bg-black p-3 md:p-6 rounded-none flex-1 relative">
        {/* Corner decoration - hidden on mobile */}
        <div className="absolute top-3 right-3 w-16 h-16 md:top-6 md:right-6 md:w-24 md:h-24 hidden sm:block">
          <Image
            src="/assets/Union.png"
            alt="Corner decoration"
            width={100}
            height={100}
          />
        </div>

        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-3xl md:text-5xl text-[#E9FF98] font-red-hat-mono font-normal leading-[1.1] uppercase">
            Inference
          </h2>
          <div className="relative w-full opacity-10 hidden md:block">
            <Image
              src="/assets/logo_text.png"
              alt="Aubrai"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* AI Models */}
        <div className="space-y-3 mb-6">
          {aiModels.map((model, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white">
                  <path d="M8 1.5C4.5 1.5 1.5 4.5 1.5 8C1.5 11.5 4.5 14.5 8 14.5C11.5 14.5 14.5 11.5 14.5 8C14.5 4.5 11.5 1.5 8 1.5Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 4.5V8L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">
                  {model.name}: {model.model}
                </span>
              </div>
              <span className="text-sm text-[#E9FF98] font-red-hat-mono font-normal leading-[0.9]">
                {model.time}
              </span>
            </div>
          ))}
        </div>

        {/* Inference Metrics */}
        <div className="space-y-3">
          {inferenceMetrics.map((metric, index) => (
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

      {/* Bottom Section - All Metrics in separate bordered section */}
      <div className="border border-white/20 bg-black p-3 md:p-6 rounded-none flex-1">
        <div className="space-y-3">
          {allMetrics.map((metric, index) => (
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
  );
} 