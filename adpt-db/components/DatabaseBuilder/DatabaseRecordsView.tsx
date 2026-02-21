import { useState, useMemo, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  Plus,
  Search,
  Filter,
  Download,
  X,
  Check,
  Calendar,
  ChevronLeft,
  BotMessageSquare,
  Trash2,
  FileSpreadsheet, // Added for Import UI
  Upload           // Added for Import UI
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { DatabaseFolder, FieldAttributes } from "./types";
import { motion, AnimatePresence } from "motion/react";
import ControlledFieldPreview from "./ControlledFieldPreview";
import { DatabaseRecord } from "./types";
import axios from "axios";
import { buildZodSchema } from "@/lib/validateRecord";
import { Checkbox } from "../ui/checkbox";

type DatabaseRecordsViewProps = {
  currentDatabase: DatabaseFolder | null;
  onOpenChatbot: () => void;
  onBack: () => void;
};

export default function DatabaseRecordsView({
  currentDatabase,
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
  const [records, setRecords] = useState<DatabaseRecord[]>(currentDatabase ? currentDatabase.records : []);
  const formSchema = useMemo(() => currentDatabase ? currentDatabase.formSchema : [], [currentDatabase]);
  const [formErrors, setFormErrors] = useState<Record<string, string> | {}>({});
  const [deleteRecords, setDeleteRecords] = useState<string[]>([]);
  const [bulkDelete, setBulkDelete] = useState<Boolean>(false);

  // --- New States for Import ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreviewCount, setImportPreviewCount] = useState<number>(0);
const [importData, setImportData] = useState<any[]>([]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = Object.values(record.data).some((value) =>
          String(value).toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }
      if (dateFilter) {
        const recordDate = new Date(record.createdAt).toISOString().split("T")[0];
        if (recordDate !== dateFilter) return false;
      }

      return true;
    });
  }, [records, searchQuery, dateFilter]);


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
    if (!currentDatabase) return;

    const schema = buildZodSchema(formSchema);
    const result = schema.safeParse(formData);

    if (!result.success) {
      const errors: Record<string, string> = {};

      result.error.issues.forEach((issue) => {
        const fieldKey = issue.path[0] as string;
        if (fieldKey && !errors[fieldKey]) {
          errors[fieldKey] = issue.message;
        }
      });

      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    if (editingRecord) {
      handleUpdateRecord(currentDatabase._id, editingRecord.id, formData);
    } else {
      handleAddRecord(currentDatabase._id, formData);
    }

    setShowForm(false);
    setFormData({});
    setEditingRecord(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setFormData({});
    setEditingRecord(null);
    setFormErrors({});
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

  const handleAddRecord = async (databaseId: string, data: Record<string, any>) => {
    try {
      await axios.post(`/api/databases/${databaseId}/records`, { data });
      const response = await axios.get(`/api/databases/${databaseId}/records`);
      setRecords(response.data);
    } catch (err) {
      alert("Failed to add record. Please try again.");
    }
  };

  const handleDeleteRecord = async (databaseId: string, recordId: string) => {
    try {
      await axios.delete(`/api/databases/${databaseId}/records/${recordId}`);
      const response = await axios.get(`/api/databases/${databaseId}/records`);
      setRecords(response.data);
    } catch (err) {
      alert("Failed to delete record. Please try again.");
    }
  };

  const handleSelectDelete = async () => {
    try {
      let databaseId = currentDatabase?._id;
      await axios.delete(
        `/api/databases/${databaseId}/records`,
        {
          data: { ids: deleteRecords },
        }
      );
      const response = await axios.get(
        `/api/databases/${databaseId}/records`
      );
      setRecords(response.data);
      setDeleteRecords([]);
      setSearchQuery("");
      setDateFilter("");
      setBulkDelete(false);
    } catch (err) {
      alert("Failed to delete records.");
    }
  };

  const handleDeleteAll = () => {
    setDeleteRecords(records.map((r) => r.id));
  }

  const handleChangeBulkDelete = (recordId: string) => {
    setDeleteRecords((prev) =>
      prev.includes(recordId)
        ? prev.filter((id) => id !== recordId)
        : [...prev, recordId]
    );
  };

  useEffect(() => {
    console.log(deleteRecords);
  }, [deleteRecords]);

  const handleUpdateRecord = async (databaseId: string, recordId: string, data: Record<string, any>) => {
    try {
      await axios.put(`/api/databases/${databaseId}/records/${recordId}`, { data });
      const response = await axios.get(`/api/databases/${databaseId}/records`);
      setRecords(response.data);
    } catch (err) {
      alert("Failed to update record. Please try again.");
    }
  };

  // --- Export Functionality ---
  const handleExportCSV = () => {
  const headers = [...dataFields.map(f => f.label), "Created At"].join(",");
  const rows = filteredRecords.map(r => {
    const fieldValues = dataFields.map(f => `"${String(r.data[f.id] ?? "")}"`);
    const createdAt = `"${new Date(r.createdAt).toLocaleDateString()}"`;
    
    return [...fieldValues, createdAt].join(",");
  }).join("\n");
  
  const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentDatabase?.DatabaseName || 'export'}.csv`;
  a.click();
};

  // --- Import Functionality ---
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !currentDatabase) return;

  setIsImporting(true);
  try {
    const XLSX = await import("xlsx");
    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

      const formattedRecords = jsonRows.map(row => {
        const recordData: Record<string, any> = {};
        dataFields.forEach(field => {
          const excelValue = row[field.label] || row[field.id];
          if (excelValue !== undefined) recordData[field.id] = excelValue;
        });
        return recordData;
      });

      setImportData(formattedRecords);
      setImportPreviewCount(formattedRecords.length);
    };
    reader.readAsArrayBuffer(file);
  } catch (err) {
    alert("Failed to parse file.");
  } finally {
    setIsImporting(false);
  }
};

const handleConfirmImport = async () => {
  if (!currentDatabase || importData.length === 0) return;
  setIsImporting(true);
  try {
    await axios.post(`/api/databases/${currentDatabase._id}/records/bulk`, { 
      records: importData 
    });
    const response = await axios.get(`/api/databases/${currentDatabase._id}/records`);
    setRecords(response.data);
    setShowImportModal(false);
    setImportData([]);
    setImportPreviewCount(0);
  } catch (err) {
    alert("Bulk import failed.");
  } finally {
    setIsImporting(false);
  }
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
            {currentDatabase?.DatabaseName || "Database"}
          </h1>
          <span className="text-sm" style={{ color: currentTheme.textSecondary }}>
            {filteredRecords.length} {filteredRecords.length === 1 ? "record" : "records"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Export Button */}
          <Button
            variant="outline"
            onClick={handleExportCSV}
            style={{ borderColor: currentTheme.border, color: currentTheme.text }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          {/* Import Button */}
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            style={{ borderColor: currentTheme.border, color: currentTheme.text }}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Import
          </Button>

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

        {records.length !== 0 ? bulkDelete ?
          <Button className="rounded-md"
            onClick={() => {
              handleSelectDelete();
              setBulkDelete(false);
            }}
            style={{
              backgroundColor: currentTheme.primary,
              color: "#ffffff",
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
             Delete multiple 
          </Button>
          :
          <Button className="rounded-md"
            onClick={() => setBulkDelete(true)}
            style={{
              backgroundColor: currentTheme.primary,
              color: "#ffffff",
            }}
          >
             Select multiple  
          </Button> : ""
        }

        {
          bulkDelete &&
          <Button
            onClick={() => {
              setBulkDelete(false);
              setDeleteRecords([]);
            }}
            style={{
              backgroundColor: 'red',
              color: "#ffffff",
            }}
          >
            cancel
          </Button>
        }

        {
          bulkDelete &&
          <Button
            onClick={() => {
              handleDeleteAll();
            }}
            style={{
              backgroundColor: 'red',
              color: "#ffffff",
            }}
          >
            Select All
          </Button>
        }

        <button
          onClick={onOpenChatbot}
          className="absolute right-8 w-10 h-10 rounded-lg shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-30"
          style={{
            backgroundColor: currentTheme.primary,
          }}
        >
          <BotMessageSquare className="w-6 h-6 text-white" />
        </button>
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
                      className="px-2 py-2 border-b text-sm truncate border border-white relative group hover:border-black "
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
                    className="px-2 py-2 text-left border-b text-sm truncate border border-white hover:border-black"
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
                  >
                    <td
                      className="px-4 py-3 border-b text-sm"
                      style={{
                        color: currentTheme.textSecondary,
                        borderColor: currentTheme.border,
                      }}
                    >
                      {
                        bulkDelete ?
                          <Checkbox
                            checked={deleteRecords.includes(record.id)}
                            onCheckedChange={() => handleChangeBulkDelete(record.id)}
                          />
                          :
                          index + 1
                      }

                    </td>
                    {dataFields.map((field) => (
                      <td
                        key={field.id}
                        onClick={() => handleEditRecord(record)}
                        className="px-4 py-3 border-b text-sm truncate border border-white hover:border-black"
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
                      className="px-4 py-3 border-b text-sm truncate border border-white hover:border-black"
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
                            handleDeleteRecord(currentDatabase?._id || "", record.id);
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

        {/* Import Modal Overlay */}
        {/* Updated Import Modal Overlay */}
<AnimatePresence>
  {showImportModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
      onClick={() => {
        setShowImportModal(false);
        setImportPreviewCount(0);
        setImportData([]);
      }}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="w-full max-w-2xl p-8 rounded-2xl shadow-2xl"
        style={{ backgroundColor: currentTheme.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={{ color: currentTheme.text }}>Import Records</h2>
          <Button variant="ghost" onClick={() => setShowImportModal(false)}><X /></Button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Upload Section */}
          <div 
            className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3" 
            style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.background }}
          >
            <Upload className="w-8 h-8" style={{ color: currentTheme.primary }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: currentTheme.text }}>
                {importPreviewCount > 0 ? `Selected: ${importPreviewCount} records` : "Drop Excel/CSV here"}
              </p>
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportFile} className="hidden" id="import-input" />
              <Button 
                variant="link"
                size="sm"
                onClick={() => document.getElementById('import-input')?.click()}
                style={{ color: currentTheme.primary }}
              >
                Change File
              </Button>
            </div>
          </div>

          {/* Requirements Section */}
          <div className="p-4 rounded-xl border" style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.background }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: currentTheme.text }}>Import Requirements:</h3>
            <ul className="text-xs space-y-2" style={{ color: currentTheme.textSecondary }}>
              <li className="flex gap-2"><Check className="w-3 h-3 text-green-500"/> Headers must match field labels</li>
              <li className="flex gap-2"><Check className="w-3 h-3 text-green-500"/> Supported: .xlsx, .csv</li>
              <li className="flex gap-2"><Check className="w-3 h-3 text-green-500"/> Max 500 rows per import</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-4">
          <Button 
            variant="ghost" 
            onClick={() => setShowImportModal(false)}
            style={{ color: currentTheme.text }}
          >
            Cancel
          </Button>
          <Button 
            disabled={importPreviewCount === 0 || isImporting}
            onClick={handleConfirmImport}
            style={{ 
              backgroundColor: importPreviewCount > 0 ? currentTheme.primary : currentTheme.border, 
              color: '#fff' 
            }}
          >
            {isImporting ? "Importing..." : `Confirm Import (${importPreviewCount})`}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

        {/* Form Overlay */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 p-8"
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
                        formErrors={formErrors}
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
    </div>
  );
}