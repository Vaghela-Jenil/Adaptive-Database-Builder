import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { useTheme } from '@/context/ThemeContext';
import { Upload, FileJson } from 'lucide-react';
import { showToast } from '@/lib/toast';

type ImportJSONModalProps = {
  open: boolean;
  onClose: () => void;
  onImport: (schema: any[]) => void;
};

export default function ImportJSONModal({ open, onClose, onImport }: ImportJSONModalProps) {
  const { currentTheme } = useTheme();
  const [jsonInput, setJsonInput] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setJsonInput(content);
      } catch (err) {
        showToast.error("Error reading file");
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      
      // Validate that parsed is an array
      if (!Array.isArray(parsed)) {
        showToast.error("Invalid format. Schema must be an array of fields.");
        return;
      }

      // Check if the number of fields exceeds 1000
      if (parsed.length > 1000) {
        showToast.error(`Maximum 1000 fields allowed. You have ${parsed.length} fields.`);
        return;
      }

      onImport(parsed);
    } catch (err) {
      showToast.error("Invalid JSON format. Please check your syntax.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl" 
        style={{ backgroundColor: currentTheme.surface, color: currentTheme.text, border: `1px solid ${currentTheme.border}` }}
      >
        <DialogHeader>
          <DialogTitle>Import Form Schema</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div 
            className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors"
            style={{ borderColor: currentTheme.border }}
          >
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <Upload className="w-8 h-8 mb-2" style={{ color: currentTheme.primary }} />
              <span className="text-sm">Click to upload .json file</span>
            </label>
          </div>

          <div className="relative">
            <label className="text-xs mb-2 block" style={{ color: currentTheme.textSecondary }}>
              Or paste JSON schema here:
            </label>
            <textarea
              className="w-full h-64 p-4 font-mono text-sm rounded-md outline-none focus:ring-1"
              style={{ 
                backgroundColor: currentTheme.background, 
                color: currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
                "--tw-ring-color": currentTheme.primary 
              } as React.CSSProperties}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[ { "id": "text-1", "type": "text", "label": "Full Name" } ]'
            />
            <p className='text-red-500/80' style={{fontSize: '13px'}}>Some Computed fields may not works</p>
            <p style={{fontSize: '10px', color: currentTheme.text}}>Tip: <br />1. Delete the field from here. <br />2. Add manually by your salf in record page.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" className='hover:bg-black/70' onClick={onClose} style={{ color: currentTheme.text }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!jsonInput.trim()}
            style={{ backgroundColor: currentTheme.primary, color: '#fff' }}
          >
            <FileJson className="w-4 h-4 mr-2" />
            Import Fields
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}