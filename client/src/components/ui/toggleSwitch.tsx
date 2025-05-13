import React from 'react';

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange }) => {
  return (
    <div className="flex items-center space-x-3">
      <label className="inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="relative w-11 h-6 bg-gray-300 dark:bg-gray-700 rounded-full peer peer-checked:bg-green-500 peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-1">
          <div className="absolute top-[2px] left-[2px] bg-white w-5 h-5 rounded-full transition-all duration-200 transform peer-checked:translate-x-5"></div>
        </div>
        <span className="ml-3 text-sm font-medium">{label}</span>
      </label>
    </div>
  );
};

export default ToggleSwitch; 