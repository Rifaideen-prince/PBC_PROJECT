import React, { useRef } from 'react';
import { Button } from '../common/Button';
import { Upload, RotateCcw } from 'lucide-react';

export interface ModelUploaderProps {
  onLoadObjContent: (content: string, filename: string) => void;
  onResetToDefault: () => void;
  disabled?: boolean;
}

export const ModelUploader: React.FC<ModelUploaderProps> = ({
  onLoadObjContent,
  onResetToDefault,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onLoadObjContent(text, file.name);
      }
    };
    reader.readAsText(file);
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        accept=".obj"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        size="sm"
        variant="primary"
        disabled={disabled}
        icon={<Upload size={14} />}
        onClick={() => fileInputRef.current?.click()}
      >
        Import OBJ Model
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled}
        icon={<RotateCcw size={14} />}
        onClick={onResetToDefault}
        title="Load default laboratory apparatus 3D model"
      >
        Apparatus Rig
      </Button>
    </div>
  );
};
