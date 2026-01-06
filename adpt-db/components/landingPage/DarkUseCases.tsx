'use client'
import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { Building2, GraduationCap, Heart, Briefcase, ShoppingCart, Users } from 'lucide-react';

export default function DarkUseCases() {
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
      gradient: 'from-cyan-500 to-blue-600',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
    },
    {
      icon: GraduationCap,
      title: 'Education',
      industry: 'Schools & Universities',
      description: 'Organize student records, course materials, and administrative data in one secure platform.',
      features: ['Student databases', 'Grade tracking', 'Document storage', 'Parent portals'],
      gradient: 'from-blue-500 to-purple-600',
      image: 'https://media.istockphoto.com/id/1263424631/photo/e-learning-online-education-or-internet-encyclopedia-concept-open-laptop-and-book-compilation.jpg?s=612x612&w=0&k=20&c=2xih46TXLwHnvgU5FaY9FRRc3F62MpzL__S8O6v2jRU=',
    },
    {
      icon: Heart,
      title: 'Healthcare',
      industry: 'Medical Practices',
      description: 'HIPAA-compliant patient records and medical data management with robust security controls.',
      features: ['Patient records', 'HIPAA compliance', 'Secure sharing', 'Appointment tracking'],
      gradient: 'from-purple-500 to-pink-600',
      image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&h=400&fit=crop',
    },
    {
      icon: Briefcase,
      title: 'Professional',
      industry: 'Consultants & Freelancers',
      description: 'Keep client information, projects, and invoices organized with custom databases.',
      features: ['Client management', 'Project tracking', 'Invoice records', 'Time tracking'],
      gradient: 'from-pink-500 to-rose-600',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop',
    },
    {
      icon: ShoppingCart,
      title: 'E-Commerce',
      industry: 'Online Retailers',
      description: 'Centralize product catalogs, inventory, and customer data for streamlined operations.',
      features: ['Product databases', 'Inventory tracking', 'Order management', 'Customer data'],
      gradient: 'from-orange-500 to-red-600',
      image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&h=400&fit=crop',
    },
    {
      icon: Users,
      title: 'HR & Recruiting',
      industry: 'Human Resources',
      description: 'Manage employee records, applications, and onboarding workflows efficiently and securely.',
      features: ['Employee records', 'Applicant tracking', 'Onboarding flows', 'Performance data'],
      gradient: 'from-green-500 to-emerald-600',
      image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop',
    },
  ];

  return (
    <section className="relative py-16 bg-slate-950 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20" />
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
            className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 mb-6"
          >
            <span className="text-cyan-400">Versatile Solutions</span>
          </motion.div>

          <h2 className="text-white mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Built for every industry
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
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
                <div className="relative h-full bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl overflow-hidden hover:border-slate-700/50 transition-all duration-300">
                  {/* Image Header */}
                  <div className="relative h-40 overflow-hidden">
                    <motion.img
                      src={useCase.image}
                      alt={useCase.title}
                      className="w-full h-full object-cover"
                      animate={{
                        scale: activeCase === index ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.6 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                    
                    {/* Icon overlay */}
                    <motion.div
                      className={`absolute top-4 right-4 w-12 h-12 bg-gradient-to-br ${useCase.gradient} rounded-xl flex items-center justify-center`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <p className="text-cyan-400 mb-2">{useCase.industry}</p>
                    <h3 className="text-white mb-3">{useCase.title}</h3>
                    <p className="text-slate-400 mb-4">
                      {useCase.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-2">
                      {useCase.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-slate-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hover gradient */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  />

                  {/* Bottom accent line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${useCase.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                </div>

                {/* Outer glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} blur-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10`} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}