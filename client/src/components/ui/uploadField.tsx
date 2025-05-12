import React from 'react';

interface UploadFieldProps {
  label: string;
  maxFiles: number;
}

const UploadField: React.FC<UploadFieldProps> = ({ label, maxFiles }) => {
  return (
    <div className="upload-field">
      <label>{label}</label>
      <div className="upload-zone">
        <p>Drag and drop files here or click to upload</p>
        <p>Max {maxFiles} files</p>
      </div>
    </div>
  );
};

export default UploadField; 