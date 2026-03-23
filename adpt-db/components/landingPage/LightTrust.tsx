'use client'
import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef } from 'react';
import { ShieldCheck, Lock, UserCheck, Server, Award, Zap } from 'lucide-react';

export default function LightTrust() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const trustFeatures = [
    {
      icon: ShieldCheck,
      title: 'Enterprise Security',
      description: 'Bank-level encryption and compliance standards',
      gradient: 'from-blue-600 to-cyan-600',
    },
    {
      icon: Lock,
      title: 'Data Privacy',
      description: 'Your data stays yours. Zero-knowledge architecture',
      gradient: 'from-purple-600 to-indigo-600',
    },
    {
      icon: UserCheck,
      title: 'Access Control',
      description: 'Granular permissions and role-based access',
      gradient: 'from-pink-600 to-purple-600',
    },
    {
      icon: Server,
      title: '99.9% Uptime',
      description: 'Reliable infrastructure you can depend on',
      gradient: 'from-green-600 to-teal-600',
    },
    {
      icon: Award,
      title: 'Compliance Ready',
      description: 'GDPR, SOC 2, and HIPAA compliant',
      gradient: 'from-orange-600 to-red-600',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized performance at any scale',
      gradient: 'from-amber-600 to-orange-600',
    },
  ];

  return (
    <section className="relative py-20 bg-gradient-to-b from-white via-slate-50 to-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-40 right-1/3 w-96 h-96 bg-linear-to-br from-blue-200/40 to-purple-200/40 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 180],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 w-96 h-96 bg-linear-to-tr from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [180, 90, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, delay: 2 }}
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
            className="inline-block px-4 py-2 rounded-full bg-linear-to-r from-purple-600/10 to-blue-600/10 border border-purple-300/30 mb-6"
          >
            <span className="bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-semibold">Enterprise Trust</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Built for reliability and security
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
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
                <motion.div
                  className="relative bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-8 h-full hover:border-slate-300 transition-all duration-300 shadow-lg hover:shadow-xl"
                  whileHover={{ y: -5 }}
                >
                  <motion.div
                    className={`w-14 h-14 bg-linear-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>

                  {/* Decorative corner accent */}
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-linear-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-bl-3xl transition-opacity duration-300`} />
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative bg-gradient-to-r from-white/95 via-slate-50/90 to-white/95 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-12 max-w-4xl mx-auto overflow-hidden shadow-xl"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-size-[2rem_2rem]" />
          </div>
          
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '500K+', label: 'Records Stored', gradient: 'from-purple-600 to-blue-600' },
              { value: '10K+', label: 'Active Users', gradient: 'from-blue-600 to-cyan-600' },
              { value: '99.9%', label: 'Uptime SLA', gradient: 'from-pink-600 to-purple-600' },
              { value: '24/7', label: 'Support', gradient: 'from-orange-600 to-red-600' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
              >
                <motion.div
                  className={`text-3xl md:text-4xl font-bold mb-2 bg-linear-to-r ${stat.gradient} bg-clip-text text-transparent`}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                >
                  {stat.value}
                </motion.div>
                <p className="text-slate-600 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Corner accents */}
          <motion.div 
            className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-purple-300/30 to-transparent rounded-bl-full opacity-50"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 w-40 h-40 bg-linear-to-tr from-blue-300/30 to-transparent rounded-tr-full opacity-50"
            animate={{ rotate: [360, 0] }}
            transition={{ duration: 25, repeat: Infinity }}
          />
        </motion.div>
      </div>
    </section>
  );
}
