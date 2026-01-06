'use client'
import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { Table2, LayoutGrid, List, Settings } from 'lucide-react';

export default function DarkDemoPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [activeView, setActiveView] = useState('table');

  const views = [
    { id: 'table', label: 'Table View', icon: Table2 },
    { id: 'grid', label: 'Grid View', icon: LayoutGrid },
    { id: 'list', label: 'List View', icon: List },
  ];

  const mockData = [
    { id: 1, name: 'Q4 Marketing Campaign', status: 'Active', priority: 'High', updated: '2 hours ago' },
    { id: 2, name: 'Product Launch 2024', status: 'Planning', priority: 'Medium', updated: '5 hours ago' },
    { id: 3, name: 'Customer Feedback Analysis', status: 'Complete', priority: 'Low', updated: '1 day ago' },
    { id: 4, name: 'Website Redesign', status: 'Active', priority: 'High', updated: '3 hours ago' },
  ];

  return (
    <section className="relative py-16 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 overflow-hidden">
      {/* Animated background */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 mb-6"
          >
            <span className="text-cyan-400">Live Preview</span>
          </motion.div>

          <h2 className="text-white mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            See it in action
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Experience the power and flexibility of custom databases with multiple view options
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative max-w-6xl mx-auto"
        >
          {/* Demo Container */}
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 rounded-3xl overflow-hidden">
            {/* Toolbar */}
            <div className="border-b border-slate-800/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <span className="text-slate-400 ml-4">Projects Database</span>
                </div>

                <div className="flex items-center gap-2">
                  {views.map((view) => {
                    const Icon = view.icon;
                    return (
                      <motion.button
                        key={view.id}
                        onClick={() => setActiveView(view.id)}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                          activeView === view.id
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{view.label}</span>
                      </motion.button>
                    );
                  })}
                  <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
              {activeView === 'table' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-x-auto"
                >
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800/50">
                        <th className="text-left text-slate-400 pb-3 pr-4">Name</th>
                        <th className="text-left text-slate-400 pb-3 pr-4">Status</th>
                        <th className="text-left text-slate-400 pb-3 pr-4">Priority</th>
                        <th className="text-left text-slate-400 pb-3">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockData.map((item, index) => (
                        <motion.tr
                          key={item.id}
                          className="border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <td className="py-3 pr-4 text-white">{item.name}</td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                              item.status === 'Planning' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                              item.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {item.priority}
                            </span>
                          </td>
                          <td className="py-3 text-slate-400">{item.updated}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}

              {activeView === 'grid' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {mockData.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-colors"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -4 }}
                    >
                      <h4 className="text-white mb-2">{item.name}</h4>
                      <div className="flex gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                          item.status === 'Planning' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {item.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                          item.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs">Updated {item.updated}</p>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {activeView === 'list' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  {mockData.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex-1">
                        <h4 className="text-white mb-1">{item.name}</h4>
                        <p className="text-slate-400 text-xs">Updated {item.updated}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                          item.status === 'Planning' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {item.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                          item.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {item.priority}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 blur-3xl -z-10 opacity-50" />
        </motion.div>
      </div>
    </section>
  );
}