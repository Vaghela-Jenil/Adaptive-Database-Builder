'use client';

import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Star, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { FieldAttributes } from './types';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '../ui/button';

type Props = {
  field: FieldAttributes;
  value?: any;
  onChange?: (value: any) => void;
  isEditing?: boolean;
};

export default function ControlledFieldPreview({ field, value, onChange, isEditing = true }: Props) {
  const { currentTheme } = useTheme();
  const [localTags, setLocalTags] = useState<string[]>(
    Array.isArray(value) ? value : value ? [value] : []
  );
  const [tagInput, setTagInput] = useState('');

  const showLabel = field.showLabel !== false;

  // Display Elements (non-interactive)
  if (field.type === 'text') {
    return (
      <div className="p-4" style={{ color: currentTheme.text }}>
        {field.label}
      </div>
    );
  }

  if (field.type === 'separator') {
    return (
      <div className="py-2">
        <div className="h-px" style={{ backgroundColor: currentTheme.border }} />
      </div>
    );
  }

  const handleTagAdd = () => {
    if (tagInput.trim() && !localTags.includes(tagInput.trim())) {
      const newTags = [...localTags, tagInput.trim()];
      setLocalTags(newTags);
      onChange?.(newTags);
      setTagInput('');
    }
  };

  const handleTagRemove = (tag: string) => {
    const newTags = localTags.filter((t) => t !== tag);
    setLocalTags(newTags);
    onChange?.(newTags);
  };

  return (
    <div className="space-y-2">
      {showLabel && (
        <Label style={{ color: currentTheme.text }}>
          {field.label}
          {field.required && <span style={{ color: '#ef4444' }}> *</span>}
        </Label>
      )}

      {/* Text/Email/Phone/URL/Time/Number Inputs */}
      {field.type.startsWith('input-') && (
        <Input
          type={
            field.type === 'input-number'
              ? 'number'
              : field.type === 'input-email'
              ? 'email'
              : field.type === 'input-phone'
              ? 'tel'
              : field.type === 'input-url'
              ? 'url'
              : field.type === 'input-time'
              ? 'time'
              : 'text'
          }
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={field.placeholder}
          disabled={field.disabled}
          required={field.required}
          min={field.min}
          max={field.max}
          step={field.step}
          minLength={field.minLength}
          maxLength={field.maxLength}
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            color: currentTheme.text,
          }}
        />
      )}

      {/* Textarea */}
      {field.type === 'textarea' && (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={field.placeholder}
          disabled={field.disabled}
          required={field.required}
          rows={field.rows}
          minLength={field.minLength}
          maxLength={field.maxLength}
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            color: currentTheme.text,
          }}
        />
      )}

      {/* Password */}
      {field.type === 'password' && (
        <Input
          type="password"
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={field.placeholder}
          disabled={field.disabled}
          required={field.required}
          minLength={field.minLength}
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            color: currentTheme.text,
          }}
        />
      )}

      {/* OTP Input */}
      {field.type === 'input-otp' && (
        <div className="flex gap-2">
          {Array.from({ length: field.otpLength || 6 }).map((_, i) => (
            <Input
              key={i}
              type="text"
              maxLength={1}
              value={value?.[i] || ''}
              onChange={(e) => {
                const newOtp = (value || '').split('');
                newOtp[i] = e.target.value;
                onChange?.(newOtp.join(''));
              }}
              className="w-12 text-center"
              disabled={field.disabled}
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
                color: currentTheme.text,
              }}
            />
          ))}
        </div>
      )}

      {/* Checkbox */}
      {field.type === 'checkbox' && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={!!value}
            onCheckedChange={(checked) => onChange?.(checked)}
            disabled={field.disabled}
          />
          {!showLabel && (
            <span className="text-sm" style={{ color: currentTheme.text }}>
              {field.label}
            </span>
          )}
        </div>
      )}

      {/* Switch */}
      {field.type === 'switch' && (
        <div className="flex items-center gap-2">
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => onChange?.(checked)}
            disabled={field.disabled}
          />
          {!showLabel && (
            <span className="text-sm" style={{ color: currentTheme.text }}>
              {field.label}
            </span>
          )}
        </div>
      )}

      {/* Date Picker */}
      {field.type === 'date-picker' && (
        <Input
          type="date"
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={field.disabled}
          required={field.required}
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            color: currentTheme.text,
          }}
        />
      )}

      {/* Tag Input */}
      {field.type === 'tag-input' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
              placeholder="Type and press Enter"
              disabled={field.disabled}
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
                color: currentTheme.text,
              }}
            />
            <Button type="button" onClick={handleTagAdd} disabled={field.disabled}>
              Add
            </Button>
          </div>
          {localTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {localTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-md text-sm flex items-center gap-1"
                  style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text,
                  }}
                >
                  {tag}
                  {!field.disabled && (
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="hover:scale-110 transition-transform"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Select */}
      {field.type === 'select' && (
        <select
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={field.disabled}
          required={field.required}
          className="w-full px-3 py-2 rounded-md"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            color: currentTheme.text,
          }}
        >
          <option value="">Select an option</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {/* Multi-Select */}
      {field.type === 'multi-select' && (
        <select
          multiple
          value={Array.isArray(value) ? value : []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, (option) => option.value);
            onChange?.(selected);
          }}
          disabled={field.disabled}
          required={field.required}
          className="w-full px-3 py-2 rounded-md"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            color: currentTheme.text,
            minHeight: '100px',
          }}
        >
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {/* Radio Group */}
      {field.type === 'radio' && (
        <RadioGroup
          value={value || ''}
          onValueChange={(val) => onChange?.(val)}
          disabled={field.disabled}
        >
          {field.options?.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
              <Label htmlFor={`${field.id}-${opt}`} style={{ color: currentTheme.text }}>
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {/* Slider */}
      {field.type === 'slider' && (
        <div className="space-y-2">
          <Slider
            value={[value || field.min || 0]}
            onValueChange={(vals) => onChange?.(vals[0])}
            min={field.min || 0}
            max={field.max || 100}
            step={field.step || 1}
            disabled={field.disabled}
          />
          <div className="text-sm text-center" style={{ color: currentTheme.textSecondary }}>
            {value || field.min || 0}
          </div>
        </div>
      )}

      {/* File Upload */}
      {field.type === 'file-upload' && (
        <label
          className="block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-opacity-50 transition-all"
          style={{ borderColor: currentTheme.border }}
        >
          <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: currentTheme.textSecondary }} />
          <p className="text-sm" style={{ color: currentTheme.text }}>
            {value ? `Selected: ${value}` : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs mt-1" style={{ color: currentTheme.textSecondary }}>
            {field.accept || 'Any file type'}
          </p>
          <input
            type="file"
            accept={field.accept}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onChange?.(file.name);
              }
            }}
            disabled={field.disabled}
            className="hidden"
          />
        </label>
      )}

      {/* Rating */}
      {field.type === 'rating' && (
        <div className="flex gap-1">
          {Array.from({ length: field.max || 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => !field.disabled && onChange?.(i + 1)}
              disabled={field.disabled}
              className="hover:scale-110 transition-transform"
            >
              <Star
                className="w-6 h-6"
                style={{
                  fill: i < (value || 0) ? '#fbbf24' : 'transparent',
                  color: i < (value || 0) ? '#fbbf24' : currentTheme.textSecondary,
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Helper Text */}
      {field.helperText && (
        <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
          {field.helperText}
        </p>
      )}
    </div>
  );
}