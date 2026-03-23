'use client'

import { motion } from 'motion/react';
import { useRef } from 'react';
import { useInView } from 'motion/react';
import {
  Database,
  Shield,
  Search,
  FolderTree,
} from 'lucide-react';

export default function DarkFeatures() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const features = [
    {
      icon: Database,
      title: 'Custom Database Builder',
      description: 'Design elegant databases tailored to your exact needs. Define custom fields, relationships, and workflows without writing code.',
      gradient: 'from-purple-600 to-blue-600',
      glowColor: 'purple',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption and granular access controls keep your sensitive records protected. Set permissions per team member.',
      gradient: 'from-blue-600 to-indigo-600',
      glowColor: 'blue',
    },
    {
      icon: Search,
      title: 'Intelligent Search',
      description: 'Find any record instantly with advanced search and filtering capabilities. Search across all fields, tags, and relationships seamlessly.',
      gradient: 'from-indigo-600 to-purple-600',
      glowColor: 'indigo',
    },
    {
      icon: FolderTree,
      title: 'Smart Organization',
      description: 'Structure your data with unlimited nested folders and collections. Create hierarchies that perfectly mirror your organization.',
      gradient: 'from-purple-600 to-pink-600',
      glowColor: 'pink',
    },
  ];

  return (
    <section id="features" className="relative py-20 bg-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated Gradient Orb - Top Right */}
        <motion.div
          className="absolute top-20 right-0 w-96 h-96 bg-linear-to-br from-purple-300 via-blue-300 to-transparent rounded-full blur-3xl opacity-50"
          animate={{ 
            y: [0, 60, 0],
            x: [0, 40, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 12, repeat: Infinity }}
        />

        {/* Animated Gradient Orb - Bottom Left */}
        <motion.div
          className="absolute bottom-20 -left-32 w-96 h-96 bg-linear-to-tr from-blue-300 via-indigo-300 to-transparent rounded-full blur-3xl opacity-45"
          animate={{ 
            y: [0, -60, 0],
            x: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 14, repeat: Infinity, delay: 2 }}
        />

        {/* Animated Gradient Orb - Center Top */}
        <motion.div
          className="absolute -top-20 left-1/3 w-96 h-96 bg-linear-to-b from-indigo-300 via-purple-300 to-transparent rounded-full blur-3xl opacity-40"
          animate={{ 
            scale: [1, 1.25, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 16, repeat: Infinity, delay: 1 }}
        />

        {/* Floating Particle Elements */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-3 h-3 bg-purple-500 rounded-full blur"
          animate={{ 
            y: [0, -100, 0],
            x: [0, 50, 0],
            opacity: [0.4, 1, 0.4]
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="absolute top-1/3 left-1/4 w-3 h-3 bg-blue-500 rounded-full blur"
          animate={{ 
            y: [0, 80, 0],
            x: [0, -60, 0],
            opacity: [0.4, 1, 0.4]
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-indigo-500 rounded-full blur"
          animate={{ 
            y: [0, -80, 0],
            x: [0, 50, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 9, repeat: Infinity, delay: 0.5 }}
        />

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.15)_1px,transparent_1px)',
          backgroundSize: '50px 50px'
        }} />

        {/* Animated Light Sweep */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full bg-linear-to-r from-transparent via-white/10 to-transparent"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </div>

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
            className="inline-block px-4 py-2 rounded-full bg-linear-to-r from-purple-100 to-blue-100 border border-purple-200 mb-6"
          >
            <span className="text-purple-700 font-semibold">Powerful Features</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-slate-900 to-purple-900 bg-clip-text text-transparent">
            Everything you need to organize
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Professional-grade tools designed for teams who demand flexibility, security, and elegant design.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
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
                <div className="relative bg-white backdrop-blur-xl border border-slate-200 rounded-2xl p-8 h-full shadow-lg hover:shadow-2xl transition-all">
                  <div className={`absolute inset-0 bg-linear-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
                  
                  <div className={`w-14 h-14 bg-linear-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>

                {/* Outer glow */}
                <div className={`absolute inset-0 bg-linear-to-br ${feature.gradient} opacity-10 blur-2xl rounded-2xl -z-10 transition-opacity duration-300 group-hover:opacity-20`} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
