'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  BarChart3,
  Settings,
  ArrowRight,
  Database,
  ChartNoAxesCombined,
  NotebookTabs,
  Calculator,
  TrendingUp,
  Layers,
  Grid3x3,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

/* ─── Types ────────────────────────────────────────── */

interface FormField {
  id: string;
  label: string;
  type: string;
}

interface DatabaseInfo {
  _id: string;
  DatabaseName: string;
  recordCount: number;
  formSchema: FormField[];
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

interface NewChartState {
  type: ChartType;
  title: string;
  series: ChartSeries[];
  categoryDatabaseId: string;
  categoryFieldId: string;
  tempDbId: string;
  tempFieldId: string;
}


/* ─── Component ────────────────────────────────────── */

export default function MultiDatabaseAnalytics() {
  const { currentTheme } = useTheme();
  const router = useRouter();

  /* — selection phase — */
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [selectedDbIds, setSelectedDbIds] = useState<string[]>([]);

  /* — analysis phase — */
  const [phase, setPhase] = useState<'select' | 'loading' | 'analyze'>('select');
  const [loadedDbs, setLoadedDbs] = useState<FullDatabase[]>([]);


  /* ─── Fetch database list ───────────────────────── */

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/databases');
        setDatabases(res.data.databases || []);
      } catch (err) {
        console.error('Failed to fetch databases:', err);
      }
    })();
  }, []);

  /* ─── Start analysis ─────────────────────────────── */

  const handleStart = useCallback(async () => {
    setPhase('loading');
    try {
      if (selectedDbIds.length === 0) return;

      // Single database — navigate to existing dashboard
      if (selectedDbIds.length === 1) {
        router.push(`/dashboard/analytics/${selectedDbIds[0]}`);
        return;
      }
      // Correct: Path first, then Query Parameters
      router.push(`/dashboard/analytics/compare?ids=${selectedDbIds.join('&')}`);
    } catch (err) {
      console.error('Failed to load databases:', err);
      setPhase('select');
    }
  }, [selectedDbIds, router]);

  /* ─── Handlers ───────────────────────────────────── */

  const toggleDb = (id: string) =>
    setSelectedDbIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );

  /* ══════════════════════════════════════════════════
     RENDER — SELECTION PHASE
     ══════════════════════════════════════════════════ */

  if (phase === 'select') {
    return (
      <div className="w-full min-h-screen p-6 md:p-10" style={{ backgroundColor: currentTheme.background }}>
        {/* Hero header */}
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-4 mb-5">
            <div
              className="p-3.5 rounded-2xl shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}99)`,
              }}
            >
              <BarChart3 className="w-9 h-9 text-white" />
            </div>
            <h1
              className="text-4xl md:text-5xl font-extrabold tracking-tight"
              style={{ color: currentTheme.text }}
            >
              Analytics Studio
            </h1>
          </div>
          <p
            className="text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: currentTheme.textSecondary }}
          >
            Select multiple databases to compare, aggregate, and visualize data
            side-by-side with powerful interactive charts
          </p>
        </motion.div>

        <div className="max-w-7xl mx-auto space-y-10">
          {/* Steps */}
          <Card
            className="p-6 backdrop-blur-sm"
            style={{
              backgroundColor: `${currentTheme.primary}08`,
              border: `1px solid ${currentTheme.primary}30`,
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  n: '1',
                  t: 'Select Databases',
                  d: 'Pick two or more databases to compare and analyze together',
                  Ic: Database,
                },
                {
                  n: '2',
                  t: 'View Comparisons',
                  d: 'Auto-generated charts and stats across all selected databases',
                  Ic: BarChart3,
                },
                {
                  n: '3',
                  t: 'Customize & Aggregate',
                  d: 'Add aggregation cards, create custom comparison charts with 10+ types',
                  Ic: Settings,
                },
              ].map((item, idx) => {
                const Icon = item.Ic;
                return (
                  <motion.div
                    key={idx}
                    className="flex gap-4 items-start"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.12 }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}90)`,
                      }}
                    >
                      {item.n}
                    </div>
                    <div>
                      <h3
                        className="font-semibold mb-1 flex items-center gap-2"
                        style={{ color: currentTheme.text }}
                      >
                        <Icon className="w-4 h-4" style={{ color: currentTheme.primary }} />
                        {item.t}
                      </h3>
                      <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                        {item.d}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>

          {/* Database grid */}
          <Card
            className="p-8"
            style={{
              backgroundColor: currentTheme.surface,
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: currentTheme.text }}>
                Available Databases
              </h2>
              {selectedDbIds.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold text-white shadow"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  {selectedDbIds.length} selected
                </motion.span>
              )}
            </div>

            {databases.length === 0 ? (
              <div
                className="py-20 text-center rounded-2xl"
                style={{ backgroundColor: currentTheme.background }}
              >
                <Database
                  className="w-16 h-16 mx-auto mb-4 opacity-25"
                  style={{ color: currentTheme.textSecondary }}
                />
                <p className="text-lg font-medium" style={{ color: currentTheme.textSecondary }}>
                  No databases available
                </p>
                <p className="text-sm mt-1" style={{ color: currentTheme.textSecondary }}>
                  Create a database first to start analyzing
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {databases.map((db, idx) => {
                    const sel = selectedDbIds.includes(db._id);
                    return (
                      <motion.button
                        key={db._id}
                        onClick={() => toggleDb(db._id)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className="p-6 rounded-xl border-2 transition-all text-left relative overflow-hidden group"
                        style={{
                          backgroundColor: sel
                            ? `${currentTheme.primary}12`
                            : currentTheme.background,
                          borderColor: sel ? currentTheme.primary : currentTheme.border,
                        }}
                      >
                        <div
                          className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${sel ? 'scale-100' : 'scale-75 opacity-30'
                            }`}
                          style={{
                            borderColor: sel ? currentTheme.primary : currentTheme.border,
                            backgroundColor: sel ? currentTheme.primary : 'transparent',
                          }}
                        >
                          {sel && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all"
                          style={{
                            backgroundColor: sel ? currentTheme.primary : 'transparent',
                          }}
                        />
                        <div
                          className="font-bold text-lg mb-3"
                          style={{ color: currentTheme.text }}
                        >
                          {db.DatabaseName}
                        </div>
                        <div
                          className="space-y-2 text-sm"
                          style={{ color: currentTheme.textSecondary }}
                        >
                          <div className="flex items-center gap-2">
                            <ChartNoAxesCombined
                              className="w-4 h-4"
                              style={{ color: currentTheme.primary }}
                            />
                            <span>{db.recordCount} records</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <NotebookTabs
                              className="w-4 h-4"
                              style={{ color: currentTheme.primary }}
                            />
                            <span>{db.formSchema?.length || 0} fields</span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <div
                  className="flex gap-4 flex-wrap items-center pt-5 border-t"
                  style={{ borderColor: currentTheme.border }}
                >
                  <Button
                    onClick={handleStart}
                    disabled={selectedDbIds.length === 0}
                    className="flex items-center gap-2 px-8 py-3 text-base font-semibold rounded-xl shadow-lg transition-all hover:shadow-xl disabled:opacity-40"
                    style={{
                      background:
                        selectedDbIds.length > 0
                          ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}90)`
                          : currentTheme.border,
                      color: '#fff',
                    }}
                  >
                    Start Analysis
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  {selectedDbIds.length > 1 && (
                    <span
                      className="text-sm font-medium px-3 py-1 rounded-lg"
                      style={{
                        color: currentTheme.primary,
                        backgroundColor: `${currentTheme.primary}10`,
                      }}
                    >
                      Multi-database comparison mode
                    </span>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════
     RENDER — LOADING
     ══════════════════════════════════════════════════ */

  if (phase === 'loading') {
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
            Fetching data from {selectedDbIds.length} database
            {selectedDbIds.length !== 1 ? 's' : ''}…
          </p>
        </motion.div>
      </div>
    );
  }
}
