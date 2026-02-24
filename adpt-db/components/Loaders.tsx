'use client';
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "motion/react";

export const FullPageLoader = () => {
  return (
    <div className="fixed inset-0 z-25 flex flex-col items-center justify-center bg-background">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 font-medium text-muted-foreground animate-pulse"
      >
        Initializing your Workspace...
      </motion.p>
    </div>
  )
};

export const DatabaseCardSkeleton = () => {
  const { currentTheme } = useTheme();
  return (
    <div
      className="p-6 rounded-xl h-full flex flex-col justify-between border animate-pulse relative overflow-hidden"
      style={{
        backgroundColor: currentTheme.surface,
        borderColor: currentTheme.border
      }}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">

          <div className="w-12 h-12 rounded-xl bg-gray-400/20" />

          <div className="w-8 h-8 rounded-lg bg-gray-400/10" />

        </div>
        <div className="h-5 w-3/4 bg-gray-400/20 rounded-md" />
        <div className="flex gap-3">
          <div className="h-3 w-16 bg-gray-400/10 rounded" />
          <div className="h-3 w-12 bg-gray-400/10 rounded" />
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t" style={{ borderColor: currentTheme.border }}>
        <div className="space-y-2">
          <div className="h-2 w-8 bg-gray-400/10 rounded" />
          <div className="h-3 w-14 bg-gray-400/20 rounded" />
        </div>
        <div className="space-y-2 flex flex-col items-end">
          <div className="h-2 w-8 bg-gray-400/10 rounded" />
          <div className="h-3 w-14 bg-gray-400/20 rounded" />
        </div>
      </div>
    </div>
  )
};

export const TableRowSkeleton = ({ fieldCount }: { fieldCount: number }) => {
  const { currentTheme } = useTheme();
  return (
    <table className="w-full border-collapse">
      <thead
        className="sticky top-0 z-10"
        style={{ backgroundColor: currentTheme.surface }}
      >
      <tr className="animate-pulse">
        {/* Index/Checkbox Column */}
        <td className="px-4 py-3 border-b">
          <div className="h-4 w-4 bg-gray-400/20 rounded" />
        </td>

        {/* Dynamic Data Columns */}
        {Array.from({ length: fieldCount }).map((_, i) => (
          <td key={i} className="px-4 py-3 border-b">
            <div className="h-4 w-full bg-gray-400/10 rounded" />
          </td>
        ))}

        {/* Created Date Column */}
        <td className="px-4 py-3 border-b">
          <div className="h-4 w-20 bg-gray-400/10 rounded" />
        </td>

        {/* Actions Column */}
        <td className="px-4 py-3 border-b">
          <div className="h-8 w-16 bg-red-400/10 rounded" />
        </td>
      </tr>
      </thead>
    </table >
  )};