'use client'
import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { Star, Quote } from 'lucide-react';

export default function DarkTestimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [hoveredIndex, setHoveredIndex] = useState(0);

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Product Manager',
      company: 'TechCorp',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
      content: 'My Digital Records transformed how our team manages project data. The custom database builder is incredibly intuitive and powerful.',
      rating: 5,
    },
    {
      name: 'Marcus Johnson',
      role: 'Operations Director',
      company: 'GlobalSoft',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      content: 'Finally, a solution that replaces our chaotic spreadsheets. The security features give us peace of mind with sensitive client data.',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Data Analyst',
      company: 'DataVision',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
      content: 'The smart search and filtering capabilities are game-changing. I can find any record in seconds across thousands of entries.',
      rating: 5,
    },
    {
      name: 'David Park',
      role: 'CTO',
      company: 'InnovateLabs',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
      content: 'Enterprise-grade security with startup-level ease of use. Our entire organization adopted it within a week.',
      rating: 5,
    },
    {
      name: 'Lisa Thompson',
      role: 'HR Manager',
      company: 'PeopleFirst',
      image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop',
      content: 'Managing employee records has never been easier. The granular access controls ensure data privacy while maintaining efficiency.',
      rating: 5,
    },
    {
      name: 'Alex Kumar',
      role: 'Founder',
      company: 'StartupHub',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
      content: 'Best investment for our startup. Scales beautifully as we grow, and the team collaboration features are stellar.',
      rating: 5,
    },
  ];

  return (
    <section className="relative py-16 bg-slate-950 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent" />

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
            <span className="text-cyan-400">Trusted by Professionals</span>
          </motion.div>

          <h2 className="text-white mb-4 bg-linear-to-r from-white to-slate-400 bg-clip-text">
            What our customers say
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Join thousands of satisfied users who have transformed their data management
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ delay: 0.1 * index, duration: 0.8 }}
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(0)}
              className="group relative"
            >
              <div className="relative h-full bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 hover:border-slate-700/50 transition-all duration-300">
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Quote className="w-12 h-12 text-cyan-400" />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-slate-300 mb-6 relative z-10">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-800"
                    />
                    <div className="absolute inset-0 rounded-full bg-linear-to-br from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <p className="text-white">{testimonial.name}</p>
                    <p className="text-slate-500">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>

                {/* Hover effect */}
                <motion.div
                  className="absolute inset-0 bg-linear-to-br from-cyan-500/5 to-blue-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  animate={hoveredIndex === index ? { opacity: 1 } : { opacity: 0 }}
                />
              </div>

              {/* Glow */}
              <div className="absolute inset-0 bg-linear-to-br from-cyan-500/10 to-blue-600/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}