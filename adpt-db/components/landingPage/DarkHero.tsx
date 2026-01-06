'use client'
import { motion } from "motion/react";
import {
  ArrowRight,
  Sparkles,
  Database,
  FolderLock,
  Table2,
  FileText,
} from "lucide-react";
import { Button } from '../ui/button';

export default function DarkHero() {
  const floatingCards = [
    {
      icon: Database,
      label: "Custom Database",
      color: "from-cyan-500 to-blue-600",
      delay: 0,
      x: -20,
      y: -30,
    },
    {
      icon: FolderLock,
      label: "Secure Folders",
      color: "from-blue-500 to-purple-600",
      delay: 0.2,
      x: 20,
      y: -20,
    },
    {
      icon: Table2,
      label: "Dynamic Tables",
      color: "from-purple-500 to-pink-600",
      delay: 0.4,
      x: -30,
      y: 20,
    },
    {
      icon: FileText,
      label: "Smart Forms",
      color: "from-pink-500 to-rose-600",
      delay: 0.6,
      x: 30,
      y: 30,
    },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-30" />

      {/* Glowing Orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="container mx-auto px-4 lg:px-8 relative left-4 z-10 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400">
                Enterprise-grade data management
              </span>
            </motion.div>

            <motion.h1
              className="text-white mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Your data. Organized your way.
            </motion.h1>

            <motion.p
              className="text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Create custom databases and secure folders that
              adapt to your workflow. Replace spreadsheets with
              powerful, flexible record keeping that scales with
              your business.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-600"
              >
                Watch Demo
              </Button>
            </motion.div>

            <motion.p
              className="mt-6 text-slate-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              No credit card required • 14-day free trial
            </motion.p>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            className="relative h-[500px] hidden lg:flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            {/* Central Glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 bg-gradient-to-r from-cyan-500/30 to-blue-600/30 rounded-full blur-3xl" />
            </div>

            {/* Floating Cards */}
            {floatingCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  className="absolute"
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                    x: 0,
                    y: 0,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: card.x * 4,
                    y: card.y * 3,
                  }}
                  transition={{
                    delay: card.delay,
                    duration: 0.8,
                  }}
                  style={{
                    animation: `float ${4 + index}s ease-in-out infinite`,
                    animationDelay: `${card.delay}s`,
                  }}
                >
                  <motion.div
                    className="relative group cursor-pointer"
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                    }}
                  >
                    {/* Card */}
                    <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 shadow-2xl">
                      {/* Glow on hover */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}
                      />

                      <div
                        className={`relative w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center mb-3`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-slate-300 whitespace-nowrap">
                        {card.label}
                      </p>
                    </div>

                    {/* Glow effect */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-20 blur-xl rounded-2xl -z-10`}
                    />
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </section>
  );
}