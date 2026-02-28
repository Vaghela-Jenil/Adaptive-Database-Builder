import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { X, Plus, Trash2 } from "lucide-react";
import { FieldAttributes } from "./types";
import { motion, AnimatePresence } from "motion/react";

export type ComputedColumnOperation = 
  | "average" 
  | "sum" 
  | "concatenate" 
  | "add" 
  | "subtract" 
  | "multiply" 
  | "divide"
  | "modulus";

export type ComputedColumnField = {
  id: string;
  name: string;
  operation: ComputedColumnOperation;
  sourceFields: string[]; // Field IDs to compute from
  formula?: string; // For advanced formulas
  created?: boolean;
};

type ComputedColumnPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  dataFields: FieldAttributes[];
  onCreateColumn: (column: ComputedColumnField) => Promise<void>;
  currentTheme: any;
  isCreating?: boolean;
};

export default function ComputedColumnPanel({
  isOpen,
  onClose,
  dataFields,
  onCreateColumn,
  currentTheme,
  isCreating = false,
}: ComputedColumnPanelProps) {
  const [columnName, setColumnName] = useState("");
  const [operation, setOperation] = useState<ComputedColumnOperation>("average");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [customFormula, setCustomFormula] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const numericFields = dataFields.filter(
    (field) => ["input-number", "slider"].includes(field.type)
  );

  const allFields = dataFields.filter(
    (field) => field.type !== "separator" && field.type !== "text"
  );

  const handleAddField = (fieldId: string) => {
    if (!selectedFields.includes(fieldId)) {
      setSelectedFields([...selectedFields, fieldId]);
    }
  };

  const handleRemoveField = (fieldId: string) => {
    setSelectedFields(selectedFields.filter((id) => id !== fieldId));
  };

  const handleOperationChange = (newOperation: ComputedColumnOperation) => {
    setOperation(newOperation);
    setSelectedFields([]);
    setCustomFormula("");
    setError("");
  };

  const validateInputs = (): boolean => {
    if (!columnName.trim()) {
      setError("Column name is required");
      return false;
    }

    if (columnName.length > 30) {
      setError("Column name must be less than 30 characters");
      return false;
    }

    // Check if column name already exists in fields
    if (dataFields.some((f) => f.label.toLowerCase() === columnName.toLowerCase())) {
      setError("A field with this name already exists");
      return false;
    }

    // Validate operation-specific requirements
    if (["average", "sum"].includes(operation) && selectedFields.length === 0) {
      setError(`Select at least one numeric field for ${operation}`);
      return false;
    }

    if (["add", "subtract", "multiply", "divide", "modulus"].includes(operation)) {
      if (selectedFields.length < 2) {
        setError(`Select at least 2 fields for ${operation}`);
        return false;
      }
    }

    if (operation === "concatenate" && selectedFields.length === 0) {
      setError("Select at least one field to concatenate");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError("");
    if (!validateInputs()) return;

    setIsSubmitting(true);
    try {
      const newColumn: ComputedColumnField = {
        id: `computed_${columnName.toLowerCase().replace(/\s+/g, "_")}`,
        name: columnName,
        operation,
        sourceFields: selectedFields,
        formula: customFormula || undefined,
        created: true,
      };

      await onCreateColumn(newColumn);
      // Reset form
      setColumnName("");
      setOperation("average");
      setSelectedFields([]);
      setCustomFormula("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create column");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldLabel = (fieldId: string) => {
    return dataFields.find((f) => f.id === fieldId)?.label || fieldId;
  };

  const getOperationDescription = (): string => {
    switch (operation) {
      case "average":
        return "Calculate the average of selected numeric fields";
      case "sum":
        return "Sum all selected numeric fields";
      case "concatenate":
        return "Combine text from selected fields";
      case "add":
        return "Add two or more numeric values";
      case "subtract":
        return "Subtract values in sequence";
      case "multiply":
        return "Multiply numeric values";
      case "divide":
        return "Divide values in sequence";
      case "modulus":
        return "Calculate remainder of division";
      default:
        return "";
    }
  };

  if (!isOpen) return null;

  const availableFields =
    operation === "concatenate" ? allFields : numericFields;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
          style={{ backgroundColor: currentTheme.surface }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: currentTheme.text }}>
              Create Computed Column
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{ backgroundColor: "#ef4444", color: "#ffffff" }}
            >
              {error}
            </div>
          )}

          {/* Column Name */}
          <div className="mb-6">
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: currentTheme.text }}
            >
              Column Name *
            </label>
            <Input
              type="text"
              placeholder="e.g., Total Cost, Average Price"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
              }}
            />
            <p className="text-xs mt-1" style={{ color: currentTheme.textSecondary }}>
              Max 30 characters
            </p>
          </div>

          {/* Operation Type */}
          <div className="mb-6">
            <label
              className="block text-sm font-medium mb-3"
              style={{ color: currentTheme.text }}
            >
              Operation Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(
                [
                  "average",
                  "sum",
                  "add",
                  "subtract",
                  "multiply",
                  "divide",
                  "modulus",
                  "concatenate",
                ] as ComputedColumnOperation[]
              ).map((op) => (
                <button
                  key={op}
                  onClick={() => handleOperationChange(op)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize border"
                  style={{
                    backgroundColor:
                      operation === op
                        ? currentTheme.primary
                        : currentTheme.background,
                    color:
                      operation === op ? "#ffffff" : currentTheme.text,
                    borderColor:
                      operation === op
                        ? currentTheme.primary
                        : currentTheme.border,
                  }}
                >
                  {op}
                </button>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: currentTheme.textSecondary }}>
              {getOperationDescription()}
            </p>
          </div>

          {/* Field Selection */}
          <div className="mb-6">
            <label
              className="block text-sm font-medium mb-3"
              style={{ color: currentTheme.text }}
            >
              Select Fields * ({selectedFields.length} selected)
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {availableFields.map((field) => (
                <button
                  key={field.id}
                  onClick={() => handleAddField(field.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-left border ${
                    selectedFields.includes(field.id)
                      ? "opacity-100"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor:
                      selectedFields.includes(field.id)
                        ? `${currentTheme.primary}20`
                        : currentTheme.background,
                    color: currentTheme.text,
                    borderColor: selectedFields.includes(field.id)
                      ? currentTheme.primary
                      : currentTheme.border,
                  }}
                >
                  <div className="truncate">{field.label}</div>
                </button>
              ))}
            </div>

            {/* Selected Fields Chips */}
            {selectedFields.length > 0 && (
              <div className="p-3 rounded-lg border mb-4" style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.background }}>
                <p className="text-xs mb-2" style={{ color: currentTheme.textSecondary }}>
                  Selected Fields (in order):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedFields.map((fieldId, index) => (
                    <div
                      key={fieldId}
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                      style={{ backgroundColor: currentTheme.primary, color: "#ffffff" }}
                    >
                      <span>
                        {index + 1}. {getFieldLabel(fieldId)}
                      </span>
                      <button
                        onClick={() => handleRemoveField(fieldId)}
                        className="ml-1 hover:opacity-70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom Formula (Optional) */}
          {["add", "subtract", "multiply", "divide"].includes(operation) && (
            <div className="mb-6">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: currentTheme.text }}
              >
                Custom Formula (Optional)
              </label>
              <p className="text-xs mb-2" style={{ color: currentTheme.textSecondary }}>
                Use field numbers (1, 2, 3...) in order of selection. E.g., "(1 + 2) * 3"
              </p>
              <Input
                type="text"
                placeholder="e.g., (1 + 2) / 3"
                value={customFormula}
                onChange={(e) => setCustomFormula(e.target.value)}
                style={{
                  backgroundColor: currentTheme.background,
                  color: currentTheme.text,
                  border: `1px solid ${currentTheme.border}`,
                }}
              />
            </div>
          )}

          {/* Info Card */}
          <Card
            className="mb-6 p-4"
            style={{
              backgroundColor: `${currentTheme.primary}10`,
              border: `1px solid ${currentTheme.primary}40`,
            }}
          >
            <p className="text-sm" style={{ color: currentTheme.text }}>
              ℹ️ Computed columns will be automatically calculated for all existing records
              and any new records created. The calculation will happen each time data is updated.
            </p>
          </Card>

          {/* Footer */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                borderColor: currentTheme.border,
                color: currentTheme.text,
                backgroundColor: currentTheme.background,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !columnName.trim()}
              style={{
                backgroundColor:
                  isSubmitting || !columnName.trim()
                    ? currentTheme.border
                    : currentTheme.primary,
                color: "#ffffff",
              }}
            >
              {isSubmitting ? "Creating..." : "Create Column"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
