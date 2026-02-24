import { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  pointerWithin,
  closestCorners,
  CollisionDetection,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import FormBuilderSidebar from './FormBuilderSidebar';
import FormBuilderCanvas from './FormBuilderCanvas';
import EditFieldPanel from './EditFieldPanel';
import FieldPreview from './FieldPreview';
import ExportJSONModal from './ExportJSONModal';
import CreateDatabaseModal from './CreateDatabaseModal';
import { DatabaseFolder, FieldAttributes } from "./types";
import { fieldTemplates } from './fieldTemplates';
import { useTheme } from '@/context/ThemeContext';
import { Eye, Code, Trash2, ArrowLeft, Database as DatabaseIcon } from 'lucide-react';
import axios from 'axios';


type FormBuilderPageProps = {
  onBack: (name: string) => void;
  editingDatabase: DatabaseFolder | null;
};

export default function FormBuilderPage({
  onBack,
  editingDatabase,
}: FormBuilderPageProps) {
  const { currentTheme } = useTheme();
  const [canvasFields, setCanvasFields] = useState<FieldAttributes[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<FieldAttributes | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateDatabase = async (name: string) => {
    try {
      const res = await axios.post("/api/databases", {
        name,
        formSchema: canvasFields,
      });

      console.log("Created:", res.data);
      setCanvasFields([]);
      onBack("database");
    } catch (err: any) {
      if (err.response?.status === 409) {
        alert("Database name already exists");
      } else {
        alert("Failed to create database");
      }
    }
  };

  const handleUpdateDatabase = async (name: string) => { 
     try {
      const res = await axios.put(`/api/databases`, {
        name,
        formSchema: canvasFields,
      });

      console.log("Updated:", res.data);
      setCanvasFields([]);
      onBack("database");
    } catch (err: any) {
        alert("Failed to update database");
    }
  }


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    if (editingDatabase) {
      setCanvasFields(editingDatabase.formSchema);
    }
  }, [editingDatabase]);


  /* -------------------- DRAG END -------------------- */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // ✅ 1. REORDER INSIDE CANVAS
    if (activeId !== overId && canvasFields.some(f => f.id === activeId)) {
      setCanvasFields((fields) => {
        const oldIndex = fields.findIndex((f) => f.id === activeId);
        const newIndex = fields.findIndex((f) => f.id === overId);
        if (oldIndex === -1 || newIndex === -1) return fields;
        return arrayMove(fields, oldIndex, newIndex);
      });
      return;
    }

    // ✅ 2. CLONE FROM SIDEBAR → CANVAS
    if (overId === 'canvas') {
      const template = fieldTemplates.find((f) => f.id === activeId);
      if (!template) return;

      const newField: FieldAttributes = {
        id: template.id + '-' + crypto.randomUUID(),
        type: template.type,
        label: template.label,
        span: template.defaultSpan,
        ...template.defaultAttributes,
      };

      setCanvasFields((prev) => [...prev, newField]);
    }
  }

  function handleFieldsUpdate(id: string, updates: Partial<FieldAttributes>) {
    setCanvasFields((fields) =>
      fields.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }

  function handleDelete(id: string) {
    setCanvasFields((fields) => fields.filter((f) => f.id !== id));
  }

  function handleSaveField(updatedField: FieldAttributes) {
    setCanvasFields((fields) =>
      fields.map((f) => (f.id === updatedField.id ? updatedField : f))
    );
  }

  function handleClearAll() {
    if (confirm('Are you sure you want to clear all fields?')) {
      setCanvasFields([]);
    }
  }

  /* -------------------- COLLISION -------------------- */
  const canvasCollisionDetection: CollisionDetection = (args) => {
    const pointerHits = pointerWithin(args);
    if (pointerHits.length > 0) return pointerHits;
    return closestCorners(args);
  };

  /* -------------------- RENDER -------------------- */
  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ backgroundColor: currentTheme.background }}>
      <DndContext
        sensors={sensors}
        collisionDetection={canvasCollisionDetection}
        onDragStart={(e) => setActiveId(e.active.id as string)}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={(e) => {
          handleDragEnd(e);
          setActiveId(null);
        }}
      >
        {/* everything below unchanged */}

        {/* HEADER */}
        <div
          className="h-16 flex items-center justify-between px-6 fshrink-0"
          style={{ borderBottom: `1px solid ${currentTheme.border}` }}
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => onBack("database")}
              className="flex items-center gap-2"
              style={{
                color: currentTheme.text,
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: currentTheme.text }}>
                {editingDatabase ? `Edit: ${editingDatabase.DatabaseName}` : 'Form Builder'}
              </h1>
              <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                {canvasFields.length} fields added
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              style={{
                backgroundColor: previewMode ? currentTheme.primary : currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
                color: previewMode ? '#ffffff' : currentTheme.text,
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Edit Mode' : 'Preview'}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowExportModal(true)}
              disabled={canvasFields.length === 0}
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
                color: currentTheme.text,
              }}
            >
              <Code className="w-4 h-4 mr-2" />
              Export JSON
            </Button>

            <Button
              variant="outline"
              onClick={handleClearAll}
              disabled={canvasFields.length === 0}
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
                color: '#ef4444',
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>

            <Button
              onClick={() => setShowCreateModal(true)}
              disabled={canvasFields.length === 0}
              style={{
                backgroundColor: currentTheme.primary,
                color: '#ffffff',
              }}
            >
              <DatabaseIcon className="w-4 h-4 mr-2" />
              {editingDatabase ? 'Update Database' : 'Create Database'}
            </Button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-hidden flex">
          {/* SIDEBAR */}
          {!previewMode && <FormBuilderSidebar />}

          {/* CANVAS / PREVIEW */}
          <div className="flex-1 overflow-hidden">
            {!previewMode ? (
              <FormBuilderCanvas
                fields={canvasFields}
                onFieldEdit={setEditingField}
                onFieldDelete={handleDelete}
              />
            ) : (
              <div className="h-full overflow-y-auto p-8">
                <Card
                  className="max-w-5xl mx-auto p-8"
                  style={{
                    backgroundColor: currentTheme.surface,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <h3
                    className="font-semibold mb-6 text-lg"
                    style={{ color: currentTheme.text }}
                  >
                    Form Preview
                  </h3>

                  {canvasFields.length === 0 ? (
                    <div
                      className="text-center py-12"
                      style={{ color: currentTheme.textSecondary }}
                    >
                      No fields added yet
                    </div>
                  ) : (
                    <div
                      className="grid gap-6 auto-rows-min"
                      style={{
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gridAutoFlow: "dense",
                      }}
                    >
                      {canvasFields.map((field) => (
                        <div
                          key={field.id}
                          className="w-full"
                          style={{
                            gridColumn: `span ${Math.min(field.span ?? 1, 3)}`,
                          }}
                        >
                          <FieldPreview field={field} />
                        </div>
                      ))}
                    </div>


                  )}

                  {canvasFields.length > 0 && (
                    <div className="mt-8 flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setPreviewMode(false)}
                        style={{
                          backgroundColor: currentTheme.background,
                          border: `1px solid ${currentTheme.border}`,
                          color: currentTheme.text,
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        style={{
                          backgroundColor: currentTheme.primary,
                          color: '#ffffff',
                        }}
                      >
                        Submit
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* EDIT PANEL */}
        {editingField && (
          <EditFieldPanel
            open={true}
            field={editingField}
            onClose={() => setEditingField(null)}
            onSave={handleSaveField}
          />
        )}

        {/* EXPORT JSON MODAL */}
        {showExportModal && (
          <ExportJSONModal
            open={showExportModal}
            formSchema={canvasFields}
            onClose={() => setShowExportModal(false)}
          />
        )}

        {/* CREATE DATABASE MODAL */}
        {showCreateModal && (
          <CreateDatabaseModal
            open={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSave={(name) => handleCreateDatabase(name)}
            onUpdate={(name) => handleUpdateDatabase(name)}
            editingName={editingDatabase?.DatabaseName}
          />
        )}

        {/* DRAG OVERLAY */}
        <DragOverlay
          dropAnimation={{
            duration: 220,
            easing: 'cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {activeId ? (
            <Card
              className="w-48 p-4 shadow-2xl opacity-95"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = fieldTemplates.find((f) => activeId.includes(f.id))?.icon;
                  return Icon ? <Icon size={18} /> : null;
                })()}

                <span className="font-medium" style={{ color: currentTheme.text }}>
                  {fieldTemplates.find((f) => activeId.includes(f.id))?.label}
                </span>
              </div>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}