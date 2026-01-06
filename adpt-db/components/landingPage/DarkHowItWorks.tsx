'use client'
import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef } from 'react';
import { FolderPlus, Settings, FileEdit, Eye } from 'lucide-react';

export default function DarkHowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const steps = [
    {
      icon: FolderPlus,
      title: 'Create Folder',
      description: 'Start with a secure folder for your project or team',
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      icon: Settings,
      title: 'Define Fields',
      description: 'Customize data fields to match your workflow',
      gradient: 'from-blue-500 to-purple-600',
    },
    {
      icon: FileEdit,
      title: 'Add Records',
      description: 'Populate your database with structured information',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      icon: Eye,
      title: 'View & Manage',
      description: 'Access, search, and analyze your data effortlessly',
      gradient: 'from-pink-500 to-rose-600',
    },
  ];

  return (
    <section className="relative py-16 bg-slate-950 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 mb-6"
          >
            <span className="text-cyan-400">Simple Process</span>
          </motion.div>

          <h2 className="text-white mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            How it works
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Get started in minutes with our intuitive workflow
          </p>
        </motion.div>

        {/* Desktop Horizontal Flow */}
        <div className="hidden lg:flex items-center justify-between max-w-6xl mx-auto relative">
          {/* Connecting Lines */}
          <div className="absolute top-16 left-0 right-0 h-px">
            {steps.map((_, index) => (
              index < steps.length - 1 && (
                <motion.div
                  key={index}
                  className="absolute h-px bg-gradient-to-r from-cyan-500/50 to-blue-600/50"
                  style={{
                    left: `${(100 / (steps.length - 1)) * index + 12}%`,
                    width: `${100 / (steps.length - 1) - 24}%`,
                  }}
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                  transition={{ delay: 0.5 + index * 0.2, duration: 0.8 }}
                />
              )
            ))}
          </div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                className="flex flex-col items-center relative z-10"
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ delay: 0.2 * index, duration: 0.8 }}
                style={{ width: '20%' }}
              >
                {/* Step Number Badge */}
                <motion.div
                  className="absolute -top-6 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full"
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : { scale: 0 }}
                  transition={{ delay: 0.3 + index * 0.2, type: 'spring' }}
                >
                  <span className="text-cyan-400">{index + 1}</span>
                </motion.div>

                {/* Icon Circle */}
                <motion.div
                  className="relative group cursor-pointer"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={`relative w-32 h-32 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center mb-6`}>
                    <Icon className="w-12 h-12 text-white" />
                    
                    {/* Animated pulse */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${step.gradient} rounded-2xl opacity-0 group-hover:opacity-30`}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>

                  {/* Glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 -z-10`} />
                </motion.div>

                <h3 className="text-white mb-2 text-center">{step.title}</h3>
                <p className="text-slate-400 text-center">{step.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile Vertical Flow */}
        <div className="lg:hidden space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -40 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
                transition={{ delay: 0.2 * index, duration: 0.8 }}
                className="flex gap-6 items-start relative"
              >
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-10 top-20 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 to-blue-600/50" />
                )}

                {/* Icon */}
                <div className="relative flex-shrink-0">
                  <div className={`w-20 h-20 bg-gradient-to-br ${step.gradient} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} blur-xl opacity-40 -z-10`} />
                  
                  {/* Step Number */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center">
                    <span className="text-cyan-400">{index + 1}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <h3 className="text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}