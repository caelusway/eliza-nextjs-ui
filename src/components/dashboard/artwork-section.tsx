import Image from 'next/image';
import { PartnersSection } from './partners-section';

export function ArtworkSection() {
  return (
    <div className="w-full border mx-auto h-full flex flex-col min-h-[250px] md:min-h-[300px]">
      <div className="flex-1 relative overflow-hidden">
        <Image
          src="/assets/robot.png"
          alt="AI Research Robot"
          fill
          className="object-contain md:object-cover"
          priority
        />
      </div>
      <div className="flex-shrink-0 p-4">
        <PartnersSection />
      </div>
    </div>
  );
}
