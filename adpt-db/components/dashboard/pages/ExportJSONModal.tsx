'use client';

import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { X, Download, Copy, Check } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { FieldAttributes } from './types';
import { useState } from 'react';

type Props = {
  open: boolean;
  formSchema: FieldAttributes[];
  onClose: () => void;
};

export default function ExportJSONModal({ open, formSchema, onClose }: Props) {
  const { currentTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const jsonString = JSON.stringify(formSchema, null, 2);

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form-schema-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card
        className="w-full max-w-4xl max-h-[90vh] flex flex-col"
        style={{
          backgroundColor: currentTheme.surface,
          border: `1px solid ${currentTheme.border}`,
        }}
      >
        {/* Header */}
        <div
          className="p-6 flex items-center justify-between shrink-0"
          style={{
            borderBottom: `1px solid ${currentTheme.border}`,
          }}
        >
          <div>
            <h3 className="text-xl font-bold" style={{ color: currentTheme.text }}>
              Export Form Schema
            </h3>
            <p className="text-sm mt-1" style={{ color: currentTheme.textSecondary }}>
              {formSchema.length} fields • {(jsonString.length / 1024).toFixed(2)} KB
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:scale-110 transition-all"
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.text,
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* JSON Content */}
        <div className="flex-1 overflow-auto p-6">
          <pre
            className="p-4 rounded-lg overflow-auto text-sm font-mono"
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.text,
            }}
          >
            {jsonString}
          </pre>
        </div>

        {/* Actions */}
        <div
          className="p-6 flex justify-end gap-3 shrink-0"
          style={{
            borderTop: `1px solid ${currentTheme.border}`,
          }}
        >
          <Button
            variant="outline"
            onClick={handleCopy}
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.text,
            }}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </>
            )}
          </Button>

          <Button
            onClick={handleDownload}
            style={{
              backgroundColor: currentTheme.primary,
              color: '#ffffff',
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download JSON
          </Button>
        </div>
      </Card>
    </div>
  );
}
