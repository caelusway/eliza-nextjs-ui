export function ProgressSection() {
  const progressItems = [
    { value: '12,475', percentage: '7%', label: 'Papers Uploaded', conversion: '40% conv.' },
    { value: '12,475', percentage: '7%', label: 'Nodes in Knowledge Graph', conversion: '40% conv.' },
    { value: '12,475', percentage: '7%', label: 'Generated', conversion: '40% conv.' },
    { value: '12,475', percentage: '7%', label: 'IPTs minted', conversion: '40% conv.' },
    { value: '12,475', percentage: '7%', label: 'Experiments started', conversion: '40% conv.' },
  ];

  return (
    <div className="border border-white/20 bg-black p-2 md:p-3 rounded-none h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 p-1 md:p-2 mb-3 md:mb-4">
        <span className="text-xs md:text-sm text-white font-red-hat-mono font-normal leading-[0.9]">Median cycle-time:</span>
        <div className="flex items-center gap-1">
          <span className="text-xs md:text-sm text-[#E0F58F] font-red-hat-mono font-normal leading-[0.9]">5</span>
          <span className="text-xs md:text-sm text-white font-red-hat-mono font-normal leading-[0.9]">D</span>
        </div>
      </div>

      {/* Progress Flow */}
      <div className="space-y-2 flex-1">
        {progressItems.map((item, index) => (
          <div key={index} className="flex gap-1">
            {/* Arrow */}
            <div className="flex flex-col items-center w-3">
              <div className="w-px h-[70px] bg-white/20"></div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white/30">
                <path d="M8 12L3 4H13L8 12Z" fill="currentColor"/>
              </svg>
            </div>
            
            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="border border-white/20 bg-black p-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">{item.value}</span>
                    <div className="flex items-center gap-1">
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" className="text-[#D0E38A]">
                        <path d="M3.5 0.5L8.5 0.5L8.5 5.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8.5 0.5L0.5 8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm text-[#D0E38A] font-red-hat-mono font-normal leading-[0.9]">{item.percentage}</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">{item.label}</div>
              </div>
              
              {/* Conversion Rate */}
              <div className="flex items-center gap-1">
                <span className="text-sm text-[#E0F58F] font-red-hat-mono font-normal leading-[0.9]">{item.conversion}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 