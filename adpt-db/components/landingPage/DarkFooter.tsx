'use client'
import { motion } from 'motion/react';
import { Github, Twitter, Linkedin } from 'lucide-react';

export default function DarkFooter() {
  const footerSections = [
    {
      title: 'Product',
      links: ['Features', 'Security', 'Pricing', 'Roadmap', 'Updates'],
    },
    {
      title: 'Use Cases',
      links: ['Personal Records', 'Team Collaboration', 'Enterprise', 'Education', 'Healthcare'],
    },
    {
      title: 'Resources',
      links: ['Documentation', 'API Reference', 'Guides', 'Blog', 'Support'],
    },
    {
      title: 'Company',
      links: ['About', 'Careers', 'Contact', 'Privacy', 'Terms'],
    },
  ];

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="relative bg-slate-950 border-t border-slate-800/50 overflow-hidden">
      {/* Subtle gradient */}
      <div className="absolute inset-0 bg-linear-to-b from-slate-900/50 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-linear-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white">M</span>
                </div>
                <span className="text-white tracking-tight">My Digital Records</span>
              </div>
              <p className="text-slate-400 mb-6 max-w-sm">
                Enterprise-grade data management for teams and individuals who demand flexibility, security, and control.
              </p>

              {/* Social Links */}
              <div className="flex gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: sectionIndex * 0.1, duration: 0.6 }}
            >
              <h3 className="text-white mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-slate-400 hover:text-white transition-colors inline-block"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div
          className="py-8 border-t border-slate-800/50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500">
              © {new Date().getFullYear()} My Digital Records. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-slate-500 hover:text-slate-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-slate-500 hover:text-slate-400 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-slate-500 hover:text-slate-400 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subtle bottom glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-linear-to-t from-cyan-500/5 to-transparent pointer-events-none" />
    </footer>
  );
}
