'use client'
import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { Building2, GraduationCap, Heart, Briefcase, ShoppingCart, Users } from 'lucide-react';

export default function LightUseCases() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [activeCase, setActiveCase] = useState(0);

  const useCases = [
    {
      icon: Building2,
      title: 'Enterprise',
      industry: 'Large Organizations',
      description: 'Manage complex data structures across departments with enterprise-grade security and compliance.',
      features: ['Multi-team collaboration', 'Advanced permissions', 'Audit logs', 'SSO integration'],
      gradient: 'from-purple-600 to-blue-600',
      darkGradient: 'from-purple-900 to-blue-900',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
    },
    {
      icon: GraduationCap,
      title: 'Education',
      industry: 'Schools & Universities',
      description: 'Organize student records, course materials, and administrative data in one secure platform.',
      features: ['Student databases', 'Grade tracking', 'Document storage', 'Parent portals'],
      gradient: 'from-indigo-600 to-purple-600',
      darkGradient: 'from-indigo-900 to-purple-900',
      image: 'https://media.istockphoto.com/id/1263424631/photo/e-learning-online-education-or-internet-encyclopedia-concept-open-laptop-and-book-compilation.jpg?s=612x612&w=0&k=20&c=2xih46TXLwHnvgU5FaY9FRRc3F62MpzL__S8O6v2jRU=',
    },
    {
      icon: Heart,
      title: 'Healthcare',
      industry: 'Medical Practices',
      description: 'HIPAA-compliant patient records and medical data management with robust security controls.',
      features: ['Patient records', 'HIPAA compliance', 'Secure sharing', 'Appointment tracking'],
      gradient: 'from-pink-600 to-purple-600',
      darkGradient: 'from-pink-900 to-purple-900',
      image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&h=400&fit=crop',
    },
    {
      icon: Briefcase,
      title: 'Professional',
      industry: 'Consultants & Freelancers',
      description: 'Keep client information, projects, and invoices organized with custom databases.',
      features: ['Client management', 'Project tracking', 'Invoice records', 'Time tracking'],
      gradient: 'from-rose-600 to-orange-600',
      darkGradient: 'from-rose-900 to-orange-900',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop',
    },
    {
      icon: ShoppingCart,
      title: 'E-Commerce',
      industry: 'Online Retailers',
      description: 'Centralize product catalogs, inventory, and customer data for streamlined operations.',
      features: ['Product databases', 'Inventory tracking', 'Order management', 'Customer data'],
      gradient: 'from-amber-600 to-red-600',
      darkGradient: 'from-amber-900 to-red-900',
      image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&h=400&fit=crop',
    },
    {
      icon: Users,
      title: 'HR & Recruiting',
      industry: 'Human Resources',
      description: 'Manage employee records, applications, and onboarding workflows efficiently and securely.',
      features: ['Employee records', 'Applicant tracking', 'Onboarding flows', 'Performance data'],
      gradient: 'from-emerald-600 to-teal-600',
      darkGradient: 'from-emerald-900 to-teal-900',
      image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop',
    },
  ];

  return (
    <section className="relative py-20 bg-gradient-to-b from-slate-50 via-white to-blue-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-1/4 w-72 h-72 bg-linear-to-br from-purple-200 to-blue-200 rounded-full blur-3xl opacity-30"
          animate={{
            y: [0, 30, 0],
            x: [0, 20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-32 right-1/4 w-80 h-80 bg-linear-to-br from-blue-200 to-purple-200 rounded-full blur-3xl opacity-20"
          animate={{
            y: [0, -30, 0],
            x: [0, -20, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
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
            <span className="bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-semibold">Versatile Solutions</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Built for every industry
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            From startups to enterprises, our platform adapts to your unique needs
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ delay: 0.1 * index, duration: 0.8 }}
                onHoverStart={() => setActiveCase(index)}
                className="group relative cursor-pointer"
              >
                <div className="relative h-full bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
                  {/* Image Header */}
                  <div className="relative h-48 overflow-hidden bg-linear-to-br from-purple-100 to-blue-100">
                    <motion.img
                      src={useCase.image}
                      alt={useCase.title}
                      className="w-full h-full object-cover"
                      animate={{
                        scale: activeCase === index ? 1.15 : 1,
                      }}
                      transition={{ duration: 0.6 }}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-white via-transparent to-transparent opacity-70" />
                    
                    {/* Icon overlay */}
                    <motion.div
                      className={`absolute top-4 right-4 w-14 h-14 bg-linear-to-br ${useCase.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="p-6 sm:p-8">
                    <motion.p 
                      className={`bg-linear-to-r ${useCase.gradient} bg-clip-text text-transparent mb-2 font-semibold text-sm`}
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      {useCase.industry}
                    </motion.p>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{useCase.title}</h3>
                    <p className="text-slate-600 mb-6 leading-relaxed">
                      {useCase.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-3">
                      {useCase.features.map((feature, idx) => (
                        <motion.div
                          key={feature}
                          initial={{ opacity: 0, x: -10 }}
                          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                          transition={{ delay: 0.2 + idx * 0.1, duration: 0.5 }}
                          className="flex items-center gap-3 text-slate-700"
                        >
                          <motion.div 
                            className={`w-2 h-2 rounded-full flex-shrink-0 bg-linear-to-r ${useCase.gradient}`}
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                          />
                          <span className="font-medium">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Hover gradient */}
                  <motion.div
                    className={`absolute inset-0 bg-linear-to-br ${useCase.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  />

                  {/* Bottom accent line */}
                  <motion.div 
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r ${useCase.gradient} scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500`}
                  />
                </div>

                {/* Outer glow */}
                <motion.div 
                  className={`absolute inset-0 bg-linear-to-br ${useCase.gradient} blur-2xl opacity-0 group-hover:opacity-15 transition-opacity duration-300 -z-10 rounded-3xl`}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
