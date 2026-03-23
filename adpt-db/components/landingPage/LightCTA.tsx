'use client'

import { motion } from 'motion/react';
import { useRef } from 'react';
import { useInView } from 'motion/react';
import { Sparkles } from 'lucide-react';

export default function LightCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <section className="relative py-20 bg-linear-to-br from-slate-50 to-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-linear-to-br from-purple-200 to-transparent rounded-full blur-3xl opacity-30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-linear-to-br from-blue-200 to-transparent rounded-full blur-3xl opacity-30"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Main CTA Card */}
          <div className="relative bg-linear-to-br from-white via-slate-50 to-blue-50 backdrop-blur-xl border border-slate-200 rounded-3xl p-12 lg:p-16 overflow-hidden shadow-2xl">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-size-[3rem_3rem] opacity-10" />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-br from-purple-100/20 via-transparent to-blue-100/20" />

            {/* Content */}
            <div className="relative z-10 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-purple-100 to-blue-100 border border-purple-200 mb-8"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-purple-700 font-semibold">Get Started</span>
              </motion.div>

              <motion.h2
                className="text-slate-900 mb-6 text-4xl md:text-5xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Ready to transform your data management?
              </motion.h2>

              <motion.p
                className="text-slate-600 mb-8 max-w-2xl mx-auto text-lg leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Join thousands of professionals using ADPt to organize their most important data. Start your 14-day free trial today—no credit card required.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <a
                  href="/signup"
                  className="px-8 py-4 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-lg shadow-purple-400/30 hover:shadow-xl hover:shadow-purple-400/50 transition-all hover:scale-105"
                >
                  Start Free Trial
                </a>
                <a
                  href="#"
                  className="px-8 py-4 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold hover:border-purple-400 hover:text-purple-700 transition-all"
                >
                  View Pricing
                </a>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-slate-500 mt-6"
              >
                ✓ No credit card required • ✓ 14-day access to all features • ✓ Cancel anytime
              </motion.p>
            </div>

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-purple-400/20 rounded-tl-3xl" />
            <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-blue-400/20 rounded-br-3xl" />
          </div>

          {/* Outer glow effect */}
          <div className="absolute inset-0 bg-linear-to-r from-purple-200/20 to-blue-200/20 blur-3xl -z-10 opacity-50" />
        </motion.div>
      </div>
    </section>
  );
}
