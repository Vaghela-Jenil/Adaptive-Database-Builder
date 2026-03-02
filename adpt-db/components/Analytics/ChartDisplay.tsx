'use client';
import { Card } from '@/components/ui/card';
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6'];

interface ChartConfig {
  id: string;
  type: 'bar' | 'pie' | 'line' | 'area' | 'scatter';
  xAxis: string;
  yAxis: string;
  instructions: string;
  title: string;
  isAuto: boolean;
}

interface FormField {
  id: string;
  label: string;
  type: string;
}

export default function ChartDisplay({
  chart,
  data,
  onUpdate,
  onRemove,
  isActive,
  onActive,
  currentTheme,
  formSchema,
}: {
  chart: ChartConfig;
  data: any[];
  onUpdate: (id: string, updates: Partial<ChartConfig>) => void;
  onRemove: (id: string) => void;
  isActive: boolean;
  onActive: () => void;
  currentTheme: any;
  formSchema: FormField[];
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const renderChart = (height: number) => {
    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} opacity={0.5} />
              <XAxis
                stroke={currentTheme.textSecondary}
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke={currentTheme.textSecondary} />
              <Tooltip
                contentStyle={{
                  backgroundColor: currentTheme.surface,
                  border: `1px solid ${currentTheme.border}`,
                  color: currentTheme.text,
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="value" fill={currentTheme.primary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: currentTheme.surface,
                  border: `1px solid ${currentTheme.border}`,
                  color: currentTheme.text,
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} opacity={0.5} />
              <XAxis
                stroke={currentTheme.textSecondary}
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke={currentTheme.textSecondary} />
              <Tooltip
                contentStyle={{
                  backgroundColor: currentTheme.surface,
                  border: `1px solid ${currentTheme.border}`,
                  color: currentTheme.text,
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={currentTheme.primary}
                strokeWidth={3}
                dot={{ fill: currentTheme.primary, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} opacity={0.5} />
              <XAxis
                stroke={currentTheme.textSecondary}
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke={currentTheme.textSecondary} />
              <Tooltip
                contentStyle={{
                  backgroundColor: currentTheme.surface,
                  border: `1px solid ${currentTheme.border}`,
                  color: currentTheme.text,
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                fill={currentTheme.primary}
                stroke={currentTheme.primary}
                fillOpacity={0.4}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} opacity={0.5} />
              <XAxis
                stroke={currentTheme.textSecondary}
                dataKey="value"
                type="number"
              />
              <YAxis stroke={currentTheme.textSecondary} dataKey="count" />
              <Tooltip
                contentStyle={{
                  backgroundColor: currentTheme.surface,
                  border: `1px solid ${currentTheme.border}`,
                  color: currentTheme.text,
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Scatter name="Data" data={data} fill={currentTheme.primary} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Normal Card */}
      <motion.div
        onClick={onActive}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card
          className="p-6 cursor-pointer transition-all relative"
          style={{
            backgroundColor: currentTheme.surface,
            border: `2px solid ${isActive ? currentTheme.primary : currentTheme.border
              }`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Input
              value={chart.title}
              onChange={(e) =>
                onUpdate(chart.id, { title: e.target.value })
              }
              className="text-lg font-bold flex-1 mr-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
              }}
            />

            <div className="flex items-center gap-2">
              {/* Fullscreen Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullscreen(true);
                }}
                style={{backgroundColor: 'white', color:'ffffff'}}
              >
                <Maximize2 className="w-4 h-4"/>
              </Button>

              {!chart.isAuto && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(chart.id);
                  }}
                  variant="ghost"
                  size="sm"
                  style={{ color: "#ef4444" }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Chart */}
          {data.length > 0 ? (
            renderChart(350)
          ) : (
            <div
              className="py-12 text-center rounded"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textSecondary,
              }}
            >
              No data available for this chart configuration
            </div>
          )}

          {/* Instructions */}
          {chart.instructions && (
            <div
              className="mt-4 p-3 rounded"
              style={{
                backgroundColor: `${currentTheme.primary}10`,
              }}
            >
              <p className="text-sm" style={{ color: currentTheme.text }}>
                <strong>Instructions:</strong> {chart.instructions}
              </p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFullscreen(false)} // close on outside click
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
              className="w-[80%] max-w-4xl h-[75%] p-6 rounded-2xl shadow-2xl"
              style={{
                backgroundColor: currentTheme.surface,
              }}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h2
                  className="text-xl font-bold"
                  style={{ color: currentTheme.text }}
                >
                  {chart.title}
                </h2>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Larger Chart */}
              <div className="h-full">
                {data.length > 0 ? renderChart(500) : (
                  <div className="text-center mt-20">
                    No data available
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
