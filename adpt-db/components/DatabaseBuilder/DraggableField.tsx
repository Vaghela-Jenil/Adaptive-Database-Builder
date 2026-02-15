"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit, Trash2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { FieldAttributes } from "./types";

type Props = {
  field: FieldAttributes;
  onEdit: () => void;
  onDelete: () => void;
};

export default function DraggableField({
  field,
  onEdit,
  onDelete,
}: Props) {
  const { currentTheme } = useTheme();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${Math.min(field.span, 3)}`,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div
        className="border rounded-xl p-4 min-h-20 flex flex-col gap-2 transition-all"
        style={{
          backgroundColor: currentTheme.surface,
          border: `1px solid ${currentTheme.border}`,
        }}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between gap-2">
          {/* DRAG HANDLE */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:scale-110 transition-all"
            style={{
              backgroundColor: currentTheme.background,
              color: currentTheme.textSecondary,
            }}
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* LABEL */}
          <div
            className="flex-1 text-sm font-medium truncate"
            style={{ color: currentTheme.text }}
          >
            {field.label}
          </div>

          {/* ACTIONS */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 rounded-lg hover:scale-110 transition-all"
              style={{
                backgroundColor: currentTheme.background,
                border: `1px solid ${currentTheme.border}`,
                color: currentTheme.primary,
              }}
            >
              <Edit className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-lg hover:scale-110 transition-all"
              style={{
                backgroundColor: currentTheme.background,
                border: `1px solid ${currentTheme.border}`,
                color: "#ef4444",
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* TYPE BADGE */}
        <div
          className="text-xs px-2 py-1 rounded-md w-fit"
          style={{
            backgroundColor: currentTheme.primary,
            color: "#fff",
          }}
        >
          {field.type.replace("-", " ")}
        </div>
      </div>
    </div>
  );
}
