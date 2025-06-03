import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookSettings, CoverData } from '../../pages/dashboard/BookCoverWizard';

interface Step4SpineEditorProps {
  bookSettings: BookSettings;
  coverData: CoverData;
  updateCoverData: (data: Partial<CoverData>) => void;
  setLoading: (loading: boolean, message?: string) => void;
  onNext: () => void;
}

const Step4SpineEditor: React.FC<Step4SpineEditorProps> = ({
  bookSettings,
  coverData,
  updateCoverData,
  setLoading,
  onNext,
}) => {
  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-blue-400">Spine Design</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="text-center text-zinc-400">
          <h3 className="text-xl font-medium mb-4">Step 4: Spine Editor</h3>
          <p>Color extraction and spine text editor coming soon...</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Step4SpineEditor; 