import { useState, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  Plus,
  MessageSquare,
  Search,
  Filter,
  Download,
  X,
  Check,
  Calendar,
  ChevronLeft,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { FieldAttributes } from "./types";
import { motion, AnimatePresence } from "motion/react";
import ControlledFieldPreview from "./ControlledFieldPreview";

type DatabaseRecord = {
  id: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

type DatabaseRecordsViewProps = {
  databaseId: string;
  databaseName: string;
  formSchema: FieldAttributes[];
  records: DatabaseRecord[];
  onAddRecord: (data: Record<string, any>) => void;
  onUpdateRecord: (id: string, data: Record<string, any>) => void;
  onDeleteRecord: (id: string) => void;
  onOpenChatbot: () => void;
  onBack: () => void;
};

export default function DatabaseRecordsView({
  databaseId,
  databaseName,
  formSchema,
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onOpenChatbot,
  onBack,
}: DatabaseRecordsViewProps) {
  const { currentTheme } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DatabaseRecord | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  // Filter records based on search query and date filter
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = Object.values(record.data).some((value) =>
          String(value).toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Date filter
      if (dateFilter) {
        const recordDate = new Date(record.createdAt).toISOString().split("T")[0];
        if (recordDate !== dateFilter) return false;
      }

      return true;
    });
  }, [records, searchQuery, dateFilter]);

  // Get data fields (exclude display-only fields)
  const dataFields = formSchema.filter(
    (field) => field.type !== "text" && field.type !== "separator"
  );

  const handleOpenForm = () => {
    setEditingRecord(null);
    setFormData({});
    setShowForm(true);
  };

  const handleEditRecord = (record: DatabaseRecord) => {
    setEditingRecord(record);
    setFormData(record.data);
    setShowForm(true);
  };

  const handleSaveForm = () => {
    if (editingRecord) {
      onUpdateRecord(editingRecord.id, formData);
    } else {
      onAddRecord(formData);
    }
    setShowForm(false);
    setFormData({});
    setEditingRecord(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setFormData({});
    setEditingRecord(null);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const getColumnWidth = (fieldId: string) => {
    return columnWidths[fieldId] || 200;
  };

  const handleColumnResize = (fieldId: string, newWidth: number) => {
    setColumnWidths((prev) => ({ ...prev, [fieldId]: Math.max(100, newWidth) }));
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: currentTheme.background }}>
      {/* Navbar */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{
          backgroundColor: currentTheme.surface,
          borderColor: currentTheme.border,
        }}
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            style={{ color: currentTheme.text }}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="h-6 w-px" style={{ backgroundColor: currentTheme.border }} />
          <h1 className="text-xl font-bold" style={{ color: currentTheme.text }}>
            {databaseName}
          </h1>
          <span className="text-sm" style={{ color: currentTheme.textSecondary }}>
            {filteredRecords.length} {filteredRecords.length === 1 ? "record" : "records"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenForm}
            style={{
              backgroundColor: currentTheme.primary,
              color: "#ffffff",
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Data
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className="border-b px-6 py-3 flex items-center gap-4"
        style={{
          backgroundColor: currentTheme.surface,
          borderColor: currentTheme.border,
        }}
      >
        <div className="flex-1 relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
            style={{ color: currentTheme.textSecondary }}
          />
          <Input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.text,
            }}
          />
        </div>

        <div className="relative">
          <Calendar
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
            style={{ color: currentTheme.textSecondary }}
          />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-10"
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.text,
            }}
          />
        </div>

        {(searchQuery || dateFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setDateFilter("");
            }}
            style={{ color: currentTheme.textSecondary }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Table View */}
        <div className="h-full overflow-auto">
          {filteredRecords.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Card
                className="p-12 text-center"
                style={{
                  backgroundColor: currentTheme.surface,
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                <h3 className="text-xl font-semibold mb-2" style={{ color: currentTheme.text }}>
                  {searchQuery || dateFilter ? "No records found" : "No records yet"}
                </h3>
                <p className="mb-6" style={{ color: currentTheme.textSecondary }}>
                  {searchQuery || dateFilter
                    ? "Try adjusting your filters"
                    : "Click 'New Data' to create your first record"}
                </p>
              </Card>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead
                className="sticky top-0 z-10"
                style={{ backgroundColor: currentTheme.surface }}
              >
                <tr>
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold border-b"
                    style={{
                      color: currentTheme.text,
                      borderColor: currentTheme.border,
                      width: "60px",
                    }}
                  >
                    #
                  </th>
                  {dataFields.map((field) => (
                    <th
                      key={field.id}
                      className="px-4 py-3 text-left text-sm font-semibold border-b relative group"
                      style={{
                        color: currentTheme.text,
                        borderColor: currentTheme.border,
                        width: `${getColumnWidth(field.id)}px`,
                        minWidth: "100px",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{field.label}</span>
                        {/* Resize handle */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: currentTheme.primary }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const startX = e.clientX;
                            const startWidth = getColumnWidth(field.id);

                            const handleMouseMove = (e: MouseEvent) => {
                              const diff = e.clientX - startX;
                              handleColumnResize(field.id, startWidth + diff);
                            };

                            const handleMouseUp = () => {
                              document.removeEventListener("mousemove", handleMouseMove);
                              document.removeEventListener("mouseup", handleMouseUp);
                            };

                            document.addEventListener("mousemove", handleMouseMove);
                            document.addEventListener("mouseup", handleMouseUp);
                          }}
                        />
                      </div>
                    </th>
                  ))}
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold border-b"
                    style={{
                      color: currentTheme.text,
                      borderColor: currentTheme.border,
                      width: "150px",
                    }}
                  >
                    Created
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold border-b"
                    style={{
                      color: currentTheme.text,
                      borderColor: currentTheme.border,
                      width: "100px",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => (
                  <tr
                    key={record.id}
                    className="hover:bg-opacity-50 cursor-pointer"
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? currentTheme.background : currentTheme.surface,
                    }}
                    onClick={() => handleEditRecord(record)}
                  >
                    <td
                      className="px-4 py-3 border-b text-sm"
                      style={{
                        color: currentTheme.textSecondary,
                        borderColor: currentTheme.border,
                      }}
                    >
                      {index + 1}
                    </td>
                    {dataFields.map((field) => (
                      <td
                        key={field.id}
                        className="px-4 py-3 border-b text-sm truncate"
                        style={{
                          color: currentTheme.text,
                          borderColor: currentTheme.border,
                          maxWidth: `${getColumnWidth(field.id)}px`,
                        }}
                      >
                        {record.data[field.id] !== undefined && record.data[field.id] !== null
                          ? String(record.data[field.id])
                          : "-"}
                      </td>
                    ))}
                    <td
                      className="px-4 py-3 border-b text-sm"
                      style={{
                        color: currentTheme.textSecondary,
                        borderColor: currentTheme.border,
                      }}
                    >
                      {new Date(record.createdAt).toLocaleDateString()}
                    </td>
                    <td
                      className="px-4 py-3 border-b text-sm"
                      style={{
                        borderColor: currentTheme.border,
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this record?")) {
                            onDeleteRecord(record.id);
                          }
                        }}
                        style={{ color: "#ef4444" }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Form Overlay */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-8"
              onClick={handleCancelForm}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl p-8"
                style={{
                  backgroundColor: currentTheme.surface,
                  border: `1px solid ${currentTheme.border}`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Form Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: currentTheme.text }}>
                    {editingRecord ? "Edit Record" : "New Record"}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={handleCancelForm}>
                    <X className="w-5 h-5" style={{ color: currentTheme.text }} />
                  </Button>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-3 gap-6 auto-rows-min mb-8">
                  {formSchema.map((field) => (
                    <div
                      key={field.id}
                      style={{
                        gridColumn: `span ${field.span || 1}`,
                      }}
                    >
                      <ControlledFieldPreview
                        field={field}
                        value={formData[field.id]}
                        onChange={(value) => handleFieldChange(field.id, value)}
                        isEditing={false}
                      />
                    </div>
                  ))}
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCancelForm}
                    style={{
                      borderColor: currentTheme.border,
                      color: currentTheme.text,
                      backgroundColor: currentTheme.background,
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveForm}
                    style={{
                      backgroundColor: currentTheme.primary,
                      color: "#ffffff",
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {editingRecord ? "Update" : "Save"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Chatbot Button */}
      <button
        onClick={onOpenChatbot}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-30"
        style={{
          backgroundColor: currentTheme.primary,
        }}
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}