'use client'

import { motion } from "motion/react";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  Sparkles,
  Database,
  FolderLock,
  Table2,
  FileText,
} from "lucide-react";
import { Button } from "../ui/button";
import FloatingCardsSection from "./FloatingCardNew";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function DarkHero() {
  const [displayedText, setDisplayedText] = useState("");
  const fullText = "Organize Your Data, Beautifully";
  const { isSignedIn } = useUser();
  const router = useRouter();

  // Text animation effect with loop
  useEffect(() => {
    setDisplayedText(""); // Reset on mount
    let index = 0;
    let interval: NodeJS.Timeout | undefined;

    const startAnimation = () => {
      index = 0;
      setDisplayedText("");
      interval = setInterval(() => {
        if (index < fullText.length) {
          setDisplayedText(fullText.substring(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          // Restart animation after 3 seconds
          setTimeout(startAnimation, 3000);
        }
      }, 80);
    };

    startAnimation();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fullText]);

  const floatingCards = [
    {
      icon: Database,
      label: "Custom Database",
      description: "Build flexible databases tailored to your workflow",
      features: ["Custom fields", "Relations", "Views"],
      color: "from-purple-600 to-blue-600",
      delay: 0,
      x: -20,
      y: -30,
    },
    {
      icon: FolderLock,
      label: "Secure Folders",
      description: "Enterprise-grade security with role-based access",
      features: ["Encryption", "Permissions", "Audit logs"],
      color: "from-blue-600 to-indigo-600",
      delay: 0.2,
      x: 20,
      y: -20,
    },
    {
      icon: Table2,
      label: "Dynamic Tables",
      description: "Powerful tables with sorting, filtering and formulas",
      features: ["Sort & filter", "Formulas", "Import/Export"],
      color: "from-indigo-600 to-purple-600",
      delay: 0.4,
      x: -30,
      y: 20,
    },
    {
      icon: FileText,
      label: "Smart Forms",
      description: "Create beautiful forms to collect data effortlessly",
      features: ["Validation", "Logic", "Embeddable"],
      color: "from-purple-600 to-pink-600",
      delay: 0.6,
      x: 30,
      y: 30,
    },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-linear-to-br from-slate-50 via-white to-blue-50 pt-20">
      {/* Animated background with video and images */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          style={{ filter: "blur(2px)" }}
        >
          <source
            src="https://media.istockphoto.com/id/1408123442/video/abstract-blue-and-purple-gradient-background-loop.mp4?s=mp4&k=v=1706283849&e=1711929600"
            type="video/mp4"
          />
        </video>

        {/* Overlay with darker gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-slate-50/70 via-white/60 to-blue-50/70" />

        {/* Large animated gradient blob - Purple */}
        <motion.div
          className="absolute -top-32 -left-32 w-96 h-96 bg-linear-to-br from-purple-400/50 via-purple-300/30 to-transparent rounded-full blur-3xl"
          animate={{ 
            y: [0, 60, 0],
            x: [0, 40, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Large animated gradient blob - Blue */}
        <motion.div
          className="absolute -bottom-32 -right-32 w-96 h-96 bg-linear-to-br from-blue-400/40 via-blue-300/30 to-transparent rounded-full blur-3xl"
          animate={{ 
            y: [0, -60, 0],
            x: [0, -40, 0],
            scale: [1.3, 1, 1.3]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Medium blob - Indigo */}
        <motion.div
          className="absolute top-1/4 right-1/3 w-80 h-80 bg-linear-to-br from-indigo-300/40 to-transparent rounded-full blur-3xl"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.15, 1],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        {/* Additional accent blob - Pink */}
        <motion.div
          className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-linear-to-br from-pink-300/25 to-transparent rounded-full blur-3xl"
          animate={{ 
            scale: [0.8, 1.2, 0.8],
            x: [0, 30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Animated grid pattern overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#9333ea" strokeWidth="0.5"/>
            </pattern>
            <pattern id="dots" x="60" y="60" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="2.5" fill="#7c3aed" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Animated gradient clips - flowing diagonals */}
        <motion.div
          className="absolute inset-0 opacity-50"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            backgroundImage: "linear-gradient(45deg, transparent 0%, rgba(168, 85, 247, 0.06) 20%, transparent 40%, transparent 60%, rgba(59, 130, 246, 0.06) 80%, transparent 100%)",
            backgroundSize: "300% 300%"
          }}
        />

        {/* Animated clip-path decorative elements */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150"
          animate={{
            rotate: [0, 360],
            scale: [0.8, 1.1, 0.8]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            background: "linear-gradient(135deg, rgba(147, 51, 234, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)",
            filter: "blur(40px)"
          }}
        />

        {/* Radial gradient background */}
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{
            backgroundImage: "radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.04) 0%, transparent 70%)",
          }}
        />

        {/* Additional radial from bottom right */}
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          style={{
            backgroundImage: "radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 60%)",
          }}
        />

        {/* Floating image accents (right side) */}
        <motion.div
          className="absolute top-1/4 right-0 w-96 h-96 opacity-20"
          animate={{
            y: [0, 40, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%22 0 0 1200 1200%22%3E%3Crect fill=%22%236b21a8%22 width=%221200%22 height=%221200%22/%3E%3Cpath fill=%22%237c3aed%22 d=%22M600 0C268.63 0 0 268.63 0 600s268.63 600 600 600 600-268.63 600-600S931.37 0 600 0z%22 opacity=%220.5%22/%3E%3C/svg%3E')",
            backgroundSize: "cover"
          }}
        />

        {/* Left side floating shapes */}
        <motion.div
          className="absolute bottom-0 left-0 w-80 h-80 opacity-25"
          animate={{
            y: [0, -40, 0],
            rotate: [-15, 5, -15]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{
            backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 1200%22%3E%3Crect fill=%22%231e40af%22 width=%221200%22 height=%221200%22/%3E%3Ccircle cx=%22600%22 cy=%22600%22 r=%22400%22 fill=%22%230369a1%22 opacity=%220.3%22/%3E%3C/svg%3E')",
            backgroundSize: "cover"
          }}
        />
      </div>

      <div className="container mx-auto px-6 lg:px-10 relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-purple-100 to-blue-100 border border-purple-200 mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
              </motion.div>
              <span className="text-purple-700 font-semibold text-sm">
                Professional Data Management
              </span>
            </motion.div>

            {/* Animated Heading */}
            <div className="mb-6 leading-tight h-auto">
              <h1 className="text-5xl md:text-7xl font-bold text-slate-900">
                {displayedText}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  className="text-purple-600"
                >
                  |
                </motion.span>
              </h1>
            </div>

            {/* Description */}
            <motion.p 
              className="text-lg text-slate-600 mb-8 max-w-xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              Create custom databases and secure folders that adapt to your workflow. Replace spreadsheets with powerful, elegant systems designed for modern teams.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex gap-4 justify-center lg:justify-start flex-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
            >
              <motion.button
                onClick={() => router.push(isSignedIn ? '/user/dashboard' : '/auth/signup')}
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(168, 85, 247, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-lg shadow-purple-400/30 transition-all flex items-center gap-2"
              >
                {isSignedIn ? 'Go to Dashboard' : 'Start Free Trial'}
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              </motion.button>

              <motion.a
                href="#features"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold hover:border-purple-400 hover:text-purple-700 transition-all flex items-center gap-2"
              >
                Watch Demo
              </motion.a>
            </motion.div>

            {/* Trust text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.8 }}
              className="text-sm text-slate-500 mt-6"
            >
              ✓ No credit card required • ✓ 14-day free trial • ✓ Cancel anytime
            </motion.p>
          </motion.div>

          {/* RIGHT FLOATING CARDS */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <FloatingCardsSection floatingCards={floatingCards} />
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
      `}</style>
    </section>
  );
}
