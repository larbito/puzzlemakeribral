import React from 'react';

// Brand Logo SVG components
const RedbubbleLogo = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <circle cx="100" cy="100" r="80" fill="#E41321"/>
    <path d="M70 80H100C110 80 120 90 120 100C120 110 110 120 100 120H70V80ZM100 140H120C130 140 140 130 140 120C140 110 130 100 120 100H100V140Z" fill="white"/>
  </svg>
);

const EtsyLogo = () => (
  <svg viewBox="0 0 500 200" className="w-full h-full">
    <path d="M56.6 50h38.8v12.8H74.1v38.9h31.6v12.8H74.1V169h21.3v12.8H56.6V50zm89.3 87.8c-3.2 1.9-9.1 3.7-15.5 3.7-17.5 0-29.4-13.4-29.4-34 0-21.4 12.8-35.1 31.1-35.1 5.9 0 11.5 1.5 14.9 3.7l-2.8 12.8c-2.6-1.9-6.9-3.1-11.9-3.1-9.7 0-16.6 9.1-16.6 21.3 0 12.6 7.1 21.2 16.7 21.2 4.5 0 9-1.2 11.9-3.1l1.6 12.6zm53.7-45.2h-21.5v30.9c0 10.7 3.8 16 11.5 16 3.5 0 6.2-.4 7.9-1l.1 12.6c-2.6 1-7 1.7-12.2 1.7-12.4 0-19.8-7.5-19.8-26.5v-33.7h-12.8V79.5h12.8v-15l12.6-3.8v18.8h21.5v13.1h-.1zm73.5 58.5h-12.6v-47.8c0-10-3.9-14.9-11.7-14.9-12 0-16.9 10.2-16.9 22v40.6h-12.6V51.8h12.6v31.5c4.6-4.5 11.3-7 17.9-7 16.5 0 23.4 11.7 23.4 29.4v45.4h-.1zm75.8-31.1c0 22.2-15.3 32.9-29.7 32.9-16.1 0-28.6-11.8-28.6-31.8 0-20.7 13.1-32.9 29.6-32.9 17.1.1 28.7 12.6 28.7 31.8zm-45.4 0c0 13.1 7.5 20.5 16.3 20.5 9.3 0 16.3-7.4 16.3-20.7 0-9-4.5-20.5-16.1-20.5-11.5.1-16.5 10.7-16.5 20.7z" fill="#F05A28"/>
  </svg>
);

const AmazonKDPLogo = () => (
  <div className="flex items-center">
    <svg viewBox="0 0 400 100" className="w-full h-full">
      <g transform="scale(0.9)">
        <path d="M118.9 84.5c-34.7 25.6-85 39.2-128.2 39.2-60.6 0-115.1-22.4-156.5-59.7-3.2-2.9-.3-6.9 3.5-4.6 44.4 25.8 99.2 41.3 156 41.3 38.2 0 80.3-7.9 119-24.4 5.9-2.6 10.8 3.8 5.2 8.2z" transform="scale(0.5)" fill="#FF9900"/>
        <path d="M132.8 68.2c-4.4-5.7-29.3-2.7-40.5-1.4-3.4.4-3.9-2.6-.8-4.7 19.8-13.9 52.3-9.9 56.1-5.2 3.8 4.7-1 37.4-19.6 53-2.9 2.5-5.6 1.2-4.3-2 4.2-10.5 13.6-34 9.1-39.7z" transform="scale(0.5)" fill="#FF9900"/>
      </g>
      <text x="200" y="60" fill="#FF9900" fontSize="40" fontWeight="bold" textAnchor="middle">Kindle</text>
    </svg>
  </div>
);

const GumroadLogo = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <circle cx="100" cy="100" r="80" fill="#FF90E8"/>
    <path d="M85 80H115V95H108L120 120H105L90 90V120H75V80H85Z" fill="#000"/>
  </svg>
);

const MerchByAmazonLogo = () => (
  <svg viewBox="0 0 400 100" className="w-full h-full">
    <g transform="scale(0.9) translate(20, 10)">
      <text x="20" y="40" fontSize="32" fill="#FF9900" fontWeight="bold">merch</text>
      <text x="20" y="60" fontSize="16" fill="#333">by</text>
      <text x="45" y="80" fontSize="38" fill="#333" fontWeight="bold">amazon</text>
      <path d="M325 80c-4.4-5.7-29.3-2.7-40.5-1.4-3.4.4-3.9-2.6-.8-4.7 19.8-13.9 52.3-9.9 56.1-5.2 3.8 4.7-1 37.4-19.6 53-2.9 2.5-5.6 1.2-4.3-2 4.2-10.5 13.6-34 9.1-39.7z" transform="scale(0.4)" fill="#FF9900"/>
    </g>
  </svg>
);

const TeespringLogo = () => (
  <svg viewBox="0 0 300 100" className="w-full h-full">
    <g transform="scale(0.85) translate(15, 15)">
      <path d="M20 50C40 20 70 20 90 50" stroke="#FF3366" strokeWidth="12" fill="none"/>
      <path d="M10 50H60" stroke="#FF3366" strokeWidth="10"/>
      <text x="110" y="60" fontSize="32" fill="#333366" fontWeight="bold">Teespring</text>
    </g>
  </svg>
);

export const SocialProof: React.FC = () => {
  const platforms = [
    { name: "Amazon KDP", logo: <AmazonKDPLogo /> },
    { name: "Etsy", logo: <EtsyLogo /> },
    { name: "Redbubble", logo: <RedbubbleLogo /> },
    { name: "Gumroad", logo: <GumroadLogo /> },
    { name: "Merch by Amazon", logo: <MerchByAmazonLogo /> },
    { name: "Teespring", logo: <TeespringLogo /> }
  ];

  return (
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />
      <div className="absolute inset-0 bg-grid-white/[0.02]" />
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-6 mb-12">
          <h2 className="text-4xl font-bold text-white">
            Trusted by 25,000+ Print-on-Demand Creators Worldwide
          </h2>
          <p className="text-lg text-gray-200 max-w-3xl mx-auto">
            Our tools are used by sellers on these major platforms
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-12 gap-y-10">
          {platforms.map((platform, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center justify-center"
            >
              <div className="w-32 h-16 mx-auto flex items-center justify-center filter hover:brightness-125 transition-all">
                {platform.logo}
              </div>
              {/* Uncomment to show platform names */}
              {/* <div className="mt-2 text-sm text-gray-400">{platform.name}</div> */}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof; 