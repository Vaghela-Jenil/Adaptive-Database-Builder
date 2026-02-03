"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import {
  Type,
  Mail,
  Lock,
  AlignLeft,
  CheckSquare,
  GripVertical,
  Trash2,
  Settings,
} from "lucide-react";

/* ---------------- TYPES ---------------- */

type Width = "full" | "half" | "third";

type Condition = {
  fieldId: string;
  value: string;
};

type Field = {
  id: string;
  type: string;
  label: string;
  name: string;
  placeholder?: string;
  required: boolean;
  width: Width;
  condition?: Condition;
};

type Template = {
  type: string;
  label: string;
  icon: any;
};

/* ---------------- DATA ---------------- */

const TEMPLATES: Template[] = [
  { type: "text", label: "Text", icon: Type },
  { type: "email", label: "Email", icon: Mail },
  { type: "password", label: "Password", icon: Lock },
  { type: "textarea", label: "Textarea", icon: AlignLeft },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
];

/* ---------------- SORTABLE ITEM ---------------- */

function SortableField({
  field,
  onSelect,
  onDelete,
  selected,
}: {
  field: Field;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer
        bg-white/5 hover:bg-white/10
        ${selected ? "ring-2 ring-cyan-500" : ""}`}
    >
      <button {...attributes} {...listeners}>
        <GripVertical className="text-white/40" size={16} />
      </button>

      <div className="flex-1">
        <p className="text-sm">{field.label}</p>
        <p className="text-xs text-white/40">{field.type}</p>
      </div>

      <Trash2
        size={16}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-red-400 opacity-0 group-hover:opacity-100"
      />
    </div>
  );
}

/* ---------------- PAGE ---------------- */

export default function FormBuilderPage() {
  const sensors = useSensors(useSensor(PointerSensor));

  const [fields, setFields] = useState<Field[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* ---------- ADD FIELD ---------- */
  const addFieldFromTemplate = (template: Template) => {
    setFields((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: template.type,
        label: template.label,
        name: `${template.type}_${Date.now()}`,
        placeholder: "",
        required: false,
        width: "full",
      },
    ]);
  };

  /* ---------- SORT ---------- */
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setFields((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const updated = [...items];
      const [moved] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, moved);
      return updated;
    });
  };

  /* ---------- CONDITIONAL VISIBILITY ---------- */
  const isVisible = (field: Field) => {
    if (!field.condition) return true;
    const target = fields.find((f) => f.id === field.condition!.fieldId);
    return target?.placeholder === field.condition.value;
  };

  const selectedField = fields.find((f) => f.id === selectedId);

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex h-screen bg-[#0b0b0f] text-white overflow-hidden">
        {/* ---------------- LEFT SIDEBAR ---------------- */}
        <aside className="w-72 border-r border-white/10 p-4 space-y-3">
          <h2 className="text-xs uppercase text-white/40">Field Elements</h2>

          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.type}
                draggable
                onDragStart={() => setActiveTemplate(t)}
                onDragEnd={() => addFieldFromTemplate(t)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg
                  bg-white/5 hover:bg-white/10 cursor-grab"
              >
                <Icon size={16} className="text-white/70" />
                <span className="text-sm">{t.label}</span>
              </div>
            );
          })}
        </aside>

        {/* ---------------- CENTER CANVAS ---------------- */}
        <main className="flex-1 p-6 overflow-y-auto">
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="max-w-2xl mx-auto space-y-3">
              {fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  selected={field.id === selectedId}
                  onSelect={() => {
                    setSelectedId(field.id);
                    console.log("Selected:", field.name);
                  }}
                  onDelete={() =>
                    setFields((prev) =>
                      prev.filter((f) => f.id !== field.id)
                    )
                  }
                />
              ))}

              {fields.length === 0 && (
                <div className="text-center text-white/40 text-sm py-20
                  border border-dashed border-white/10 rounded-xl">
                  Drag fields here
                </div>
              )}
            </div>
          </SortableContext>
        </main>

        {/* ---------------- RIGHT SETTINGS + PREVIEW ---------------- */}
        <aside className="w-105 border-l border-white/10 p-6 overflow-y-auto">
          <h2 className="flex items-center gap-2 text-sm text-white/60 mb-4">
            <Settings size={16} /> Field Settings
          </h2>

          {selectedField ? (
            <div className="space-y-4">
              <input
                className="w-full bg-white/5 px-3 py-2 rounded"
                value={selectedField.label}
                onChange={(e) =>
                  setFields((prev) =>
                    prev.map((f) =>
                      f.id === selectedField.id
                        ? { ...f, label: e.target.value }
                        : f
                    )
                  )
                }
                placeholder="Label"
              />

              <input
                className="w-full bg-white/5 px-3 py-2 rounded"
                value={selectedField.placeholder}
                onChange={(e) =>
                  setFields((prev) =>
                    prev.map((f) =>
                      f.id === selectedField.id
                        ? { ...f, placeholder: e.target.value }
                        : f
                    )
                  )
                }
                placeholder="Placeholder"
              />

              <div className="grid grid-cols-3 gap-2">
                {(["full", "half", "third"] as Width[]).map((w) => (
                  <button
                    key={w}
                    onClick={() =>
                      setFields((prev) =>
                        prev.map((f) =>
                          f.id === selectedField.id ? { ...f, width: w } : f
                        )
                      )
                    }
                    className={`py-2 rounded text-xs ${
                      selectedField.width === w
                        ? "bg-cyan-500 text-black"
                        : "bg-white/5"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>

              {/* CONDITIONAL */}
              <select
                className="w-full bg-white/5 px-3 py-2 rounded"
                onChange={(e) =>
                  setFields((prev) =>
                    prev.map((f) =>
                      f.id === selectedField.id
                        ? {
                            ...f,
                            condition: e.target.value
                              ? { fieldId: e.target.value, value: "" }
                              : undefined,
                          }
                        : f
                    )
                  )
                }
              >
                <option value="">No condition</option>
                {fields
                  .filter((f) => f.id !== selectedField.id)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      Show when {f.label}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <p className="text-white/40 text-sm">
              Select a field to edit settings
            </p>
          )}

          {/* ---------------- FORM PREVIEW ---------------- */}
          <div className="mt-10 border-t border-white/10 pt-6">
            <h3 className="text-sm text-white/60 mb-4">Form Preview</h3>

            <div className="grid grid-cols-12 gap-4">
              {fields.filter(isVisible).map((f) => (
                <div
                  key={f.id}
                  className={`${
                    f.width === "full"
                      ? "col-span-12"
                      : f.width === "half"
                      ? "col-span-6"
                      : "col-span-4"
                  }`}
                >
                  <label className="text-xs text-white/60">
                    {f.label}
                  </label>
                  <input
                    placeholder={f.placeholder}
                    className="w-full bg-white/5 px-3 py-2 rounded mt-1"
                  />
                </div>
              ))}
            </div>
          </div>
        </aside>

        <DragOverlay>
          {activeTemplate && (
            <div className="px-4 py-2 rounded bg-white/10 text-sm">
              {activeTemplate.label}
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
