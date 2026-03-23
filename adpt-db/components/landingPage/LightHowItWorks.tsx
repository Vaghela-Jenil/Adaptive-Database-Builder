'use client'

import { motion } from 'motion/react';
import { useRef } from 'react';
import { useInView } from 'motion/react';
import {
  FolderPlus,
  Settings,
  FileEdit,
  Eye,
} from 'lucide-react';

export default function LightHowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const steps = [
    {
      icon: FolderPlus,
      title: 'Create Folder',
      description: 'Start with a secure folder for your project or team',
      gradient: 'from-purple-600 to-blue-600',
    },
    {
      icon: Settings,
      title: 'Define Fields',
      description: 'Customize data fields to match your workflow',
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      icon: FileEdit,
      title: 'Add Records',
      description: 'Populate your database with structured information',
      gradient: 'from-indigo-600 to-purple-600',
    },
    {
      icon: Eye,
      title: 'View & Manage',
      description: 'Access, search, and analyze your data effortlessly',
      gradient: 'from-purple-600 to-pink-600',
    },
  ];

  return (
    <section className="relative py-20 bg-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-purple-100/30 via-transparent to-transparent" />
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
            className="inline-block px-4 py-2 rounded-full bg-linear-to-r from-purple-100 to-blue-100 border border-purple-200 mb-6"
          >
            <span className="text-purple-700 font-semibold">Simple Process</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            How it works
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Get started in minutes with our intuitive workflow. No steep learning curve, just elegance and efficiency.
          </p>
        </motion.div>

        {/* Desktop Horizontal Flow */}
        <div className="hidden lg:grid grid-cols-2 gap-12 items-center max-w-7xl mx-auto relative">
          {/* Left Content - Steps */}
          <div className="flex items-center justify-between relative">
            {/* Connecting Lines */}
            <div className="absolute top-16 left-0 right-0 h-px">
              {steps.map((_, index) => (
                index < steps.length - 1 && (
                  <motion.div
                    key={index}
                    className="absolute h-px bg-linear-to-r from-purple-400 to-blue-400"
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
                  className="relative flex flex-col items-center w-1/2"
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ delay: 0.3 + index * 0.15, duration: 0.8 }}
                >
                  <motion.div
                    className={`w-28 h-28 bg-linear-to-br ${step.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg hover:shadow-2xl transition-all cursor-pointer group relative`}
                    whileHover={{ scale: 1.05, y: -8 }}
                  >
                    <Icon className="w-14 h-14 text-white" />
                    <div className={`absolute inset-0 bg-linear-to-br ${step.gradient} opacity-0 group-hover:opacity-20 rounded-xl blur-xl -z-10`} />
                  </motion.div>

                  <h3 className="font-bold text-slate-900 mb-2 text-base">{step.title}</h3>
                  <p className="text-slate-600 text-xs text-center max-w-30">{step.description}</p>

                  {/* Step Number Badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-linear-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg text-sm">
                    {index + 1}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right Content - Featured Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {/* Image Container */}
              <div 
                className="w-full h-96 bg-cover bg-center rounded-2xl"
                style={{
                  backgroundImage: "url('/database-application.webp')",
                }}
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-purple-900/40 via-transparent to-transparent" />
              
              {/* Feature Label */}
              <motion.div
                className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-xl rounded-xl p-4 shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <h4 className="font-bold text-slate-900 mb-1">Intuitive Interface</h4>
                <p className="text-sm text-slate-600">Build powerful databases without coding knowledge</p>
              </motion.div>
            </div>

            {/* Floating Badge */}
            <motion.div
              className="absolute -top-4 -right-4 w-20 h-20 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
              animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <div className="text-center">
                <div className="text-sm">Easy</div>
                <div className="text-xs">Setup</div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Mobile Vertical Flow */}
        <div className="lg:hidden space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="flex gap-6 items-start"
              >
                <div className={`w-20 h-20 bg-linear-to-br ${step.gradient} rounded-xl flex items-center justify-center shrink-0 shadow-lg`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-linear-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <h3 className="font-bold text-slate-900">{step.title}</h3>
                  </div>
                  <p className="text-slate-600 text-sm">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
