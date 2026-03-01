'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  Plus,
  BarChart3,
  Download,
  RefreshCw,
  Menu,
  X,
  ArrowLeft,
  Maximize2,
  Minimize2,
  ChevronRight,
  LayoutDashboard,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import StatsBar from '@/components/Analytics/StatsBar';
import ChartBuilder from '@/components/Analytics/ChartBuilder';
import ChartDisplay from '@/components/Analytics/ChartDisplay';
import { useRouter } from 'next/navigation';

interface DatabaseRecord {
  _id: string;
  data: Record<string, any>;
  [key: string]: any;
}

interface FormField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  [key: string]: any;
}

interface ChartConfig {
  id: string;
  type: 'bar' | 'pie' | 'line' | 'area' | 'scatter';
  xAxis: string;
  yAxis: string;
  instructions: string;
  title: string;
  isAuto: boolean;
}

interface DatabaseData {
  _id: string;
  DatabaseName: string;
  formSchema: FormField[];
  records: DatabaseRecord[];
  totalRecords: number;
}

export default function AnalyticsDashboard({
  databaseId,
}: {
  databaseId: string;
}) {
  const { currentTheme } = useTheme();
  const router = useRouter();

  const [database, setDatabase] = useState<DatabaseData | null>(null);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChartId, setActiveChartId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatabase = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/databases/${databaseId}`);
        setDatabase(response.data);
        createDefaultCharts(response.data.formSchema);
      } catch (err) {
        console.error('Error fetching database:', err);
        setError('Failed to load database. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (databaseId) {
      fetchDatabase();
    }
  }, [databaseId]);

  const createDefaultCharts = useCallback((formSchema: FormField[]) => {
    const defaultCharts: ChartConfig[] = [];
    const numericFields = formSchema.filter(
      (f) => f.type === 'input-number' || f.type === 'slider'
    );
    const textFields = formSchema.filter(
      (f) => f.type === 'text' || f.type === 'select' || f.type === 'radio'
    );

    if (numericFields.length > 0 && textFields.length > 0) {
      defaultCharts.push({
        id: `auto-1-${Date.now()}`,
        type: 'bar',
        xAxis: textFields[0].id,
        yAxis: numericFields[0].id,
        instructions: 'Show distribution',
        title: `${textFields[0].label} vs ${numericFields[0].label}`,
        isAuto: true,
      });
    }

    if (numericFields.length > 0) {
      defaultCharts.push({
        id: `auto-2-${Date.now()}`,
        type: 'line',
        xAxis: numericFields[0].id,
        yAxis: numericFields[0].id,
        instructions: 'Show trend',
        title: `${numericFields[0].label} Trend`,
        isAuto: true,
      });
    }

    setCharts(defaultCharts);
  }, []);

  const stats = useMemo(() => {
    if (!database) return null;
    const numericFields = database.formSchema.filter(
      (f) => f.type === 'input-number' || f.type === 'slider'
    );
    let totalSum = 0;
    let fieldCount = 0;
    numericFields.forEach((field) => {
      database.records.forEach((record) => {
        const value = record.data[field.id];
        if (value && !isNaN(parseFloat(value))) {
          totalSum += parseFloat(value);
          fieldCount++;
        }
      });
    });
    return {
      totalRecords: database.totalRecords,
      totalFields: database.formSchema.length,
      avgValue: fieldCount > 0 ? (totalSum / fieldCount).toFixed(2) : 0,
      uniqueValues: new Set(
        database.records.flatMap((r) => Object.values(r.data))
      ).size,
    };
  }, [database]);

  const handleAddChart = (chartType: ChartConfig['type']) => {
    const newChart: ChartConfig = {
      id: `chart-${Date.now()}`,
      type: chartType,
      xAxis: database?.formSchema[0]?.id || '',
      yAxis: database?.formSchema[1]?.id || '',
      instructions: '',
      title: `${chartType.toUpperCase()} Chart`,
      isAuto: false,
    };
    setCharts([...charts, newChart]);
    setActiveChartId(newChart.id);
  };

  const handleUpdateChart = useCallback((chartId: string, updates: Partial<ChartConfig>) => {
    setCharts((prev) =>
      prev.map((chart) => (chart.id === chartId ? { ...chart, ...updates } : chart))
    );
  }, []);

  const handleRemoveChart = useCallback((chartId: string) => {
    setCharts((prev) => prev.filter((chart) => chart.id !== chartId));
  }, []);

  const prepareChartData = (chart: ChartConfig) => {
    if (!database) return [];
    const xFieldId = chart.xAxis;
    const yFieldId = chart.yAxis;
    const groupedData: Record<string, any> = {};
    database.records.forEach((record) => {
      const xValue = record.data[xFieldId];
      const yValue = record.data[yFieldId];
      if (xValue !== undefined && yValue !== undefined) {
        if (!groupedData[xValue]) {
          groupedData[xValue] = { name: xValue, value: 0, count: 0 };
        }
        const numValue = parseFloat(yValue);
        if (!isNaN(numValue)) {
          groupedData[xValue].value += numValue;
          groupedData[xValue].count += 1;
        }
      }
    });
    return Object.values(groupedData);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: currentTheme.background }}>
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: currentTheme.primary }} />
          <p style={{ color: currentTheme.text }} className="text-lg font-semibold">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: currentTheme.background }}>
        <Card className="max-w-md p-8 text-center" style={{ backgroundColor: currentTheme.surface, border: `1px solid ${currentTheme.border}` }}>
          <p style={{ color: currentTheme.text }} className="mb-6">{error}</p>
          <Button onClick={() => router.back()} style={{ backgroundColor: currentTheme.primary, color: '#ffffff' }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </Card>
      </div>
    );
  }

  if (!database) return null;

  return (
   <div className="w-full h-screen flex flex-col overflow-hidden" style={{ backgroundColor: currentTheme.background }}>
      
      {/* Header */}
      <header className="border-b z-50 shrink-0" style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.background }}>
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.back()} style={{ color: currentTheme.text }}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: currentTheme.text }}>
                <LayoutDashboard className="w-5 h-5 opacity-50" />
                {database.DatabaseName}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
               <span className="text-xs font-medium opacity-50 mr-2" style={{ color: currentTheme.text }}>
                  {sidebarOpen ? "Editor Mode" : "View Mode"}
               </span>
            </div>
          </div>
          {stats && <StatsBar stats={stats} currentTheme={currentTheme} />}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* RE-OPEN TRIGGER (Visible only when sidebar is closed) */}
        <AnimatePresence>
          {!sidebarOpen && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-50"
            >
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center justify-center w-8 h-20 rounded-r-xl shadow-lg border-y border-r transition-all hover:w-10 group"
                style={{ 
                  backgroundColor: currentTheme.primary, 
                  borderColor: currentTheme.border,
                  color: '#fff' 
                }}
                title="Open Chart Builder"
              >
                <ChevronRight className="w-5 h-5 group-hover:scale-125 transition-transform" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SIDEBAR */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 350, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full border-r flex flex-col overflow-hidden shrink-0 z-40 relative"
              style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.border }}
            >
              <div className="p-4 border-b flex justify-between items-center shrink-0" style={{ borderColor: currentTheme.border }}>
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" style={{ color: currentTheme.primary }} />
                  <span className="font-bold text-sm uppercase tracking-wider" style={{ color: currentTheme.text }}>Builder</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSidebarOpen(false)}
                  className="hover:bg-red-500/10 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                <ChartBuilder
                  database={database}
                  onAddChart={handleAddChart}
                  charts={charts}
                  activeChartId={activeChartId}
                  onActiveChartChange={setActiveChartId}
                  onUpdateChart={handleUpdateChart}
                  onRemoveChart={handleRemoveChart}
                  currentTheme={currentTheme}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 h-full overflow-y-auto custom-scrollbar relative">
          <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
            {charts.length === 0 ? (
              <div className="h-[50vh] flex flex-col items-center justify-center border-2 border-dashed rounded-[2rem]" 
                style={{ borderColor: currentTheme.border, backgroundColor: `${currentTheme.surface}50` }}>
                <div className="p-6 rounded-full mb-4" style={{ backgroundColor: `${currentTheme.primary}10` }}>
                  <BarChart3 className="w-12 h-12 opacity-40" style={{ color: currentTheme.primary }} />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: currentTheme.text }}>Visualizer is Ready</h3>
                <p className="text-sm opacity-60 mt-1" style={{ color: currentTheme.textSecondary }}>
                  {!sidebarOpen ? "Open the tools on the left to add a chart" : "Select a field in the builder to start"}
                </p>
              </div>
            ) : (
              <div className={`grid gap-6 transition-all duration-700 ease-in-out ${
                sidebarOpen 
                ? 'grid-cols-1 xl:grid-cols-2' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {charts.map((chart) => (
                  <ChartDisplay
                    key={chart.id}
                    chart={chart}
                    data={prepareChartData(chart)}
                    onUpdate={handleUpdateChart}
                    onRemove={handleRemoveChart}
                    isActive={activeChartId === chart.id}
                    onActive={() => setActiveChartId(chart.id)}
                    currentTheme={currentTheme}
                    formSchema={database.formSchema}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}