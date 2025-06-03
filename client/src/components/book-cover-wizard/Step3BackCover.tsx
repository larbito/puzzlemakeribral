import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookSettings, CoverData } from '../../pages/dashboard/BookCoverWizard';

interface Step3BackCoverProps {
  bookSettings: BookSettings;
  coverData: CoverData;
  updateCoverData: (data: Partial<CoverData>) => void;
  setLoading: (loading: boolean, message?: string) => void;
  onNext: () => void;
}

const Step3BackCover: React.FC<Step3BackCoverProps> = ({
  bookSettings,
  coverData,
  updateCoverData,
  setLoading,
  onNext,
}) => {
  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-blue-400">Back Cover Generation</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="text-center text-zinc-400">
          <h3 className="text-xl font-medium mb-4">Step 3: Back Cover</h3>
          <p>Auto-generate matching back cover coming soon...</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Step3BackCover; 