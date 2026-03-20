"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  Plus,
  ChevronLeft,
  Minimize2,
  Maximize2,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DatabaseFolder = {
  _id: string;
  DatabaseName: string;
  formSchema: any[];
  records: any[];
};

type FieldAttributes = {
  id: string;
  label: string;
  type: string;
  span?: number;
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

type AnalyticsVisual = "bar" | "line" | "pie";

const AUTO_SALES_HISTORY_OPTION = "__auto_invoice_sales_history__";

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

interface RecommendationsPageProps {
  currentDatabase: DatabaseFolder;
  userRole?: "Admin" | "Editor" | "Viewer";
  onBack: () => void;
  searchQuery?: string;
  dateFilter?: string;
  generatedInvoices?: any[];
  records?: any[];
}

export default function RecommendationsPage({
  currentDatabase,
  userRole,
  onBack,
  searchQuery = "",
  dateFilter = "",
  generatedInvoices = [],
  records: passedRecords = [],
}: RecommendationsPageProps) {
  const { currentTheme } = useTheme();
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");
  const [recommendationResult, setRecommendationResult] = useState<ReplenishmentResponse | null>(null);
  const [expandedAnalyticsVisual, setExpandedAnalyticsVisual] = useState<AnalyticsVisual | null>(null);
  const [forecastDays, setForecastDays] = useState(14);
  const [topNRecommendations, setTopNRecommendations] = useState(20);
  const [autoRefreshRecommendations, setAutoRefreshRecommendations] = useState(false);
  const [analyticsFieldId, setAnalyticsFieldId] = useState("");
  const [barChartCategoryFieldId, setBarChartCategoryFieldId] = useState("");
  const [barChartNumericFieldId, setBarChartNumericFieldId] = useState("");
  const [lineChartCategoryFieldId, setLineChartCategoryFieldId] = useState("");
  const [lineChartNumericFieldId, setLineChartNumericFieldId] = useState("");
  
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

  const formSchema = useMemo(
    () => (currentDatabase ? currentDatabase.formSchema : []),
    [currentDatabase]
  );

  const records = useMemo(
    () => passedRecords && passedRecords.length > 0 ? passedRecords : (currentDatabase?.records || []),
    [passedRecords, currentDatabase]
  );

  const dataFields = useMemo(
    () =>
      formSchema.filter(
        (field) => field.type !== "text" && field.type !== "separator"
      ),
    [formSchema]
  );

  const isAutoSalesHistorySelected =
    recommenderFieldMap.salesHistoryFieldId === AUTO_SALES_HISTORY_OPTION;

  const salesHistoryOverrides = useMemo<Record<string, number[]>>(() => {
    const salesByItem = new Map<string, Map<string, number>>();

    generatedInvoices.forEach((invoice) => {
      const dateKey = new Date(invoice.date).toISOString().slice(0, 10);

      invoice.items.forEach((item: any) => {
        if (!salesByItem.has(item.name)) {
          salesByItem.set(item.name, new Map());
        }
        const perDayMap = salesByItem.get(item.name)!;
        perDayMap.set(
          dateKey,
          (perDayMap.get(dateKey) || 0) + (item.qty || 1)
        );
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

  const numericAnalyticsFields = useMemo(
    () => {
      if (!records || records.length === 0 || !dataFields || dataFields.length === 0) return [];
      return dataFields.filter((field) =>
        records.some((record) => record?.data && parseNumericValue(record.data[field.id]) !== null)
      );
    },
    [dataFields, records]
  );

  const categoricalAnalyticsFields = useMemo(
    () => {
      if (!records || records.length === 0 || !dataFields || dataFields.length === 0) return [];
      return dataFields.filter((field) =>
        records.some((record) => {
          const value = record?.data?.[field.id];
          return typeof value === "string" && value.trim().length > 0;
        })
      );
    },
    [dataFields, records]
  );

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

  const formatXAxisTick = useCallback(
    (value: string | number, expanded: boolean) => {
      const source = String(value ?? "");
      const maxChars = expanded ? 20 : 10;
      return source.length > maxChars ? `${source.slice(0, maxChars)}...` : source;
    },
    []
  );

  useEffect(() => {
    if (!dataFields.length) return;
    setRecommenderFieldMap((prev) => {
      const suggestions = {
        stockFieldId: ["stock", "quantity", "qty", "inventory"].reduce((match, keyword) => {
          if (match) return match;
          return dataFields.find((f) =>
            `${f.id} ${f.label}`.toLowerCase().includes(keyword)
          )?.id || "";
        }, ""),
        salesHistoryFieldId: "auto",
        skuFieldId: ["sku", "code", "product code"].reduce((match, keyword) => {
          if (match) return match;
          return dataFields.find((f) =>
            `${f.id} ${f.label}`.toLowerCase().includes(keyword)
          )?.id || "";
        }, ""),
      };

      return {
        ...prev,
        stockFieldId: prev.stockFieldId || suggestions.stockFieldId,
        salesHistoryFieldId: prev.salesHistoryFieldId || AUTO_SALES_HISTORY_OPTION,
        skuFieldId: prev.skuFieldId || suggestions.skuFieldId,
      };
    });
  }, [dataFields]);

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
          salesHistoryOverrides: hasSalesHistoryOverrides ? salesHistoryOverrides : undefined,
          skuFieldId: recommenderFieldMap.skuFieldId || undefined,
          nameFieldId: recommenderFieldMap.nameFieldId || undefined,
          reorderPointFieldId: recommenderFieldMap.reorderPointFieldId || undefined,
          leadTimeDaysFieldId: recommenderFieldMap.leadTimeDaysFieldId || undefined,
          safetyStockDaysFieldId: recommenderFieldMap.safetyStockDaysFieldId || undefined,
          incomingReplenishmentFieldId: recommenderFieldMap.incomingReplenishmentFieldId || undefined,
          forecastDays,
          topN: topNRecommendations,
          search: searchQuery || undefined,
          date: dateFilter || undefined,
        }
      );
      setRecommendationResult(response.data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      const message = axiosError?.response?.data?.error || "Failed to load recommendations.";
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
    if (!autoRefreshRecommendations || !currentDatabase) return;

    const interval = setInterval(() => {
      fetchRecommendations();
    }, 60000);

    return () => clearInterval(interval);
  }, [autoRefreshRecommendations, currentDatabase, fetchRecommendations]);

  // Early return if currentDatabase is not available
  if (!currentDatabase) {
    return (
      <div style={{ backgroundColor: currentTheme.background }} className="h-screen flex items-center justify-center">
        <p style={{ color: currentTheme.text }}>Database not available</p>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col overflow-auto"
      style={{ backgroundColor: currentTheme.background }}
    >
      {/* Header */}
      <div
        className="border-b px-6 py-4 sticky top-0 z-10"
        style={{
          backgroundColor: currentTheme.surface,
          borderColor: currentTheme.border,
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              style={{ color: currentTheme.text }}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: currentTheme.text }}>
                Dynamic Replenishment Recommender
              </h1>
              <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                Real-time stock guidance using future sales prediction.
              </p>
            </div>
          </div>
          <Button
            onClick={fetchRecommendations}
            disabled={isLoadingRecommendations}
            style={{ backgroundColor: currentTheme.primary, color: "#ffffff" }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isLoadingRecommendations ? "Generating..." : "Generate Recommendations"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="space-y-4 max-w-7xl mx-auto">
          {/* Configuration Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: currentTheme.text }}>
              Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <p className="text-xs mb-1" style={{ color: currentTheme.textSecondary }}>
                  Stock Field *
                </p>
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
                <p className="text-xs mb-1" style={{ color: currentTheme.textSecondary }}>
                  Sales History Field *
                </p>
                <select
                  value={recommenderFieldMap.salesHistoryFieldId}
                  onChange={(e) =>
                    setRecommenderFieldMap((prev) => ({
                      ...prev,
                      salesHistoryFieldId: e.target.value,
                    }))
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
                <p className="text-xs mb-1" style={{ color: currentTheme.textSecondary }}>
                  SKU Field
                </p>
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
                <p className="text-xs mb-1" style={{ color: currentTheme.textSecondary }}>
                  Product Name Field
                </p>
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
                <p className="text-xs mb-1" style={{ color: currentTheme.textSecondary }}>
                  Forecast Days
                </p>
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
                <p className="text-xs mb-1" style={{ color: currentTheme.textSecondary }}>
                  Top Recommendations
                </p>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={topNRecommendations}
                  onChange={(e) =>
                    setTopNRecommendations(Math.max(1, Number(e.target.value) || 20))
                  }
                  style={{
                    backgroundColor: currentTheme.background,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                />
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: currentTheme.textSecondary }}>
                  Lead Time Field
                </p>
                <select
                  value={recommenderFieldMap.leadTimeDaysFieldId}
                  onChange={(e) =>
                    setRecommenderFieldMap((prev) => ({
                      ...prev,
                      leadTimeDaysFieldId: e.target.value,
                    }))
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
                <p className="text-xs mb-1" style={{ color: currentTheme.textSecondary }}>
                  Auto Refresh (60s)
                </p>
                <div
                  className="h-10 rounded-md px-3 flex items-center"
                  style={{ border: `1px solid ${currentTheme.border}` }}
                >
                  <Checkbox
                    checked={autoRefreshRecommendations}
                    onCheckedChange={(checked) =>
                      setAutoRefreshRecommendations(Boolean(checked))
                    }
                  />
                  <span
                    className="text-xs ml-2"
                    style={{ color: currentTheme.textSecondary }}
                  >
                    Keep recommendations live
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {recommendationError && (
            <p className="text-sm px-4 py-2 rounded" style={{ color: "#ef4444", backgroundColor: "#ef444420" }}>
              {recommendationError}
            </p>
          )}

          {/* Results Section */}
          {recommendationResult && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold" style={{ color: currentTheme.text }}>
                Recommendations
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card
                  className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    border: `1px solid #ef4444`,
                    backgroundColor: currentTheme.background,
                  }}
                >
                  <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                    Order Now
                  </p>
                  <p className="text-xl font-bold" style={{ color: "#ef4444" }}>
                    {recommendationResult.summary.orderNowCount}
                  </p>
                </Card>
                <Card
                  className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    border: `1px solid #f59e0b`,
                    backgroundColor: currentTheme.background,
                  }}
                >
                  <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                    Order Soon
                  </p>
                  <p className="text-xl font-bold" style={{ color: "#f59e0b" }}>
                    {recommendationResult.summary.orderSoonCount}
                  </p>
                </Card>
                <Card
                  className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    border: `1px solid #10b981`,
                    backgroundColor: currentTheme.background,
                  }}
                >
                  <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                    Healthy
                  </p>
                  <p className="text-xl font-bold" style={{ color: "#10b981" }}>
                    {recommendationResult.summary.healthyCount}
                  </p>
                </Card>
                <Card
                  className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    border: `1px solid #0ea5e9`,
                    backgroundColor: currentTheme.background,
                  }}
                >
                  <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                    Overstock
                  </p>
                  <p className="text-xl font-bold" style={{ color: "#0ea5e9" }}>
                    {recommendationResult.summary.overstockCount}
                  </p>
                </Card>
                <Card
                  className="p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    border: `1px solid #8b5cf6`,
                    backgroundColor: currentTheme.background,
                  }}
                >
                  <p className="text-xs" style={{ color: currentTheme.textSecondary }}>
                    Recommended Units
                  </p>
                  <p className="text-xl font-bold" style={{ color: currentTheme.text }}>
                    {recommendationResult.summary.totalRecommendedUnits}
                  </p>
                </Card>
              </div>

              {/* Recommendations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-96 overflow-auto">
                {recommendationResult.recommendations.map((recommendation) => {
                  const badge = getActionBadgeStyles(recommendation.action);
                  return (
                    <Card
                      key={`${recommendation.sku}-${recommendation.urgencyScore}`}
                      className="p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        border: `1px solid ${badge.background}`,
                        backgroundColor: currentTheme.background,
                      }}
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
                          Urgency Score:{" "}
                          <span style={{ color: currentTheme.text }}>
                            {recommendation.urgencyScore}
                          </span>
                        </p>
                        <p style={{ color: currentTheme.textSecondary }}>
                          Order Qty:{" "}
                          <span style={{ color: currentTheme.text }}>
                            {recommendation.recommendedOrderQty}
                          </span>
                        </p>
                        <p style={{ color: currentTheme.textSecondary }}>
                          Daily Sales:{" "}
                          <span style={{ color: currentTheme.text }}>
                            {recommendation.predictedDailySales}
                          </span>
                        </p>
                        <p style={{ color: currentTheme.textSecondary }}>
                          Stockout (days):{" "}
                          <span style={{ color: currentTheme.text }}>
                            {recommendation.daysUntilStockout}
                          </span>
                        </p>
                      </div>

                      <p
                        className="text-xs p-2 rounded"
                        style={{
                          color: currentTheme.text,
                          backgroundColor: `${badge.background}20`,
                        }}
                      >
                        {recommendation.explanation}
                      </p>
                    </Card>
                  );
                })}
              </div>

              {/* Warnings */}
              {recommendationResult.warnings.length > 0 && (
                <Card
                  className="p-3 transition-all duration-200"
                  style={{
                    border: `1px solid ${currentTheme.border}`,
                    backgroundColor: currentTheme.background,
                  }}
                >
                  <p className="text-sm font-semibold mb-2" style={{ color: currentTheme.text }}>
                    Data Warnings
                  </p>
                  <div className="max-h-24 overflow-auto space-y-1">
                    {recommendationResult.warnings.map((warning) => (
                      <p
                        key={warning}
                        className="text-xs"
                        style={{ color: currentTheme.textSecondary }}
                      >
                        {warning}
                      </p>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Empty State */}
          {!recommendationResult && !isLoadingRecommendations && (
            <Card
              className="p-8 text-center"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: currentTheme.textSecondary }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: currentTheme.text }}>
                Ready to Generate Recommendations
              </h3>
              <p className="mb-4" style={{ color: currentTheme.textSecondary }}>
                Configure your fields and click "Generate Recommendations" to get started.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
