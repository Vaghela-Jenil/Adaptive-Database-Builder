'use client'
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export default function AnimatedBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Data nodes flowing
  const dataNodes = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: i * 0.3,
    duration: 15 + Math.random() * 10,
    x: Math.random() * 100,
    size: 20 + Math.random() * 40,
  }));

  // Database layers (3D effect)
  const databaseLayers = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    delay: i * 0.5,
    scale: 1 - i * 0.15,
    opacity: 0.8 - i * 0.15,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Gradient orbs with parallax */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-125 h-125 bg-cyan-500/20 rounded-full blur-3xl"
        animate={{
          x: mousePosition.x * 50,
          y: mousePosition.y * 50,
          scale: [1, 1.2, 1],
        }}
        transition={{
          x: { type: 'spring', stiffness: 50 },
          y: { type: 'spring', stiffness: 50 },
          scale: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
        }}
      />
      
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-150 h-150 bg-blue-600/20 rounded-full blur-3xl"
        animate={{
          x: mousePosition.x * -40,
          y: mousePosition.y * -40,
          scale: [1.2, 1, 1.2],
        }}
        transition={{
          x: { type: 'spring', stiffness: 50 },
          y: { type: 'spring', stiffness: 50 },
          scale: { duration: 10, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* 3D Database Layers */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl">
        {databaseLayers.map((layer) => (
          <motion.div
            key={layer.id}
            className="absolute inset-0 border border-cyan-500/10 rounded-xl"
            style={{
              transformStyle: 'preserve-3d',
            }}
            initial={{ scale: layer.scale, opacity: 0 }}
            animate={{
              scale: [layer.scale, layer.scale * 1.05, layer.scale],
              opacity: [layer.opacity, layer.opacity * 0.6, layer.opacity],
              rotateX: [0, 5, 0],
              rotateY: [0, -5, 0],
            }}
            transition={{
              delay: layer.delay,
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Floating Data Nodes */}
      {dataNodes.map((node) => (
        <motion.div
          key={node.id}
          className="absolute rounded-full bg-linear-to-br from-cyan-500/30 to-blue-600/30 backdrop-blur-sm"
          style={{
            width: node.size,
            height: node.size,
            left: `${node.x}%`,
          }}
          initial={{ y: '100vh', opacity: 0 }}
          animate={{
            y: '-100vh',
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            delay: node.delay,
            duration: node.duration,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Grid lines with perspective */}
      <div className="absolute inset-0" style={{ perspective: '1000px' }}>
        <motion.div
          className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e9_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e9_1px,transparent_1px)] bg-size-[100px_100px] opacity-5"
          animate={{
            rotateX: [0, 10, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'center bottom',
          }}
        />
      </div>

      {/* Connecting Lines (Data Flow) */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: 8 }, (_, i) => (
          <motion.path
            key={i}
            d={`M ${i * 150} 0 Q ${i * 150 + 75} ${300 + i * 50} ${i * 150 + 150} 600`}
            stroke="url(#lineGradient)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'linear',
            }}
          />
        ))}
      </svg>

      {/* Particle system */}
      {Array.from({ length: 30 }, (_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
}
