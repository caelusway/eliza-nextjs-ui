export function PartnersSection() {
  const partners = [
    { name: 'VitaDAO', hasTriangle: true },
    { name: 'LEVF', hasTriangle: false },
    { name: 'bio protocol', hasTriangle: false },
    { name: 'Eliza framework', hasTriangle: false },
  ];

  return (
    <div className="border border-white/20 bg-black p-3 rounded-none">
      <div className="flex items-center justify-center">
        {/* Single row with all partners repeated */}
        <div className="flex items-center gap-8">
          {/* First set */}
          {partners.map((partner, index) => (
            <div key={index} className="flex items-center gap-1">
              <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">{partner.name}</span>
              {partner.hasTriangle && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="text-[#FFDD35]">
                  <path d="M4 6L1 2H7L4 6Z" fill="currentColor"/>
                </svg>
              )}
            </div>
          ))}
          {/* Second set */}
          {partners.map((partner, index) => (
            <div key={`second-${index}`} className="flex items-center gap-1">
              <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">{partner.name}</span>
              {partner.hasTriangle && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="text-[#FFDD35]">
                  <path d="M4 6L1 2H7L4 6Z" fill="currentColor"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}