'use client';

import { Card } from '../../ui/card';
import { useDraggable } from '@dnd-kit/core';
import { fieldTemplates } from './fieldTemplates';
import { useTheme } from '@/context/ThemeContext';
import { LucideIcon } from 'lucide-react';

function DraggableFieldTemplate({ id, icon: Icon, label }: { id: string; icon: LucideIcon; label: string }) {
  const { currentTheme } = useTheme();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: currentTheme.primary,
      }}
      {...listeners}
      {...attributes}
      className="
        rounded-lg
        text-white
        p-3
        shadow
        hover:shadow-lg
        transition-all
        cursor-grab
        active:scale-95
        active:cursor-grabbing
      "
    >
      <div className="flex items-center gap-2">
        <Icon size={18} />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}

export default function FormBuilderSidebar() {
  const { currentTheme } = useTheme();

  const displayElements = fieldTemplates.filter((f) => f.category === 'display');
  const fieldElements = fieldTemplates.filter((f) => f.category === 'field');

  return (
    <Card
      className="w-72 p-4 h-full overflow-y-auto shrink-0"
      style={{
        backgroundColor: currentTheme.surface,
        border: `1px solid ${currentTheme.border}`,
      }}
    >
      <h3
        className="font-semibold mb-4 text-lg"
        style={{ color: currentTheme.text }}
      >
        Form Elements
      </h3>

      {/* Display Elements */}
      <div className="mb-6">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: currentTheme.textSecondary }}
        >
          Display Elements
        </p>
        <div className="space-y-2">
          {displayElements.map((field) => (
            <DraggableFieldTemplate
              key={field.id}
              id={field.id}
              icon={field.icon}
              label={field.label}
            />
          ))}
        </div>
      </div>

      {/* Separator */}
      <div
        className="my-4 h-px"
        style={{ backgroundColor: currentTheme.border }}
      />

      {/* Field Elements */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: currentTheme.textSecondary }}
        >
          Field Elements
        </p>
        <div className="space-y-2">
          {fieldElements.map((field) => (
            <DraggableFieldTemplate
              key={field.id}
              id={field.id}
              icon={field.icon}
              label={field.label}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
