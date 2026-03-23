'use client'
import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef } from 'react';
import Image from 'next/image';
import { Code } from 'lucide-react';

export default function LightIntegrations() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const integrations = [
    { image: '/nextjs.webp', name: 'Next.js' },
    { image: '/Typescript.png', name: 'TypeScript' },
    { image: '/Tailwind.png', name: 'Tailwind CSS' },
    { image: '/clerk.png', name: 'Clerk Auth' },
    { image: '/mongodb.png', name: 'MongoDB' },
    { image: '/socket io.png', name: 'Socket.io' },
    { image: '/cloudinary.webp', name: 'Cloudinary' },
    { image: '/langchain.png', name: 'LangChain' },
  ];

  return (
    <section className="relative py-20 bg-linear-to-b from-white via-purple-50/30 to-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main gradient blob */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-linear-to-b from-purple-200/20 via-transparent to-transparent"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        {/* Floating orb - Top Left */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-linear-to-br from-purple-300/30 to-blue-300/20 rounded-full blur-3xl"
          animate={{
            x: [0, 30, -30, 0],
            y: [0, -40, 40, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating orb - Bottom Right */}
        <motion.div
          className="absolute bottom-0 right-10 w-96 h-96 bg-linear-to-br from-blue-300/30 to-purple-300/20 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 40, 0],
            y: [0, 50, -50, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Floating orb - Center */}
        <motion.div
          className="absolute top-1/2 left-1/3 w-80 h-80 bg-linear-to-br from-indigo-300/20 to-cyan-300/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Animated shine effect */}
        <motion.div
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
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
            <span className="bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-semibold">Seamless Integrations</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Connect with your favorite tools
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Integrate seamlessly with the tools you already use. Build custom workflows with our powerful API.
          </p>
        </motion.div>

        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto mb-16 relative z-20">
          {/* Animated background elements for cards */}
          <motion.div
            className="absolute top-0 left-0 w-40 h-40 bg-linear-to-br from-purple-500/10 to-blue-500/5 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-40 h-40 bg-linear-to-br from-blue-500/10 to-purple-500/5 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
          />

          {integrations.map((integration, index) => {
            return (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.05 * index, duration: 0.6 }}
                whileHover={{ y: -12, scale: 1.08 }}
                className="group relative"
              >
                <motion.div
                  className="relative bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-6 text-center hover:border-slate-300 transition-all duration-300 shadow-lg hover:shadow-xl h-full flex flex-col items-center justify-center"
                  whileHover={{ borderColor: 'rgba(147, 112, 219, 0.3)' }}
                >
                  {/* Image */}
                  <motion.div
                    className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-slate-50 rounded-xl"
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.15 }}
                  >
                    <Image
                      src={integration.image}
                      alt={integration.name}
                      width={56}
                      height={56}
                      className="w-14 h-14 object-contain"
                      priority={false}
                    />
                  </motion.div>

                  {/* Name */}
                  <motion.p 
                    className="text-slate-700 font-semibold text-sm group-hover:text-slate-900 transition-colors"
                    animate={{ opacity: [1, 0.8, 1] }}
                    transition={{ duration: 3, repeat: Infinity, delay: index * 0.1 }}
                  >
                    {integration.name}
                  </motion.p>

                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-linear-to-br from-purple-500 to-blue-500 opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300" />
                </motion.div>

                {/* Card glow */}
                <motion.div 
                  className="absolute inset-0 bg-linear-to-br from-purple-500 to-blue-500 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10 rounded-2xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: index * 0.15 }}
                />
              </motion.div>
            );
          })}
        </motion.div>

        {/* API Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative max-w-3xl mx-auto bg-gradient-to-br from-white/95 via-slate-50/80 to-white/95 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 md:p-12 overflow-hidden shadow-xl"
        >
          {/* Background code pattern */}
          <div className="absolute inset-0 opacity-3">
            <pre className="text-purple-400 text-xs leading-relaxed p-4">
{`{
  "database": "custom_records",
  "fields": [...],
  "security": "enterprise",
  "api": "rest"
}`}
            </pre>
          </div>

          <div className="relative z-10 text-center">
            <motion.div
              className="w-20 h-20 mx-auto mb-6 bg-linear-to-br from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Code className="w-10 h-10 text-white" />
            </motion.div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Powerful REST API</h3>
            <p className="text-slate-600 mb-8 text-lg leading-relaxed max-w-xl mx-auto">
              Build custom integrations with our comprehensive API. Full documentation and SDKs available for all major platforms.
            </p>
            <motion.a
              href="#"
              className="inline-flex items-center gap-2 px-8 py-3 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              View API Docs
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </motion.a>
          </div>

          {/* Decorative corners */}
          <motion.div 
            className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-purple-400/20 rounded-tr-3xl"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-blue-400/20 rounded-bl-3xl"
            animate={{ rotate: [360, 0] }}
            transition={{ duration: 25, repeat: Infinity }}
          />
        </motion.div>
      </div>
    </section>
  );
}
