'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function EditPanel({
  open,
  label,
  span,
  onSave,
  onClose,
}: {
  open: boolean;
  label: string;
  span: number;
  onSave: (label: string, span: number) => void;
  onClose: () => void;
}) {
  if (!open) return null;

  let newLabel = label;
  let newSpan = span;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <Card className="w-90 p-5 space-y-4">
        <h3 className="font-semibold">Edit Field</h3>

        <Input
          defaultValue={label}
          onChange={(e) => (newLabel = e.target.value)}
        />

        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <Button
              key={s}
              variant={s === span ? 'default' : 'outline'}
              onClick={() => (newSpan = s)}
            >
              Span {s}
            </Button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(newLabel, newSpan)}>
            Save
          </Button>
        </div>
      </Card>
    </div>
  );
}
