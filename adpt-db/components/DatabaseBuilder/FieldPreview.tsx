'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Upload, X, Search, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { FieldAttributes } from './types';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  field: FieldAttributes;
};

export default function FieldPreview({ field }: Props) {
  const { currentTheme } = useTheme();
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const showLabel = field.showLabel !== false;
  const options = field.options || [];

  // 1. DISPLAY ELEMENTS (Standalone)
  if (field.type === 'text') {
    return <div className="p-2 font-medium" style={{ color: currentTheme.text }}>{field.label}</div>;
  }

  if (field.type === 'separator') {
    return <div className="py-4"><div className="h-px w-full" style={{ backgroundColor: `${currentTheme.border}80` }} /></div>;
  }

  return (
    <div className="space-y-3">
      {/* Label logic: Hidden for checkbox/switch/text/separator */}
      {showLabel && !['checkbox', 'switch'].includes(field.type) && (
        <Label className="text-sm font-semibold" style={{ color: currentTheme.text }}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {/* 2. TEXTAREA */}
      {field.type === 'textarea' && (
        <Textarea
          placeholder={field.placeholder}
          disabled={field.disabled}
          rows={field.rows || 4}
          style={{
            backgroundColor: currentTheme.surface,
            borderColor: currentTheme.border,
            color: currentTheme.text,
          }}
        />
      )}

      {/* 3. PASSWORD (Matches Template 'password') */}
      {field.type === 'password' && (
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder={field.placeholder || "••••••••"}
            disabled={field.disabled}
            style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
            style={{ color: currentTheme.text }}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Date Picker Preview */}
    {/* Date Picker Preview */}
      {field.type === 'date-picker' && (
        <div className="relative">
          <Input
            type="date"
            // Ensure we use Date-specific attributes
            min={field.minDate} 
            max={field.maxDate}
            disabled={field.disabled}
            style={{
              backgroundColor: currentTheme.surface,
              borderColor: currentTheme.border,
              color: currentTheme.text,
              // Add this to make the calendar icon/picker theme-aware
              colorScheme: currentTheme.mode === 'dark' ? 'dark' : 'light'
            }}
            className="block w-full"
          />
        </div>
      )}

      {/* 4. RATING */}
      {field.type === 'rating' && (
        <div className="flex gap-1.5 py-1">
          {Array.from({ length: field.max || 5 }).map((_, i) => (
            <Star
              key={i}
              size={24}
              className="cursor-pointer transition-transform hover:scale-110"
              fill={i < rating ? "#facc15" : "transparent"} // yellow-400
              style={{ color: i < rating ? "#facc15" : currentTheme.border }}
              onClick={() => setRating(i + 1)}
            />
          ))}
        </div>
      )}

      {/* 5. OTP GRID */}
      {field.type === 'input-otp' && (
        <div className="flex gap-2">
          {Array.from({ length: field.otpLength || 6 }).map((_, i) => (
            <Input
              key={i}
              type="text"
              maxLength={1}
              className="w-10 h-12 text-center text-lg font-bold"
              style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }}
            />
          ))}
        </div>
      )}

      {/* 6. SWITCH */}
      {field.type === 'switch' && (
        <div className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.surface }}>
          <Label htmlFor={field.id} style={{ color: currentTheme.text }} className="cursor-pointer font-medium">
            {field.label}
          </Label>
          <Switch id={field.id} disabled={field.disabled} />
        </div>
      )}

      {/* 7. STANDARD INPUTS (Catch-all for email, phone, url, etc.) */}
      {field.type.startsWith('input-') && field.type !== 'input-otp' && (
        <Input
          type={field.type.replace('input-', '') === 'phone' ? 'tel' : field.type.replace('input-', '')}
          placeholder={field.placeholder}
          disabled={field.disabled}
          style={{
            backgroundColor: currentTheme.surface,
            borderColor: currentTheme.border,
            color: currentTheme.text,
          }}
        />
      )}

      {/* 8. SELECT & COMBOBOX */}
      {(field.type === 'select' || field.type === 'combobox') && (
        <div className="relative">
          {field.type === 'select' ? (
            <div className="relative">
              <select
                disabled={field.disabled}
                defaultValue=""
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm appearance-none outline-none focus:ring-2"
                style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }}
              >
                <option value="" disabled>{field.placeholder || "Choose one..."}</option>
                {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 pointer-events-none" />
            </div>
          ) : (
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" style={{ color: currentTheme.text }} />
               <Input
                 list={`list-${field.id}`}
                 className="pl-9"
                 placeholder={field.placeholder}
                 style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }}
               />
               <datalist id={`list-${field.id}`}>
                 {options.map((opt, i) => <option key={i} value={opt} />)}
               </datalist>
            </div>
          )}
        </div>
      )}

      {/* 9. CHECKBOX & MULTI-SELECT */}
      {(field.type === 'checkbox' || field.type === 'multi-select') && (
        <div className="space-y-3">
          {options.length > 0 ? (
            options.map((opt, i) => (
              <div key={`${field.id}-${i}`} className="flex items-center space-x-2">
                <Checkbox id={`${field.id}-${i}`} disabled={field.disabled} />
                <Label htmlFor={`${field.id}-${i}`} style={{ color: currentTheme.text }}>{opt}</Label>
              </div>
            ))
          ) : (
            <div className="flex items-center space-x-2 py-1">
              <Checkbox id={field.id} disabled={field.disabled} />
              <Label htmlFor={field.id} style={{ color: currentTheme.text }}>{field.label}</Label>
            </div>
          )}
        </div>
      )}

      {/* 10. RADIO & TOGGLE */}
      {(field.type === 'radio' || field.type === 'toggle') && (
        <div className={field.type === 'radio' ? "space-y-2" : "flex flex-wrap gap-2"}>
          {options.length > 0 ? (
            field.type === 'radio' ? (
              <RadioGroup disabled={field.disabled}>
                {options.map((opt, i) => (
                  <div key={`${field.id}-${i}`} className="flex items-center gap-2">
                    <RadioGroupItem value={opt} id={`${field.id}-${i}`} />
                    <Label htmlFor={`${field.id}-${i}`} style={{ color: currentTheme.text }}>{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              options.map((opt, i) => (
                <button
                  key={`${field.id}-${i}`}
                  className="px-3 py-1 text-sm rounded-md border hover:opacity-80"
                  style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }}
                >
                  {opt}
                </button>
              ))
            )
          ) : (
             <p className="text-xs italic opacity-40" style={{ color: currentTheme.text }}>No options added</p>
          )}
        </div>
      )}

      {/* 11. SLIDER */}
      {field.type === 'slider' && (
        <div className="pt-4 pb-2 px-1">
          <Slider
            disabled={field.disabled}
            min={field.min}
            max={field.max}
            step={field.step}
            defaultValue={[Number(field.defaultValue) || 0]}
            className={cn("w-full", "**:data-[slot=slider-track]:bg-slate-200 dark:**:data-[slot=slider-track]:bg-slate-800")}
          />
          <div className="flex justify-between mt-2 text-[10px] font-bold" style={{ color: currentTheme.text }}>
            <span>{field.min}</span>
            <span style={{ color: currentTheme.primary }}>{field.defaultValue}</span>
            <span>{field.max}</span>
          </div>
        </div>
      )}

      {/* 12. TAG INPUT */}
      {field.type === 'tag-input' && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md" style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border }}>
          {tags.map((tag, i) => (
            <span key={i} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white bg-primary">
              {tag} <X size={12} className="cursor-pointer" onClick={() => setTags(tags.filter((_, idx) => idx !== i))} />
            </span>
          ))}
          <input
            className="bg-transparent outline-none text-sm flex-1"
            placeholder={field.placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                setTags([...tags, e.currentTarget.value]);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      )}

      {/* 13. FILE UPLOAD */}
      {field.type === 'file-upload' && (
        <div 
          className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2"
          style={{ borderColor: currentTheme.border, backgroundColor: `${currentTheme.surface}50` }}
        >
          <Upload className="w-6 h-6 opacity-50" style={{ color: currentTheme.text }} />
          <span className="text-sm font-medium" style={{ color: currentTheme.text }}>{field.placeholder || "Upload Files"}</span>
          <Button variant="outline" size="sm">Select File</Button>
        </div>
      )}

      {/* HELPER TEXT */}
      {field.helperText && (
        <p className="text-[11px] mt-1 italic opacity-60" style={{ color: currentTheme.text }}>
          {field.helperText}
        </p>
      )}
    </div>
  );
}