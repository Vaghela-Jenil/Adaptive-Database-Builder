import { useState } from 'react';

import { Plus, Trash2, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Card } from '@/components/ui/card';



interface ChartConfig {
  id: string;
  type: 'bar' | 'pie' | 'line' | 'area' | 'scatter';
  xAxis: string;
  yAxis: string;
  instructions: string;
  title: string;
  isAuto: boolean;
  isMinimized?: boolean;      // NEW
  isFullscreen?: boolean;     // NEW
}



interface FormField {

  id: string;

  label: string;

  type: string;

}



interface DatabaseData {

  formSchema: FormField[];

}



export default function ChartBuilder({

  database,

  onAddChart,

  charts,

  activeChartId,

  onActiveChartChange,

  onUpdateChart,

  onRemoveChart,

  currentTheme,

}: {

  database: DatabaseData;

  onAddChart: (type: ChartConfig['type']) => void;

  charts: ChartConfig[];

  activeChartId: string | null;

  onActiveChartChange: (id: string) => void;

  onUpdateChart: (id: string, updates: Partial<ChartConfig>) => void;

  onRemoveChart: (id: string) => void;

  currentTheme: any;

}) {

  const chartTypes: ChartConfig['type'][] = ['bar', 'pie', 'line', 'area', 'scatter'];

  const activeChart = charts.find((c) => c.id === activeChartId) || charts[0];



  return (

    <div className="flex flex-col h-full">

      {/* Add Chart */}

      <div className="p-4 border-b" style={{ borderColor: currentTheme.border }}>

        <h3 className="font-bold mb-3" style={{ color: currentTheme.text }}>

          Add Chart

        </h3>

        <div className="grid grid-cols-2 gap-2">

          {chartTypes.map((type) => (

            <Button

              key={type}

              size="sm"

              onClick={() => onAddChart(type)}

              style={{

                backgroundColor: currentTheme.primary,

                color: '#ffffff',

                opacity: 0.8,

              }}

            >

              <Plus className="w-3 h-3 mr-1" />

              {type}

            </Button>

          ))}

        </div>

      </div>



      {/* Charts List */}

      <div className="flex-1  p-4 border-b" style={{ borderColor: currentTheme.border }}>

        <h3 className="font-bold mb-3" style={{ color: currentTheme.text }}>

          Created Charts ({charts.length})

        </h3>

        <div className="space-y-2">

          {charts.map((chart) => (

            <div

              key={chart.id}

              onClick={() => onActiveChartChange(chart.id)}

              className="p-3 rounded-lg cursor-pointer transition-all border-2 flex items-center justify-between gap-2"

              style={{

                backgroundColor:

                  activeChartId === chart.id

                    ? `${currentTheme.primary}20`

                    : currentTheme.surface,

                borderColor:

                  activeChartId === chart.id

                    ? currentTheme.primary

                    : currentTheme.border,

                color: currentTheme.text,

              }}

            >

              <div className="flex-1">

                <div className="font-semibold text-sm">{chart.title}</div>

                <div

                  className="text-xs"

                  style={{ color: currentTheme.textSecondary }}

                >

                  {chart.type.toUpperCase()}

                  {chart.isAuto ? ' (Auto)' : ''}

                </div>

              </div>

              {activeChartId === chart.id && (

                <Check className="w-4 h-4" style={{ color: currentTheme.primary }} />

              )}

            </div>

          ))}

        </div>

      </div>



      {/* Chart Configuration */}

      {activeChart && (

        <div className="p-4 space-y-4 border-t" style={{ borderColor: currentTheme.border }}>

          <h3 className="font-bold" style={{ color: currentTheme.text }}>

            Configure Chart

          </h3>



          {/* Chart Title */}

          <div>

            <label className="text-sm mb-1 block" style={{ color: currentTheme.text }}>

              Title

            </label>

            <Input

              value={activeChart.title}

              onChange={(e) =>

                onUpdateChart(activeChart.id, { title: e.target.value })

              }

              placeholder="Chart title"

              style={{

                backgroundColor: currentTheme.background,

                color: currentTheme.text,

                borderColor: currentTheme.border,

              }}

            />

          </div>



          {/* X Axis */}

          <div>

            <label className="text-sm mb-1 block" style={{ color: currentTheme.text }}>

              X-Axis Field

            </label>

            <select

              value={activeChart.xAxis}

              onChange={(e) =>

                onUpdateChart(activeChart.id, { xAxis: e.target.value })

              }

              className="w-full p-2 rounded border text-sm"

              style={{

                backgroundColor: currentTheme.background,

                color: currentTheme.text,

                borderColor: currentTheme.border,

              }}

            >

              <option value="">Select field...</option>

              {database.formSchema.map((field) => (

                <option key={field.id} value={field.id}>

                  {field.label}

                </option>

              ))}

            </select>

          </div>



          {/* Y Axis */}

          <div>

            <label className="text-sm mb-1 block" style={{ color: currentTheme.text }}>

              Y-Axis Field

            </label>

            <select

              value={activeChart.yAxis}

              onChange={(e) =>

                onUpdateChart(activeChart.id, { yAxis: e.target.value })

              }

              className="w-full p-2 rounded border text-sm"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.text,
                borderColor: currentTheme.border,
              }}
            >
              <option value="">Select field...</option>

              {database.formSchema.map((field) => (

                <option key={field.id} value={field.id}>

                  {field.label}

                </option>

              ))}

            </select>

          </div>
          {/* Chart Type */}
          <div>
            <label className="text-sm mb-1 block" style={{ color: currentTheme.text }}>
              Chart Type
            </label>
            <select
              value={activeChart.type}
              onChange={(e) =>
                onUpdateChart(activeChart.id, {
                  type: e.target.value as ChartConfig['type'],
                })
              }
              className="w-full p-2 rounded border text-sm"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.text,
                borderColor: currentTheme.border,
              }}

            >

              {chartTypes.map((type) => (

                <option key={type} value={type}>

                  {type.toUpperCase()}

                </option>

              ))}

            </select>

          </div>



          {/* Instructions */}

          <div>

            <label className="text-sm mb-1 block" style={{ color: currentTheme.text }}>

              Custom Instructions

            </label>

            <textarea

              value={activeChart.instructions}

              onChange={(e) =>

                onUpdateChart(activeChart.id, { instructions: e.target.value })

              }

              placeholder="e.g., Compare sales by region"

              className="w-full p-2 rounded border text-sm resize-none"

              rows={3}

              style={{

                backgroundColor: currentTheme.background,

                color: currentTheme.text,

                borderColor: currentTheme.border,

              }}

            />

          </div>



          {/* Delete Chart */}

          {!activeChart.isAuto && (

            <Button

              onClick={() => onRemoveChart(activeChart.id)}

              className="w-full"

              style={{

                backgroundColor: '#ef4444',

                color: '#ffffff',

              }}

            >

              <Trash2 className="w-4 h-4 mr-2" />

              Delete Chart

            </Button>

          )}

        </div>

      )}

    </div>

  );

}