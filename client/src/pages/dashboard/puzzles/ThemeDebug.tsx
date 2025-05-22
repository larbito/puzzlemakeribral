import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal, ModalFooter } from '@/components/ui/modal';

export const ThemeDebug: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Modal Debug Test</h1>
      
      <div className="space-y-6">
        <div className="p-4 bg-gray-100 rounded-md">
          <p className="mb-4">Click the button below to open a test modal:</p>
          
          <Button 
            onClick={() => {
              console.log("Opening modal");
              setIsOpen(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white w-full"
          >
            Open Test Modal
          </Button>
          
          <div className="mt-4 text-sm">
            Modal state: {isOpen ? 'OPEN' : 'CLOSED'}
          </div>
        </div>
      </div>
      
      <Modal
        isOpen={isOpen}
        onClose={() => {
          console.log("Closing modal");
          setIsOpen(false);
        }}
        title="Test Modal"
        description="This is a test modal dialog"
      >
        <div className="p-4 bg-gray-50 rounded-md mb-4">
          <p>
            If you can see this modal, it means the modal component is working correctly.
            The issue might be elsewhere in the ThemesAndWordsStep component.
          </p>
        </div>
        
        <ModalFooter>
          <Button
            onClick={() => {
              console.log("Close button clicked");
              setIsOpen(false);
            }}
          >
            Close Modal
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}; 