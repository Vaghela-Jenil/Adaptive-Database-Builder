import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  Minimize2,
  Maximize2,
  BarChart3Icon,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Menu,
  ShoppingCart,
  PackageX,
  FileText,
  History,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { DatabaseFolder, FieldAttributes } from "./types";
import { motion, AnimatePresence } from "motion/react";
import ControlledFieldPreview from "./ControlledFieldPreview";
import { showToast } from "@/lib/toast";
import { ToastContainer } from "react-toastify";
import { DatabaseRecord } from "./types";
import axios from "axios";
import { buildZodSchema } from "@/lib/validateRecord";
import { Checkbox } from "../ui/checkbox";
import { useInView } from "react-intersection-observer";
import { record } from "zod";
import { TableRowSkeleton } from "../Loaders";
import ComputedColumnPanel, { ComputedColumnField } from "./ComputedColumnPanel";
import { computeColumnValue, validateComputedColumn } from "@/lib/computedColumns";
import SellStocks, { InvoiceData } from "./SellStocks";
import OutOfStockItems, { OutOfStockItem } from "./OutOfStockItems";
import GeneratedInvoices from "./GeneratedInvoices";
import SalesHistoryTracker from "./SalesHistoryTracker";
import {
  extractTemporaryUploadedFileAssets,
  extractUploadedFileAssets,
  sanitizeRecordFileData,
} from "@/lib/uploadedFiles";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type UndoAction = {
  type: 'add' | 'update' | 'delete' | 'bulkDelete';
  timestamp: number;
  recordId?: string;
  recordIds?: string[];
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  oldRecords?: DatabaseRecord[];
};

type DatabaseRecordsViewProps = {
  currentDatabase: DatabaseFolder;
  userRole?: "Admin" | "Editor" | "Viewer";
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

const AUTO_SALES_HISTORY_OPTION = "__auto_invoice_sales_history__";

type AnalyticsVisual = "bar" | "line" | "pie";

const parseNumericValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    if (!normalized) return null;
    const converted = Number(normalized);
    return Number.isFinite(converted) ? converted : null;
  }
  return null;
};

const compareValues = (a: unknown, b: unknown, order: 'asc' | 'desc'): number => {
  // Handle null/undefined
  if (a == null && b == null) return 0;
  if (a == null) return order === 'asc' ? 1 : -1;
  if (b == null) return order === 'asc' ? -1 : 1;

  // Try numeric comparison
  const numA = parseNumericValue(a);
  const numB = parseNumericValue(b);

  if (numA !== null && numB !== null) {
    const result = numA - numB;
    return order === 'asc' ? result : -result;
  }

  // String comparison
  const strA = String(a).toLowerCase();
  const strB = String(b).toLowerCase();

  if (strA < strB) return order === 'asc' ? -1 : 1;
  if (strA > strB) return order === 'asc' ? 1 : -1;
  return 0;
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
  userRole,
  onOpenChatbot,
  onBack,
}: DatabaseRecordsViewProps) {
  const { currentTheme } = useTheme();
  const isViewer = userRole === "Viewer";
  const isAdmin = userRole === "Admin";
  const canEdit = !isViewer;
  const canDelete = isAdmin;
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DatabaseRecord | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [dateFilterType, setDateFilterType] = useState<"" | "last-day" | "last-week" | "last-month" | "custom">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilterDropdown, setShowDateFilterDropdown] = useState(false);
  const dateFilterRef = useRef<HTMLDivElement>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [records, setRecords] = useState<DatabaseRecord[]>([]);
  const formSchema = useMemo(() => currentDatabase ? currentDatabase.formSchema : [], [currentDatabase]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteRecords, setDeleteRecords] = useState<string[]>([]);
  const [bulkDelete, setBulkDelete] = useState<boolean>(false);

  // Sorting
  const [sortConfig, setSortConfig] = useState<{
    fieldId: string;
    order: 'asc' | 'desc';
  } | null>(null);
  const [openSortMenuId, setOpenSortMenuId] = useState<string | null>(null);
  const [hoveredHeaderId, setHoveredHeaderId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const sortButtonRefs = useRef<Record<string, HTMLButtonElement>>({});

  // Computed Columns
  const [showComputedColumnPanel, setShowComputedColumnPanel] = useState(false);
  const [computedColumns, setComputedColumns] = useState<ComputedColumnField[]>([]);
  const [isComputingColumns, setIsComputingColumns] = useState(false);

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
  // Stock management sidebar & subpages
  const [showStockSidebar, setShowStockSidebar] = useState(false);
  type StockSubPage = 'sell' | 'out-of-stock' | 'invoices' | 'sales-history' | null;
  const [stockSubPage, setStockSubPage] = useState<StockSubPage>(null);
  const [outOfStockItems, setOutOfStockItems] = useState<OutOfStockItem[]>([]);
  const [generatedInvoices, setGeneratedInvoices] = useState<InvoiceData[]>([]);
  const [stockDataLoaded, setStockDataLoaded] = useState(false);

  const salesHistoryOverrides = useMemo<Record<string, number[]>>(() => {
    const salesByItem = new Map<string, Map<string, number>>();

    generatedInvoices.forEach((invoice) => {
      const dateKey = new Date(invoice.date).toISOString().slice(0, 10);

      invoice.items.forEach((item) => {
        const qty = Number(item.qty);
        if (!Number.isFinite(qty) || qty <= 0) return;

        const normalizedName = String(item.productName || "").trim().toLowerCase();
        const keys = [item.recordId, normalizedName].filter(Boolean);

        keys.forEach((key) => {
          if (!salesByItem.has(key)) {
            salesByItem.set(key, new Map<string, number>());
          }

          const perDayMap = salesByItem.get(key)!;
          perDayMap.set(dateKey, (perDayMap.get(dateKey) || 0) + qty);
        });
      });
    });

    const overrides: Record<string, number[]> = {};

    salesByItem.forEach((perDayMap, key) => {
      const series = Array.from(perDayMap.entries())
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([, quantity]) => quantity);

      if (series.length > 0) {
        overrides[key] = series;
      }
    });

    return overrides;
  }, [generatedInvoices]);

  const hasSalesHistoryOverrides = useMemo(
    () => Object.keys(salesHistoryOverrides).length > 0,
    [salesHistoryOverrides]
  );

  // Load persisted stock management data on mount
  useEffect(() => {
    if (!currentDatabase?._id) return;
    const loadStockData = async () => {
      try {
        const res = await axios.get(`/api/databases/${currentDatabase._id}/stock-management`);
        setOutOfStockItems(res.data.outOfStockItems || []);
        setGeneratedInvoices(res.data.generatedInvoices || []);
        setStockDataLoaded(true);
      } catch (err: any) {
        // Silently handle 404 errors (endpoint doesn't exist for this database)
        if (err?.response?.status !== 404) {
          console.warn('Stock management data unavailable');
        }
        // Initialize with empty arrays
        setOutOfStockItems([]);
        setGeneratedInvoices([]);
        setStockDataLoaded(true);
      }
    };
    loadStockData();
  }, [currentDatabase?._id]);

  // Persist stock management data whenever it changes
  useEffect(() => {
    if (!currentDatabase?._id || !stockDataLoaded) return;
    const saveStockData = async () => {
      try {
        await axios.put(`/api/databases/${currentDatabase._id}/stock-management`, {
          outOfStockItems,
          generatedInvoices,
        });
      } catch (err: any) {
        // Silently handle 404 errors (endpoint doesn't exist)
        if (err?.response?.status !== 404) {
          console.warn('Could not save stock management data');
        }
      }
    };
    saveStockData();
  }, [outOfStockItems, generatedInvoices, currentDatabase?._id, stockDataLoaded]);

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
  const isAutoSalesHistorySelected =
    recommenderFieldMap.salesHistoryFieldId === AUTO_SALES_HISTORY_OPTION;


  const [showAnalytics, setShowAnalytics] = useState(false);
  const [expandedAnalyticsVisual, setExpandedAnalyticsVisual] = useState<AnalyticsVisual | null>(null);
  const [analyticsFieldId, setAnalyticsFieldId] = useState("");
  const [barChartCategoryFieldId, setBarChartCategoryFieldId] = useState("");
  const [barChartNumericFieldId, setBarChartNumericFieldId] = useState("");
  const [lineChartCategoryFieldId, setLineChartCategoryFieldId] = useState("");
  const [lineChartNumericFieldId, setLineChartNumericFieldId] = useState("");

  // Undo/Redo History
  const [undoHistory, setUndoHistory] = useState<UndoAction[]>([]);

  // Close date filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(e.target as Node)) {
        setShowDateFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyDatePreset = (preset: "" | "last-day" | "last-week" | "last-month" | "custom") => {
    setDateFilterType(preset);
    const today = new Date();
    if (preset === "last-day") {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      setDateFrom(yesterday.toISOString().split("T")[0]);
      setDateTo(today.toISOString().split("T")[0]);
      setDateFilter("");
      setShowDateFilterDropdown(false);
    } else if (preset === "last-week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      setDateFrom(weekAgo.toISOString().split("T")[0]);
      setDateTo(today.toISOString().split("T")[0]);
      setDateFilter("");
      setShowDateFilterDropdown(false);
    } else if (preset === "last-month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      setDateFrom(monthAgo.toISOString().split("T")[0]);
      setDateTo(today.toISOString().split("T")[0]);
      setDateFilter("");
      setShowDateFilterDropdown(false);
    } else if (preset === "custom") {
      // Keep dropdown open for custom date selection
    } else {
      setDateFrom("");
      setDateTo("");
      setDateFilter("");
      setShowDateFilterDropdown(false);
    }
  };

  const clearDateFilter = () => {
    setDateFilterType("");
    setDateFrom("");
    setDateTo("");
    setDateFilter("");
    setShowDateFilterDropdown(false);
  };

  // Effect A: When Filters change, reset to page 1
  useEffect(() => {
    setRecords([]);
    setHasMore(true);
    setPage(1);
    loadMoreRecords(1, true); // Force a page 1 fetch immediately
  }, [searchQuery, dateFilter, dateFrom, dateTo]);

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
          dateFrom: dateFrom || "",
          dateTo: dateTo || "",
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

  // Identify computed columns (those with specific ID pattern or disabled flag)
  const computedColumnIds = useMemo(() => {
    return formSchema
      .filter((field) => field.disabled && field.helperText?.includes("Computed:"))
      .map((field) => field.id);
  }, [formSchema]);

  // Form fields (exclude computed columns)
  const editableFormFields = useMemo(
    () => formSchema.filter((field) => !computedColumnIds.includes(field.id)),
    [formSchema, computedColumnIds]
  );

  const numericAnalyticsFields = useMemo(
    () =>
      dataFields.filter((field) =>
        records.some((record) => parseNumericValue(record.data[field.id]) !== null)
      ),
    [dataFields, records]
  );

  const categoricalAnalyticsFields = useMemo(
    () =>
      dataFields.filter((field) =>
        records.some((record) => {
          const value = record.data[field.id];
          return typeof value === "string" && value.trim().length > 0;
        })
      ),
    [dataFields, records]
  );

  useEffect(() => {
    if (
      analyticsFieldId &&
      numericAnalyticsFields.some((field) => field.id === analyticsFieldId)
    ) {
      return;
    }
    setAnalyticsFieldId(numericAnalyticsFields[0]?.id || "");
  }, [numericAnalyticsFields, analyticsFieldId]);

  useEffect(() => {
    if (
      barChartCategoryFieldId &&
      categoricalAnalyticsFields.some((field) => field.id === barChartCategoryFieldId)
    ) {
      return;
    }
    setBarChartCategoryFieldId(categoricalAnalyticsFields[0]?.id || "");
  }, [categoricalAnalyticsFields, barChartCategoryFieldId]);

  useEffect(() => {
    if (
      barChartNumericFieldId &&
      numericAnalyticsFields.some((field) => field.id === barChartNumericFieldId)
    ) {
      return;
    }
    setBarChartNumericFieldId(numericAnalyticsFields[0]?.id || "");
  }, [numericAnalyticsFields, barChartNumericFieldId]);

  useEffect(() => {
    if (
      lineChartCategoryFieldId &&
      categoricalAnalyticsFields.some((field) => field.id === lineChartCategoryFieldId)
    ) {
      return;
    }
    setLineChartCategoryFieldId(categoricalAnalyticsFields[0]?.id || "");
  }, [categoricalAnalyticsFields, lineChartCategoryFieldId]);

  useEffect(() => {
    if (
      lineChartNumericFieldId &&
      numericAnalyticsFields.some((field) => field.id === lineChartNumericFieldId)
    ) {
      return;
    }
    setLineChartNumericFieldId(numericAnalyticsFields[0]?.id || "");
  }, [numericAnalyticsFields, lineChartNumericFieldId]);

  const analyticsTimelineData = useMemo(() => {
    const dateMap = new Map<
      string,
      { records: number; totalValue: number; valueCount: number }
    >();

    records.forEach((record) => {
      const date = new Date(record.createdAt).toISOString().split("T")[0];
      const current = dateMap.get(date) || { records: 0, totalValue: 0, valueCount: 0 };
      current.records += 1;

      if (analyticsFieldId) {
        const parsed = parseNumericValue(record.data[analyticsFieldId]);
        if (parsed !== null) {
          current.totalValue += parsed;
          current.valueCount += 1;
        }
      }
      dateMap.set(date, current);
    });

    return [...dateMap.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-14)
      .map(([date, values]) => ({
        date: date.slice(5),
        records: values.records,
        averageValue: values.valueCount ? Number((values.totalValue / values.valueCount).toFixed(2)) : 0,
      }));
  }, [records, analyticsFieldId]);

  const analyticsBarChartData = useMemo(() => {
    if (!barChartCategoryFieldId || !barChartNumericFieldId) return [];
    const categoryMap = new Map<string, { numericTotal: number; numericCount: number; records: number }>();

    records.forEach((record) => {
      const rawValue = record.data[barChartCategoryFieldId];
      const label = String(rawValue ?? "Unknown").trim() || "Unknown";
      const parsedNumeric = parseNumericValue(record.data[barChartNumericFieldId]);
      const current = categoryMap.get(label) || { numericTotal: 0, numericCount: 0, records: 0 };
      current.records += 1;
      if (parsedNumeric !== null) {
        current.numericTotal += parsedNumeric;
        current.numericCount += 1;
      }
      categoryMap.set(label, current);
    });

    return [...categoryMap.entries()]
      .map(([name, values]) => ({
        name,
        metricValue:
          values.numericCount > 0 ? Number((values.numericTotal / values.numericCount).toFixed(2)) : 0,
      }))
      .sort((left, right) => right.metricValue - left.metricValue)
      .slice(0, 10);
  }, [records, barChartCategoryFieldId, barChartNumericFieldId]);

  const analyticsLineChartData = useMemo(() => {
    if (!lineChartCategoryFieldId || !lineChartNumericFieldId) return [];

    const grouped = new Map<string, { totalNumeric: number; numericCount: number }>();

    records.forEach((record) => {
      const rawCategory = record.data[lineChartCategoryFieldId];
      const category = String(rawCategory ?? "Unknown").trim() || "Unknown";
      const parsedNumeric = parseNumericValue(record.data[lineChartNumericFieldId]);

      const current = grouped.get(category) || { totalNumeric: 0, numericCount: 0 };
      if (parsedNumeric !== null) {
        current.totalNumeric += parsedNumeric;
        current.numericCount += 1;
      }
      grouped.set(category, current);
    });

    return [...grouped.entries()]
      .map(([category, values]) => ({
        category,
        metricValue:
          values.numericCount > 0
            ? Number((values.totalNumeric / values.numericCount).toFixed(2))
            : 0,
      }))
      .slice(0, 12)
      .reverse();
  }, [lineChartCategoryFieldId, lineChartNumericFieldId]);

  const analyticsPieData = useMemo(() => {
    if (!recommendationResult) return [];
    return [
      { name: "Order Now", value: recommendationResult.summary.orderNowCount },
      { name: "Order Soon", value: recommendationResult.summary.orderSoonCount },
      { name: "Healthy", value: recommendationResult.summary.healthyCount },
      { name: "Overstock", value: recommendationResult.summary.overstockCount },
    ];
  }, [recommendationResult]);

  const barChartCategoryLabel =
    dataFields.find((field) => field.id === barChartCategoryFieldId)?.label || "Category";
  const barChartNumericLabel =
    dataFields.find((field) => field.id === barChartNumericFieldId)?.label || "Numeric Field";
  const lineChartCategoryLabel =
    dataFields.find((field) => field.id === lineChartCategoryFieldId)?.label || "Category";
  const lineChartNumericLabel =
    dataFields.find((field) => field.id === lineChartNumericFieldId)?.label || "Numeric Field";

  const isBarExpanded = expandedAnalyticsVisual === "bar";
  const isLineExpanded = expandedAnalyticsVisual === "line";
  const isPieExpanded = expandedAnalyticsVisual === "pie";

  const displayedBarChartData = useMemo(
    () => analyticsBarChartData.slice(0, isBarExpanded ? 12 : 6),
    [analyticsBarChartData, isBarExpanded]
  );

  const displayedLineChartData = useMemo(
    () => analyticsLineChartData.slice(0, isLineExpanded ? 12 : 6),
    [analyticsLineChartData, isLineExpanded]
  );

  const formatXAxisTick = useCallback(
    (value: string | number, expanded: boolean) => {
      const source = String(value ?? "");
      const maxChars = expanded ? 20 : 10;
      return source.length > maxChars ? `${source.slice(0, maxChars)}...` : source;
    },
    []
  );

  const analyticsSummary = useMemo(() => {
    const selectedValues = analyticsFieldId
      ? records
        .map((record) => parseNumericValue(record.data[analyticsFieldId]))
        .filter((value): value is number => value !== null)
      : [];
    const selectedField = dataFields.find((field) => field.id === analyticsFieldId);
    const average =
      selectedValues.length > 0
        ? Number(
          (
            selectedValues.reduce((sum, current) => sum + current, 0) / selectedValues.length
          ).toFixed(2)
        )
        : 0;

    return {
      totalRecords: records.length,
      visibleRecords: records.length,
      numericFieldsCount: numericAnalyticsFields.length,
      selectedFieldLabel: selectedField?.label || "Selected metric",
      selectedFieldAverage: average,
    };
  }, [records, records.length, numericAnalyticsFields.length, analyticsFieldId, dataFields]);

  const analyticsRecommendations = useMemo(() => {
    const recommendations: string[] = [];

    if (records.length === 0) {
      return ["No records are available yet. Add records to generate analytics recommendations."];
    }

    if (analyticsTimelineData.length >= 2) {
      const latest = analyticsTimelineData[analyticsTimelineData.length - 1];
      const previous = analyticsTimelineData[analyticsTimelineData.length - 2];
      if (latest.records > previous.records) {
        recommendations.push("Record inflow is rising. Plan for higher processing and inventory needs.");
      } else if (latest.records < previous.records) {
        recommendations.push("Record inflow has slowed. Recheck demand assumptions before placing large orders.");
      }
    }

    if (recommendationResult?.recommendations?.length) {
      recommendationResult.recommendations.slice(0, 2).forEach((item) => {
        recommendations.push(
          `${item.name || item.sku}: ${item.explanation} (Recommended qty: ${item.recommendedOrderQty})`
        );
      });
    } else {
      recommendations.push(
        "Map Stock and Sales History fields, then refresh recommendations for SKU-level replenishment guidance."
      );
    }

    if (analyticsSummary.selectedFieldAverage > 0) {
      recommendations.push(
        `Average ${analyticsSummary.selectedFieldLabel.toLowerCase()} is ${analyticsSummary.selectedFieldAverage}. Use this as a baseline for thresholds and alerts.`
      );
    }

    return recommendations.slice(0, 4);
  }, [records.length, analyticsTimelineData, recommendationResult, analyticsSummary]);


  useEffect(() => {
    if (!dataFields.length) return;
    setRecommenderFieldMap((prev) => {
      const next = {
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
      };

      const isSame =
        prev.stockFieldId === next.stockFieldId &&
        prev.salesHistoryFieldId === next.salesHistoryFieldId &&
        prev.skuFieldId === next.skuFieldId &&
        prev.nameFieldId === next.nameFieldId &&
        prev.reorderPointFieldId === next.reorderPointFieldId &&
        prev.leadTimeDaysFieldId === next.leadTimeDaysFieldId &&
        prev.safetyStockDaysFieldId === next.safetyStockDaysFieldId &&
        prev.incomingReplenishmentFieldId === next.incomingReplenishmentFieldId;

      return isSame ? prev : next;
    });
  }, [dataFields]);

  const guardEdit = (): boolean => {
    if (isViewer) {
      showToast.error("Permission not allowed. You have Viewer access only.");
      return false;
    }
    return true;
  };

  const handleOpenForm = () => {
    if (!guardEdit()) return;
    setEditingRecord(null);
    setFormData({});
    setShowForm(true);
  };

  const handleEditRecord = (record: DatabaseRecord) => {
    if (!guardEdit()) return;
    setEditingRecord(record);
    // Exclude computed columns from editable form data
    const editableData: Record<string, unknown> = {};
    editableFormFields.forEach((field) => {
      editableData[field.id] = record.data[field.id];
    });
    setFormData(editableData);
    setShowForm(true);
  };


  const handleSaveForm = () => {
    if (!currentDatabase) return;

    const sanitizedFormData = sanitizeRecordFileData(formData, editableFormFields);

    // Build schema excluding computed columns
    const schemaForValidation = editableFormFields.length > 0
      ? buildZodSchema(editableFormFields)
      : buildZodSchema(formSchema);

    const result = schemaForValidation.safeParse(sanitizedFormData);

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
      handleUpdateRecord(currentDatabase._id, editingRecord.id, sanitizedFormData);
    } else {
      handleAddRecord(currentDatabase._id, sanitizedFormData);
    }

    setShowForm(false);
    setFormData({});
    setEditingRecord(null);
  };

  const handleCancelForm = async () => {
    const temporaryAssets = editableFormFields.flatMap((field) =>
      extractTemporaryUploadedFileAssets(formData[field.id])
    );

    await Promise.all(
      temporaryAssets.map((asset) =>
        axios.delete('/api/uploads', {
          data: {
            publicId: asset.publicId,
            resourceType: asset.resourceType,
          },
        }).catch(() => null)
      )
    );

    setShowForm(false);
    setFormData({});
    setEditingRecord(null);
    setFormErrors({});
  };

  const renderRecordCellValue = (field: FieldAttributes, rawValue: unknown) => {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return '-';
    }

    if (field.type === 'file-upload') {
      const files = extractUploadedFileAssets(rawValue);
      if (!files.length) return '-';

      return (
        <div className="space-y-1">
          {files.slice(0, 2).map((file, index) => (
            <div key={`${file.publicId || file.url}-${index}`} className="group min-w-0">
              <div className="truncate">{file.originalFilename || file.url}</div>
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] underline"
              >
                Open
              </a>
            </div>
          ))}
          {files.length > 2 && <div className="text-[10px] opacity-70">+{files.length - 2} more</div>}
        </div>
      );
    }

    if (Array.isArray(rawValue)) {
      return rawValue.join(', ');
    }

    if (typeof rawValue === 'object') {
      return JSON.stringify(rawValue);
    }

    return String(rawValue);
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

  const handleSort = (fieldId: string, order: 'asc' | 'desc') => {
    // If clicking the same field and order, toggle it off
    if (sortConfig?.fieldId === fieldId && sortConfig?.order === order) {
      setSortConfig(null);
    } else {
      // Replace with new sort (single sort only)
      setSortConfig({ fieldId, order });
    }
  };

  const removeSorting = () => {
    setSortConfig(null);
  };

  // Undo functionality
  const addToHistory = useCallback((action: UndoAction) => {
    setUndoHistory((prev) => {
      const newHistory = [...prev];
      // Keep only last 50 actions to prevent memory issues
      if (newHistory.length >= 50) {
        newHistory.shift();
      }
      return [...newHistory, action];
    });
  }, []);

  const handleUndo = useCallback(async () => {
    if (undoHistory.length === 0) return;

    const action = undoHistory[undoHistory.length - 1];

    try {
      if (action.type === 'add' && action.recordId) {
        // Undo add by deleting the record
        await axios.delete(`/api/databases/${currentDatabase._id}/records/${action.recordId}`);
        setPage(1);
        setHasMore(true);
        await loadMoreRecords(1, true);
      } else if (action.type === 'update' && action.recordId && action.oldData) {
        // Undo update by restoring old data
        await axios.put(`/api/databases/${currentDatabase._id}/records/${action.recordId}`, {
          data: action.oldData,
        });
        setPage(1);
        setHasMore(true);
        await loadMoreRecords(1, true);
      } else if (action.type === 'delete' && action.recordId && action.oldData) {
        // Undo delete by re-creating the record
        await axios.post(`/api/databases/${currentDatabase._id}/records`, {
          data: action.oldData,
        });
        setPage(1);
        setHasMore(true);
        await loadMoreRecords(1, true);
      } else if (action.type === 'bulkDelete' && action.recordIds && action.oldRecords) {
        // Undo bulk delete by re-creating all records
        const recordsToAdd = action.oldRecords.map((r) => r.data);
        await axios.post(`/api/databases/${currentDatabase._id}/records/bulk`, {
          records: recordsToAdd,
        });
        setPage(1);
        setHasMore(true);
        await loadMoreRecords(1, true);
      }

      // Remove from history after successful undo
      setUndoHistory((prev) => prev.slice(0, -1));
      showToast.success('Action undone successfully!');
    } catch (error) {
      console.error('Undo failed:', error);
      alert('Failed to undo action');
    }
  }, [undoHistory, currentDatabase, loadMoreRecords]);

  // Keyboard shortcut for Undo (Ctrl+Z or Cmd+Z)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleUndo]);

  // Sorted records based on current sort configuration
  const sortedRecords = useMemo(() => {
    if (!sortConfig) return records;

    const sorted = [...records];

    sorted.sort((recordA, recordB) => {
      const valA = recordA.data[sortConfig.fieldId];
      const valB = recordB.data[sortConfig.fieldId];

      return compareValues(valA, valB, sortConfig.order);
    });

    return sorted;
  }, [records, sortConfig]);

  const handleAddRecord = async (databaseId: string, data: Record<string, unknown>) => {
    try {
      const response = await axios.post(`/api/databases/${databaseId}/records`, { data });
      const newRecordId = response.data?._id || response.data?.id;

      // Add to undo history
      addToHistory({
        type: 'add',
        timestamp: Date.now(),
        recordId: newRecordId,
        newData: data,
      });

      setPage(1);
      setHasMore(true);
      await loadMoreRecords(1, true);
    } catch (error) {
      showToast.error("Failed to add record. Please try again.");
    }
  };

  const handleDeleteRecord = async (databaseId: string, recordId: string) => {
    if (!guardEdit()) return;
    try {
      // Find the record to store its data for undo
      const recordToDelete = records.find((r) => r.id === recordId);

      await axios.delete(`/api/databases/${databaseId}/records/${recordId}`);

      // Add to undo history
      if (recordToDelete) {
        addToHistory({
          type: 'delete',
          timestamp: Date.now(),
          recordId: recordId,
          oldData: recordToDelete.data,
        });
      }

      const response = await axios.get(`/api/databases/${databaseId}/records`);
      setRecords([]);      // Wipe the local array
      setPage(1);
      setHasMore(true);
      await loadMoreRecords(1, true);
    } catch (error) {
      showToast.error("Failed to delete record. Please try again.");
    }
  };

  const handleSelectDelete = async () => {
    if (!guardEdit()) return;
    if (!confirm("Are you absolutely sure? This will wipe ALL records which selected in this database.")) return;
    try {
      const databaseId = currentDatabase?._id;

      // Store records to delete for undo
      const recordsToDelete = records.filter((r) => deleteRecords.includes(r.id));

      await axios.delete(
        `/api/databases/${databaseId}/records`,
        {
          data: { ids: deleteRecords },
        }
      );

      // Add to undo history
      addToHistory({
        type: 'bulkDelete',
        timestamp: Date.now(),
        recordIds: deleteRecords,
        oldRecords: recordsToDelete,
      });

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
      showToast.success("Records deleted successfully!");
    } catch (error) {
      showToast.error("Failed to delete records.");
    }
  };

  const handleClearAllRecords = async () => {
    if (!guardEdit()) return;
    // 1. Calculate IDs immediately
    const allIds = records.map((r) => r.id);

    if (allIds.length === 0) {
      showToast.warning("No records to delete!");
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

        showToast.success("Database cleared!");

        // Reload to sync with server
        await loadMoreRecords(1, true);
      } catch (err) {
        console.error("Failed to clear records", err);
        showToast.error("An error occurred while clearing the database.");
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
      // Find the record to store its old data for undo
      const recordToUpdate = records.find((r) => r.id === recordId);
      const oldData = recordToUpdate?.data || {};

      await axios.put(`/api/databases/${databaseId}/records/${recordId}`, { data });

      // Add to undo history
      addToHistory({
        type: 'update',
        timestamp: Date.now(),
        recordId: recordId,
        oldData: oldData,
        newData: data,
      });

      const response = await axios.get(`/api/databases/${databaseId}/records`);
      // setRecords(response.data);
      setPage(1);
      setHasMore(true);
      await loadMoreRecords(1, true);
    } catch (error) {
      showToast.error("Failed to update record. Please try again.");
    }
  };

  const handleCreateComputedColumn = async (column: ComputedColumnField) => {
    try {
      // Validate the column
      const validation = validateComputedColumn(column, formSchema);
      if (!validation.valid) {
        throw new Error(validation.error || "Invalid column configuration");
      }

      setIsComputingColumns(true);

      // Create a new field attribute for the computed column
      const newFieldAttribute: FieldAttributes = {
        id: column.id,
        label: column.name,
        span: 1,
        type: "input-text",
        disabled: true, // Make computed columns read-only
        helperText: `Computed: ${column.operation}`,
        showLabel: true,
      };

      // Call API to save the computed column and update all records
      const response = await axios.post(
        `/api/databases/${currentDatabase._id}/computed-columns`,
        {
          column: {
            ...column,
            computedAt: new Date().toISOString(),
          },
          fieldAttribute: newFieldAttribute,
        }
      );

      if (response.status === 200 || response.status === 201) {
        // Update local state to include the new column
        setComputedColumns([...computedColumns, column]);

        // Reload records to get computed values
        setPage(1);
        setHasMore(true);
        await loadMoreRecords(1, true);

        showToast.success("Computed column created successfully!");
      }
    } catch (error: any) {
      // Silently handle 404 errors for shared databases that don't support computed columns
      if (error?.response?.status !== 404) {
        console.error("Error creating computed column:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create computed column";
        showToast.error(errorMessage);
        throw new Error(errorMessage);
      } else {
        console.warn("Computed columns not available for this database type");
        showToast.warning("Computed columns feature is not available for this database type");
      }
    } finally {
      setIsComputingColumns(false);
    }
  };

  const fetchRecommendations = useCallback(async () => {
    if (!currentDatabase) return;

    if (!recommenderFieldMap.stockFieldId) {
      setRecommendationError("Please select Stock field.");
      return;
    }

    const resolvedSalesHistoryFieldId = isAutoSalesHistorySelected
      ? ""
      : recommenderFieldMap.salesHistoryFieldId;

    if (!resolvedSalesHistoryFieldId && !hasSalesHistoryOverrides) {
      setRecommendationError("Please select Sales History field or generate invoice sales history.");
      return;
    }

    setIsLoadingRecommendations(true);
    setRecommendationError("");

    try {
      const response = await axios.post<ReplenishmentResponse>(
        `/api/databases/${currentDatabase._id}/recommendations/replenishment`,
        {
          stockFieldId: recommenderFieldMap.stockFieldId,
          salesHistoryFieldId: resolvedSalesHistoryFieldId || undefined,
          salesHistoryOverrides:
            hasSalesHistoryOverrides
              ? salesHistoryOverrides
              : undefined,
          skuFieldId: recommenderFieldMap.skuFieldId || undefined,
          nameFieldId: recommenderFieldMap.nameFieldId || undefined,
          reorderPointFieldId: recommenderFieldMap.reorderPointFieldId || undefined,
          leadTimeDaysFieldId: recommenderFieldMap.leadTimeDaysFieldId || undefined,
          safetyStockDaysFieldId: recommenderFieldMap.safetyStockDaysFieldId || undefined,
          incomingReplenishmentFieldId:
            recommenderFieldMap.incomingReplenishmentFieldId || undefined,
          forecastDays,
          topN: topNRecommendations,
          search: searchQuery || undefined,
          date: dateFilter || undefined,
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
  }, [
    currentDatabase,
    recommenderFieldMap,
    forecastDays,
    topNRecommendations,
    searchQuery,
    dateFilter,
    salesHistoryOverrides,
    hasSalesHistoryOverrides,
    isAutoSalesHistorySelected,
  ]);

  useEffect(() => {
    if (!showRecommender || !autoRefreshRecommendations || !currentDatabase) return;

    const interval = setInterval(() => {
      fetchRecommendations();
    }, 60000);

    return () => clearInterval(interval);
  }, [showRecommender, autoRefreshRecommendations, currentDatabase, fetchRecommendations]);

  useEffect(() => {
    if (!showAnalytics || recommendationResult || isLoadingRecommendations) return;
    if (!recommenderFieldMap.stockFieldId) return;
    const resolvedSalesHistoryFieldId = isAutoSalesHistorySelected
      ? ""
      : recommenderFieldMap.salesHistoryFieldId;
    if (!resolvedSalesHistoryFieldId && !hasSalesHistoryOverrides) return;
    fetchRecommendations();
  }, [
    showAnalytics,
    recommendationResult,
    isLoadingRecommendations,
    recommenderFieldMap.stockFieldId,
    recommenderFieldMap.salesHistoryFieldId,
    hasSalesHistoryOverrides,
    isAutoSalesHistorySelected,
    fetchRecommendations,
  ]);

  useEffect(() => {
    if (showAnalytics) return;
    setExpandedAnalyticsVisual(null);
  }, [showAnalytics]);

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
            showToast.warning("The uploaded file is empty.");
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
          showToast.error("Error processing the Excel data. Please check the file format.");
        }
      };

      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error("Import Error:", error);
      showToast.error("Failed to load the import library.");
    } finally {
      setIsImporting(false);
    }
  };
  const handleConfirmImport = async () => {
    if (!guardEdit()) return;
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
      showToast.success("Records imported successfully!");
    } catch (error) {
      showToast.error("Bulk import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: currentTheme.background }} onClick={() => setOpenSortMenuId(null)}>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
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

          {/* Undo Button */}
          {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={undoHistory.length === 0}
            title={`Undo (${undoHistory.length} actions available) - Ctrl+Z`}
            style={{
              backgroundColor: undoHistory.length > 0 ? currentTheme.primary : `${currentTheme.primary}40`,
              color: undoHistory.length > 0 ? "#ffffff" : currentTheme.textSecondary,
            }}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Undo {undoHistory.length > 0 && `(${undoHistory.length})`}
          </Button>
          )}

          <div className="h-6 w-px" style={{ backgroundColor: currentTheme.border }} />
          <h1 className="text-xl font-bold" style={{ color: currentTheme.text }}>
            {currentDatabase?.DatabaseName || "Database"}
          </h1>
          <span className="text-sm" style={{ color: currentTheme.textSecondary }}>
            {currentDatabase.recordCount} {currentDatabase.recordCount === 1 ? "record" : "records"}
          </span>
          {userRole && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded uppercase"
              style={{
                backgroundColor: isViewer ? "#f59e0b20" : `${currentTheme.primary}20`,
                color: isViewer ? "#f59e0b" : currentTheme.primary,
              }}
            >
              {userRole}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">

          <Button
            variant={showAnalytics ? "default" : "outline"}
            onClick={() => setShowAnalytics((prev) => !prev)}
            style={
              showAnalytics
                ? { backgroundColor: currentTheme.primary }
                : { borderColor: currentTheme.border, color: currentTheme.text, backgroundColor: currentTheme.primary }
            }
          >
            <BarChart3Icon className="w-4 h-4 mr-2" />
            {showAnalytics ? "Hide Analytics" : "Analytics"}
          </Button>
          {/* Export Button */}
          {!isViewer && (
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
          )}

          {/* Import Button */}
          {canEdit && (
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
          )}

          {canEdit && (
          <Button
            onClick={handleOpenForm}
            style={{
              backgroundColor: currentTheme.primary,
              color: currentTheme.text,
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Record
          </Button>
          )}

          {/* Stock Management Menu Button */}
          {isAdmin && (
          <Button
            variant="outline"
            onClick={() => setShowStockSidebar(true)}
            style={{
              backgroundColor: currentTheme.primary,
              color: currentTheme.text,
            }}
          >
            <Menu className="w-4 h-4 mr-2" />
            Stock Menu
          </Button>
          )}
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

        {/* Date Filter Dropdown */}
        <div className="relative" ref={dateFilterRef}>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors"
            style={{
              backgroundColor: dateFilterType ? currentTheme.primary : currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
              color: dateFilterType ? "#ffffff" : currentTheme.text,
            }}
            onClick={() => setShowDateFilterDropdown((prev) => !prev)}
            onMouseEnter={() => setShowDateFilterDropdown(true)}
          >
            <Calendar className="w-4 h-4" />
            {dateFilterType === "last-day" ? "Last Day" :
             dateFilterType === "last-week" ? "Last Week" :
             dateFilterType === "last-month" ? "Last Month" :
             dateFilterType === "custom" ? "Custom Range" :
             "Filter by Date"}
            <ChevronDown className="w-3 h-3" />
          </button>

          {showDateFilterDropdown && (
            <div
              className="absolute top-full left-0 mt-1 w-64 rounded-lg shadow-xl z-50 py-2"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
              }}
              onMouseLeave={() => {
                if (dateFilterType !== "custom") setShowDateFilterDropdown(false);
              }}
            >
              <button
                className="w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
                style={{
                  color: currentTheme.text,
                  backgroundColor: dateFilterType === "last-day" ? `${currentTheme.primary}15` : "transparent",
                }}
                onClick={() => applyDatePreset("last-day")}
              >
                Last Day
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
                style={{
                  color: currentTheme.text,
                  backgroundColor: dateFilterType === "last-week" ? `${currentTheme.primary}15` : "transparent",
                }}
                onClick={() => applyDatePreset("last-week")}
              >
                Last Week
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
                style={{
                  color: currentTheme.text,
                  backgroundColor: dateFilterType === "last-month" ? `${currentTheme.primary}15` : "transparent",
                }}
                onClick={() => applyDatePreset("last-month")}
              >
                Last Month
              </button>

              <div className="my-1 h-px mx-2" style={{ backgroundColor: currentTheme.border }} />

              <button
                className="w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
                style={{
                  color: currentTheme.text,
                  backgroundColor: dateFilterType === "custom" ? `${currentTheme.primary}15` : "transparent",
                }}
                onClick={() => applyDatePreset("custom")}
              >
                Custom Date Range
              </button>

              {dateFilterType === "custom" && (
                <div className="px-4 py-2 space-y-2">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: currentTheme.textSecondary }}>
                      From
                    </label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      style={{
                        backgroundColor: currentTheme.background,
                        border: `1px solid ${currentTheme.border}`,
                        color: currentTheme.text,
                      }}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: currentTheme.textSecondary }}>
                      To
                    </label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      style={{
                        backgroundColor: currentTheme.background,
                        border: `1px solid ${currentTheme.border}`,
                        color: currentTheme.text,
                      }}
                      className="text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-1"
                    onClick={() => setShowDateFilterDropdown(false)}
                    style={{ backgroundColor: currentTheme.primary, color: "#ffffff" }}
                  >
                    Apply
                  </Button>
                </div>
              )}

              {dateFilterType && (
                <>
                  <div className="my-1 h-px mx-2" style={{ backgroundColor: currentTheme.border }} />
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
                    style={{ color: "#ef4444" }}
                    onClick={clearDateFilter}
                  >
                    Clear Date Filter
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {(searchQuery || dateFilter || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              clearDateFilter();
            }}
            style={{ color: currentTheme.text, background: currentTheme.primary }}
          >
            Clear Filters
          </Button>
        )}

        {canDelete && (records.length !== 0 ? bulkDelete ?
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
        )}

        {
          canDelete && bulkDelete &&
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
          canDelete && bulkDelete &&
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

        <div className="absolute right-6 flex gap-2">
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
            {isLoadingRecommendations ? "Refreshing..." : "Recommendations"}
          </Button>
        </div>
      </div>

      {showAnalytics && (
        <div
          className="border-b px-6 py-4 space-y-4 relative"
          style={{
            backgroundColor: currentTheme.surface,
            borderColor: currentTheme.border,
          }}
        >
          {expandedAnalyticsVisual && (
            <div
              className="fixed inset-0 z-40 bg-black/45"
              onClick={() => setExpandedAnalyticsVisual(null)}
            />
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold" style={{ color: currentTheme.text }}>
                Database Analytics
              </h3>
              <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                Visuals and recommendations for the current opened database.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={analyticsFieldId}
                onChange={(e) => setAnalyticsFieldId(e.target.value)}
                className="px-3 py-2 rounded-md text-sm"
                style={{
                  backgroundColor: currentTheme.background,
                  color: currentTheme.text,
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                <option value="">Select numeric metric</option>
                {numericAnalyticsFields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.label}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={fetchRecommendations}
                disabled={isLoadingRecommendations}
                style={{ backgroundColor: currentTheme.primary, color: "#ffffff" }}
              >
                {isLoadingRecommendations ? "Loading..." : "Refresh Recommendations"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            <Card className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-[var(--color-background)] hover:border-[var(--color-primary)] cursor-pointer" style={{ backgroundColor: currentTheme.background, border: `1px solid #ef4444`, alignItems: "center" }}>
              <p className="text-xs" style={{ color: currentTheme.textSecondary, fontSize: '1.05rem' }}>Total Records</p>
              <p className="text-xl font-bold" style={{ color: currentTheme.text }}>{analyticsSummary.totalRecords}</p>
            </Card>
            <Card className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-[var(--color-background)] hover:border-[var(--color-primary)] cursor-pointer" style={{ backgroundColor: currentTheme.background, border: `1px solid #f59e0b`, alignItems: "center" }}>
              <p className="text-xs" style={{ color: currentTheme.textSecondary, alignItems: "center", fontSize: '1.05rem' }}>Visible Records</p>
              <p className="text-xl font-bold" style={{ color: currentTheme.text }}>{analyticsSummary.visibleRecords}</p>
            </Card>
            <Card className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-[var(--color-background)] hover:border-[var(--color-primary)] cursor-pointer" style={{ backgroundColor: currentTheme.background, border: `1px solid #10b981`, alignItems: "center" }}>
              <p className="text-xs" style={{ color: currentTheme.textSecondary, fontSize: '1.05rem' }}>Numeric Fields</p>
              <p className="text-xl font-bold" style={{ color: currentTheme.text }}>{analyticsSummary.numericFieldsCount}</p>
            </Card>
            <Card className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-[var(--color-background)] hover:border-[var(--color-primary)] cursor-pointer" style={{ backgroundColor: currentTheme.background, border: `1px solid #0ea5e9`, alignItems: "center" }}>
              <p className="text-xs" style={{ color: currentTheme.textSecondary, fontSize: '1.05rem' }}>
                Avg {analyticsSummary.selectedFieldLabel}
              </p>
              <p className="text-xl font-bold" style={{ color: currentTheme.text }}>
                {analyticsSummary.selectedFieldAverage}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card
              className={`p-3 ${isBarExpanded ? "fixed inset-6 z-50 overflow-auto shadow-2xl" : ""}p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-[var(--color-background)] hover:border-[var(--color-primary)] cursor-pointer`}
              style={{ backgroundColor: currentTheme.background, border: `1px solid #0ea5e9` }}
            >
              <div className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-[var(--color-background)] hover:border-[var(--color-primary)] cursor-pointer mb-2 flex items-center justify-between gap-2 ">
                <p className="text-sm font-semibold" style={{ color: currentTheme.text }}>
                  Bar Graph: Category vs Numeric Field
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedAnalyticsVisual((prev) => (prev === "bar" ? null : "bar"))}
                  style={{ color: currentTheme.text }}
                >
                  {isBarExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2 mb-3">
                <select
                  value={barChartCategoryFieldId}
                  onChange={(e) => setBarChartCategoryFieldId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{
                    backgroundColor: currentTheme.surface,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <option value="">Select bar chart category field</option>
                  {categoricalAnalyticsFields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                </select>
                <select
                  value={barChartNumericFieldId}
                  onChange={(e) => setBarChartNumericFieldId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{
                    backgroundColor: currentTheme.surface,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <option value="">Select bar chart numeric field</option>
                  {numericAnalyticsFields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={isBarExpanded ? "h-[70vh]" : "h-56"}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayedBarChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} />
                    <XAxis
                      dataKey="name"
                      stroke={currentTheme.textSecondary}
                      interval="preserveStartEnd"
                      minTickGap={isBarExpanded ? 18 : 40}
                      tickFormatter={(value) => formatXAxisTick(value, isBarExpanded)}
                      tick={{ fontSize: isBarExpanded ? 12 : 10 }}
                      angle={isBarExpanded ? 0 : -15}
                      textAnchor={isBarExpanded ? "middle" : "end"}
                      height={60}
                      label={{
                        value: barChartCategoryLabel,
                        position: "insideBottom",
                        offset: -2,
                        fill: currentTheme.text,
                      }}
                    />
                    <YAxis
                      stroke={currentTheme.textSecondary}
                      label={{
                        value: `Avg ${barChartNumericLabel}`,
                        angle: -90,
                        position: "insideLeft",
                        fill: currentTheme.text,
                      }}
                    />
                    <Tooltip
                      labelFormatter={(label) => `${barChartCategoryLabel}: ${String(label)}`}
                      formatter={(value) => [String(value), `Avg ${barChartNumericLabel}`]}
                    />
                    <Bar dataKey="metricValue" name="Metric Average" fill={currentTheme.primary} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card
              className={`p-3 ${isLineExpanded ? "fixed inset-6 z-50 overflow-auto shadow-2xl" : ""}p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-[var(--color-background)] hover:border-[var(--color-primary)] cursor-pointer`}
              style={{ backgroundColor: currentTheme.background, border: `1px solid #ef4444` }}
            >
              <div className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-[var(--color-background)] hover:border-[var(--color-primary)] cursor-pointermb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold" style={{ color: currentTheme.text }}>
                  Line Chart: Category vs Numeric Field
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedAnalyticsVisual((prev) => (prev === "line" ? null : "line"))}
                  style={{ color: currentTheme.text }}
                >
                  {isLineExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2 mb-3">
                <select
                  value={lineChartCategoryFieldId}
                  onChange={(e) => setLineChartCategoryFieldId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{
                    backgroundColor: currentTheme.surface,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <option value="">Select line chart category field</option>
                  {categoricalAnalyticsFields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                </select>
                <select
                  value={lineChartNumericFieldId}
                  onChange={(e) => setLineChartNumericFieldId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{
                    backgroundColor: currentTheme.surface,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <option value="">Select line chart numeric field</option>
                  {numericAnalyticsFields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={isLineExpanded ? "h-[70vh]" : "h-64"}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayedLineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} />
                    <XAxis
                      dataKey="category"
                      stroke={currentTheme.textSecondary}
                      interval="preserveStartEnd"
                      minTickGap={isLineExpanded ? 18 : 40}
                      tickFormatter={(value) => formatXAxisTick(value, isLineExpanded)}
                      tick={{ fontSize: isLineExpanded ? 12 : 10 }}
                      angle={isLineExpanded ? 0 : -15}
                      textAnchor={isLineExpanded ? "middle" : "end"}
                      height={60}
                      label={{
                        value: lineChartCategoryLabel,
                        position: "insideBottom",
                        offset: -2,
                        fill: currentTheme.text,
                      }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke={currentTheme.textSecondary}
                      label={{
                        value: "Record Count",
                        angle: -90,
                        position: "insideLeft",
                        fill: currentTheme.text,
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke={currentTheme.textSecondary}
                      label={{
                        value: `Avg ${lineChartNumericLabel}`,
                        angle: 90,
                        position: "insideRight",
                        fill: currentTheme.text,
                      }}
                    />
                    <Tooltip
                      labelFormatter={(label) => `${lineChartCategoryLabel}: ${String(label)}`}
                      formatter={(value, name) => {
                        if (name === "Record Count") {
                          return [String(value), "Record Count"];
                        }
                        return [String(value), `Avg ${lineChartNumericLabel}`];
                      }}
                    />
                    <Legend />

                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="metricValue"
                      name="Metric Average"
                      stroke="#f59e0b"
                      strokeWidth={2}

                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card
              className={`p-3 ${isPieExpanded ? "fixed inset-6 z-50 overflow-auto shadow-2xl" : ""}p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-(--color-background) hover:border-(--color-primary) cursor-pointer`}
              style={{ backgroundColor: currentTheme.background, border: `1px solid #f59e0b` }}
            >
              <div className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-(--color-background) hover:border-(--color-primary) cursor-pointer mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold" style={{ color: currentTheme.text }}>
                  Pie Chart: Recommendation Mix
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedAnalyticsVisual((prev) => (prev === "pie" ? null : "pie"))}
                  style={{ color: currentTheme.text }}
                >
                  {isPieExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
              <div className={isPieExpanded ? "h-[70vh]" : "h-64"}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {analyticsPieData.map((entry, index) => {
                        const colors = ["#ef4444", "#f59e0b", "#10b981", "#0ea5e9", currentTheme.primary, "#14b8a6"];
                        return <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-(--color-background) hover:border-(--color-primary)cursor-pointerp-4" style={{ backgroundColor: currentTheme.background, border: `1px solid #10b981` }}>
            <p className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-(--color-background) hover:border-(--color-primary) cursor-pointer text-sm font-semibold mb-2" style={{ color: currentTheme.text }}>
              Recommendations
            </p>
            <div className="space-y-2">
              {analyticsRecommendations.map((message, index) => (
                <p key={`${message}-${index}`} className="text-sm" style={{ color: currentTheme.textSecondary }}>
                  {index + 1}. {message}
                </p>
              ))}
            </div>
          </Card>
        </div>
      )}

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

            {/* Add Computed Column Button - Above Table */}
            <div
              onClick={() => setShowComputedColumnPanel(true)}
            >
              <Button
                variant="outline"
                size="sm"
                title="Add computed column"
                style={{
                  borderColor: currentTheme.border,
                  color: '#ffffff',
                  backgroundColor: currentTheme.primary,
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Custom Column
              </Button>
            </div> 
          <Button
            onClick={onOpenChatbot}
            className="rounded-lg shadow-xl flex items-center justify-center cursor-pointer hover:scale-103 transition-transform z-30"
            style={{
              backgroundColor: currentTheme.primary,
            }}
          >
            <Sparkles className=" text-white" /><span>Query with AI</span>
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
                  <option value={AUTO_SALES_HISTORY_OPTION}>
                    Auto Sales History (from sold items)
                  </option>
                  {dataFields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                </select>
                {isAutoSalesHistorySelected && (
                  <p className="text-[11px] mt-1" style={{ color: currentTheme.textSecondary }}>
                    Uses auto-generated sold quantity list from generated invoices.
                  </p>
                )}
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
                  <Card className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-[var(--color-background)] hover:border-[var(--color-primary)] cursor-pointer" style={{ border: `1px solid #ef4444`, backgroundColor: currentTheme.background, alignItems: "center" }}>
                    <p className="text-xs" style={{ color: currentTheme.textSecondary, fontSize: "1.05rem" }}>Order Now</p>
                    <p className="text-xl font-bold" style={{ color: "#ef4444" }}>
                      {recommendationResult.summary.orderNowCount}
                    </p>
                  </Card>
                  <Card className=" p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-[var(--color-background)] hover:border-[var(--color-primary)] cursor-pointer" style={{ border: `1px solid #f59e0b`, backgroundColor: currentTheme.background, alignItems: "center" }}>
                    <p className="text-xs" style={{ color: currentTheme.textSecondary, fontSize: "1.05rem" }}>Order Soon</p>
                    <p className="text-xl font-bold" style={{ color: "#f59e0b" }}>
                      {recommendationResult.summary.orderSoonCount}
                    </p>
                  </Card>
                  <Card className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-[var(--color-background)] hover:border-[var(--color-primary)] cursor-pointer p-3" style={{ border: `1px solid #10b981`, backgroundColor: currentTheme.background, alignItems: "center" }}>
                    <p className="text-xs" style={{ color: currentTheme.textSecondary, fontSize: "1.05rem" }}>Healthy</p>
                    <p className="text-xl font-bold" style={{ color: "#10b981" }}>
                      {recommendationResult.summary.healthyCount}
                    </p>
                  </Card>
                  <Card className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-[var(--color-background)] hover:border-[var(--color-primary)] cursor-pointer p-3" style={{ border: `1px solid #0ea5e9`, backgroundColor: currentTheme.background, alignItems: "center" }}>
                    <p className="text-xs" style={{ color: currentTheme.textSecondary, fontSize: "1.05rem" }}>Overstock</p>
                    <p className="text-xl font-bold" style={{ color: "#0ea5e9" }}>
                      {recommendationResult.summary.overstockCount}
                    </p>
                  </Card>
                  <Card className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-[var(--color-background)] hover:border-[var(--color-primary)] cursor-pointer p-3" style={{ border: `1px solid #8b5cf6`, backgroundColor: currentTheme.background, alignItems: "center" }}>
                    <p className="text-xs" style={{ color: currentTheme.textSecondary, fontSize: "1.05rem" }}>Recommended Units</p>
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
                        className="p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-[var(--color-background)] hover:border-[var(--color-primary)] cursor-pointer"
                        style={{ border: `1px solid ${badge.background}`, backgroundColor: currentTheme.background }}
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
                            Urgency Score: <span style={{ color: currentTheme.text }}>{recommendation.urgencyScore}</span>
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

                        <p className="text-xs" style={{ color: currentTheme.text, backgroundColor: badge.background, padding: '4px', borderRadius: '4px' }}>
                          {recommendation.explanation}
                        </p>
                      </Card>
                    );
                  })}
                </div>

                {recommendationResult.warnings.length > 0 && (
                  <Card className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-[var(--color-background)] hover:border-[var(--color-primary)] cursor-pointer" style={{ border: `1px solid ${currentTheme.border}`, backgroundColor: currentTheme.background }}>
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
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {/* Table View */}
        <div className="flex-1 overflow-auto relative">
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
                      className="sticky top-0 z-20"
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
                            className="px-2 py-2 border-b text-sm truncate border border-white relative"
                            style={{
                              color: currentTheme.text,
                              borderColor: currentTheme.border,
                              width: `${getColumnWidth(field.id)}px`,
                              minWidth: "100px",
                            }}
                            onMouseEnter={() => setHoveredHeaderId(field.id)}
                            onMouseLeave={() => setHoveredHeaderId(null)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{field.label}</span>

                              {/* Sort Icon - Show on hover or if sorted */}
                              {(hoveredHeaderId === field.id || sortConfig?.fieldId === field.id) && (
                                <div className="relative shrink-0">
                                  <button
                                    ref={(el) => {
                                      if (el) sortButtonRefs.current[field.id] = el;
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (openSortMenuId === field.id) {
                                        setOpenSortMenuId(null);
                                      } else {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setMenuPosition({
                                          top: rect.top - 10,
                                          left: rect.left + rect.width / 2,
                                        });
                                        setOpenSortMenuId(field.id);
                                      }
                                    }}
                                    className="p-1 rounded transition-all"
                                    style={{
                                      backgroundColor:
                                        sortConfig?.fieldId === field.id
                                          ? currentTheme.primary
                                          : `${currentTheme.primary}20`,
                                      color: sortConfig?.fieldId === field.id ? '#ffffff' : currentTheme.text,
                                    }}
                                    title="Sort options"
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </button>

                                  {/* Sort Menu Dropdown - Positioned above to avoid table hiding */}
                                  <AnimatePresence>
                                    {openSortMenuId === field.id && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="fixed z-99999 rounded-lg border shadow-2xl p-2 flex flex-col gap-1 whitespace-nowrap"
                                        style={{
                                          backgroundColor: currentTheme.surface,
                                          borderColor: currentTheme.border,
                                          top: `${menuPosition.top}px`,
                                          left: `${menuPosition.left}px`,
                                          transform: 'translate(-50%, -100%)',
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          onClick={() => {
                                            handleSort(field.id, 'asc');
                                            setOpenSortMenuId(null);
                                          }}
                                          className="px-3 py-1.5 text-xs font-bold rounded hover:opacity-80 transition-all text-left whitespace-nowrap"
                                          style={{
                                            backgroundColor:
                                              sortConfig?.fieldId === field.id && sortConfig?.order === 'asc'
                                                ? currentTheme.primary
                                                : currentTheme.background,
                                            color:
                                              sortConfig?.fieldId === field.id && sortConfig?.order === 'asc'
                                                ? '#ffffff'
                                                : currentTheme.text,
                                            border: `1px solid ${currentTheme.border}`,
                                          }}
                                          title="Sort Ascending"
                                        >
                                          A→Z ↑
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleSort(field.id, 'desc');
                                            setOpenSortMenuId(null);
                                          }}
                                          className="px-3 py-1.5 text-xs font-bold rounded hover:opacity-80 transition-all text-left whitespace-nowrap"
                                          style={{
                                            backgroundColor:
                                              sortConfig?.fieldId === field.id && sortConfig?.order === 'desc'
                                                ? currentTheme.primary
                                                : currentTheme.background,
                                            color:
                                              sortConfig?.fieldId === field.id && sortConfig?.order === 'desc'
                                                ? '#ffffff'
                                                : currentTheme.text,
                                            border: `1px solid ${currentTheme.border}`,
                                          }}
                                          title="Sort Descending"
                                        >
                                          Z→A ↓
                                        </button>
                                        {sortConfig?.fieldId === field.id && (
                                          <button
                                            onClick={() => {
                                              removeSorting();
                                              setOpenSortMenuId(null);
                                            }}
                                            className="px-3 py-1.5 text-xs font-bold rounded hover:opacity-80 transition-all text-left whitespace-nowrap"
                                            style={{
                                              backgroundColor: currentTheme.background,
                                              color: currentTheme.text,
                                              border: `1px solid ${currentTheme.border}`,
                                            }}
                                            title="Remove Sort"
                                          >
                                            ✕ Clear
                                          </button>
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}

                              {/* Resize handle */}
                              <div
                                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 hover:opacity-100 transition-opacity"
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
                        {/* Computed Columns Headers */}
                        {computedColumns.map((column) => (
                          <th
                            key={column.id}
                            className="px-2 py-2 border-b text-sm truncate border border-white relative group hover:border-black"
                            style={{
                              color: currentTheme.primary,
                              borderColor: currentTheme.border,
                              width: "150px",
                              minWidth: "100px",
                              backgroundColor: `${currentTheme.primary}10`,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate font-medium" title={column.name}>
                                {column.name}
                              </span>
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
                      {sortedRecords.map((record, index) => (
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
                              {renderRecordCellValue(field, record.data[field.id])}

                            </td>
                          ))}
                          {/* Computed Column Cells */}
                          {computedColumns.map((column) => {
                            const computedValue = computeColumnValue(record.data, column, formSchema);
                            return (
                              <td
                                key={column.id}
                                className="px-4 py-3 border-b text-sm truncate border border-white"
                                style={{
                                  color: currentTheme.primary,
                                  borderColor: currentTheme.border,
                                  backgroundColor: `${currentTheme.primary}05`,
                                  fontWeight: "500",
                                }}
                                title={computedValue !== null ? String(computedValue) : "N/A"}
                              >
                                {computedValue !== null ? String(computedValue) : "-"}
                              </td>
                            );
                          })}
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
                            {canDelete && (
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
                            )}
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
                    {editableFormFields.map((field) => (
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

                  {/* Computed Columns Display (Read-Only) */}
                  {computedColumnIds.length > 0 && (
                    <div className="mt-8 pt-6 border-t" style={{ borderColor: currentTheme.border }}>
                      <h3 className="text-sm font-semibold mb-4" style={{ color: currentTheme.text }}>
                        Computed Fields (Auto-calculated)
                      </h3>
                      <div className="grid grid-cols-3 gap-6 auto-rows-min">
                        {formSchema
                          .filter((field) => computedColumnIds.includes(field.id))
                          .map((field) => (
                            <div
                              key={field.id}
                              style={{
                                gridColumn: `span ${field.span || 1}`,
                              }}
                            >
                              <label
                                className="block text-sm font-medium mb-2"
                                style={{ color: currentTheme.text }}
                              >
                                {field.label}
                              </label>
                              <div
                                className="px-3 py-2 rounded-lg border text-sm"
                                style={{
                                  backgroundColor: `${currentTheme.primary}10`,
                                  borderColor: currentTheme.primary,
                                  color: currentTheme.text,
                                }}
                              >
                                {formData[field.id] !== undefined && formData[field.id] !== null
                                  ? String(formData[field.id])
                                  : "—"}
                              </div>
                              {field.helperText && (
                                <p
                                  className="text-xs mt-1"
                                  style={{ color: currentTheme.textSecondary }}
                                >
                                  {field.helperText}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
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

        {/* Computed Column Panel */}
        <ComputedColumnPanel
          isOpen={showComputedColumnPanel}
          onClose={() => setShowComputedColumnPanel(false)}
          dataFields={dataFields}
          onCreateColumn={handleCreateComputedColumn}
          currentTheme={currentTheme}
          isCreating={isComputingColumns}
        />
      </div>

      {/* ===== STOCK MANAGEMENT SIDEBAR ===== */}
      <AnimatePresence>
        {showStockSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowStockSidebar(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 z-50 shadow-2xl flex flex-col"
              style={{
                backgroundColor: currentTheme.surface,
                borderLeft: `1px solid ${currentTheme.border}`,
              }}
            >
              <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: currentTheme.border }}>
                <h2 className="text-lg font-bold" style={{ color: currentTheme.text }}>Stock Management</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowStockSidebar(false)}>
                  <X className="w-5 h-5" style={{ color: currentTheme.text }} />
                </Button>
              </div>
              <div className="flex-1 p-4 space-y-3">
                <button
                  onClick={() => { setStockSubPage('sell'); setShowStockSidebar(false); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border }}
                >
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#10b98120' }}>
                    <ShoppingCart className="w-5 h-5" style={{ color: '#10b981' }} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold" style={{ color: currentTheme.text }}>Sell Stocks</p>
                    <p className="text-xs" style={{ color: currentTheme.textSecondary }}>Sell products and generate invoices</p>
                  </div>
                </button>

                <button
                  onClick={() => { setStockSubPage('out-of-stock'); setShowStockSidebar(false); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border }}
                >
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#ef444420' }}>
                    <PackageX className="w-5 h-5" style={{ color: '#ef4444' }} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold" style={{ color: currentTheme.text }}>Out of Stock Items</p>
                    <p className="text-xs" style={{ color: currentTheme.textSecondary }}>{outOfStockItems.length} items currently out of stock</p>
                  </div>
                </button>

                <button
                  onClick={() => { setStockSubPage('invoices'); setShowStockSidebar(false); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border }}
                >
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${currentTheme.primary}20` }}>
                    <FileText className="w-5 h-5" style={{ color: currentTheme.primary }} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold" style={{ color: currentTheme.text }}>Generated Invoices</p>
                    <p className="text-xs" style={{ color: currentTheme.textSecondary }}>{generatedInvoices.length} invoices generated</p>
                  </div>
                </button>

                <button
                  onClick={() => { setStockSubPage('sales-history'); setShowStockSidebar(false); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border }}
                >
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${currentTheme.primary}20` }}>
                    <History className="w-5 h-5" style={{ color: currentTheme.primary }} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold" style={{ color: currentTheme.text }}>Sales History</p>
                    <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                      Daily sales + auto sold quantity list
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== STOCK SUB PAGES (full-screen overlays) ===== */}
      <AnimatePresence>
        {stockSubPage === 'sell' && (
          <motion.div
            key="sell-stocks"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: currentTheme.background }}
          >
            <SellStocks
              records={records}
              formSchema={formSchema}
              databaseId={currentDatabase._id}
              onBack={() => setStockSubPage(null)}
              onAddOutOfStock={(item) => {
                setOutOfStockItems((prev) => [
                  ...prev,
                  {
                    id: `oos-${Date.now()}`,
                    productName: item.productName,
                    requestedQty: item.requestedQty,
                    availableQty: item.availableQty,
                    addedAt: new Date().toISOString(),
                  },
                ]);
              }}
              onGenerateInvoice={(invoice) => {
                setGeneratedInvoices((prev) => [...prev, invoice]);
              }}
              onStockUpdated={() => {
                setRecords([]);
                setPage(1);
                setHasMore(true);
                loadMoreRecords(1, true);
              }}
            />
          </motion.div>
        )}

        {stockSubPage === 'out-of-stock' && (
          <motion.div
            key="out-of-stock"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: currentTheme.background }}
          >
            <OutOfStockItems
              items={outOfStockItems}
              onBack={() => setStockSubPage(null)}
              onRemoveItem={(id) => setOutOfStockItems((prev) => prev.filter((i) => i.id !== id))}
              onUpdateItem={(id, updates) =>
                setOutOfStockItems((prev) =>
                  prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
                )
              }
            />
          </motion.div>
        )}

        {stockSubPage === 'invoices' && (
          <motion.div
            key="invoices"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: currentTheme.background }}
          >
            <GeneratedInvoices
              invoices={generatedInvoices}
              onBack={() => setStockSubPage(null)}
              onRemoveInvoice={(id) => setGeneratedInvoices((prev) => prev.filter((i) => i.id !== id))}
            />
          </motion.div>
        )}

        {stockSubPage === 'sales-history' && (
          <motion.div
            key="sales-history"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: currentTheme.background }}
          >
            <SalesHistoryTracker
              invoices={generatedInvoices}
              onBack={() => setStockSubPage(null)}
              onOpenRecommender={() => {
                setStockSubPage(null);
                setShowRecommender(true);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
