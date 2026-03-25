'use client'
import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';

export default function LightFAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: 'How secure is my data?',
      answer: 'We use bank-level AES-256 encryption for data at rest and TLS 1.3 for data in transit. Your data is stored in SOC 2 Type II certified data centers with 24/7 monitoring. We also offer optional end-to-end encryption where only you hold the decryption keys.',
    },
    {
      question: 'Can I import my existing data?',
      answer: 'Yes! We support bulk imports from CSV, Excel, JSON, and most popular database formats. Our import wizard makes it easy to map your existing data to custom fields, and we provide dedicated migration support for enterprise customers.',
    },
    {
      question: 'What happens if I exceed my storage limit?',
      answer: 'We\'ll notify you when you reach 80% of your storage limit. You can upgrade your plan anytime, and your data remains fully accessible during the upgrade process. We never delete or restrict access to your data due to storage limits.',
    },
    {
      question: 'Can I collaborate with my team?',
      answer: 'Yes, collaboration is built-in. Invite unlimited team members, set granular permissions per folder or database, and track all changes with audit logs. Team plans include advanced features like role-based access control and approval workflows.',
    },
    {
      question: 'What kind of support do you provide?',
      answer: 'All customers get access to our comprehensive documentation and email support. Pro and Enterprise plans include priority support with faster response times, dedicated account managers, and optional onboarding assistance.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! We offer a 14-day free trial with full access to all features. No credit card required to start. You can cancel anytime during the trial with no obligations.',
    },
    {
      question: 'Can I export my data?',
      answer: 'Of course! Your data is yours. You can export to CSV, JSON, Excel, or use our API for programmatic exports. There are no export limits or fees, and you can export anytime from your dashboard.',
    },
  ];

  return (
    <section className="relative py-20 bg-linear-to-b from-white via-slate-50 to-blue-50 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/3 left-1/4 w-80 h-80 bg-linear-to-br from-purple-200/30 to-blue-200/30 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-linear-to-tl from-blue-200/20 to-purple-200/20 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, delay: 1 }}
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
            <span className="bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-semibold">Got Questions?</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Frequently asked questions
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Everything you need to know about ADPt database platform
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.05 * index, duration: 0.6 }}
                className="group"
              >
                <motion.div
                  className={`relative bg-white/80 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-300 shadow-lg ${
                    openIndex === index
                      ? 'border-purple-300 bg-white/95 shadow-xl'
                      : 'border-slate-200/50 hover:border-slate-300 hover:shadow-lg'
                  }`}
                  whileHover={{ y: -2 }}
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                    className="w-full text-left p-6 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <motion.div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-md ${
                          openIndex === index
                            ? 'bg-linear-to-br from-purple-600 to-blue-600 shadow-lg'
                            : 'bg-linear-to-br from-slate-100 to-slate-200'
                        }`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <HelpCircle
                          className={`w-6 h-6 transition-colors ${
                            openIndex === index ? 'text-white' : 'text-slate-600'
                          }`}
                        />
                      </motion.div>
                      <span
                        className={`font-semibold text-lg transition-colors ${
                          openIndex === index ? 'text-slate-900' : 'text-slate-800'
                        }`}
                      >
                        {faq.question}
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="shrink-0"
                    >
                      <ChevronDown
                        className={`w-6 h-6 transition-colors ${
                          openIndex === index ? 'text-purple-600' : 'text-slate-400'
                        }`}
                      />
                    </motion.div>
                  </button>

                  <motion.div
                    initial={false}
                    animate={{
                      height: openIndex === index ? 'auto' : 0,
                      opacity: openIndex === index ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pl-20 text-slate-600 leading-relaxed text-base">
                      {faq.answer}
                    </div>
                  </motion.div>

                  {/* Bottom accent line when open */}
                  {openIndex === index && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.4 }}
                      className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-purple-600 to-blue-600"
                    />
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
