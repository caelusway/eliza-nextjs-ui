import Image from 'next/image';

export function PartnersSection() {
  const partners = [
    { 
      name: 'VitaDAO',
      logo: '/assets/partner/vita-logo.svg'
    },
    { 
      name: 'LEVF',
      logo: '/assets/partner/lev-logo.png'
    },
    { 
      name: 'bio protocol',
      logo: '/assets/partner/bio-logo.svg'
    },
    { 
      name: 'Eliza framework',
      logo: '/assets/partner/eliza-logo.svg'
    },
  ];

  return (
    <div className="border border-white/20 p-3 rounded-none">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-8">
          {partners.map((partner, index) => (
            <div key={index} className="flex items-center">
              <Image 
                src={partner.logo}
                alt={partner.name}
                width={80}
                height={24}
                className="h-5 w-auto"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
