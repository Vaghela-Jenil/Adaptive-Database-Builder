'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Upload } from 'lucide-react';
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { FieldAttributes } from './types';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  field: FieldAttributes;
};

export default function FieldPreview({ field }: Props) {
  const { currentTheme } = useTheme();
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);

  const showLabel = field.showLabel !== false;

  // Display Elements
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
        <div
          className="h-px"
          style={{ backgroundColor: currentTheme.border }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <Label style={{ color: currentTheme.text }}>
          {field.label}
          {field.required && <span style={{ color: '#ef4444' }}> *</span>}
        </Label>
      )}

      {/* Text/Email/Phone/URL/Time Inputs */}
      {field.type.startsWith('input-') && (
        <Input
          type={
            field.type === 'input-number'
              ? 'number'
              : field.type === 'input-email'
              ? 'email'
              : field.type === 'input-url'
              ? 'url'
              : field.type === 'input-time'
              ? 'time'
              : 'text'
          }
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
          <Checkbox disabled={field.disabled} />
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
          <Switch disabled={field.disabled} />
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
        <div>
          <div
            className="flex flex-wrap gap-2 p-2 rounded-lg min-h-10.5"
            style={{
              backgroundColor: currentTheme.surface,
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            {tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded text-sm"
                style={{
                  backgroundColor: currentTheme.primary,
                  color: '#ffffff',
                }}
              >
                {tag}
                <button
                  onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                  className="ml-1"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder={field.placeholder}
              disabled={field.disabled}
              className="flex-1 bg-transparent outline-none min-w-25"
              style={{ color: currentTheme.text }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  setTags([...tags, e.currentTarget.value]);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Select */}
      {field.type === 'select' && (
        <select
          disabled={field.disabled}
          required={field.required}
          className="w-full px-3 py-2 rounded-lg outline-none"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            color: currentTheme.text,
          }}
        >
          <option value="">{field.placeholder}</option>
          {(field.options || []).map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {/* Combobox - simplified as select for preview */}
      {field.type === 'combobox' && (
        <Input
          type="text"
          list={`options-${field.id}`}
          placeholder={field.placeholder}
          disabled={field.disabled}
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            color: currentTheme.text,
          }}
        />
      )}

      {/* Multi Select */}
      {field.type === 'multi-select' && (
        <select
          multiple
          disabled={field.disabled}
          required={field.required}
          size={4}
          className="w-full px-3 py-2 rounded-lg outline-none"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            color: currentTheme.text,
          }}
        >
          {(field.options || []).map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {/* Toggle Group */}
      {field.type === 'toggle' && (
        <div className="flex flex-wrap gap-2">
          {(field.options || []).map((opt, i) => (
            <button
              key={i}
              disabled={field.disabled}
              className="px-4 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
                color: currentTheme.text,
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Radio Group */}
      {field.type === 'radio' && (
        <RadioGroup disabled={field.disabled}>
          {(field.options || []).map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <RadioGroupItem value={opt} id={`${field.id}-${i}`} />
              <Label htmlFor={`${field.id}-${i}`} style={{ color: currentTheme.text }}>
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
            disabled={field.disabled}
            min={field.min}
            max={field.max}
            step={field.step}
            defaultValue={[field.defaultValue as number || 50]}
          />
          <div className="flex justify-between text-xs" style={{ color: currentTheme.textSecondary }}>
            <span>{field.min}</span>
            <span>{field.max}</span>
          </div>
        </div>
      )}

      {/* File Upload */}
      {field.type === 'file-upload' && (
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-all"
          style={{
            backgroundColor: currentTheme.surface,
            borderColor: currentTheme.border,
          }}
        >
          <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: currentTheme.textSecondary }} />
          <p className="text-sm" style={{ color: currentTheme.text }}>
            {field.multiple ? 'Click to upload files' : 'Click to upload file'}
          </p>
          <p className="text-xs mt-1" style={{ color: currentTheme.textSecondary }}>
            {field.accept}
          </p>
        </div>
      )}

      {/* Rating */}
      {field.type === 'rating' && (
        <div className="flex gap-1">
          {Array.from({ length: field.max || 5 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setRating(i + 1)}
              disabled={field.disabled}
              className="transition-all hover:scale-110"
            >
              <Star
                className="w-6 h-6"
                fill={i < rating ? currentTheme.primary : 'none'}
                style={{
                  color: i < rating ? currentTheme.primary : currentTheme.border,
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
