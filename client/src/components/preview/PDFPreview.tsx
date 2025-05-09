import { useEffect, useRef } from 'react';
import { KDPConfig } from '@/components/kdp/KDPSettings';

interface PDFPreviewProps {
  kdpConfig: KDPConfig;
  children: React.ReactNode;
}

export const PDFPreview = ({ kdpConfig, children }: PDFPreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);

  // Convert inches to pixels (assuming 96 DPI for web preview)
  const inchesToPx = (inches: number) => Math.round(inches * 96);

  // Parse book size dimensions
  const [width, height] = kdpConfig.bookSize.split('x').map(Number);
  
  // Calculate preview scale to fit in container
  const scale = Math.min(
    600 / inchesToPx(width), // Max width
    800 / inchesToPx(height) // Max height
  );

  const pageStyle = {
    width: `${inchesToPx(width)}px`,
    height: `${inchesToPx(height)}px`,
    padding: `${inchesToPx(kdpConfig.topMargin)}px ${inchesToPx(kdpConfig.exteriorMargin)}px ${inchesToPx(kdpConfig.bottomMargin)}px ${inchesToPx(kdpConfig.interiorMargin)}px`,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    backgroundColor: 'white',
    position: 'relative' as const,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  };

  const bleedStyle = kdpConfig.hasBleed ? {
    position: 'absolute' as const,
    top: `-${inchesToPx(0.125)}px`,
    left: `-${inchesToPx(0.125)}px`,
    right: `-${inchesToPx(0.125)}px`,
    bottom: `-${inchesToPx(0.125)}px`,
    border: '1px dashed #FF4444',
    pointerEvents: 'none' as const,
  } : {};

  const marginStyle = {
    position: 'absolute' as const,
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    border: '1px dashed #4444FF',
    pointerEvents: 'none' as const,
  };

  return (
    <div className="relative bg-background/50 p-8 rounded-lg border border-primary/20 overflow-hidden">
      <div className="text-sm text-muted-foreground mb-4">
        Preview - {kdpConfig.bookSize}" ({kdpConfig.colorMode === 'bw' ? 'Black & White' : 'Color'})
      </div>
      
      <div 
        ref={previewRef}
        style={{
          height: `${inchesToPx(height) * scale + 32}px`,
          width: `${inchesToPx(width) * scale + 32}px`,
        }}
        className="relative bg-neutral-100 rounded-lg"
      >
        <div style={pageStyle}>
          {kdpConfig.hasBleed && <div style={bleedStyle} />}
          <div style={marginStyle} />
          <div className="relative">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}; 