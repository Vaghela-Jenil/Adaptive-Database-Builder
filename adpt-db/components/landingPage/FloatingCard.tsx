'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconType } from "react-icons";

interface FloatingCard {
  label: string;
  description: string;
  features: string[];
  icon: IconType;
  color: string;
  delay: number;
}

export default function RotatingGrid({
  floatingCards,
}: {
  floatingCards: FloatingCard[];
}) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [positions, setPositions] = useState<number[]>([0, 1, 2, 3]); // index mapping

  // Rotate positions every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setPositions((prev) => [prev[3], prev[0], prev[1], prev[2]]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Map 2x2 grid coordinates
  const gridCoords = [
    { row: 0, col: 0 }, // 11
    { row: 0, col: 1 }, // 12
    { row: 1, col: 1 }, // 22
    { row: 1, col: 0 }, // 21
  ];

  const cardWidth = 220;
  const cardHeight = 220;
  const gap = 32;

  return (
    <section className="relative py-16 flex justify-center">
      <div
        className="relative w-[500px] h-[500px]"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: `${gap}px` }}
      >
        {floatingCards.map((card, index) => {
          const Icon = card.icon;
          const isActive = hoveredCard === index;

          // Get position from rotating positions
          const posIndex = positions.indexOf(index);
          const { row, col } = gridCoords[posIndex];

          return (
            <motion.div
              key={card.label}
              className="absolute"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                top: row * (cardHeight + gap),
                left: col * (cardWidth + gap),
              }}
              transition={{ duration: 1 }}
            >
              <motion.div
                className="relative cursor-pointer"
                onHoverStart={() => setHoveredCard(index)}
                onHoverEnd={() => setHoveredCard(null)}
                whileHover={{ scale: 1.05, zIndex: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* Card */}
                <motion.div
                  className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden"
                  animate={{ width: isActive ? 280 : 220 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Hover Glow */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 ${
                      isActive ? "opacity-10" : ""
                    } rounded-2xl transition-opacity duration-300 pointer-events-none`}
                  />

                  <div className="p-6">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center mb-3`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <p className="text-slate-300 font-medium whitespace-nowrap">
                      {card.label}
                    </p>

                    {/* Expand Content */}
                    <motion.div
                      initial={false}
                      animate={{
                        opacity: isActive ? 1 : 0,
                        height: isActive ? "auto" : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden mt-2"
                    >
                      <p className="text-slate-400 text-sm mb-2">
                        {card.description}
                      </p>

                      <div className="space-y-1.5">
                        {card.features.map((feature, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-slate-400 text-xs"
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${card.color}`}
                            />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Outer Glow */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-20 blur-xl rounded-2xl -z-10 pointer-events-none`}
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
