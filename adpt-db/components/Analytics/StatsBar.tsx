import { motion } from 'motion/react';
import { BarChart3, Database, Grid3x3, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Stats {
  totalRecords: number;
  totalFields: number;
  avgValue: string | number;
  uniqueValues: number;
}

export default function StatsBar({
  stats,
  currentTheme,
}: {
  stats: Stats;
  currentTheme: any;
}) {
  const statItems = [
    {
      label: 'Total Records',
      value: stats.totalRecords,
      icon: Database,
    },
    {
      label: 'Fields',
      value: stats.totalFields,
      icon: Grid3x3,
    },
    {
      label: 'Unique Values',
      value: stats.uniqueValues,
      icon: BarChart3,
    },
    {
      label: 'Average Value',
      value: stats.avgValue,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card
              className="p-4"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className="w-5 h-5"
                  style={{ color: currentTheme.primary }}
                />
                <div>
                  <div
                    className="text-xs"
                    style={{ color: currentTheme.textSecondary }}
                  >
                    {item.label}
                  </div>
                  <div
                    className="text-lg font-bold"
                    style={{ color: currentTheme.text }}
                  >
                    {item.value}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
