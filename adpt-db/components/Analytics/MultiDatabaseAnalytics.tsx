import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { CheckCircle2, BarChart3, Settings, ArrowRight, ChartNoAxesCombined, NotebookTabs } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { color, motion } from 'motion/react';
import axios from 'axios';

interface DatabaseInfo {
  _id: string;
  DatabaseName: string;
  recordCount: number;
  formSchema: any[];
}

export default function MultiDatabaseAnalytics() {
  const { currentTheme } = useTheme();
  const router = useRouter();
  
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [selectedDatabases, setSelectedDatabases] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all databases on mount
  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const response = await axios.get('/api/databases');
        const dbList = response.data.databases || [];
        setDatabases(dbList);
      } catch (error) {
        console.error('Failed to fetch databases:', error);
      }
    };
    fetchDatabases();
  }, []);

  const toggleDatabase = (dbId: string) => {
    setSelectedDatabases((prev) =>
      prev.includes(dbId)
        ? prev.filter((id) => id !== dbId)
        : [...prev, dbId]
    );
  };

  const handleAnalyze = async () => {
    if (selectedDatabases.length === 0) return;
    
    setLoading(true);
    try {
      // If only one database selected, go to analytics dashboard
      if (selectedDatabases.length === 1) {
        router.push(`/dashboard/analytics/${selectedDatabases[0]}`);
      } else {
        // If multiple selected, analyze the first one (can extend later)
        router.push(`/dashboard/analytics/${selectedDatabases[0]}`);
      }
    } catch (error) {
      console.error('Error navigating to analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen p-6" style={{ backgroundColor: currentTheme.background }}>
      {/* Header */}
      <motion.div 
        className="mb-12 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <BarChart3 className="w-8 h-8" style={{ color: currentTheme.primary }} />
          <h1 className="text-4xl font-bold" style={{ color: currentTheme.text }}>
            Data Analytics Dashboard
          </h1>
        </div>
        <p className="text-lg" style={{ color: currentTheme.textSecondary }}>
          Analyze and compare data across your databases with powerful insights and visualizations
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto">
        {/* Instructions Section */}
        <Card
          className="p-8 mb-10"
          style={{
            backgroundColor: `${currentTheme.primary}10`,
            border: `2px solid ${currentTheme.primary}`,
          }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: currentTheme.text }}>
            <Settings className="w-5 h-5" />
            How to Use Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Select Databases',
                description: 'Choose one or more databases you want to analyze below',
              },
              {
                step: '2',
                title: 'Analyze Data',
                description: 'Click "Start Analysis" to generate automatic charts and summaries',
              },
              {
                step: '3',
                title: 'Create Reports',
                description: 'Build custom charts by selecting fields and creating insights from your data',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: currentTheme.text }}>
                    {item.title}
                  </h3>
                  <p style={{ color: currentTheme.textSecondary }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Database Selection */}
        <Card
          className="p-8"
          style={{
            backgroundColor: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
          }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: currentTheme.text }}>
            Available Databases
          </h2>

          {databases.length === 0 ? (
            <div
              className="py-12 text-center rounded-lg"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textSecondary,
              }}
            >
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No databases available. Create a database to get started with analytics.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {databases.map((db) => (
                  <motion.button
                    key={db._id}
                    onClick={() => toggleDatabase(db._id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-6 rounded-lg border-2 transition-all text-left relative overflow-hidden"
                    style={{
                      backgroundColor: selectedDatabases.includes(db._id)
                        ? `${currentTheme.primary}20`
                        : currentTheme.background,
                      borderColor: selectedDatabases.includes(db._id)
                        ? currentTheme.primary
                        : currentTheme.border,
                      color: currentTheme.text,
                    }}
                  >
                    {selectedDatabases.includes(db._id) && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2
                          className="w-6 h-6"
                          style={{ color: currentTheme.primary }}
                        />
                      </div>
                    )}
                    <div className="font-bold text-lg mb-2">{db.DatabaseName}</div>
                    <div className="space-y-1 text-sm" style={{ color: currentTheme.textSecondary }}>
                      <div className='flex'><span><ChartNoAxesCombined className="w-4 h-4 mr-3 text-white" style={{color: currentTheme.primary}}/></span> {db.recordCount} records</div>
                      <div className='flex'><span><NotebookTabs className="w-4 h-4 mr-3 text-white" style={{color: currentTheme.primary}}/></span> {db.formSchema?.length || 0} fields</div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-4 flex-wrap items-center">
                <Button
                  onClick={handleAnalyze}
                  disabled={selectedDatabases.length === 0 || loading}
                  className="flex items-center gap-2"
                  style={{
                    backgroundColor: currentTheme.primary,
                    color: '#ffffff',
                    padding: '12px 24px',
                    fontSize: '16px',
                  }}
                >
                  {loading ? 'Starting Analysis...' : 'Start Analysis'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                
                {selectedDatabases.length > 0 && (
                  <span
                    className="text-sm font-medium"
                    style={{ color: currentTheme.textSecondary }}
                  >
                    {selectedDatabases.length} database{selectedDatabases.length !== 1 ? 's' : ''} selected
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
