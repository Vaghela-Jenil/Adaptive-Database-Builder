'use client';

import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Star, Upload, X, Search, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { FieldAttributes } from './types';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { extractUploadedFileAssets, normalizeUploadedFileAsset, UploadedFileAsset } from '@/lib/uploadedFiles';

type Props = {
  field: FieldAttributes;
  value?: any;
  onChange?: (value: any) => void;
  isEditing?: boolean;
  formErrors?: Record<string, string>;
};

export default function ControlledFieldPreview({ field, value, onChange, isEditing = true, formErrors }: Props) {
  const { currentTheme, mode } = useTheme();
  const [localTags, setLocalTags] = useState<string[]>(Array.isArray(value) ? value : []);
  const [tagInput, setTagInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    setLocalTags(Array.isArray(value) ? value : []);
  }, [value]);

  const showLabel = field.showLabel !== false;
  const errorMessage = formErrors?.[field.id];
  const options = field.options || [];

  const getMeridiemFromTime = (time?: string): 'AM' | 'PM' => {
    if (!time || !time.includes(':')) return 'AM';
    const [hours] = time.split(':').map(Number);
    return Number.isFinite(hours) && hours >= 12 ? 'PM' : 'AM';
  };

  const applyMeridiemToTime = (time: string, meridiem: 'AM' | 'PM'): string => {
    const baseTime = time && time.includes(':') ? time : '12:00';
    const [hoursRaw, minutesRaw] = baseTime.split(':');
    let hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return '12:00';

    if (meridiem === 'AM') {
      if (hours >= 12) hours -= 12;
    } else if (hours < 12) {
      hours += 12;
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleTagRemove = (tag: string) => {
    const next = localTags.filter((t) => t !== tag);
    setLocalTags(next);
    onChange?.(next);
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !localTags.includes(tagInput.trim())) {
      const next = [...localTags, tagInput.trim()];
      setLocalTags(next);
      onChange?.(next);
      setTagInput('');
    }
  };

  const uploadSingleFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post('/api/uploads', formData);
    return {
      ...response.data,
      isTemporary: true,
    } as UploadedFileAsset;
  };

  const deleteUploadedFile = async (asset: UploadedFileAsset | null) => {
    if (!asset?.publicId || !asset.isTemporary) return;
    await axios.delete('/api/uploads', {
      data: {
        publicId: asset.publicId,
        resourceType: asset.resourceType,
      },
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadError('');
    setIsUploadingFile(true);
    try {
      const uploads = Array.from(files);
      const urls = await Promise.all(uploads.map((file) => uploadSingleFile(file)));

      if (field.multiple) {
        const existing = Array.isArray(value) ? value : [];
        const merged = [...existing, ...urls.filter(Boolean)];
        onChange?.(merged);
      } else {
        const existing = normalizeUploadedFileAsset(value);
        await deleteUploadedFile(existing);
        onChange?.(urls[0] || '');
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || 'Failed to upload file';
      setUploadError(message);
    } finally {
      setIsUploadingFile(false);
      event.target.value = '';
    }
  };

  const removeUploadedFile = (index?: number) => {
    if (field.multiple) {
      const existing = Array.isArray(value) ? value : [];
      if (index === undefined) return;
      const target = normalizeUploadedFileAsset(existing[index]);
      void deleteUploadedFile(target);
      onChange?.(existing.filter((_: unknown, idx: number) => idx !== index));
      return;
    }

    const single = normalizeUploadedFileAsset(value);
    void deleteUploadedFile(single);
    onChange?.('');
  };

  const uploadedFiles = extractUploadedFileAssets(value);

  return (
    <div className="space-y-2.5">
      {/* Universal Label */}
      {showLabel && !['checkbox', 'switch'].includes(field.type) && (
        <Label style={{ color: currentTheme.text }} className="text-sm font-semibold">
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
        </Label>
      )}

      {/* 1. Textarea */}
      {field.type === 'textarea' && (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={field.placeholder}
          rows={field.rows || 4}
          style={{
            backgroundColor: currentTheme.surface,
            borderColor: errorMessage ? "#ef4444" : currentTheme.border,
            color: currentTheme.text
          }}
        />
      )}

      {/* 2. Rating (Rate This) */}
      {field.type === 'rating' && (
        <div className="flex gap-1.5 py-1">
          {Array.from({ length: field.max || 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange?.(i + 1)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={cn("w-7 h-7", i < (value || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300")}
              />
            </button>
          ))}
        </div>
      )}

      {/* 3. Password Field */}
      {field.type === 'password' && (
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={field.placeholder || "••••••••"}
            style={{ backgroundColor: currentTheme.surface, borderColor: errorMessage ? "#ef4444" : currentTheme.border, color: currentTheme.text }}
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

      {/* 4. Switch / Toggle */}
      {field.type === 'switch' && (
        <div className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.surface }}>
          <Label htmlFor={field.id} style={{ color: currentTheme.text }} className="cursor-pointer font-medium">
            {field.label}
          </Label>
          <Switch id={field.id} checked={!!value} onCheckedChange={(c) => onChange?.(c)} />
        </div>
      )}

      {/* 5. Slider (with background container) */}
      {field.type === 'slider' && (
        <div className="py-5 px-4 rounded-xl border" style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border }}>
          <Slider
            value={[value || field.min || 0]}
            onValueChange={(vals) => onChange?.(vals[0])}
            min={field.min || 0}
            max={field.max || 100}
            step={field.step || 1}
            className={cn("w-full", "**:data-[slot=slider-track]:bg-slate-300 dark:**:data-[slot=slider-track]:bg-slate-700")}
          />
          <div className="flex justify-between mt-3 text-[10px] font-bold" style={{ color: currentTheme.text }}>
            <span>{field.min || 0}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-primary text-white">{value || field.min || 0}</span>
            <span>{field.max || 100}</span>
          </div>
        </div>
      )}

      {/* 6. File Upload */}
      {field.type === 'file-upload' && (
        <div
          className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2"
          style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.surface + '40' }}
        >
          <Upload className="w-8 h-8 opacity-40" style={{ color: currentTheme.text }} />
          <input
            type="file"
            className="hidden"
            id={`file-${field.id}`}
            accept={field.accept}
            multiple={!!field.multiple}
            onChange={handleFileUpload}
            disabled={field.disabled || isUploadingFile}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById(`file-${field.id}`)?.click()}
            disabled={field.disabled || isUploadingFile}
          >
            {isUploadingFile ? 'Uploading...' : 'Upload File'}
          </Button>
          {field.multiple && uploadedFiles.length > 0 && (
            <div className="w-full mt-2 space-y-2">
              {uploadedFiles.map((fileAsset, index: number) => (
                <div
                  key={`${fileAsset.publicId || fileAsset.url}-${index}`}
                  className="group flex items-center justify-between gap-2 text-xs border rounded px-2 py-1"
                  style={{ borderColor: currentTheme.border, color: currentTheme.text }}
                >
                  <div className="min-w-0 flex-1">
                    <a href={fileAsset.url} target="_blank" rel="noreferrer" className="truncate underline block">
                      {fileAsset.originalFilename || fileAsset.url}
                    </a>
                    <a
                      href={fileAsset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] underline"
                    >
                      Open
                    </a>
                  </div>
                  <button type="button" onClick={() => removeUploadedFile(index)}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {!field.multiple && uploadedFiles[0] && (
            <div
              className="group mt-2 w-full flex items-center justify-between gap-2 text-xs border rounded px-2 py-1"
              style={{ borderColor: currentTheme.border, color: currentTheme.text }}
            >
              <div className="min-w-0 flex-1">
                <a href={uploadedFiles[0].url} target="_blank" rel="noreferrer" className="truncate underline block">
                  {uploadedFiles[0].originalFilename || uploadedFiles[0].url}
                </a>
                <a
                  href={uploadedFiles[0].url}
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] underline"
                >
                  Open
                </a>
              </div>
              <button type="button" onClick={() => removeUploadedFile()}>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {uploadError && <span className="text-xs text-red-500 mt-1">{uploadError}</span>}
        </div>
      )}

      {/* 7. OTP Grid */}
      {field.type === 'input-otp' && (
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Input
              key={i}
              type="text"
              maxLength={1}
              className="w-12 h-12 text-center text-lg font-bold"
              style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }}
              onChange={(e) => {
                const char = e.target.value;
                const current = (value || "").split("");
                current[i] = char;
                onChange?.(current.join(""));
              }}
            />
          ))}
        </div>
      )}

      {/* 8. Combobox (Search) */}
      {field.type === 'combobox' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" style={{color: currentTheme.text}}/>
          <Input
            list={`list-${field.id}`}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={field.placeholder || "Search..."}
            className="pl-9"
            style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }}
          />
          <datalist id={`list-${field.id}`}>
            {options.map((opt) => <option key={opt} value={opt} />)}
          </datalist>
        </div>
      )}

      {/* Date Picker Controlled */}
      {field.type === 'date-picker' && (
        <div className="space-y-1">
          <Input
            type="date"
            // Added these back to ensure the browser calendar respects constraints
            min={field.minDate}
            max={field.maxDate}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={field.disabled}
            style={{
              backgroundColor: currentTheme.surface,
              borderColor: errorMessage ? "#ef4444" : currentTheme.border,
              color: currentTheme.text,
              // Vital for dark mode calendar popups
              colorScheme: mode === 'dark' ? 'dark' : 'light'
            }}
          />
        </div>
      )}

      {/* 9. Multi-Select (Tags) */}
      {field.type === 'multi-select' && (
        <div className="space-y-2">
          <select
            value=""
            onChange={(e) => {
              if (e.target.value && !localTags.includes(e.target.value)) {
                onChange?.([...localTags, e.target.value]);
              }
            }}
            className="w-full h-10 px-3 rounded-md border"
            style={{ backgroundColor: currentTheme.surface, color: currentTheme.text, borderColor: currentTheme.border }}
          >
            <option value="" disabled>Select multiple...</option>
            {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            {localTags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-2 py-1 rounded text-xs border" style={{ backgroundColor: currentTheme.background, color: currentTheme.text }}>
                {tag} <X className="w-3 h-3 cursor-pointer" onClick={() => handleTagRemove(tag)} />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* TIME FIELD */}
{field.type === 'input-time' && (
    <div className="grid grid-cols-[1fr_84px] gap-2">
      <Input
        type="time"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={field.disabled}
        style={{
          backgroundColor: currentTheme.surface,
          borderColor: errorMessage ? "#ef4444" : currentTheme.border,
          color: currentTheme.text,
          accentColor: "red",
          colorScheme: mode === 'dark' ? 'dark' : 'light'
        }}
        className="block w-full h-9 text-sm rounded-md"
      />
      <select
        value={getMeridiemFromTime(value || '')}
        onChange={(e) => onChange?.(applyMeridiemToTime(value || '12:00', e.target.value as 'AM' | 'PM'))}
        disabled={field.disabled}
        className="h-9 rounded-md border px-2 text-sm outline-none"
        style={{
          backgroundColor: currentTheme.surface,
          borderColor: errorMessage ? "#ef4444" : currentTheme.border,
          color: currentTheme.text,
        }}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
)}

      {/* 10. Standard Inputs (text, email, tel, date, etc.) */}
      {field.type.startsWith('input-') && !['input-password', 'input-otp', 'input-time'].includes(field.type) && (
        <Input
          type={field.type.split('-')[1]}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={field.placeholder}
          style={{ backgroundColor: currentTheme.surface, borderColor: errorMessage ? "#ef4444" : currentTheme.border, color: currentTheme.text }}
        />
      )}

      {/* 11. Select, Radio, Checkbox */}
      {field.type === 'select' && (
        <div className="relative">
          <select value={value || ''} onChange={(e) => onChange?.(e.target.value)} className="w-full h-10 px-3 pr-10 rounded-md border appearance-none outline-none" style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }}>
            <option value="" disabled>{field.placeholder || "Select option"}</option>
            {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
        </div>
      )}

      {field.type === 'radio' && (
        <RadioGroup value={value || ''} onValueChange={(val) => onChange?.(val)} className="flex flex-col gap-2">
          {options.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
              <Label htmlFor={`${field.id}-${opt}`} style={{ color: currentTheme.text }}>{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {field.type === 'checkbox' && (
        <div className="flex items-center gap-2 py-1">
          <Checkbox id={field.id} checked={!!value} onCheckedChange={(c) => onChange?.(c)} />
          <Label htmlFor={field.id} style={{ color: currentTheme.text }} className="text-sm">{field.label}</Label>
        </div>
      )}

      {/* 12. Tag Input (Controlled) */}
      {field.type === 'tag-input' && (
        <div className="space-y-2">
          <div
            className={cn(
              "flex flex-wrap gap-2 p-2 min-h-10.5 border rounded-md transition-all",
              errorMessage ? "border-red-500" : ""
            )}
            style={{
              backgroundColor: currentTheme.surface,
              borderColor: errorMessage ? "#ef4444" : currentTheme.border
            }}
          >
            {/* Render existing tags from the value prop */}
            {Array.isArray(value) && value.map((tag: string, i: number) => (
              <span
                key={`${tag}-${i}`}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-white animate-in fade-in zoom-in duration-200"
                style={{ backgroundColor: currentTheme.primary }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => {
                    const nextTags = value.filter((_: any, idx: number) => idx !== i);
                    onChange?.(nextTags);
                  }}
                  className="hover:bg-black/20 rounded-full p-0.5 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}

            {/* Input for typing new tags */}
            <input
              type="text"
              value={tagInput}
              disabled={field.disabled}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Prevent form submission
                  const trimmed = tagInput.trim();
                  if (trimmed) {
                    const currentTags = Array.isArray(value) ? value : [];
                    // Prevent duplicates
                    
                    onChange?.([...currentTags, trimmed]);
                    
                    setTagInput(''); // Clear local input
                  }
                } else if (e.key === 'Backspace' && !tagInput && Array.isArray(value) && value.length > 0) {
                  // Optional: Delete last tag on backspace if input is empty
                  const nextTags = value.slice(0, -1);
                  onChange?.(nextTags);
                }
              }}
              placeholder={Array.isArray(value) && value.length > 0 ? "" : field.placeholder || "Type and press Enter..."}
              className="flex-1 bg-transparent outline-none text-sm min-w-30"
              style={{ color: currentTheme.text }}
            />
          </div>
          {/* Helper text for the user */}
          <p className="text-[10px] opacity-50" style={{ color: currentTheme.text }}>
            Press <span className="font-bold">Enter</span> to add tags
          </p>
        </div>
      )}

      {/* 13. Toggle Group (Controlled) */}
      {field.type === 'toggle' && (
        <div className="flex flex-wrap gap-2">
          {options.length > 0 ? (
            options.map((opt) => {
              const isActive = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={field.disabled}
                  onClick={() => onChange?.(opt)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md border transition-all active:scale-95",
                    isActive ? "shadow-md" : "hover:bg-black/5"
                  )}
                  style={{
                    backgroundColor: isActive ? currentTheme.primary : currentTheme.surface,
                    borderColor: isActive ? currentTheme.primary : currentTheme.border,
                    color: isActive ? "#ffffff" : currentTheme.text,
                    opacity: field.disabled ? 0.5 : 1,
                    cursor: field.disabled ? 'not-allowed' : 'pointer'
                  }}
                >
                  {opt}
                </button>
              );
            })
          ) : (
            <p className="text-xs italic opacity-40" style={{ color: currentTheme.text }}>
              No options configured
            </p>
          )}
        </div>
      )}

      {/* Error / Helper */}
      {errorMessage ? (
        <p className="text-red-500 text-xs font-medium">{errorMessage}</p>
      ) : field.helperText ? (
        <p className="text-xs opacity-60" style={{ color: currentTheme.text }}>{field.helperText}</p>
      ) : null}
    </div>


  );
}