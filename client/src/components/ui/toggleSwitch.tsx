import React from 'react';

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange }) => {
  return (
    <div className="toggle-switch">
      <label>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{label}</span>
      </label>
    </div>
  );
};

export default ToggleSwitch; 