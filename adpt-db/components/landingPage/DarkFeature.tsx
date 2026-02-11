'use client'
import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef } from 'react';
import { Database, Shield, Search, FolderTree } from 'lucide-react';

export default function DarkFeatures() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const features = [
    {
      icon: Database,
      title: 'Custom Database Builder',
      description: 'Design databases tailored to your exact needs. Define custom fields, relationships, and workflows without writing code.',
      gradient: 'from-cyan-500 to-blue-600',
      glowColor: 'cyan',
    },
    {
      icon: Shield,
      title: 'Secure Data Vault',
      description: 'Enterprise-grade encryption and access controls keep your sensitive records protected. Set granular permissions per folder.',
      gradient: 'from-blue-500 to-purple-600',
      glowColor: 'blue',
    },
    {
      icon: Search,
      title: 'Smart Search',
      description: 'Find any record instantly with intelligent search and filtering. Search across all fields, tags, and relationships.',
      gradient: 'from-purple-500 to-pink-600',
      glowColor: 'purple',
    },
    {
      icon: FolderTree,
      title: 'Organized Records',
      description: 'Structure your data with nested folders and collections. Create hierarchies that mirror your organization.',
      gradient: 'from-pink-500 to-rose-600',
      glowColor: 'pink',
    },
  ];

  return (
    <section className="relative py-16 bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-20" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-block px-4 py-2 rounded-full bg-linear-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 mb-6"
          >
            <span className="text-cyan-400">Powerful Features</span>
          </motion.div>

          <h2 className="text-white mb-4 bg-linear-to-r from-white to-slate-400 bg-clip-text">
            Everything you need to organize
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Professional-grade tools designed for teams and individuals who demand flexibility, security, and control.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ delay: 0.1 * index, duration: 0.8 }}
                whileHover={{ y: -8 }}
                className="group relative"
              >
                {/* Glassmorphism Card */}
                <div className="relative h-full bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 overflow-hidden transition-all duration-300 group-hover:border-slate-700/50">
                  {/* Hover Glow Effect */}
                  <motion.div
                    className={`absolute inset-0 bg-linear-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  />
                  
                  {/* Icon with Gradient Background */}
                  <motion.div
                    className={`relative w-14 h-14 bg-linear-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                    whileHover={{ rotate: 5 }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                    
                    {/* Icon Glow */}
                    <div className={`absolute inset-0 bg-linear-to-br ${feature.gradient} blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300 -z-10`} />
                  </motion.div>

                  <h3 className="text-white mb-3 group-hover:text-transparent group-hover:bg-linear-to-r group-hover:from-white group-hover:to-slate-300 group-hover:bg-clip-text transition-all">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Bottom Glow Line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-px bg-linear-to-r ${feature.gradient} opacity-0 group-hover:opacity-50 transition-opacity duration-300`} />
                </div>

                {/* Card Outer Glow */}
                <div className={`absolute inset-0 bg-linear-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 blur-2xl rounded-2xl -z-10 transition-opacity duration-300`} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}