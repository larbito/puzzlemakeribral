import React, { useEffect, useRef } from 'react';
import { BookContent, KDPBookSettings } from '@/pages/dashboard/KDPBookFormatter';
import { generateBookHTML } from '@/templates/bookTemplate';

interface BookPreviewProps {
  book: BookContent;
  settings: KDPBookSettings;
}

export const BookPreview: React.FC<BookPreviewProps> = ({ book, settings }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const html = generateBookHTML(book, settings);
    const doc = iframeRef.current?.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
  }, [book, settings]);

  return (
    <iframe
      ref={iframeRef}
      title="Book Preview"
      style={{ width: '100%', height: '100%', border: 'none' }}
    />
  );
}; 