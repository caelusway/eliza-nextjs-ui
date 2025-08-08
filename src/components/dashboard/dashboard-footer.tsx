export function DashboardFooter() {
  return (
    <div className="border border-white/20 bg-black p-2 rounded-none flex justify-between items-center">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#757575] font-red-hat-mono font-normal leading-[0.9]">© AUBRAI</span>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">treasury</span>
          <span className="text-sm text-[#E0F58F] font-red-hat-mono font-normal leading-[0.9]">0xteas...sure</span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">contract</span>
          <span className="text-sm text-[#E0F58F] font-red-hat-mono font-normal leading-[0.9]">0xc0n7...tract</span>
        </div>
      </div>
      
      {/* Right Section */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">Built on Base</span>
        <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">•</span>
        <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">Docs</span>
        <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">•</span>
        <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">Privacy</span>
      </div>
    </div>
  );
}