import Image from 'next/image';

export function ArtworkSection() {
  return (
    <div className="border border-white-400/30 bg-black/90 p-8 flex flex-col items-center justify-center min-h-[300px]">
      <div className="relative w-48 h-48">
        <Image
          src="/assets/aubrai-character-one.png"
          alt="Aubrai Character"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}