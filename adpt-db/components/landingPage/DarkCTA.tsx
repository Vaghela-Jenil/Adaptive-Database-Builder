'use client'
import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef } from 'react';
import { ArrowRight, Sparkles, Check } from 'lucide-react';
import { Button } from '../ui/button';

export default function DarkCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <section className="relative py-16 bg-slate-950 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"
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
          <div className="relative bg-linear-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-12 lg:p-16 overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[3rem_3rem] opacity-20" />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-br from-cyan-500/10 via-transparent to-blue-600/10" />

            {/* Content */}
            <div className="relative z-10 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 mb-8"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400">Start your free trial today</span>
              </motion.div>

              <motion.h2
                className="text-white mb-6 bg-linear-to-r from-white via-slate-200 to-slate-400 bg-clip-text"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Ready to organize your data?
              </motion.h2>

              <motion.p
                className="text-slate-400 mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Join thousands of professionals who trust My Digital Records to manage their most important data. 
                Start your 14-day free trial with no credit card required.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <Button
                  size="lg"
                  className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-500"
                >
                  Schedule a Demo
                </Button>
              </motion.div>

              <motion.p
                className="mt-6 text-slate-500"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <div className="flex items-center gap-3 text-slate-500">
                  <Check size={16} className="text-cyan-400 shrink-0" />
                  Free 14-day trial  •
                  <Check size={16} className="text-cyan-400 shrink-0 ml-3" />
                  No credit card  •
                  <Check size={16} className="text-cyan-400 shrink-0 ml-3" />
                  Cancel anytime
                </div>
              </motion.p>
            </div>

            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-3xl" />
            <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-blue-600/30 rounded-br-3xl" />
          </div>

          {/* Outer glow effect */}
          <div className="absolute inset-0 bg-linear-to-r from-cyan-500/20 to-blue-600/20 blur-3xl -z-10 opacity-50" />
        </motion.div>
      </div>
    </section>
  );
}