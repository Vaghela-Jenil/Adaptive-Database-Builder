'use client'
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useClerk } from '@clerk/nextjs';
import { logLogout } from '@/lib/activityLogger';

export default function DarkNavigation({activePanel, setActivePanel} : {activePanel : string; setActivePanel: (page: string) => void}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {isSignedIn} = useUser();
  const { signOut, session } = useClerk()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home'},
    { label: 'Use Cases' },
    { label: 'Security' },
    { label: 'Tools'},
    // { label: 'Reviews'},
    { label: 'Q&A'},
  ];

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-slate-950/90 backdrop-blur-2xl border-b border-slate-800/80 shadow-2xl shadow-cyan-500/5' 
          : 'bg-transparent'
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo with glow */}
          <motion.div
            className="flex items-center gap-3 group cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <div className="w-10 h-10 bg-linear-to-br from-cyan-500 via-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <motion.span 
                  className="text-white tracking-tighter"
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  S
                </motion.span>
              </div>
              {/* Logo glow */}
              <div className="absolute inset-0 bg-linear-to-br from-cyan-500 to-blue-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity -z-10" />
            </div>
            <div>
              <div className="text-white tracking-tight">My Digital Records</div>
              <div className="text-xs text-cyan-400/80 tracking-wide -mt-0.5">Enterprise Grade</div>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item, index) => (
              
              <motion.div
                key={item.label}
                onClick={() => setActivePanel(item.label)}
                className="relative group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <div
                  className="flex items-center gap-1 px-4 py-2 text-slate-300 hover:text-white transition-colors relative cursor-pointer"
                >
                  {item.label}
                  {/* Hover underline */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-cyan-500 to-blue-600"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
             {
              isSignedIn ?
                <Button
                  variant="ghost"
                  className="text-slate-300 cursor-pointer hover:text-white hover:bg-slate-800/50 transition-all"
                  onClick={async() => {
                    await logLogout();
                    await signOut();
                  }}
                >
                  Sign Out
                </Button>
              :
               <Link href='/login'>
                <Button
                  variant="ghost"
                  className="text-slate-300  cursor-pointer hover:text-white hover:bg-slate-800/50 transition-all"
                >
                  Login
                </Button>
              </Link>
             }
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="relative group"
            >
             <Link href='/user/dashboard'>
              <Button className="relative bg-linear-to-r from-cyan-500 to-blue-600 cursor-pointer hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all">
                Get Started
              </Button>
              </Link>
              {/* Button glow */}
              <div className="absolute inset-0 bg-linear-to-r from-cyan-500 to-blue-600 rounded-md blur opacity-0 group-hover:opacity-50 transition-opacity -z-10" />
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white hover:bg-slate-800/50"
              >
                <motion.div
                  animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </motion.div>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.div
            className="lg:hidden pb-6 bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-slate-800/50 mt-4 overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {navItems.map((item, index) => (
              <motion.a
                key={item.label}
                className="flex items-center justify-between px-6 py-4 text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors border-b border-slate-800/30 last:border-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {item.label}
              </motion.a>
            ))}
            <div className="px-6 py-4 space-y-3">
            {
              isSignedIn ?
             <Button variant="ghost" className="w-full text-slate-300 hover:text-white hover:bg-slate-800/50"
              onClick={async() => {
                await logLogout();
                await signOut();
              }}
             >
                Sign Out
              </Button>
              :
              <Button variant="ghost" className="w-full text-slate-300 hover:text-white hover:bg-slate-800/50">
                Login
              </Button>
            }
              <Button className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/30">
                Get Started
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}