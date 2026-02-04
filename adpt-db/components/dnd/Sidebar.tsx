'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Draggable } from './Draggable';

const fields = [
  { id: 'text', label: 'Text Field', placeholder: 'Text input' },
  { id: 'number', label: 'Number Field', placeholder: '123' },
  { id: 'email', label: 'Email Field', placeholder: 'email@example.com' },
  { id: 'password', label: 'Password Field', placeholder: '••••••••' },
  { id: 'date', label: 'Date Field', placeholder: 'YYYY-MM-DD' },
  { id: 'checkbox', label: 'Checkbox Field', placeholder: '' },
  { id: 'radio', label: 'Radio Button Field', placeholder: '' },
  { id: 'select', label: 'Select Field', placeholder: '' },
];

export default function Sidebar() {
  return (
   <div 
   className="
    h-full
    w-64
    overflow-y-auto
    scrollbar-hide
    border-r
    pr-2
  ">
     <aside className="w-65 border-r bg-muted/40 p-2 space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground">
        Input Fields
      </h2>

      {fields.map((f) => (
        <Draggable key={f.id} id={f.id}>
          <Card className="p-2 cursor-grab hover:shadow-md transition">
            <div>
            <Label className="text-xs">{f.label}</Label>
            <Input
              disabled
              placeholder={f.placeholder}
              className="pointer-events-none mt-1"
            /></div>
          </Card>
        </Draggable>
      ))}
    </aside>
   </div>
  );
}
