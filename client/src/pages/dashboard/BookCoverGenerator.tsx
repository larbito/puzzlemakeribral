import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import KDPFuturisticGenerator from '@/pages/generators/KDPFuturisticGenerator';

const BookCoverGenerator = () => {
  return (
    <PageLayout
      title="Book Cover Generator"
      description="Create professional Amazon KDP-compliant book covers with AI"
    >
      <KDPFuturisticGenerator />
    </PageLayout>
  );
};

export default BookCoverGenerator; 