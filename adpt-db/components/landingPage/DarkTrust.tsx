'use client'
import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef } from 'react';
import { ShieldCheck, Lock, UserCheck, Server, Award, Zap } from 'lucide-react';

export default function DarkTrust() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const trustFeatures = [
    {
      icon: ShieldCheck,
      title: 'Enterprise Security',
      description: 'Bank-level encryption and compliance standards',
    },
    {
      icon: Lock,
      title: 'Data Privacy',
      description: 'Your data stays yours. Zero-knowledge architecture',
    },
    {
      icon: UserCheck,
      title: 'Access Control',
      description: 'Granular permissions and role-based access',
    },
    {
      icon: Server,
      title: '99.9% Uptime',
      description: 'Reliable infrastructure you can depend on',
    },
    {
      icon: Award,
      title: 'Compliance Ready',
      description: 'GDPR, SOC 2, and HIPAA compliant',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized performance at any scale',
    },
  ];

  return (
    <section className="relative py-16 bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-linear-to-r from-cyan-500/10 to-blue-600/10 rounded-full blur-3xl" />
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
            className="inline-block px-4 py-2 rounded-full bg-linear-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 mb-6"
          >
            <span className="text-cyan-400">Enterprise Trust</span>
          </motion.div>

          <h2 className="text-white mb-4 bg-linear-to-r from-white to-slate-400 bg-clip-text">
            Built for reliability and security
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Trusted by organizations worldwide to handle their most sensitive data with enterprise-grade security and performance.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          {trustFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ delay: 0.1 * index, duration: 0.8 }}
                className="group"
              >
                <div className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-xl p-6 h-full hover:border-slate-700/50 transition-all duration-300">
                  <motion.div
                    className="w-12 h-12 bg-linear-to-br from-cyan-500/20 to-blue-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                    whileHover={{ rotate: 5 }}
                  >
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </motion.div>

                  <h3 className="text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>

                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative bg-linear-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-12 max-w-4xl mx-auto overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[linear-linear(to_right,#1e293b_1px,transparent_1px),linear-linear(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[2rem_2rem] opacity-20" />
          
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '500K+', label: 'Records Stored' },
              { value: '10K+', label: 'Active Users' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '24/7', label: 'Support' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
              >
                <div className="text-white mb-2 bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text">
                  {stat.value}
                </div>
                <p className="text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Corner accents */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-cyan-500/20 to-transparent rounded-bl-full" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-linear-to-tr from-blue-600/20 to-transparent rounded-tr-full" />
        </motion.div>
      </div>
    </section>
  );
}