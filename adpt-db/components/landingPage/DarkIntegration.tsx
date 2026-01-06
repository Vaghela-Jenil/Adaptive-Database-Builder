'use client'
import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef } from 'react';
import { Cloud, Zap, Mail, Calendar, FileText, Lock, Database, Code } from 'lucide-react';

export default function DarkIntegrations() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const integrations = [
    { icon: Cloud, name: 'Google Drive', color: 'from-yellow-500 to-orange-500' },
    { icon: Zap, name: 'Zapier', color: 'from-orange-500 to-red-500' },
    { icon: Mail, name: 'Gmail', color: 'from-red-500 to-pink-500' },
    { icon: Calendar, name: 'Calendar', color: 'from-blue-500 to-cyan-500' },
    { icon: FileText, name: 'Notion', color: 'from-slate-600 to-slate-800' },
    { icon: Lock, name: 'OAuth', color: 'from-green-500 to-emerald-500' },
    { icon: Database, name: 'PostgreSQL', color: 'from-blue-600 to-indigo-600' },
    { icon: Code, name: 'REST API', color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <section className="relative py-16 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />

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
            <span className="text-cyan-400">Seamless Integrations</span>
          </motion.div>

          <h2 className="text-white mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Connect with your favorite tools
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Integrate seamlessly with the tools you already use. Build custom workflows with our powerful API.
          </p>
        </motion.div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
          {integrations.map((integration, index) => {
            const Icon = integration.icon;
            return (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.05 * index, duration: 0.6 }}
                whileHover={{ y: -8, scale: 1.05 }}
                className="group relative"
              >
                <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 rounded-xl p-6 text-center hover:border-slate-700/50 transition-all duration-300">
                  {/* Icon */}
                  <motion.div
                    className={`w-14 h-14 mx-auto mb-3 bg-gradient-to-br ${integration.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    whileHover={{ rotate: 5 }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>

                  {/* Name */}
                  <p className="text-slate-300 group-hover:text-white transition-colors">
                    {integration.name}
                  </p>

                  {/* Hover glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${integration.color} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300`} />
                </div>

                {/* Card glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${integration.color} blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10`} />
              </motion.div>
            );
          })}
        </div>

        {/* API Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative max-w-3xl mx-auto bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 overflow-hidden"
        >
          {/* Background code pattern */}
          <div className="absolute inset-0 opacity-5">
            <pre className="text-cyan-400 text-xs leading-relaxed">
{`{
  "database": "custom_records",
  "fields": [...],
  "security": "enterprise",
  "api": "rest"
}`}
            </pre>
          </div>

          <div className="relative z-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Code className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white mb-3">Powerful REST API</h3>
            <p className="text-slate-400 mb-6">
              Build custom integrations with our comprehensive API. Full documentation and SDKs available.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View API Docs
              <span>→</span>
            </a>
          </div>

          {/* Decorative corners */}
          <div className="absolute top-0 right-0 w-20 h-20 border-t border-r border-cyan-500/20 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-20 h-20 border-b border-l border-blue-600/20 rounded-bl-2xl" />
        </motion.div>
      </div>
    </section>
  );
}