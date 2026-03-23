'use client'
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import Image from 'next/image';
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
    { label: 'Features' },
    { label: 'Tools' },
    { label: 'Security' },
    { label: 'FAQ'},
  ];

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/98 backdrop-blur-2xl border-b border-purple-200/30 shadow-lg shadow-purple-600/15' 
          : 'bg-linear-to-r from-white/80 via-blue-50/80 to-white/80 backdrop-blur-xl border-b border-transparent'
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 group cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative w-10 h-10">
              <Image
                src="/logo.png"
                alt="Sysnera Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-linear-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">Sysnera</h1>
              <p className="text-xs text-slate-600">Data Management</p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item, index) => (
              <motion.button
                key={item.label}
                onClick={() => setActivePanel(item.label)}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${activePanel === item.label ? 'bg-linear-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-400/30' : 'text-slate-700 hover:text-purple-700 hover:bg-linear-to-r hover:from-purple-100 hover:to-blue-100'}`}
                whileHover={{ y: -2 }}
              >
                {item.label}
              </motion.button>
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
                  className="text-slate-700 cursor-pointer hover:text-purple-700 hover:bg-slate-100 transition-all"
                  onClick={async() => {
                    await logLogout();
                    await signOut();
                  }}
                >
                  Sign Out
                </Button>
              :
               <Link href='/auth/login'>
                <Button
                  variant="ghost"
                  className="text-slate-700 cursor-pointer hover:text-purple-700 hover:bg-slate-100 transition-all"
                >
                  Sign In
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
             <Link href={isSignedIn ? '/user/dashboard' : '/auth/signup'}>
              <Button className="relative bg-linear-to-r from-purple-600 to-blue-600 cursor-pointer hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-purple-500/40 hover:shadow-lg hover:shadow-purple-600/60 transition-all font-semibold">
                {isSignedIn ? 'Dashboard' : 'Start Free'}
              </Button>
              </Link>
              <div className="absolute inset-0 bg-linear-to-r from-purple-600 to-blue-600 rounded-md blur opacity-0 group-hover:opacity-50 transition-opacity -z-10" />
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
            >
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.div
            className="lg:hidden pb-6 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-100 mt-4 overflow-hidden shadow-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {navItems.map((item, index) => (
              <motion.button
                key={item.label}
                onClick={() => {
                  setActivePanel(item.label);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-6 py-3 text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-all border-b border-slate-100 last:border-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {item.label}
              </motion.button>
            ))}
            <div className="px-4 py-4 space-y-2">
            {
              isSignedIn ?
             <Button variant="ghost" className="w-full text-slate-700 hover:text-purple-700 hover:bg-slate-100"
              onClick={async() => {
                await logLogout();
                await signOut();
              }}
             >
                Sign Out
              </Button>
              :
              <Link href="/auth/login" className="block">
                <Button variant="ghost" className="w-full text-slate-700 hover:text-purple-700 hover:bg-slate-100">
                  Sign In
                </Button>
              </Link>
            }
              <Link href={isSignedIn ? '/dashboard' : '/auth/signup'} className="block">
                <Button className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-purple-400/30">
                  {isSignedIn ? 'Dashboard' : 'Start Free'}
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
