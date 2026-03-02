'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { X, Save, Settings2, Hash, CalendarDays, Star } from 'lucide-react';
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
  const isInputVariant = editedField.type.startsWith('input-');
  const hasOptions = ['select', 'combobox', 'multi-select', 'toggle', 'radio'].includes(editedField.type);
  const isRanged = ['input-number', 'slider'].includes(editedField.type);
  const isDate = editedField.type === 'date-picker';
  const isRating = editedField.type === 'rating';

  const inputStyle = {
    backgroundColor: currentTheme.background,
    borderColor: currentTheme.border,
    color: currentTheme.text
  };

  useEffect(() => {
    // CRITICAL: Ensure every possible editable property has a default to prevent "uncontrolled" error
    if (open) {
      setEditedField({
        ...field,
        label: field.label ?? '',
        placeholder: field.placeholder ?? '',
        min: field.min ?? 0,
        max: field.max ?? 100,
        step: field.step ?? 1,
        minDate: field.minDate ?? '',
        maxDate: field.maxDate ?? '',
        options: field.options ?? [],
      });
    }
  }, [field, open]);

  if (!open) return null;

  const updateField = (key: keyof FieldAttributes, value: any) => {
    setEditedField((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(editedField);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-100 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
      <Card
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: currentTheme.surface, border: `1px solid ${currentTheme.border}` }}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b" style={{ borderColor: currentTheme.border }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings2 className="w-5 h-5" style={{ color: currentTheme.primary }} />
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: currentTheme.text }}>Field Configuration</h3>
              <p className="text-[10px] uppercase tracking-widest opacity-50" style={{ color: currentTheme.textSecondary }}>Type: {editedField.type}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 transition-colors" style={{ color: currentTheme.text }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

          {/* General Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: currentTheme.text }}>General Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <Label className="text-[11px] mb-2 block uppercase opacity-70">Field Label</Label>
                <Input value={editedField.label ?? ''} onChange={(e) => updateField('label', e.target.value)} style={inputStyle} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label className="text-[11px] mb-2 block uppercase opacity-70">Placeholder</Label>
                <Input value={editedField.placeholder ?? ''} onChange={(e) => updateField('placeholder', e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Conditional Section: OTP Length */}
          {editedField.type === 'input-otp' && (
            <div className="space-y-4 p-4 rounded-xl bg-black/5 border border-dashed" style={{ borderColor: currentTheme.border }}>
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 opacity-50" style={{ color: currentTheme.text }} />
                <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-70" style={{ color: currentTheme.text }}>OTP Configuration</h4>
              </div>
              <div>
                <Label className="text-[10px] opacity-70">Number of Digits</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[4, 5, 6, 8].map((length) => (
                    <button
                      key={length}
                      type="button"
                      onClick={() => updateField('maxLength', length)}
                      className={`py-2 text-sm font-bold rounded-md border transition-all ${editedField.maxLength === length ? 'shadow-inner' : ''}`}
                      style={editedField.maxLength === length
                        ? { backgroundColor: currentTheme.primary, color: '#fff', borderColor: currentTheme.primary }
                        : { backgroundColor: currentTheme.background, borderColor: currentTheme.border, color: currentTheme.text }}
                    >
                      {length}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Range Limits (Numbers/Slider) */}
          {isRanged && (
            <div className="space-y-4 p-4 rounded-xl bg-black/5 border border-dashed" style={{ borderColor: currentTheme.border }}>
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 opacity-50" style={{ color: currentTheme.text }} />
                <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-70" style={{ color: currentTheme.text }}>Range Limits</h4>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-[10px] opacity-70">Minimum</Label>
                  <Input type="number" value={editedField.min ?? 0} onChange={(e) => updateField('min', Number(e.target.value))} style={inputStyle} />
                </div>
                <div>
                  <Label className="text-[10px] opacity-70">Maximum</Label>
                  <Input type="number" value={editedField.max ?? 100} onChange={(e) => updateField('max', Number(e.target.value))} style={inputStyle} />
                </div>
                <div>
                  <Label className="text-[10px] opacity-70">Step</Label>
                  <Input type="number" value={editedField.step ?? 1} onChange={(e) => updateField('step', Number(e.target.value))} style={inputStyle} />
                </div>
              </div>
            </div>
          )}

          {/* Date Constraints */}
          {isDate && (
            <div className="space-y-4 p-4 rounded-xl bg-black/5 border border-dashed" style={{ borderColor: currentTheme.border }}>
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 opacity-50" style={{ color: currentTheme.text }} />
                <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-70" style={{ color: currentTheme.text }}>Date Constraints</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] opacity-70">Min Date</Label>
                  <Input
                    type="date"
                    value={editedField.minDate ?? ''}
                    onChange={(e) => updateField('minDate', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <Label className="text-[10px] opacity-70">Max Date</Label>
                  <Input
                    type="date"
                    value={editedField.maxDate ?? ''}
                    onChange={(e) => updateField('maxDate', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Star Rating Scale */}
          {isRating && (
            <div className="space-y-4 p-4 rounded-xl bg-black/5 border border-dashed" style={{ borderColor: currentTheme.border }}>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 opacity-50" style={{ color: currentTheme.text }} />
                <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-70" style={{ color: currentTheme.text }}>Rating Scale</h4>
              </div>
              <div>
                <Label className="text-[10px] opacity-70">Number of Stars (Max: {editedField.max ?? 5})</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    type="range"
                    min="3"
                    max="10"
                    value={editedField.max ?? 5}
                    onChange={(e) => updateField('max', Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="font-bold text-lg w-8" style={{ color: currentTheme.text }}>{editedField.max ?? 5}</span>
                </div>
              </div>
            </div>
          )}

          {/* Options Management */}
          {hasOptions && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: currentTheme.text }}>Items Management</h4>
              <Label style={{ color: currentTheme.text }} className="text-xs">Enter options (One per line)</Label>
              <Textarea
                value={(editedField.options || []).join('\n')}
                onChange={(e) => updateField('options', e.target.value.split('\n'))}
                onBlur={(e) => updateField('options', e.target.value.split('\n').filter(o => o.trim() !== ''))}
                rows={5}
                style={inputStyle}
              />
            </div>
          )}

          {/* Layout & Logic */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: currentTheme.text }}>Layout & Grid</h4>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((span) => (
                <button
                  key={span}
                  type="button"
                  onClick={() => updateField('span', span)}
                  className={`py-3 text-xs font-bold rounded-xl border transition-all ${editedField.span === span ? 'scale-95 shadow-inner' : ''}`}
                  style={editedField.span === span
                    ? { backgroundColor: currentTheme.primary, color: '#fff', borderColor: currentTheme.primary }
                    : { backgroundColor: currentTheme.background, borderColor: currentTheme.border, color: currentTheme.text }}
                >
                  {span === 1 ? 'Small' : span === 2 ? 'Medium' : 'Full'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: currentTheme.border , color:currentTheme.text}}>
                <Label className="text-sm">Required</Label>
                <Switch checked={!!editedField.required} onCheckedChange={(v) => updateField('required', v)} style={{borderColor: currentTheme.border}}/>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: currentTheme.border, color:currentTheme.text }}>
                <Label className="text-sm">Read Only</Label>
                <Switch checked={!!editedField.disabled} onCheckedChange={(v) => updateField('disabled', v)} style={{borderColor: currentTheme.border}} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 flex justify-end gap-3 border-t" style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border }}>
          <Button variant="ghost" className='hover:bg-black/70' onClick={onClose} style={{ color: currentTheme.text }}>Discard</Button>
          <Button onClick={handleSave} className="px-8 flex gap-2" style={{ backgroundColor: currentTheme.primary, color: '#ffffff' }}>
            <Save className="w-4 h-4" />
            Apply Changes
          </Button>
        </div>
      </Card>
    </div>
  );
}