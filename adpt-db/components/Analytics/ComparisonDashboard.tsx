'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  ArrowLeft,
  Plus,
  Trash2,
  X,
  RefreshCw,
  Database,
  TrendingUp,
  TrendingDown,
  Grid3x3,
  NotebookTabs,
  Calculator,
  Maximize2,
  Layers,
  PieChartIcon,
  Zap,
  RadarIcon,
  Shuffle,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

/* ─── Types ────────────────────────────────────────── */

interface FormField {
  id: string;
  label: string;
  type: string;
}

interface DatabaseRecord {
  id: string;
  data: Record<string, unknown>;
  createdAt: string;
}

interface FullDatabase {
  _id: string;
  DatabaseName: string;
  formSchema: FormField[];
  records: DatabaseRecord[];
  totalRecords: number;
}

type ChartType =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'scatter'
  | 'radar'
  | 'stackedBar'
  | 'composed'
  | 'doughnut'
  | 'horizontalBar';

type AggOperation = 'sum' | 'average' | 'min' | 'max' | 'count' | 'median';

interface ChartSeries {
  databaseId: string;
  fieldId: string;
}

interface ComparisonChart {
  id: string;
  type: ChartType;
  title: string;
  series: ChartSeries[];
  categoryDatabaseId: string;
  categoryFieldId: string;
}

interface AggregationCard {
  id: string;
  databaseId: string;
  fieldId: string;
  operation: AggOperation;
}

interface NewChartState {
  type: ChartType;
  title: string;
  series: ChartSeries[];
  categoryDatabaseId: string;
  categoryFieldId: string;
  tempDbId: string;
  tempFieldId: string;
}

/* ─── Constants ────────────────────────────────────── */

const DB_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9',
  '#f97316', '#8b5cf6', '#ef4444', '#14b8a6', '#a855f7',
];

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
  { value: 'pie', label: 'Pie' },
  { value: 'doughnut', label: 'Doughnut' },
  { value: 'scatter', label: 'Scatter' },
  { value: 'radar', label: 'Radar' },
  { value: 'stackedBar', label: 'Stacked' },
  { value: 'composed', label: 'Composed' },
  { value: 'horizontalBar', label: 'H-Bar' },
];

const AGG_OPERATIONS: { value: AggOperation; label: string }[] = [
  { value: 'sum', label: 'Sum' },
  { value: 'average', label: 'Average' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
  { value: 'count', label: 'Count' },
  { value: 'median', label: 'Median' },
];

const AGG_ICONS: Record<AggOperation, typeof Calculator> = {
  sum: Calculator,
  average: TrendingUp,
  min: Layers,
  max: Layers,
  count: Grid3x3,
  median: TrendingUp,
};

const CHART_ICONS: Record<ChartType, typeof BarChart3> = {
  bar: BarChart3,
  line: TrendingUp,
  area: TrendingDown,
  pie: PieChartIcon,
  doughnut: PieChartIcon,
  scatter: Zap,
  radar: RadarIcon,
  stackedBar: Layers,
  composed: Shuffle,
  horizontalBar: Minus,
};

/* ─── Utilities ────────────────────────────────────── */

function computeAggregate(
  records: DatabaseRecord[],
  fieldId: string,
  operation: AggOperation
): number {
  const values = records
    .map((r) => {
      const v = r.data?.[fieldId];
      return typeof v === 'number' ? v : parseFloat(String(v));
    })
    .filter((v) => Number.isFinite(v));

  if (values.length === 0) return 0;

  switch (operation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'average':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'count':
      return values.length;
    case 'median': {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    }
  }
}

function fmtNum(n: number): string {
  if (n === 0) return '0';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function getNumericFields(schema: FormField[]): FormField[] {
  return schema.filter(
    (f) => f.type === 'input-number' || f.type === 'slider'
  );
}

function getCategoricalFields(schema: FormField[]): FormField[] {
  return schema.filter(
    (f) =>
      f.type === 'input-text' ||
      f.type === 'select' ||
      f.type === 'radio' ||
      f.type === 'combobox' ||
      f.type === 'multi-select' ||
      f.type === 'tag-input'
  );
}

function getAllDataFields(schema: FormField[]): FormField[] {
  return schema.filter((f) => f.type !== 'text' && f.type !== 'separator');
}

const EMPTY_CHART: NewChartState = {
  type: 'bar',
  title: '',
  series: [],
  categoryDatabaseId: '',
  categoryFieldId: '',
  tempDbId: '',
  tempFieldId: '',
};

/* ─── Component ────────────────────────────────────── */

export default function ComparisonDashboard({
  databaseIds,
}: {
  databaseIds: string[];
}) {
  const { currentTheme } = useTheme();
  const router = useRouter();

  /* — data — */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedDbs, setLoadedDbs] = useState<FullDatabase[]>([]);

  /* — aggregation cards — */
  const [aggCards, setAggCards] = useState<AggregationCard[]>([]);
  const [showAggModal, setShowAggModal] = useState(false);
  const [newAgg, setNewAgg] = useState<Partial<AggregationCard>>({});

  /* — charts — */
  const [charts, setCharts] = useState<ComparisonChart[]>([]);
  const [showChartModal, setShowChartModal] = useState(false);
  const [newChart, setNewChart] = useState<NewChartState>({ ...EMPTY_CHART });
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);

  /* ─── Load databases ─────────────────────────────── */

  const fetchDatabases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const responses = await Promise.all(
        databaseIds.map((id) => axios.get(`/api/databases/${id}`))
      );
      const dbs: FullDatabase[] = responses.map((r) => r.data);
      setLoadedDbs(dbs);

      /* auto-create comparison chart + agg cards on first load */
      if (charts.length === 0 && aggCards.length === 0) {
        const autoCharts: ComparisonChart[] = [];
        const autoAggs: AggregationCard[] = [];

        const seriesForDefault: ChartSeries[] = [];
        dbs.forEach((db) => {
          const nf = getNumericFields(db.formSchema);
          if (nf.length > 0) {
            seriesForDefault.push({ databaseId: db._id, fieldId: nf[0].id });
            autoAggs.push({
              id: `agg-${db._id}-${Date.now()}`,
              databaseId: db._id,
              fieldId: nf[0].id,
              operation: 'sum',
            });
          }
        });

        if (seriesForDefault.length > 0) {
          const catFields = getCategoricalFields(dbs[0].formSchema);
          autoCharts.push({
            id: `auto-${Date.now()}`,
            type: 'bar',
            title: 'Database Comparison',
            series: seriesForDefault,
            categoryDatabaseId: catFields.length > 0 ? dbs[0]._id : '',
            categoryFieldId: catFields[0]?.id || '',
          });
        }

        setCharts(autoCharts);
        setAggCards(autoAggs);
      }
    } catch (err) {
      console.error('Failed to load databases:', err);
      setError('Failed to load databases. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [databaseIds]);

  useEffect(() => {
    if (databaseIds.length > 0) {
      fetchDatabases();
    }
  }, [databaseIds, fetchDatabases]);

  /* ─── Handlers ───────────────────────────────────── */

  const addAggCard = () => {
    if (!newAgg.databaseId || !newAgg.fieldId || !newAgg.operation) return;
    setAggCards((p) => [
      ...p,
      {
        id: `agg-${Date.now()}`,
        databaseId: newAgg.databaseId!,
        fieldId: newAgg.fieldId!,
        operation: newAgg.operation!,
      },
    ]);
    setNewAgg({});
    setShowAggModal(false);
  };

  const addChart = () => {
    if (!newChart.type || newChart.series.length === 0) return;
    setCharts((p) => [
      ...p,
      {
        id: `chart-${Date.now()}`,
        type: newChart.type,
        title: newChart.title || `${newChart.type.toUpperCase()} Chart`,
        series: newChart.series,
        categoryDatabaseId: newChart.categoryDatabaseId,
        categoryFieldId: newChart.categoryFieldId,
      },
    ]);
    setNewChart({ ...EMPTY_CHART });
    setShowChartModal(false);
  };

  const pushSeries = () => {
    if (!newChart.tempDbId || !newChart.tempFieldId) return;
    setNewChart((p) => ({
      ...p,
      series: [...p.series, { databaseId: p.tempDbId, fieldId: p.tempFieldId }],
      tempDbId: '',
      tempFieldId: '',
    }));
  };

  /* ─── Chart data preparation ─────────────────────── */

  const prepareChartData = useCallback(
    (chart: ComparisonChart): { data: Record<string, unknown>[]; keys: string[] } => {
      const keys: string[] = [];
      const labeled = chart.series.map((s) => {
        const db = loadedDbs.find((d) => d._id === s.databaseId);
        const field = db?.formSchema.find((f) => f.id === s.fieldId);
        const label = `${db?.DatabaseName ?? 'DB'} – ${field?.label ?? s.fieldId}`;
        keys.push(label);
        return { ...s, label };
      });

      if (!chart.categoryFieldId) {
        return {
          data: labeled.map((s) => {
            const db = loadedDbs.find((d) => d._id === s.databaseId);
            return {
              name: s.label,
              value: db ? computeAggregate(db.records, s.fieldId, 'sum') : 0,
            };
          }),
          keys,
        };
      }

      const allCats = new Set<string>();
      chart.series.forEach((s) => {
        const db = loadedDbs.find((d) => d._id === s.databaseId);
        db?.records.forEach((r) => {
          const v = r.data?.[chart.categoryFieldId];
          if (v !== undefined && v !== null && String(v).trim())
            allCats.add(String(v).trim());
        });
      });

      const categories = [...allCats].slice(0, 25);
      const data = categories.map((cat) => {
        const entry: Record<string, unknown> = { name: cat };
        labeled.forEach((s) => {
          const db = loadedDbs.find((d) => d._id === s.databaseId);
          if (!db) {
            entry[s.label] = 0;
            return;
          }
          const matching = db.records.filter(
            (r) => String(r.data?.[chart.categoryFieldId] ?? '').trim() === cat
          );
          entry[s.label] = computeAggregate(matching, s.fieldId, 'sum');
        });
        return entry;
      });

      return { data, keys };
    },
    [loadedDbs]
  );

  /* ─── Chart renderer ─────────────────────────────── */

  const renderChart = useCallback(
    (
      chart: ComparisonChart,
      chartData: Record<string, unknown>[],
      seriesKeys: string[],
      height: number
    ) => {
      const hasCat = !!chart.categoryFieldId;
      const categoryDb = loadedDbs.find((d) => d._id === chart.categoryDatabaseId);
      const categoryField = categoryDb?.formSchema.find((f) => f.id === chart.categoryFieldId);
      const xAxisLabel = hasCat
        ? categoryField?.label || 'Category'
        : chart.type === 'scatter'
          ? 'Data Point Index'
          : 'Series';
      const yAxisLabel =
        seriesKeys.length === 1
          ? seriesKeys[0]
          : seriesKeys.length > 1
            ? 'Aggregated Value'
            : 'Value';
      const tip = {
        contentStyle: {
          backgroundColor: currentTheme.surface,
          border: `1px solid ${currentTheme.border}`,
          color: currentTheme.text,
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          fontSize: 12,
        },
      };

      switch (chart.type) {
        case 'bar':
          return (
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} opacity={0.3} />
                <XAxis
                  dataKey="name"
                  stroke={currentTheme.textSecondary}
                  angle={-35}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 11 }}
                  label={{ value: xAxisLabel, position: 'insideBottom', offset: -4, fill: currentTheme.textSecondary, fontSize: 11 }}
                />
                <YAxis
                  stroke={currentTheme.textSecondary}
                  tick={{ fontSize: 11 }}
                  label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: currentTheme.textSecondary, fontSize: 11 }}
                />
                <Tooltip {...tip} />
                <Legend />
                {hasCat ? (
                  seriesKeys.map((k, i) => (
                    <Bar key={k} dataKey={k} fill={DB_COLORS[i % DB_COLORS.length]} radius={[6, 6, 0, 0]} />
                  ))
                ) : (
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={DB_COLORS[i % DB_COLORS.length]} />
                    ))}
                  </Bar>
                )}
              </BarChart>
            </ResponsiveContainer>
          );

        case 'horizontalBar':
          return (
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} opacity={0.3} />
                <XAxis
                  type="number"
                  stroke={currentTheme.textSecondary}
                  tick={{ fontSize: 11 }}
                  label={{ value: yAxisLabel, position: 'insideBottom', offset: -2, fill: currentTheme.textSecondary, fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke={currentTheme.textSecondary}
                  tick={{ fontSize: 11 }}
                  width={90}
                  label={{ value: xAxisLabel, angle: -90, position: 'insideLeft', fill: currentTheme.textSecondary, fontSize: 11 }}
                />
                <Tooltip {...tip} />
                <Legend />
                {hasCat ? (
                  seriesKeys.map((k, i) => (
                    <Bar key={k} dataKey={k} fill={DB_COLORS[i % DB_COLORS.length]} radius={[0, 6, 6, 0]} />
                  ))
                ) : (
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={DB_COLORS[i % DB_COLORS.length]} />
                    ))}
                  </Bar>
                )}
              </BarChart>
            </ResponsiveContainer>
          );

        case 'stackedBar':
          return (
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} opacity={0.3} />
                <XAxis
                  dataKey="name"
                  stroke={currentTheme.textSecondary}
                  angle={-35}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 11 }}
                  label={{ value: xAxisLabel, position: 'insideBottom', offset: -4, fill: currentTheme.textSecondary, fontSize: 11 }}
                />
                <YAxis
                  stroke={currentTheme.textSecondary}
                  tick={{ fontSize: 11 }}
                  label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: currentTheme.textSecondary, fontSize: 11 }}
                />
                <Tooltip {...tip} />
                <Legend />
                {seriesKeys.map((k, i) => (
                  <Bar
                    key={k}
                    dataKey={k}
                    stackId="s"
                    fill={DB_COLORS[i % DB_COLORS.length]}
                    radius={i === seriesKeys.length - 1 ? [6, 6, 0, 0] : undefined}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          );

        case 'line':
          return (
            <ResponsiveContainer width="100%" height={height}>
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} opacity={0.3} />
                <XAxis
                  dataKey="name"
                  stroke={currentTheme.textSecondary}
                  angle={-35}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 11 }}
                  label={{ value: xAxisLabel, position: 'insideBottom', offset: -4, fill: currentTheme.textSecondary, fontSize: 11 }}
                />
                <YAxis
                  stroke={currentTheme.textSecondary}
                  tick={{ fontSize: 11 }}
                  label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: currentTheme.textSecondary, fontSize: 11 }}
                />
                <Tooltip {...tip} />
                <Legend />
                {hasCat ? (
                  seriesKeys.map((k, i) => (
                    <Line key={k} type="monotone" dataKey={k} stroke={DB_COLORS[i % DB_COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  ))
                ) : (
                  <Line type="monotone" dataKey="value" stroke={currentTheme.primary} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          );

        case 'area':
          return (
            <ResponsiveContainer width="100%" height={height}>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} opacity={0.3} />
                <XAxis
                  dataKey="name"
                  stroke={currentTheme.textSecondary}
                  angle={-35}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 11 }}
                  label={{ value: xAxisLabel, position: 'insideBottom', offset: -4, fill: currentTheme.textSecondary, fontSize: 11 }}
                />
                <YAxis
                  stroke={currentTheme.textSecondary}
                  tick={{ fontSize: 11 }}
                  label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: currentTheme.textSecondary, fontSize: 11 }}
                />
                <Tooltip {...tip} />
                <Legend />
                {hasCat ? (
                  seriesKeys.map((k, i) => (
                    <Area key={k} type="monotone" dataKey={k} fill={DB_COLORS[i % DB_COLORS.length]} stroke={DB_COLORS[i % DB_COLORS.length]} fillOpacity={0.25} />
                  ))
                ) : (
                  <Area type="monotone" dataKey="value" fill={currentTheme.primary} stroke={currentTheme.primary} fillOpacity={0.25} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          );

        case 'pie':
        case 'doughnut': {
          const pieData = hasCat
            ? chartData.map((d) => ({
                name: d.name as string,
                value: (seriesKeys.length > 0 ? d[seriesKeys[0]] : d.value) as number || 0,
              }))
            : chartData.map((d) => ({ name: d.name as string, value: (d.value as number) || 0 }));
          const inner = chart.type === 'doughnut' ? Math.round(height / 5) : 0;
          return (
            <ResponsiveContainer width="100%" height={height}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={Math.round(height / 3)}
                  innerRadius={inner}
                  label={({ name, value }: { name?: string; value?: number }) =>
                    `${name ?? ''}: ${fmtNum(value ?? 0)}`
                  }
                  labelLine={{ stroke: currentTheme.textSecondary }}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={DB_COLORS[i % DB_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          );
        }

        case 'scatter': {
          const scatterData = chartData.map((d, idx) => ({
            x: idx,
            y: ((hasCat && seriesKeys[0] ? d[seriesKeys[0]] : d.value) as number) || 0,
            name: d.name as string,
          }));
          return (
            <ResponsiveContainer width="100%" height={height}>
              <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} opacity={0.3} />
                <XAxis
                  type="number"
                  dataKey="x"
                  stroke={currentTheme.textSecondary}
                  tick={{ fontSize: 11 }}
                  name={xAxisLabel}
                  label={{ value: xAxisLabel, position: 'insideBottom', offset: -2, fill: currentTheme.textSecondary, fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  stroke={currentTheme.textSecondary}
                  tick={{ fontSize: 11 }}
                  name={yAxisLabel}
                  label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: currentTheme.textSecondary, fontSize: 11 }}
                />
                <Tooltip {...tip} />
                <Scatter data={scatterData} fill={currentTheme.primary}>
                  {scatterData.map((_, i) => (
                    <Cell key={i} fill={DB_COLORS[i % DB_COLORS.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          );
        }

        case 'radar': {
          const radarData = chartData.map((d) => {
            const entry: Record<string, unknown> = { subject: d.name };
            if (hasCat) {
              seriesKeys.forEach((k) => { entry[k] = (d[k] as number) || 0; });
            } else {
              entry.value = (d.value as number) || 0;
            }
            return entry;
          });
          return (
            <ResponsiveContainer width="100%" height={height}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={Math.round(height / 3)}>
                <PolarGrid stroke={currentTheme.border} />
                <PolarAngleAxis dataKey="subject" stroke={currentTheme.textSecondary} tick={{ fontSize: 10 }} />
                <PolarRadiusAxis stroke={currentTheme.textSecondary} tick={{ fontSize: 9 }} />
                {hasCat ? (
                  seriesKeys.map((k, i) => (
                    <Radar key={k} name={k} dataKey={k} stroke={DB_COLORS[i % DB_COLORS.length]} fill={DB_COLORS[i % DB_COLORS.length]} fillOpacity={0.2} />
                  ))
                ) : (
                  <Radar name="Value" dataKey="value" stroke={currentTheme.primary} fill={currentTheme.primary} fillOpacity={0.25} />
                )}
                <Legend />
                <Tooltip {...tip} />
              </RadarChart>
            </ResponsiveContainer>
          );
        }

        case 'composed':
          return (
            <ResponsiveContainer width="100%" height={height}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} opacity={0.3} />
                <XAxis
                  dataKey="name"
                  stroke={currentTheme.textSecondary}
                  angle={-35}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 11 }}
                  label={{ value: xAxisLabel, position: 'insideBottom', offset: -4, fill: currentTheme.textSecondary, fontSize: 11 }}
                />
                <YAxis
                  stroke={currentTheme.textSecondary}
                  tick={{ fontSize: 11 }}
                  label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: currentTheme.textSecondary, fontSize: 11 }}
                />
                <Tooltip {...tip} />
                <Legend />
                {hasCat ? (
                  seriesKeys.map((k, i) =>
                    i % 2 === 0 ? (
                      <Bar key={k} dataKey={k} fill={DB_COLORS[i % DB_COLORS.length]} radius={[6, 6, 0, 0]} barSize={28} />
                    ) : (
                      <Line key={k} type="monotone" dataKey={k} stroke={DB_COLORS[i % DB_COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} />
                    )
                  )
                ) : (
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={DB_COLORS[i % DB_COLORS.length]} />
                    ))}
                  </Bar>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          );

        default:
          return (
            <div className="flex items-center justify-center py-16" style={{ color: currentTheme.textSecondary }}>
              Unsupported chart type
            </div>
          );
      }
    },
    [currentTheme, loadedDbs]
  );

  /* ─── Overview stats ───────────────────────────── */

  const stats = useMemo(() => {
    const totalRecords = loadedDbs.reduce(
      (s, db) => s + (db.totalRecords || db.records?.length || 0),
      0
    );
    const totalFields = loadedDbs.reduce(
      (s, db) => s + (db.formSchema?.length || 0),
      0
    );
    const nums: number[] = [];
    loadedDbs.forEach((db) => {
      getNumericFields(db.formSchema).forEach((f) => {
        db.records.forEach((r) => {
          const v = parseFloat(String(r.data?.[f.id]));
          if (Number.isFinite(v)) nums.push(v);
        });
      });
    });
    return {
      databases: loadedDbs.length,
      totalRecords,
      totalFields,
      avgValue: nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : '0',
    };
  }, [loadedDbs]);

  /* ─── Loading state ─────────────────────────────── */

  if (loading) {
    return (
      <div
        className="w-full min-h-screen flex items-center justify-center"
        style={{ backgroundColor: currentTheme.background }}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <RefreshCw
            className="w-16 h-16 animate-spin mx-auto mb-6"
            style={{ color: currentTheme.primary }}
          />
          <p className="text-xl font-semibold mb-2" style={{ color: currentTheme.text }}>
            Loading Analytics
          </p>
          <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
            Fetching data from {databaseIds.length} database
            {databaseIds.length !== 1 ? 's' : ''}…
          </p>
        </motion.div>
      </div>
    );
  }

  /* ─── Error state ───────────────────────────────── */

  if (error) {
    return (
      <div
        className="w-full min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: currentTheme.background }}
      >
        <Card
          className="max-w-md p-8 text-center"
          style={{ backgroundColor: currentTheme.surface, border: `1px solid ${currentTheme.border}` }}
        >
          <p style={{ color: currentTheme.text }} className="mb-6">{error}</p>
          <Button onClick={() => router.back()} style={{ backgroundColor: currentTheme.primary, color: '#ffffff' }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </Card>
      </div>
    );
  }

  /* ─── Main render ───────────────────────────────── */

  const fullscreenChart = fullscreenId ? charts.find((c) => c.id === fullscreenId) : null;

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: currentTheme.background }}>
      {/* ─── Header ─── */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{
          borderColor: currentTheme.border,
          backgroundColor: `${currentTheme.background}e8`,
        }}
      >
        <div className="max-w-400 mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="rounded-lg"
              style={{backgroundColor:currentTheme.primary, color: "#ffffff"}}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1
                className="text-xl font-bold flex items-center gap-2"
                style={{ color: currentTheme.text }}
              >
                <BarChart3 className="w-5 h-5" style={{ color: currentTheme.primary }} />
                Analytics Studio
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {loadedDbs.map((db, i) => (
                  <span
                    key={db._id}
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: `${DB_COLORS[i % DB_COLORS.length]}18`,
                      color: DB_COLORS[i % DB_COLORS.length],
                      border: `1px solid ${DB_COLORS[i % DB_COLORS.length]}35`,
                    }}
                  >
                    {db.DatabaseName}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchDatabases}
            className="rounded-lg"
            style={{ color: currentTheme.text }}
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="max-w-400 mx-auto px-6 py-8 space-y-10">
        {/* ─── Overview stats ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Databases', val: stats.databases, Ic: Database, clr: '#6366f1' },
            { label: 'Total Records', val: fmtNum(stats.totalRecords), Ic: Grid3x3, clr: '#ec4899' },
            { label: 'Total Fields', val: stats.totalFields, Ic: NotebookTabs, clr: '#f59e0b' },
            { label: 'Avg Numeric', val: stats.avgValue, Ic: TrendingUp, clr: '#10b981' },
          ].map((s, idx) => {
            const Icon = s.Ic;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
              >
                <Card
                  className="p-5 relative overflow-hidden"
                  style={{
                    backgroundColor: currentTheme.surface,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <div
                    className="absolute top-0 right-0 w-24 h-24 rounded-bl-[3rem] opacity-[0.07]"
                    style={{ backgroundColor: s.clr }}
                  />
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-xl"
                      style={{ backgroundColor: `${s.clr}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: s.clr }} />
                    </div>
                    <div>
                      <div
                        className="text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: currentTheme.textSecondary }}
                      >
                        {s.label}
                      </div>
                      <div className="text-2xl font-bold" style={{ color: currentTheme.text }}>
                        {s.val}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ─── Aggregation Cards ─── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2
              className="text-lg font-bold flex items-center gap-2"
              style={{ color: currentTheme.text }}
            >
              <Calculator className="w-5 h-5" style={{ color: currentTheme.primary }} />
              Aggregation Cards
            </h2>
            <Button
              size="sm"
              onClick={() => setShowAggModal(true)}
              className="rounded-xl"
              style={{ backgroundColor: currentTheme.primary, color: '#fff' }}
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {aggCards.map((card, idx) => {
              const db = loadedDbs.find((d) => d._id === card.databaseId);
              const field = db?.formSchema.find((f) => f.id === card.fieldId);
              const value = db
                ? computeAggregate(db.records, card.fieldId, card.operation)
                : 0;
              const opLabel =
                AGG_OPERATIONS.find((o) => o.value === card.operation)?.label || card.operation;
              const dbIdx = loadedDbs.findIndex((d) => d._id === card.databaseId);
              const clr = DB_COLORS[dbIdx >= 0 ? dbIdx % DB_COLORS.length : 0];
              const AggIcon = AGG_ICONS[card.operation] || Calculator;
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card
                    className="p-5 relative group overflow-hidden hover:shadow-lg transition-shadow"
                    style={{
                      backgroundColor: currentTheme.surface,
                      border: `1px solid ${currentTheme.border}`,
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: clr }}
                    />
                    <button
                      onClick={() => setAggCards((p) => p.filter((c) => c.id !== card.id))}
                      className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-500/10"
                    >
                      <X className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <AggIcon className="w-4 h-4" style={{ color: clr }} />
                      <span className="text-xs font-semibold" style={{ color: clr }}>
                        {db?.DatabaseName}
                      </span>
                    </div>
                    <div
                      className="text-3xl font-extrabold mb-1 tracking-tight"
                      style={{ color: currentTheme.text }}
                    >
                      {fmtNum(value)}
                    </div>
                    <div className="text-xs" style={{ color: currentTheme.textSecondary }}>
                      {opLabel} of {field?.label || card.fieldId}
                    </div>
                  </Card>
                </motion.div>
              );
            })}

            <motion.button
              onClick={() => setShowAggModal(true)}
              whileHover={{ scale: 1.02 }}
              className="p-5 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all min-h-32.5 hover:border-solid"
              style={{ borderColor: currentTheme.border, color: currentTheme.textSecondary }}
            >
              <Plus className="w-7 h-7 opacity-40" />
              <span className="text-sm font-medium">Add metric</span>
            </motion.button>
          </div>

          {/* Add Aggregation Modal */}
          <AnimatePresence>
            {showAggModal && (
              <motion.div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAggModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md p-7 rounded-2xl shadow-2xl"
                  style={{ backgroundColor: currentTheme.surface }}
                >
                  <h3 className="text-lg font-bold mb-5" style={{ color: currentTheme.text }}>
                    Add Aggregation Card
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        className="text-sm font-medium mb-1 block"
                        style={{ color: currentTheme.textSecondary }}
                      >
                        Database
                      </label>
                      <select
                        value={newAgg.databaseId || ''}
                        onChange={(e) =>
                          setNewAgg((p) => ({ ...p, databaseId: e.target.value, fieldId: '' }))
                        }
                        className="w-full p-2.5 rounded-xl border text-sm"
                        style={{
                          backgroundColor: currentTheme.background,
                          color: currentTheme.text,
                          borderColor: currentTheme.border,
                        }}
                      >
                        <option value="">Select database…</option>
                        {loadedDbs.map((db) => (
                          <option key={db._id} value={db._id}>
                            {db.DatabaseName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        className="text-sm font-medium mb-1 block"
                        style={{ color: currentTheme.textSecondary }}
                      >
                        Field (numeric)
                      </label>
                      <select
                        value={newAgg.fieldId || ''}
                        onChange={(e) => setNewAgg((p) => ({ ...p, fieldId: e.target.value }))}
                        className="w-full p-2.5 rounded-xl border text-sm"
                        style={{
                          backgroundColor: currentTheme.background,
                          color: currentTheme.text,
                          borderColor: currentTheme.border,
                        }}
                      >
                        <option value="">Select field…</option>
                        {newAgg.databaseId &&
                          getNumericFields(
                            loadedDbs.find((d) => d._id === newAgg.databaseId)?.formSchema || []
                          ).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.label}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label
                        className="text-sm font-medium mb-2 block"
                        style={{ color: currentTheme.textSecondary }}
                      >
                        Operation
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {AGG_OPERATIONS.map((op) => (
                          <button
                            key={op.value}
                            onClick={() => setNewAgg((p) => ({ ...p, operation: op.value }))}
                            className="p-2.5 rounded-xl border text-sm font-medium transition-all"
                            style={{
                              backgroundColor:
                                newAgg.operation === op.value
                                  ? `${currentTheme.primary}20`
                                  : currentTheme.background,
                              borderColor:
                                newAgg.operation === op.value
                                  ? currentTheme.primary
                                  : currentTheme.border,
                              color:
                                newAgg.operation === op.value
                                  ? currentTheme.primary
                                  : currentTheme.text,
                            }}
                          >
                            {op.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-7">
                    <Button
                      onClick={() => setShowAggModal(false)}
                      variant="ghost"
                      className="flex-1 rounded-xl"
                      style={{ color: currentTheme.text }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={addAggCard}
                      disabled={!newAgg.databaseId || !newAgg.fieldId || !newAgg.operation}
                      className="flex-1 rounded-xl"
                      style={{ backgroundColor: currentTheme.primary, color: '#fff' }}
                    >
                      Add Card
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ─── Comparison Charts ─── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2
              className="text-lg font-bold flex items-center gap-2"
              style={{ color: currentTheme.text }}
            >
              <BarChart3 className="w-5 h-5" style={{ color: currentTheme.primary }} />
              Comparison Charts
            </h2>
            <Button
              size="sm"
              onClick={() => setShowChartModal(true)}
              className="rounded-xl"
              style={{ backgroundColor: currentTheme.primary, color: '#fff' }}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Chart
            </Button>
          </div>

          {charts.length === 0 ? (
            <Card
              className="p-16 text-center border-2 border-dashed"
              style={{
                borderColor: currentTheme.border,
                backgroundColor: `${currentTheme.surface}60`,
              }}
            >
              <BarChart3
                className="w-14 h-14 mx-auto mb-4 opacity-20"
                style={{ color: currentTheme.textSecondary }}
              />
              <h3 className="font-semibold mb-1" style={{ color: currentTheme.text }}>
                No charts yet
              </h3>
              <p className="text-sm mb-5" style={{ color: currentTheme.textSecondary }}>
                Create a comparison chart to visualize data across your databases
              </p>
              <Button
                onClick={() => setShowChartModal(true)}
                className="rounded-xl"
                style={{ backgroundColor: currentTheme.primary, color: '#fff' }}
              >
                <Plus className="w-4 h-4 mr-1" /> Create Chart
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {charts.map((chart, idx) => {
                const { data, keys } = prepareChartData(chart);
                return (
                  <motion.div
                    key={chart.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                  >
                    <Card
                      className="p-6 relative group hover:shadow-lg transition-shadow"
                      style={{
                        backgroundColor: currentTheme.surface,
                        border: `1px solid ${currentTheme.border}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="font-bold text-base" style={{ color: currentTheme.text }}>
                            {chart.title}
                          </h3>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                            style={{
                              backgroundColor: `${currentTheme.primary}15`,
                              color: currentTheme.primary,
                            }}
                          >
                            {CHART_TYPES.find((t) => t.value === chart.type)?.label || chart.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFullscreenId(chart.id)}
                            className="rounded-lg"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCharts((p) => p.filter((c) => c.id !== chart.id))}
                            className="rounded-lg"
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {data.length > 0 ? (
                        renderChart(chart, data, keys, 340)
                      ) : (
                        <div
                          className="py-20 text-center rounded-xl"
                          style={{ backgroundColor: currentTheme.background }}
                        >
                          <p style={{ color: currentTheme.textSecondary }}>
                            No data for this configuration
                          </p>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Add Chart Modal */}
          <AnimatePresence>
            {showChartModal && (
              <motion.div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowChartModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-lg max-h-[85vh] overflow-y-auto p-7 rounded-2xl shadow-2xl"
                  style={{ backgroundColor: currentTheme.surface }}
                >
                  <h3 className="text-lg font-bold mb-5" style={{ color: currentTheme.text }}>
                    Create Comparison Chart
                  </h3>

                  <div className="space-y-5">
                    <div>
                      <label
                        className="text-sm font-medium mb-1 block"
                        style={{ color: currentTheme.textSecondary }}
                      >
                        Chart Title
                      </label>
                      <Input
                        value={newChart.title}
                        onChange={(e) =>
                          setNewChart((p) => ({ ...p, title: e.target.value }))
                        }
                        placeholder="e.g., Revenue Comparison"
                        className="rounded-xl"
                        style={{
                          backgroundColor: currentTheme.background,
                          color: currentTheme.text,
                          borderColor: currentTheme.border,
                        }}
                      />
                    </div>

                    <div>
                      <label
                        className="text-sm font-medium mb-2 block"
                        style={{ color: currentTheme.textSecondary }}
                      >
                        Chart Type
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {CHART_TYPES.map((ct) => (
                          <button
                            key={ct.value}
                            onClick={() => setNewChart((p) => ({ ...p, type: ct.value }))}
                            className="p-2.5 rounded-xl border text-center transition-all hover:shadow-md"
                            style={{
                              backgroundColor:
                                newChart.type === ct.value
                                  ? `${currentTheme.primary}20`
                                  : currentTheme.background,
                              borderColor:
                                newChart.type === ct.value
                                  ? currentTheme.primary
                                  : currentTheme.border,
                            }}
                          >
                            <div className="text-xl mb-0.5">
                              {(() => {
                                const IconComponent = CHART_ICONS[ct.value as ChartType];
                                return IconComponent ? <IconComponent size={24} className="mx-auto" /> : null;
                              })()}
                            </div>
                            <div
                              className="text-[10px] font-semibold"
                              style={{
                                color:
                                  newChart.type === ct.value
                                    ? currentTheme.primary
                                    : currentTheme.textSecondary,
                              }}
                            >
                              {ct.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label
                        className="text-sm font-medium mb-1 block"
                        style={{ color: currentTheme.textSecondary }}
                      >
                        Category / X-Axis{' '}
                        <span className="opacity-50 text-xs">(optional)</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={newChart.categoryDatabaseId}
                          onChange={(e) =>
                            setNewChart((p) => ({
                              ...p,
                              categoryDatabaseId: e.target.value,
                              categoryFieldId: '',
                            }))
                          }
                          className="p-2.5 rounded-xl border text-sm"
                          style={{
                            backgroundColor: currentTheme.background,
                            color: currentTheme.text,
                            borderColor: currentTheme.border,
                          }}
                        >
                          <option value="">Database…</option>
                          {loadedDbs.map((db) => (
                            <option key={db._id} value={db._id}>
                              {db.DatabaseName}
                            </option>
                          ))}
                        </select>
                        <select
                          value={newChart.categoryFieldId}
                          onChange={(e) =>
                            setNewChart((p) => ({ ...p, categoryFieldId: e.target.value }))
                          }
                          className="p-2.5 rounded-xl border text-sm"
                          style={{
                            backgroundColor: currentTheme.background,
                            color: currentTheme.text,
                            borderColor: currentTheme.border,
                          }}
                        >
                          <option value="">Field…</option>
                          {newChart.categoryDatabaseId &&
                            getAllDataFields(
                              loadedDbs.find((d) => d._id === newChart.categoryDatabaseId)
                                ?.formSchema || []
                            ).map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.label}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        className="text-sm font-medium mb-2 block"
                        style={{ color: currentTheme.textSecondary }}
                      >
                        Data Series
                      </label>

                      {newChart.series.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {newChart.series.map((s, i) => {
                            const db = loadedDbs.find((d) => d._id === s.databaseId);
                            const field = db?.formSchema.find((f) => f.id === s.fieldId);
                            return (
                              <div
                                key={i}
                                className="flex items-center gap-2 p-2.5 rounded-xl"
                                style={{ backgroundColor: currentTheme.background }}
                              >
                                <div
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: DB_COLORS[i % DB_COLORS.length],
                                  }}
                                />
                                <span
                                  className="text-sm flex-1"
                                  style={{ color: currentTheme.text }}
                                >
                                  {db?.DatabaseName} → {field?.label || s.fieldId}
                                </span>
                                <button
                                  onClick={() =>
                                    setNewChart((p) => ({
                                      ...p,
                                      series: p.series.filter((_, j) => j !== i),
                                    }))
                                  }
                                  className="p-1 rounded-lg hover:bg-red-500/10"
                                >
                                  <X className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <select
                          value={newChart.tempDbId}
                          onChange={(e) =>
                            setNewChart((p) => ({
                              ...p,
                              tempDbId: e.target.value,
                              tempFieldId: '',
                            }))
                          }
                          className="flex-1 p-2.5 rounded-xl border text-sm"
                          style={{
                            backgroundColor: currentTheme.background,
                            color: currentTheme.text,
                            borderColor: currentTheme.border,
                          }}
                        >
                          <option value="">Database…</option>
                          {loadedDbs.map((db) => (
                            <option key={db._id} value={db._id}>
                              {db.DatabaseName}
                            </option>
                          ))}
                        </select>
                        <select
                          value={newChart.tempFieldId}
                          onChange={(e) =>
                            setNewChart((p) => ({ ...p, tempFieldId: e.target.value }))
                          }
                          className="flex-1 p-2.5 rounded-xl border text-sm"
                          style={{
                            backgroundColor: currentTheme.background,
                            color: currentTheme.text,
                            borderColor: currentTheme.border,
                          }}
                        >
                          <option value="">Numeric field…</option>
                          {newChart.tempDbId &&
                            getNumericFields(
                              loadedDbs.find((d) => d._id === newChart.tempDbId)?.formSchema || []
                            ).map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.label}
                              </option>
                            ))}
                        </select>
                        <Button
                          size="sm"
                          onClick={pushSeries}
                          disabled={!newChart.tempDbId || !newChart.tempFieldId}
                          className="rounded-xl px-3"
                          style={{ backgroundColor: currentTheme.primary, color: '#fff' }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex gap-3 mt-7 pt-5 border-t"
                    style={{ borderColor: currentTheme.border }}
                  >
                    <Button
                      onClick={() => {
                        setShowChartModal(false);
                        setNewChart({ ...EMPTY_CHART });
                      }}
                      variant="ghost"
                      className="flex-1 rounded-xl"
                      style={{ color: currentTheme.text }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={addChart}
                      disabled={newChart.series.length === 0}
                      className="flex-1 rounded-xl"
                      style={{ backgroundColor: currentTheme.primary, color: '#fff' }}
                    >
                      Create Chart
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fullscreen overlay */}
          {fullscreenChart && (() => {
            const { data: fsData, keys: fsKeys } = prepareChartData(fullscreenChart);
            return (
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-8"
                onClick={() => setFullscreenId(null)}
              >
                <div
                  className="w-full max-w-5xl h-[80vh] p-8 rounded-2xl shadow-2xl flex flex-col"
                  style={{ backgroundColor: currentTheme.surface }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold" style={{ color: currentTheme.text }}>
                      {fullscreenChart.title}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setFullscreenId(null)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    {fsData.length > 0 ? (
                      renderChart(fullscreenChart, fsData, fsKeys, 500)
                    ) : (
                      <div
                        className="flex items-center justify-center h-full"
                        style={{ color: currentTheme.textSecondary }}
                      >
                        No data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </motion.section>

        {/* ─── Per-Database Summary ─── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2
            className="text-lg font-bold mb-5 flex items-center gap-2"
            style={{ color: currentTheme.text }}
          >
            <Database className="w-5 h-5" style={{ color: currentTheme.primary }} />
            Database Summaries
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loadedDbs.map((db, dbIdx) => {
              const numFields = getNumericFields(db.formSchema);
              const catFields = getCategoricalFields(db.formSchema);
              const clr = DB_COLORS[dbIdx % DB_COLORS.length];
              return (
                <Card
                  key={db._id}
                  className="p-6 relative overflow-hidden hover:shadow-lg transition-shadow"
                  style={{
                    backgroundColor: currentTheme.surface,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: clr }}
                  />
                  <h3
                    className="font-bold text-lg mb-4 flex items-center gap-2"
                    style={{ color: currentTheme.text }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: clr }} />
                    {db.DatabaseName}
                  </h3>

                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label: 'Records', val: db.records?.length || 0 },
                      { label: 'Numeric', val: numFields.length },
                      { label: 'Categorical', val: catFields.length },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="p-3 rounded-xl text-center"
                        style={{ backgroundColor: currentTheme.background }}
                      >
                        <div
                          className="text-xl font-bold"
                          style={{ color: currentTheme.text }}
                        >
                          {stat.val}
                        </div>
                        <div
                          className="text-[10px] font-medium uppercase tracking-wider"
                          style={{ color: currentTheme.textSecondary }}
                        >
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {numFields.length > 0 && (
                    <div className="space-y-2">
                      <div
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: currentTheme.textSecondary }}
                      >
                        Numeric Fields
                      </div>
                      {numFields.slice(0, 5).map((field) => {
                        const sum = computeAggregate(db.records, field.id, 'sum');
                        const avg = computeAggregate(db.records, field.id, 'average');
                        return (
                          <div
                            key={field.id}
                            className="flex items-center justify-between p-2.5 rounded-xl text-sm"
                            style={{ backgroundColor: currentTheme.background }}
                          >
                            <span style={{ color: currentTheme.text }}>{field.label}</span>
                            <div
                              className="flex gap-4 text-xs"
                              style={{ color: currentTheme.textSecondary }}
                            >
                              <span>
                                Sum:{' '}
                                <strong style={{ color: currentTheme.text }}>
                                  {fmtNum(sum)}
                                </strong>
                              </span>
                              <span>
                                Avg:{' '}
                                <strong style={{ color: currentTheme.text }}>
                                  {fmtNum(avg)}
                                </strong>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
