import { useState, useMemo, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  Plus,
  Search,
  Download,
  X,
  Check,
  Calendar,
  ChevronLeft,
  BotMessageSquare,
  Trash2,
  FileSpreadsheet, // Added for Import UI
  Upload,           // Added for Import UI
  RefreshCcw
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
import { useInView } from "react-intersection-observer";
import { record } from "zod";
import { TableRowSkeleton } from "../Loaders";
type DatabaseRecordsViewProps = {
  currentDatabase: DatabaseFolder;
  onOpenChatbot: () => void;
  onBack: () => void;
};

type ReplenishmentRecommendation = {
  sku: string;
  name?: string;
  action: "order_now" | "order_soon" | "healthy" | "overstock";
  urgencyScore: number;
  recommendedOrderQty: number;
  predictedDailySales: number;
  predictedHorizonDemand: number;
  daysUntilStockout: number;
  projectedStockAtHorizon: number;
  leadTimeDays: number;
  safetyStockUnits: number;
  explanation: string;
};

type ReplenishmentResponse = {
  generatedAt: string;
  forecastDays: number;
  summary: {
    totalSkus: number;
    orderNowCount: number;
    orderSoonCount: number;
    healthyCount: number;
    overstockCount: number;
    totalRecommendedUnits: number;
  };
  recommendations: ReplenishmentRecommendation[];
  warnings: string[];
  meta: {
    databaseId: string;
    totalRecords: number;
    validRecordsUsed: number;
  };
};

const suggestFieldId = (fields: FieldAttributes[], keywords: string[]) => {
  const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase());
  const match = fields.find((field) => {
    const source = `${field.id} ${field.label}`.toLowerCase();
    return normalizedKeywords.some((keyword) => source.includes(keyword));
  });
  return match?.id || "";
};

const getActionBadgeStyles = (
  action: ReplenishmentRecommendation["action"]
) => {
  if (action === "order_now") {
    return { background: "#ef4444", color: "#ffffff", label: "Order Now" };
  }
  if (action === "order_soon") {
    return { background: "#f59e0b", color: "#ffffff", label: "Order Soon" };
  }
  if (action === "overstock") {
    return { background: "#0ea5e9", color: "#ffffff", label: "Overstock" };
  }
  return { background: "#10b981", color: "#ffffff", label: "Healthy" };
};

export default function DatabaseRecordsView({
  currentDatabase,
  onOpenChatbot,
  onBack,
}: DatabaseRecordsViewProps) {
  const { currentTheme } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DatabaseRecord | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [records, setRecords] = useState<DatabaseRecord[]>([]);
  const formSchema = useMemo(() => currentDatabase ? currentDatabase.formSchema : [], [currentDatabase]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteRecords, setDeleteRecords] = useState<string[]>([]);
  const [bulkDelete, setBulkDelete] = useState<boolean>(false);

  //pagination
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();

  // --- New States for Import ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreviewCount, setImportPreviewCount] = useState<number>(0);
  const [importData, setImportData] = useState<Record<string, unknown>[]>([]);
  const [showRecommender, setShowRecommender] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");
  const [recommendationResult, setRecommendationResult] = useState<ReplenishmentResponse | null>(null);
  const [forecastDays, setForecastDays] = useState(14);
  const [topNRecommendations, setTopNRecommendations] = useState(20);
  const [autoRefreshRecommendations, setAutoRefreshRecommendations] = useState(false);
  const [recommenderFieldMap, setRecommenderFieldMap] = useState({
    stockFieldId: "",
    salesHistoryFieldId: "",
    skuFieldId: "",
    nameFieldId: "",
    reorderPointFieldId: "",
    leadTimeDaysFieldId: "",
    safetyStockDaysFieldId: "",
    incomingReplenishmentFieldId: "",
  });

  // Effect A: When Filters change, reset to page 1
  useEffect(() => {
    setRecords([]);
    setHasMore(true);
    setPage(1);
    loadMoreRecords(1, true); // Force a page 1 fetch immediately
  }, [searchQuery, dateFilter]);

  // Effect B: When the scroll trigger hits (Page changes)
  // ONLY trigger this if page is greater than 1
  useEffect(() => {
    if (page > 1) {
      loadMoreRecords(page);
    }
  }, [page]);

  // Effect C: The Intersection Observer
  useEffect(() => {
    if (inView && hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  }, [inView, hasMore, loading]);

  const loadMoreRecords = async (targetPage?: number, isRefresh: boolean = false) => {
    const pageToFetch = targetPage !== undefined ? targetPage : page;

    // Guard: Don't fetch if already loading or no more data (unless refreshing)
    if (loading || (!hasMore && !isRefresh)) return;

    try {
      const res = await axios.get(`/api/databases/${currentDatabase._id}/records`, {
        params: {
          page: pageToFetch,
          limit: 10,
          search: searchQuery || "",
          date: dateFilter || "",
          _t: Date.now() // Busts browser cache
        }
      });

      const { records: newItems, totalCount } = res.data;

      setRecords((prev) => {
        let updatedRecords;
        if (pageToFetch === 1 || isRefresh) {
          updatedRecords = newItems;
        } else {
          const existingIds = new Set(prev.map((r) => r.id));
          const uniqueItems = newItems.filter((item: any) => !existingIds.has(item.id));
          updatedRecords = [...prev, ...uniqueItems];
        }

        // Update hasMore based on the newly calculated list
        setHasMore(updatedRecords.length < totalCount);
        return updatedRecords;
      });

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 600)
  }, []);

  const dataFields = formSchema.filter(
    (field) => field.type !== "text" && field.type !== "separator"
  );

  const recommenderfields = useMemo(() => {
    if (!dataFields.length) return;

    setRecommenderFieldMap((prev) => ({
      stockFieldId:
        prev.stockFieldId || suggestFieldId(dataFields, ["stock", "inventory", "qty", "quantity", "onhand"]),
      salesHistoryFieldId:
        prev.salesHistoryFieldId ||
        suggestFieldId(dataFields, ["saleshistory", "sales_history", "sales", "dailysales", "demand"]),
      skuFieldId: prev.skuFieldId || suggestFieldId(dataFields, ["sku", "code", "itemid"]),
      nameFieldId: prev.nameFieldId || suggestFieldId(dataFields, ["name", "product", "item"]),
      reorderPointFieldId:
        prev.reorderPointFieldId || suggestFieldId(dataFields, ["reorder", "reorderpoint", "threshold"]),
      leadTimeDaysFieldId:
        prev.leadTimeDaysFieldId || suggestFieldId(dataFields, ["leadtime", "lead_time"]),
      safetyStockDaysFieldId:
        prev.safetyStockDaysFieldId || suggestFieldId(dataFields, ["safety", "safetystock"]),
      incomingReplenishmentFieldId:
        prev.incomingReplenishmentFieldId ||
        suggestFieldId(dataFields, ["incoming", "replenishment", "restock", "inbound"]),
    }));
  }, [dataFields.length]);

  useEffect(() => {
    recommenderfields;
  }, [dataFields]);

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

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const getColumnWidth = (fieldId: string) => {
    return columnWidths[fieldId] || 200;
  };

  const handleColumnResize = (fieldId: string, newWidth: number) => {
    setColumnWidths((prev) => ({ ...prev, [fieldId]: Math.max(100, newWidth) }));
  };

  const handleAddRecord = async (databaseId: string, data: Record<string, unknown>) => {
    try {
      await axios.post(`/api/databases/${databaseId}/records`, { data });
      const response = await axios.get(`/api/databases/${databaseId}/records`);
      // setRecords(response.data);
      setPage(1);
      setHasMore(true);
      await loadMoreRecords(1, true);
    } catch {
      alert("Failed to add record. Please try again.");
    }
  };

  const handleDeleteRecord = async (databaseId: string, recordId: string) => {
    try {
      await axios.delete(`/api/databases/${databaseId}/records/${recordId}`);
      const response = await axios.get(`/api/databases/${databaseId}/records`);
      setRecords([]);      // Wipe the local array
      setPage(1);
      setHasMore(true);
      await loadMoreRecords(1, true);
    } catch {
      alert("Failed to delete record. Please try again.");
    }
  };

  const handleSelectDelete = async () => {
    if (!confirm("Are you absolutely sure? This will wipe ALL records which selected in this database.")) return;
    try {
      const databaseId = currentDatabase?._id;
      await axios.delete(
        `/api/databases/${databaseId}/records`,
        {
          data: { ids: deleteRecords },
        }
      );
      const response = await axios.get(
        `/api/databases/${databaseId}/records`
      );
      // setRecords(response.data);
      setDeleteRecords([]);
      setSearchQuery("");
      setDateFilter("");
      setBulkDelete(false);
      setPage(1);
      setHasMore(true);
      await loadMoreRecords(1, true);
    } catch {
      alert("Failed to delete records.");
    }
  };

  const handleClearAllRecords = async () => {
    // 1. Calculate IDs immediately
    const allIds = records.map((r) => r.id);

    if (allIds.length === 0) {
      alert("No records to delete!");
      return;
    }

    if (confirm("Are you absolutely sure? This will wipe ALL records in this database.")) {
      try {
        // 2. Use the local constant 'allIds' instead of the state 'deleteRecords'
        await axios.delete(`/api/databases/${currentDatabase._id}/records/bulk`, {
          data: { ids: allIds },
        });

        // 3. Clear UI state
        setRecords([]);
        setDeleteRecords([]);
        setBulkDelete(false);
        setPage(1);
        setHasMore(true);

        alert("Database cleared!");

        // Reload to sync with server
        await loadMoreRecords(1, true);
      } catch (err) {
        console.error("Failed to clear records", err);
        alert("An error occurred while clearing the database.");
      }
    }
  };


  const handleChangeBulkDelete = (recordId: string) => {
    setDeleteRecords((prev) =>
      prev.includes(recordId)
        ? prev.filter((id) => id !== recordId)
        : [...prev, recordId]
    );
  };

  const handleUpdateRecord = async (databaseId: string, recordId: string, data: Record<string, unknown>) => {
    try {
      await axios.put(`/api/databases/${databaseId}/records/${recordId}`, { data });
      const response = await axios.get(`/api/databases/${databaseId}/records`);
      // setRecords(response.data);
      setPage(1);
      setHasMore(true);
      await loadMoreRecords(1, true);
    } catch {
      alert("Failed to update record. Please try again.");
    }
  };

  const fetchRecommendations = useCallback(async () => {
    if (!currentDatabase) return;

    if (!recommenderFieldMap.stockFieldId || !recommenderFieldMap.salesHistoryFieldId) {
      setRecommendationError("Please select Stock field and Sales History field.");
      return;
    }

    setIsLoadingRecommendations(true);
    setRecommendationError("");

    try {
      const response = await axios.post<ReplenishmentResponse>(
        `/api/databases/${currentDatabase._id}/recommendations/replenishment`,
        {
          stockFieldId: recommenderFieldMap.stockFieldId,
          salesHistoryFieldId: recommenderFieldMap.salesHistoryFieldId,
          skuFieldId: recommenderFieldMap.skuFieldId || undefined,
          nameFieldId: recommenderFieldMap.nameFieldId || undefined,
          reorderPointFieldId: recommenderFieldMap.reorderPointFieldId || undefined,
          leadTimeDaysFieldId: recommenderFieldMap.leadTimeDaysFieldId || undefined,
          safetyStockDaysFieldId: recommenderFieldMap.safetyStockDaysFieldId || undefined,
          incomingReplenishmentFieldId:
            recommenderFieldMap.incomingReplenishmentFieldId || undefined,
          forecastDays,
          topN: topNRecommendations,
        }
      );
      setRecommendationResult(response.data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      const message =
        axiosError?.response?.data?.error || "Failed to load recommendations.";
      setRecommendationError(message);
      setRecommendationResult(null);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [currentDatabase, recommenderFieldMap, forecastDays, topNRecommendations]);

  useEffect(() => {
    if (!showRecommender || !autoRefreshRecommendations || !currentDatabase) return;

    const interval = setInterval(() => {
      fetchRecommendations();
    }, 60000);

    return () => clearInterval(interval);
  }, [showRecommender, autoRefreshRecommendations, currentDatabase, fetchRecommendations]);

  // --- Export Functionality ---
  const handleExportCSV = () => {
    const headers = [...dataFields.map(f => f.label), "Created At"].join(",");
    const rows = records.map(r => {
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
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);

          // ✅ Ensure dates are parsed correctly
          const workbook = XLSX.read(data, {
            type: "array",
            cellDates: true
          });

          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];

          // ✅ Add raw:false
          const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(
            sheet,
            {
              defval: null,
              raw: false
            }
          );

          console.log("Parsed rows:", jsonRows);

          if (jsonRows.length === 0) {
            alert("The uploaded file is empty.");
            return;
          }

          const formattedRecords = jsonRows.map((row) => {
            const recordData: Record<string, any> = {};

            const normalizedRow: Record<string, any> = {};
            Object.keys(row).forEach((key) => {
              normalizedRow[key.toLowerCase().trim()] = row[key];
            });

            dataFields.forEach((field) => {
              const labelKey = field.label.toLowerCase().trim();
              const idKey = field.id.toLowerCase().trim();

              let excelValue =
                normalizedRow[labelKey] ?? normalizedRow[idKey];

              if (excelValue !== undefined && excelValue !== null) {

                // ✅ If it's already a Date object
                if (excelValue instanceof Date) {
                  recordData[field.id] = excelValue.toISOString();
                }

                // ✅ If it's Excel serial number
                else if (typeof excelValue === "number") {
                  const parsedDate = XLSX.SSF.parse_date_code(excelValue);
                  if (parsedDate) {
                    const jsDate = new Date(
                      parsedDate.y,
                      parsedDate.m - 1,
                      parsedDate.d
                    );
                    recordData[field.id] = jsDate.toISOString();
                  } else {
                    recordData[field.id] = excelValue;
                  }
                }

                // ✅ If it's string date (DD-MM-YYYY)
                else if (
                  typeof excelValue === "string" &&
                  /^\d{2}-\d{2}-\d{4}$/.test(excelValue)
                ) {
                  const [day, month, year] = excelValue.split("-");
                  const jsDate = new Date(`${year}-${month}-${day}`);
                  recordData[field.id] = jsDate.toISOString();
                }

                else {
                  recordData[field.id] = excelValue;
                }
              }
            });

            return recordData;
          });

          setImportData(formattedRecords);
          setImportPreviewCount(formattedRecords.length);
          e.target.value = "";

        } catch (innerError) {
          console.error("Processing Error:", innerError);
          alert("Error processing the Excel data. Please check the file format.");
        }
      };

      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error("Import Error:", error);
      alert("Failed to load the import library.");
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
      // setRecords(response.data);
      setShowImportModal(false);
      // setRecords(prev => [...records, ...prev]);
      setImportData([]);
      setImportPreviewCount(0);
      setPage(1);
      setHasMore(true);
      await loadMoreRecords(1, true);
    } catch {
      alert("Bulk import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: currentTheme.background }}>
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
            style={{
              backgroundColor: currentTheme.primary,
              color: "#ffffff",
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <div className="h-6 w-px" style={{ backgroundColor: currentTheme.border }} />
          <h1 className="text-xl font-bold" style={{ color: currentTheme.text }}>
            {currentDatabase?.DatabaseName || "Database"}
          </h1>
          <span className="text-sm" style={{ color: currentTheme.textSecondary }}>
            {currentDatabase.recordCount} {currentDatabase.recordCount === 1 ? "record" : "records"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Export Button */}
          <Button
            variant="outline"
            onClick={handleExportCSV}
            style={{
              backgroundColor: currentTheme.primary,
             color: currentTheme.text,
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          {/* Import Button */}
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            style={{
              backgroundColor: currentTheme.primary,
              color: currentTheme.text,
            }}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Import
          </Button>

          <Button
            onClick={handleOpenForm}
            style={{
              backgroundColor: currentTheme.primary,
              color: currentTheme.text,
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
            style={{ color: currentTheme.text, background: currentTheme.primary }}
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
              color: currentTheme.text
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
            onClick={() => handleClearAllRecords()}
            style={{
              backgroundColor: 'red',
              color: "#ffffff",
            }}
          >
            Delete All
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

      {/* Recommender Panel */}
      <div
        className="border-b px-6 py-4"
        style={{
          backgroundColor: currentTheme.surface,
          borderColor: currentTheme.border,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold" style={{ color: currentTheme.text }}>
              Dynamic Replenishment Recommender
            </h3>
            <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
              Real-time stock guidance using future sales prediction.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRecommender((prev) => !prev)}
              style={{
              backgroundColor: currentTheme.primary,
             color: currentTheme.text
            }}
            >
              {showRecommender ? "Hide Panel" : "Show Panel"}
            </Button>
            <Button
              size="sm"
              onClick={fetchRecommendations}
              disabled={isLoadingRecommendations}
              style={{ backgroundColor: currentTheme.primary, color: currentTheme.text }}
            >
              {isLoadingRecommendations ? "Refreshing..." : "Refresh Recommendations"}
            </Button>
          </div>
        </div>

        {showRecommender && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <p className="text-xs mb-1" style={{ color: currentTheme.textSecondary }}>Stock Field *</p>
                <select
                  value={recommenderFieldMap.stockFieldId}
                  onChange={(e) =>
                    setRecommenderFieldMap((prev) => ({ ...prev, stockFieldId: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{
                    backgroundColor: currentTheme.background,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <option value="">Select field</option>
                  {dataFields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: currentTheme.textSecondary }}>Sales History Field *</p>
                <select
                  value={recommenderFieldMap.salesHistoryFieldId}
                  onChange={(e) =>
                    setRecommenderFieldMap((prev) => ({ ...prev, salesHistoryFieldId: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{
                    backgroundColor: currentTheme.background,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <option value="">Select field</option>
                  {dataFields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: currentTheme.textSecondary }}>SKU Field</p>
                <select
                  value={recommenderFieldMap.skuFieldId}
                  onChange={(e) =>
                    setRecommenderFieldMap((prev) => ({ ...prev, skuFieldId: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{
                    backgroundColor: currentTheme.background,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <option value="">(Optional)</option>
                  {dataFields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label} 
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: currentTheme.textSecondary }}>Product Name Field</p>
                <select
                  value={recommenderFieldMap.nameFieldId}
                  onChange={(e) =>
                    setRecommenderFieldMap((prev) => ({ ...prev, nameFieldId: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{
                    backgroundColor: currentTheme.background,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <option value="">(Optional)</option>
                  {dataFields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label} 
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: currentTheme.textSecondary }}>Forecast Days</p>
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={forecastDays}
                  onChange={(e) => setForecastDays(Math.max(1, Number(e.target.value) || 14))}
                  style={{
                    backgroundColor: currentTheme.background,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                />
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: currentTheme.textSecondary }}>Top Recommendations</p>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={topNRecommendations}
                  onChange={(e) => setTopNRecommendations(Math.max(1, Number(e.target.value) || 20))}
                  style={{
                    backgroundColor: currentTheme.background,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                />
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: currentTheme.textSecondary }}>Lead Time Field</p>
                <select
                  value={recommenderFieldMap.leadTimeDaysFieldId}
                  onChange={(e) =>
                    setRecommenderFieldMap((prev) => ({ ...prev, leadTimeDaysFieldId: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{
                    backgroundColor: currentTheme.background,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <option value="">(Optional)</option>
                  {dataFields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: currentTheme.textSecondary }}>Auto Refresh (60s)</p>
                <div className="h-10 rounded-md px-3 flex items-center" style={{ border: `1px solid ${currentTheme.border}` }}>
                  <Checkbox
                    checked={autoRefreshRecommendations}
                    onCheckedChange={(checked) => setAutoRefreshRecommendations(Boolean(checked))}
                  />
                  <span className="text-xs ml-2" style={{ color: currentTheme.textSecondary }}>
                    Keep recommendations live
                  </span>
                </div>
              </div>
            </div>

            {recommendationError && (
              <p className="text-sm" style={{ color: "#ef4444" }}>
                {recommendationError}
              </p>
            )}

            {recommendationResult && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Card className="p-3" style={{ border: `1px solid ${currentTheme.border}` }}>
                    <p className="text-xs" style={{ color: currentTheme.textSecondary }}>Order Now</p>
                    <p className="text-xl font-bold" style={{ color: "#ef4444" }}>
                      {recommendationResult.summary.orderNowCount}
                    </p>
                  </Card>
                  <Card className="p-3" style={{ border: `1px solid ${currentTheme.border}` }}>
                    <p className="text-xs" style={{ color: currentTheme.textSecondary }}>Order Soon</p>
                    <p className="text-xl font-bold" style={{ color: "#f59e0b" }}>
                      {recommendationResult.summary.orderSoonCount}
                    </p>
                  </Card>
                  <Card className="p-3" style={{ border: `1px solid ${currentTheme.border}` }}>
                    <p className="text-xs" style={{ color: currentTheme.textSecondary }}>Healthy</p>
                    <p className="text-xl font-bold" style={{ color: "#10b981" }}>
                      {recommendationResult.summary.healthyCount}
                    </p>
                  </Card>
                  <Card className="p-3" style={{ border: `1px solid ${currentTheme.border}` }}>
                    <p className="text-xs" style={{ color: currentTheme.textSecondary }}>Overstock</p>
                    <p className="text-xl font-bold" style={{ color: "#0ea5e9" }}>
                      {recommendationResult.summary.overstockCount}
                    </p>
                  </Card>
                  <Card className="p-3" style={{ border: `1px solid ${currentTheme.border}` }}>
                    <p className="text-xs" style={{ color: currentTheme.textSecondary }}>Recommended Units</p>
                    <p className="text-xl font-bold" style={{ color: currentTheme.text }}>
                      {recommendationResult.summary.totalRecommendedUnits}
                    </p>
                  </Card>
                </div>

                <div className="max-h-72 overflow-auto grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {recommendationResult.recommendations.map((recommendation) => {
                    const badge = getActionBadgeStyles(recommendation.action);
                    return (
                      <Card
                        key={`${recommendation.sku}-${recommendation.urgencyScore}`}
                        className="p-4"
                        style={{ border: `1px solid ${currentTheme.border}` }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-semibold" style={{ color: currentTheme.text }}>
                              {recommendation.name || recommendation.sku}
                            </p>
                            <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                              SKU: {recommendation.sku}
                            </p>
                          </div>
                          <span
                            className="text-xs px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: badge.background,
                              color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <p style={{ color: currentTheme.textSecondary }}>
                            Urgency: <span style={{ color: currentTheme.text }}>{recommendation.urgencyScore}</span>
                          </p>
                          <p style={{ color: currentTheme.textSecondary }}>
                            Order Qty: <span style={{ color: currentTheme.text }}>{recommendation.recommendedOrderQty}</span>
                          </p>
                          <p style={{ color: currentTheme.textSecondary }}>
                            Daily Sales: <span style={{ color: currentTheme.text }}>{recommendation.predictedDailySales}</span>
                          </p>
                          <p style={{ color: currentTheme.textSecondary }}>
                            Stockout (days): <span style={{ color: currentTheme.text }}>{recommendation.daysUntilStockout}</span>
                          </p>
                        </div>

                        <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                          {recommendation.explanation}
                        </p>
                      </Card>
                    );
                  })}
                </div>

                {recommendationResult.warnings.length > 0 && (
                  <Card className="p-3" style={{ border: `1px solid ${currentTheme.border}` }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: currentTheme.text }}>
                      Data Warnings
                    </p>
                    <div className="max-h-24 overflow-auto space-y-1">
                      {recommendationResult.warnings.map((warning) => (
                        <p key={warning} className="text-xs" style={{ color: currentTheme.textSecondary }}>
                          {warning}
                        </p>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Table View */}
        <div className="h-full overflow-auto">
          {
            loading ?
              [...Array(10)].map((_, i) => (
                <TableRowSkeleton key={i} fieldCount={dataFields.length} />
              ))
              :
              records.length === 0 ? (
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
              ) :
                (
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
                      {records.map((record, index) => (
                        <tr
                          key={`${record.id}-${index}`}
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
                      <tr ref={ref}>
                        <td colSpan={dataFields.length + 3} className="py-8">
                          <div className="flex flex-col items-center justify-center gap-4">

                            {/* 1. The Record Counter Status */}
                            {records.length > 0 && (
                              <div
                                className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                                style={{
                                  backgroundColor: `${currentTheme.primary}10`, // 10% opacity
                                  borderColor: `${currentTheme.primary}30`,
                                  color: currentTheme.primary
                                }}
                              >
                                Showing {records.length} of  Records
                              </div>
                            )}

                            {/* 2. Loading Spinner */}
                            {loading && records.length > 0 ? (
                              <div className="flex flex-col items-center gap-2">
                                <div
                                  className="w-6 h-6 border-2 border-t-transparent animate-spin rounded-full"
                                  style={{ borderColor: currentTheme.primary }}
                                />
                                <span className="text-xs font-medium" style={{ color: currentTheme.textSecondary }}>
                                  Loading more...
                                </span>
                              </div>
                            ) : null}

                            {/* 3. End of Database Message */}
                            {!hasMore && records.length > 0 && !loading ? (
                              <div
                                className="flex items-center gap-2 text-xs opacity-40 py-2 italic"
                                style={{ color: currentTheme.textSecondary }}
                              >
                                <div className="h-px w-8 bg-current opacity-20" />
                                End of database
                                <div className="h-px w-8 bg-current opacity-20" />
                              </div>
                            ) : null}

                          </div>
                        </td>
                      </tr>
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
                      <li className="flex gap-2"><Check className="w-3 h-3 text-green-500" /> Headers must match field labels</li>
                      <li className="flex gap-2"><Check className="w-3 h-3 text-green-500" /> Supported: .xlsx, .csv</li>
                      <li className="flex gap-2"><Check className="w-3 h-3 text-green-500" /> Max 500 rows per import</li>
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
              // CHANGED: items-start and overflow-y-auto allows the whole modal to scroll if needed
              className="absolute inset-0 bg-black/50 flex justify-center items-start z-20 overflow-y-auto p-4 md:p-8"
              onClick={handleCancelForm}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                // CHANGED: flex flex-col and max-h remove the hard scroll on the whole box
                className="w-full max-w-4xl rounded-2xl flex flex-col my-auto"
                style={{
                  backgroundColor: currentTheme.surface,
                  border: `1px solid ${currentTheme.border}`,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Sticky Header */}
                <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: currentTheme.border }}>
                  <h2 className="text-2xl font-bold" style={{ color: currentTheme.text }}>
                    {editingRecord ? "Edit Record" : "New Record"}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={handleCancelForm}>
                    <X className="w-5 h-5" style={{ color: currentTheme.text }} />
                  </Button>
                </div>

                {/* Scrollable Content */}
                <div className="p-8 overflow-y-auto max-h-[60vh]">
                  <div className="grid grid-cols-3 gap-6 auto-rows-min">
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
                </div>

                {/* Sticky Footer - Always Visible */}
                <div className="p-6 border-t flex items-center justify-end gap-3"
                  style={{
                    borderColor: currentTheme.border,
                    backgroundColor: currentTheme.surface, // Matches modal bg
                    borderBottomLeftRadius: '1rem',
                    borderBottomRightRadius: '1rem'
                  }}>
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
