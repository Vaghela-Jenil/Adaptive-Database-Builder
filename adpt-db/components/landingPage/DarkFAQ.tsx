'use client'
import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function DarkFAQ() {
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
      question: 'Do you offer API access?',
      answer: 'Absolutely! All plans include full REST API access with comprehensive documentation. You can programmatically create, read, update, and delete records, manage databases, and integrate with your existing tools and workflows.',
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
    <section className="relative py-16 bg-slate-950 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent" />

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
            <span className="text-cyan-400">Got Questions?</span>
          </motion.div>

          <h2 className="text-white mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Frequently asked questions
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Everything you need to know about My Digital Records
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.1 * index, duration: 0.6 }}
                className="group"
              >
                <div
                  className={`relative bg-slate-900/50 backdrop-blur-xl border rounded-xl overflow-hidden transition-all duration-300 ${
                    openIndex === index
                      ? 'border-cyan-500/30 bg-slate-900/80'
                      : 'border-slate-800/50 hover:border-slate-700/50'
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                    className="w-full text-left p-6 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        openIndex === index
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                          : 'bg-slate-800'
                      }`}>
                        <HelpCircle className={`w-5 h-5 transition-colors ${
                          openIndex === index ? 'text-white' : 'text-slate-400'
                        }`} />
                      </div>
                      <span className={`transition-colors ${
                        openIndex === index ? 'text-white' : 'text-slate-300'
                      }`}>
                        {faq.question}
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown className={`w-5 h-5 transition-colors ${
                        openIndex === index ? 'text-cyan-400' : 'text-slate-400'
                      }`} />
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
                    <div className="px-6 pb-6 pl-20 text-slate-400 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>

                  {/* Bottom accent line when open */}
                  {openIndex === index && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                      className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-cyan-500 to-blue-600"
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Still have questions CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-12 text-center bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8"
          >
            <h3 className="text-white mb-3">Still have questions?</h3>
            <p className="text-slate-400 mb-6">
              Our team is here to help. Get in touch and we'll respond within 24 hours.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
            >
              Contact Support
              <span>→</span>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}