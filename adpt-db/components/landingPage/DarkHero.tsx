'use client'

import { motion } from "motion/react";
import { useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Database,
  FolderLock,
  Table2,
  FileText,
} from "lucide-react";
import { Button } from "../ui/button";
import FloatingCardsSection from "./FloatingCard";

export default function DarkHero({
  onEnterDashboard,
}: {
  onEnterDashboard: () => void;
}) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const floatingCards = [
    {
      icon: Database,
      label: "Custom Database",
      description: "Build flexible databases tailored to your workflow",
      features: ["Custom fields", "Relations", "Views"],
      color: "from-cyan-500 to-blue-600",
      delay: 0,
      x: -20,
      y: -30,
    },
    {
      icon: FolderLock,
      label: "Secure Folders",
      description: "Enterprise-grade security with role-based access",
      features: ["Encryption", "Permissions", "Audit logs"],
      color: "from-blue-500 to-purple-600",
      delay: 0.2,
      x: 20,
      y: -20,
    },
    {
      icon: Table2,
      label: "Dynamic Tables",
      description: "Powerful tables with sorting, filtering and formulas",
      features: ["Sort & filter", "Formulas", "Import/Export"],
      color: "from-purple-500 to-pink-600",
      delay: 0.4,
      x: -30,
      y: 20,
    },
    {
      icon: FileText,
      label: "Smart Forms",
      description: "Create beautiful forms to collect data effortlessly",
      features: ["Validation", "Logic", "Embeddable"],
      color: "from-pink-500 to-rose-600",
      delay: 0.6,
      x: 30,
      y: 30,
    },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-linear-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-30" />

      {/* Glow Orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="container mx-auto px-6 lg:px-10 relative z-10 pt-20">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400">
                Enterprise-grade data management
              </span>
            </div>

            <h1 className="text-white text-5xl font-bold mb-6">
              Your data. Organized your way.
            </h1>

            <p className="text-slate-400 mb-8 max-w-xl">
              Create custom databases and secure folders that adapt to your
              workflow. Replace spreadsheets with powerful systems.
            </p>

            <div className="flex gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                onClick={onEnterDashboard}
                className="bg-linear-to-r from-cyan-500 to-blue-600"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>
          </motion.div>

          <FloatingCardsSection floatingCards={floatingCards} />
        </div>
      </div>

      

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-18px);
          }
        }
      `}</style>
    </section>
  );
}
