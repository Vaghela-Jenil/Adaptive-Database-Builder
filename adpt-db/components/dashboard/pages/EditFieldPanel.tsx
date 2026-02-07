'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import { FieldAttributes, FieldType } from './types';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  open: boolean;
  field: FieldAttributes;
  onClose: () => void;
  onSave: (field: FieldAttributes) => void;
};

const inputTypes = [
  { value: 'input-text', label: 'Text' },
  { value: 'input-number', label: 'Number' },
  { value: 'input-email', label: 'Email' },
  { value: 'input-phone', label: 'Phone' },
  { value: 'input-url', label: 'URL' },
  { value: 'input-time', label: 'Time' },
];

export default function EditFieldPanel({ open, field, onClose, onSave }: Props) {
  const { currentTheme } = useTheme();
  const [editedField, setEditedField] = useState<FieldAttributes>(field);

  if (!open) return null;

  const updateField = (key: keyof FieldAttributes, value: any) => {
    setEditedField((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(editedField);
    onClose();
  };

  const isInputVariant = editedField.type.startsWith('input-');
  const hasOptions = ['select', 'combobox', 'multi-select', 'toggle', 'radio'].includes(
    editedField.type
  );
  const isTextBased = [
    'input-text',
    'input-email',
    'input-phone',
    'input-url',
    'textarea',
    'password',
  ].includes(editedField.type);
  const isNumberBased = ['input-number', 'slider'].includes(editedField.type);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: currentTheme.surface,
          border: `1px solid ${currentTheme.border}`,
        }}
      >
        <div
          className="sticky top-0 z-10 p-6 flex items-center justify-between"
          style={{
            backgroundColor: currentTheme.surface,
            borderBottom: `1px solid ${currentTheme.border}`,
          }}
        >
          <h3 className="text-xl font-bold" style={{ color: currentTheme.text }}>
            Edit Field Properties
          </h3>
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

        <div className="p-6 space-y-6">
          {/* Field Type (for input variants) */}
          {isInputVariant && (
            <div>
              <Label style={{ color: currentTheme.text }}>Input Type</Label>
              <select
                value={editedField.type}
                onChange={(e) => updateField('type', e.target.value as FieldType)}
                className="w-full mt-2 px-4 py-2 rounded-lg outline-none"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                  color: currentTheme.text,
                }}
              >
                {inputTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Label */}
          <div>
            <Label style={{ color: currentTheme.text }}>Label</Label>
            <Input
              value={editedField.label}
              onChange={(e) => updateField('label', e.target.value)}
              className="mt-2"
              style={{
                backgroundColor: currentTheme.background,
                border: `1px solid ${currentTheme.border}`,
                color: currentTheme.text,
              }}
            />
          </div>

          {/* Show Label Toggle */}
          <div className="flex items-center justify-between">
            <Label style={{ color: currentTheme.text }}>Show Label</Label>
            <Switch
              checked={editedField.showLabel !== false}
              onCheckedChange={(checked) => updateField('showLabel', checked)}
            />
          </div>

          {/* Placeholder (for text inputs) */}
          {(isTextBased || editedField.type === 'date-picker' || editedField.type === 'tag-input') && (
            <div>
              <Label style={{ color: currentTheme.text }}>Placeholder</Label>
              <Input
                value={editedField.placeholder || ''}
                onChange={(e) => updateField('placeholder', e.target.value)}
                className="mt-2"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                  color: currentTheme.text,
                }}
              />
            </div>
          )}

          {/* Helper Text */}
          <div>
            <Label style={{ color: currentTheme.text }}>Helper Text</Label>
            <Input
              value={editedField.helperText || ''}
              onChange={(e) => updateField('helperText', e.target.value)}
              placeholder="Optional hint or description"
              className="mt-2"
              style={{
                backgroundColor: currentTheme.background,
                border: `1px solid ${currentTheme.border}`,
                color: currentTheme.text,
              }}
            />
          </div>

          {/* Column Span */}
          <div>
            <Label style={{ color: currentTheme.text }}>Column Span (1-3)</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3].map((span) => (
                <Button
                  key={span}
                  variant={editedField.span === span ? 'default' : 'outline'}
                  onClick={() => updateField('span', span)}
                  style={
                    editedField.span === span
                      ? { backgroundColor: currentTheme.primary, color: '#ffffff' }
                      : {
                          backgroundColor: currentTheme.background,
                          border: `1px solid ${currentTheme.border}`,
                          color: currentTheme.text,
                        }
                  }
                >
                  {span}
                </Button>
              ))}
            </div>
          </div>

          {/* Required & Disabled */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label style={{ color: currentTheme.text }}>Required</Label>
              <Switch
                checked={editedField.required || false}
                onCheckedChange={(checked) => updateField('required', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label style={{ color: currentTheme.text }}>Disabled</Label>
              <Switch
                checked={editedField.disabled || false}
                onCheckedChange={(checked) => updateField('disabled', checked)}
              />
            </div>
          </div>

          {/* Number Range (for number/slider) */}
          {isNumberBased && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label style={{ color: currentTheme.text }}>Min</Label>
                <Input
                  type="number"
                  value={editedField.min ?? 0}
                  onChange={(e) => updateField('min', Number(e.target.value))}
                  className="mt-2"
                  style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text,
                  }}
                />
              </div>
              <div>
                <Label style={{ color: currentTheme.text }}>Max</Label>
                <Input
                  type="number"
                  value={editedField.max ?? 100}
                  onChange={(e) => updateField('max', Number(e.target.value))}
                  className="mt-2"
                  style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text,
                  }}
                />
              </div>
              <div>
                <Label style={{ color: currentTheme.text }}>Step</Label>
                <Input
                  type="number"
                  value={editedField.step ?? 1}
                  onChange={(e) => updateField('step', Number(e.target.value))}
                  className="mt-2"
                  style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text,
                  }}
                />
              </div>
            </div>
          )}

          {/* Length constraints (for text) */}
          {isTextBased && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label style={{ color: currentTheme.text }}>Min Length</Label>
                <Input
                  type="number"
                  value={editedField.minLength ?? 0}
                  onChange={(e) => updateField('minLength', Number(e.target.value))}
                  className="mt-2"
                  style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text,
                  }}
                />
              </div>
              <div>
                <Label style={{ color: currentTheme.text }}>Max Length</Label>
                <Input
                  type="number"
                  value={editedField.maxLength ?? 500}
                  onChange={(e) => updateField('maxLength', Number(e.target.value))}
                  className="mt-2"
                  style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text,
                  }}
                />
              </div>
            </div>
          )}

          {/* Textarea Rows */}
          {editedField.type === 'textarea' && (
            <div>
              <Label style={{ color: currentTheme.text }}>Rows</Label>
              <Input
                type="number"
                value={editedField.rows ?? 4}
                onChange={(e) => updateField('rows', Number(e.target.value))}
                className="mt-2"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                  color: currentTheme.text,
                }}
              />
            </div>
          )}

          {/* OTP Length */}
          {editedField.type === 'input-otp' && (
            <div>
              <Label style={{ color: currentTheme.text }}>OTP Length</Label>
              <Input
                type="number"
                value={editedField.otpLength ?? 6}
                onChange={(e) => updateField('otpLength', Number(e.target.value))}
                className="mt-2"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                  color: currentTheme.text,
                }}
              />
            </div>
          )}

          {/* File Upload Accept */}
          {editedField.type === 'file' && (
            <>
              <div>
                <Label style={{ color: currentTheme.text }}>Accept File Types</Label>
                <Input
                  value={editedField.accept || '*'}
                  onChange={(e) => updateField('accept', e.target.value)}
                  placeholder="e.g., .pdf,.doc,.jpg"
                  className="mt-2"
                  style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text,
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label style={{ color: currentTheme.text }}>Multiple Files</Label>
                <Switch
                  checked={editedField.multiple || false}
                  onCheckedChange={(checked) => updateField('multiple', checked)}
                />
              </div>
            </>
          )}

          {/* Options (for select, radio, etc.) */}
          {hasOptions && (
            <div>
              <Label style={{ color: currentTheme.text }}>
                Options (one per line)
              </Label>
              <Textarea
                value={(editedField.options || []).join('\n')}
                onChange={(e) =>
                  updateField(
                    'options',
                    e.target.value.split('\n').filter((o) => o.trim())
                  )
                }
                rows={5}
                className="mt-2"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                  color: currentTheme.text,
                }}
              />
            </div>
          )}

          {/* Rating Max Stars */}
          {editedField.type === 'rating' && (
            <div>
              <Label style={{ color: currentTheme.text }}>Max Stars</Label>
              <Input
                type="number"
                value={editedField.max ?? 5}
                onChange={(e) => updateField('max', Number(e.target.value))}
                className="mt-2"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                  color: currentTheme.text,
                }}
              />
            </div>
          )}

          {/* Slider Marks */}
          {editedField.type === 'slider' && (
            <div className="flex items-center justify-between">
              <Label style={{ color: currentTheme.text }}>Show Marks</Label>
              <Switch
                checked={editedField.marks !== false}
                onCheckedChange={(checked) => updateField('marks', checked)}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className="sticky bottom-0 p-6 flex justify-end gap-3"
          style={{
            backgroundColor: currentTheme.surface,
            borderTop: `1px solid ${currentTheme.border}`,
          }}
        >
          <Button
            variant="ghost"
            onClick={onClose}
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.text,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            style={{ backgroundColor: currentTheme.primary, color: '#ffffff' }}
          >
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
}
