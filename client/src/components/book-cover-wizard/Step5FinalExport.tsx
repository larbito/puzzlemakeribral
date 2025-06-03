import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookSettings, CoverData } from '../../pages/dashboard/BookCoverWizard';

interface Step5FinalExportProps {
  bookSettings: BookSettings;
  coverData: CoverData;
  updateCoverData: (data: Partial<CoverData>) => void;
  setLoading: (loading: boolean, message?: string) => void;
  onNext: () => void;
}

const Step5FinalExport: React.FC<Step5FinalExportProps> = ({
  bookSettings,
  coverData,
  updateCoverData,
  setLoading,
  onNext,
}) => {
  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-blue-400">Final Export</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="text-center text-zinc-400">
          <h3 className="text-xl font-medium mb-4">Step 5: Final Export</h3>
          <p>Full wrap assembly and download coming soon...</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Step5FinalExport; 