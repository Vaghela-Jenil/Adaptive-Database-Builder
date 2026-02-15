"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useTheme } from "@/context/ThemeContext";
import DraggableField from "./DraggableField";
import { FieldAttributes } from "./types";
import { Package } from "lucide-react";

type Props = {
  fields: FieldAttributes[];
  onFieldEdit: (field: FieldAttributes) => void;
  onFieldDelete: (id: string) => void;
  // onFieldUpdate: (field: FieldAttributes) => void;
};

export default function FormBuilderCanvas({
  fields,
  onFieldEdit,
  onFieldDelete,
  // onFieldUpdate
}: Props) {
  const { currentTheme } = useTheme();
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

  return (
    <div
      ref={setNodeRef}
      className="h-full overflow-y-auto p-8 scrollbar-hide"
      style={{
        backgroundColor: isOver
          ? `${currentTheme.primary}10`
          : currentTheme.background,
      }}
    >
      {fields.length === 0 ? (
        /* EMPTY STATE (dark safe) */
        <div
          className="h-full flex items-center justify-center"
          style={{ color: currentTheme.textSecondary }}
        >
          <div className="text-center">
            <Package className="w-16 h-16 mx-auto opacity-40" />
            <p className="mt-4 text-sm opacity-70">Drop fields here</p>
          </div>
        </div>
      ) : (
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={rectSortingStrategy} // ✅ FIXED
        >
          <div className="grid gap-6 auto-rows-min"
           style={{
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gridAutoFlow: "dense",
          }}>
            {fields.map((field) => (
              <DraggableField
                key={field.id}
                field={field}
                onEdit={() => onFieldEdit(field)}
                onDelete={() => onFieldDelete(field.id)}
              />
            ))}

            {/* ✅ DROP SPACER — allows last / center drop */}
            <div className="col-span-3 h-24" />
          </div>
        </SortableContext>
      )}
    </div>
  );
}
