import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  bg?: 'default' | 'muted' | 'grid' | 'gradient';
  id?: string;
}

export const Section: React.FC<SectionProps> = ({ children, className = '', bg = 'default', id }) => {
  const bgClass =
    bg === 'muted'
      ? 'bg-muted/30'
      : bg === 'grid'
      ? 'relative before:absolute before:inset-0 before:bg-grid-white/[0.04] before:content-[""]'
      : bg === 'gradient'
      ? 'relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-background before:via-background/60 before:to-background before:content-[""]'
      : '';

  return (
    <section id={id} className={`py-20 sm:py-24 ${bgClass} ${className}`}>
      <div className="relative">
        {children}
      </div>
    </section>
  );
}; 