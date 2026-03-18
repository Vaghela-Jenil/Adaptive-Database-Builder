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
import ImportJSONModal from './ImportJsonModel';
import CreateDatabaseModal from './CreateDatabaseModal';
import { DatabaseFolder, FieldAttributes } from "./types";
import { fieldTemplates } from './fieldTemplates';
import { useTheme } from '@/context/ThemeContext';
import { Eye, Code, Trash2, ArrowLeft, Database as DatabaseIcon, AlertCircle, CheckCircle, Trash } from 'lucide-react';
import axios from 'axios';


type FormBuilderPageProps = {
  onBack: (name: string) => void;
  editingDatabase: DatabaseFolder | null;
  SelectTemplate?: FieldAttributes[] | null;
};

const SCHEMA_STORAGE_KEY = 'formBuilder_savedSchema';

export default function FormBuilderPage({
  onBack,
  editingDatabase,
  SelectTemplate
}: FormBuilderPageProps) {
  const { currentTheme } = useTheme();
  const [canvasFields, setCanvasFields] = useState<FieldAttributes[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<FieldAttributes | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  const [showSaveSchemaModal, setShowSaveSchemaModal] = useState(false);
  const [showSavedSchemaPrompt, setShowSavedSchemaPrompt] = useState(false);
  const [hasSavedSchema, setHasSavedSchema] = useState(false);

  // Check for saved schema on mount
  useEffect(() => {
    if (!editingDatabase) {
      const savedSchema = localStorage.getItem(SCHEMA_STORAGE_KEY);
      setHasSavedSchema(!!savedSchema);
      
      // Show saved schema prompt if schema exists and no fields are loaded
      if (savedSchema && canvasFields.length === 0) {
        setShowSavedSchemaPrompt(true);
      }
    }
  }, []);

  // Save schema to localStorage
  const saveSchemaLocally = () => {
    if (canvasFields.length === 0) {
      alert('No fields to save');
      return;
    }
    try {
      localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(canvasFields));
      setHasSavedSchema(true);
      setShowSaveSchemaModal(false);
      alert('Schema saved successfully!');
      onBack("database");
    } catch (err) {
      alert('Failed to save schema');
    }
  };

  // Load saved schema
  const loadSavedSchema = () => {
    const savedSchema = localStorage.getItem(SCHEMA_STORAGE_KEY);
    if (savedSchema) {
      try {
        const parsed = JSON.parse(savedSchema);
        setCanvasFields(parsed);
        setShowSavedSchemaPrompt(false);
      } catch (err) {
        alert('Failed to load saved schema');
      }
    }
  };

  // Delete saved schema
  const deleteSavedSchema = () => {
    if (confirm('Are you sure you want to delete the saved schema?')) {
      localStorage.removeItem(SCHEMA_STORAGE_KEY);
      setHasSavedSchema(false);
    }
  };

  // Handle back with confirmation
  const handleBackClick = () => {
    if (canvasFields.length > 0) {
      setShowBackConfirmation(true);
    } else {
      onBack('database');
    }
  };

  const confirmBackWithoutSaving = () => {
    setShowBackConfirmation(false);
    onBack('database');
  };

  const confirmBackAndSave = () => {
    setShowBackConfirmation(false);
    setShowSaveSchemaModal(true);
  };

  const handleImportJSON = (importedSchema: FieldAttributes[]) => {
    if (Array.isArray(importedSchema)) {
      setCanvasFields(importedSchema);
      setShowImportModal(false);
    } else {
      alert("Invalid schema format. Please provide a valid array of fields.");
    }
  };

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
  if (editingDatabase?.formSchema) {
    setCanvasFields(editingDatabase.formSchema);
  } else if (SelectTemplate && Array.isArray(SelectTemplate)) {
    setCanvasFields(SelectTemplate);
  }else {
    setCanvasFields([]); 
  }
}, [editingDatabase, SelectTemplate]);


  /* -------------------- DRAG END -------------------- */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId !== overId && canvasFields.some(f => f.id === activeId)) {
      setCanvasFields((fields) => {
        const oldIndex = fields.findIndex((f) => f.id === activeId);
        const newIndex = fields.findIndex((f) => f.id === overId);
        if (oldIndex === -1 || newIndex === -1) return fields;
        return arrayMove(fields, oldIndex, newIndex);
      });
      return;
    }
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
          className="h-16 flex items-center justify-between px-6 shrink-0"
          style={{ borderBottom: `1px solid ${currentTheme.border}` }}
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBackClick}
              className="flex items-center gap-2"
              style={{
                color: "#ffffff",
                backgroundColor: currentTheme.primary
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: currentTheme.text }}>
                {editingDatabase ? `Edit: ${editingDatabase.DatabaseName}` : 'Form Builder'}
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                  {canvasFields.length} fields added
                </p>
                {hasSavedSchema && !editingDatabase && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ backgroundColor: '#10b98120', color: '#10b981' }}
                  >
                    <CheckCircle size={12} />
                    Schema Saved
                  </span>
                )}
              </div>
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
              onClick={() => setShowImportModal(true)}
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
                color: currentTheme.text,
              }}
            >
              <DatabaseIcon className="w-4 h-4 mr-2" />
              Import Schema
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

            {!editingDatabase && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowSaveSchemaModal(true)}
                  disabled={canvasFields.length === 0}
                  style={{
                    backgroundColor: currentTheme.surface,
                    border: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text,
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Schema
                </Button>

                {hasSavedSchema && (
                  <Button
                    variant="outline"
                    onClick={deleteSavedSchema}
                    style={{
                      backgroundColor: currentTheme.surface,
                      border: `1px solid ${currentTheme.border}`,
                      color: '#ef4444',
                    }}
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete Saved
                  </Button>
                )}
              </>
            )}

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

        {showImportModal && (
          <ImportJSONModal
            open={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImport={handleImportJSON}
          />
        )}

        {/* SAVED SCHEMA PROMPT */}
        {showSavedSchemaPrompt && (
          <div
            className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowSavedSchemaPrompt(false)}
          >
            <Card
              className="w-96 p-6"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle size={24} style={{ color: '#10b981' }} />
                <h3 className="text-lg font-semibold" style={{ color: currentTheme.text }}>
                  Saved Schema Found
                </h3>
              </div>
              <p style={{ color: currentTheme.textSecondary }} className="mb-6">
                You have a previously saved schema. Do you want to continue with it?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSavedSchemaPrompt(false);
                    deleteSavedSchema();
                  }}
                  className="flex-1"
                  style={{
                    borderColor: '#ef4444',
                    color: '#ef4444',
                  }}
                >
                  <Trash size={16} className="mr-2" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSavedSchemaPrompt(false);
                    deleteSavedSchema();
                  }}
                  className="flex-1"
                  style={{
                    borderColor: currentTheme.border,
                    color: currentTheme.text,
                  }}
                >
                  Start Fresh
                </Button>
                <Button
                  onClick={loadSavedSchema}
                  className="flex-1"
                  style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                  }}
                >
                  <CheckCircle size={16} className="mr-2" />
                  Continue
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* BACK CONFIRMATION */}
        {showBackConfirmation && (
          <div
            className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowBackConfirmation(false)}
          >
            <Card
              className="w-96 p-6"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle size={24} style={{ color: '#f59e0b' }} />
                <h3 className="text-lg font-semibold" style={{ color: currentTheme.text }}>
                  Unsaved Fields
                </h3>
              </div>
              <p style={{ color: currentTheme.textSecondary }} className="mb-6">
                You have {canvasFields.length} fields added. Would you like to save this schema before leaving?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={confirmBackWithoutSaving}
                  className="flex-1"
                  style={{
                    borderColor: '#ef4444',
                    color: '#ef4444',
                  }}
                >
                  Leave Without Saving
                </Button>
                <Button
                  onClick={confirmBackAndSave}
                  className="flex-1"
                  style={{
                    backgroundColor: currentTheme.primary,
                    color: '#ffffff',
                  }}
                >
                  Save & Continue
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* SAVE SCHEMA MODAL */}
        {showSaveSchemaModal && (
          <div
            className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowSaveSchemaModal(false)}
          >
            <Card
              className="w-96 p-6"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <DatabaseIcon size={24} style={{ color: currentTheme.primary }} />
                <h3 className="text-lg font-semibold" style={{ color: currentTheme.text }}>
                  Save Schema
                </h3>
              </div>
              <p style={{ color: currentTheme.textSecondary }} className="mb-6">
                Save your current schema ({canvasFields.length} fields) so you can continue with it later?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSaveSchemaModal(false);
                    confirmBackWithoutSaving();
                  }}
                  className="flex-1"
                  style={{
                    borderColor: currentTheme.border,
                    color: currentTheme.text,
                  }}
                >
                  Don't Save
                </Button>
                <Button
                  onClick={() => {
                    saveSchemaLocally();
                  }}
                  className="flex-1"
                  style={{
                    backgroundColor: currentTheme.primary,
                    color: '#ffffff',
                  }}
                >
                  Save Schema
                </Button>
              </div>
            </Card>
          </div>
        )}
      </DndContext>
    </div>
  );
}