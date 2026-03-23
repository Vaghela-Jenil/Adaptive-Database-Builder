'use client';

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

interface FloatingCard {
  label: string;
  description: string;
  features: string[];
  icon: LucideIcon;
  color: string;
  delay: number;
}

export default function RotatingGrid({
  floatingCards,
}: {
  floatingCards: FloatingCard[];
}) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [positions, setPositions] = useState<number[]>([0, 1, 2, 3]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPositions((prev) => [prev[3], prev[0], prev[1], prev[2]]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const gridCoords = [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 1 },
    { row: 1, col: 0 },
  ];

  const cardWidth = 220;
  const cardHeight = 220;
  const gap = 32;

  return (
    <section className="relative py-16 flex justify-center">
      <div
        className="relative w-125 h-125"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: `${gap}px` }}
      >
        {floatingCards.map((card, index) => {
          const Icon = card.icon;
          const isActive = hoveredCard === index;

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
                  className="relative bg-white backdrop-blur-xl border border-slate-200 rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transition-all"
                  animate={{ width: isActive ? 280 : 220 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Hover Glow */}
                  <div
                    className={`absolute inset-0 bg-linear-to-br ${card.color} opacity-0 ${
                      isActive ? "opacity-5" : ""
                    } rounded-2xl transition-opacity duration-300 pointer-events-none`}
                  />

                  <div className="p-6">
                    <div
                      className={`w-12 h-12 bg-linear-to-br ${card.color} rounded-xl flex items-center justify-center mb-3 shadow-md`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <p className="text-slate-800 font-bold whitespace-nowrap text-sm">
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
                      <p className="text-slate-600 text-xs mb-3 leading-relaxed">
                        {card.description}
                      </p>

                      <div className="space-y-2">
                        {card.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2 text-xs text-slate-700">
                            <div className="w-1.5 h-1.5 bg-linear-to-r from-purple-600 to-blue-600 rounded-full" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Outer Glow */}
                <div
                  className={`absolute inset-0 bg-linear-to-br ${card.color} opacity-20 blur-xl rounded-2xl -z-10 pointer-events-none`}
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
