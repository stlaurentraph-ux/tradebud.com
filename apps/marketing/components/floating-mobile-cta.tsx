'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWaitlistDialog } from '@/components/waitlist-dialog';
import { ChevronUp } from 'lucide-react';

export function FloatingMobileCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const waitlist = useWaitlistDialog();

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-gradient-to-t from-[var(--forest-canopy)] via-[var(--forest-canopy)] to-transparent p-4 pb-6 pointer-events-none"
        >
          <Button
            onClick={() => waitlist.setOpen(true)}
            className="w-full bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold py-3 rounded-full text-base shadow-xl pointer-events-auto flex items-center justify-center gap-2"
          >
            Join the waitlist
            <ChevronUp className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
