'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWaitlistDialog } from '@/components/waitlist-dialog';
import { ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { locales, type Locale } from '@/i18n.config';

function isHomePath(pathname: string) {
  if (pathname === '/') return true;
  const segment = pathname.split('/').filter(Boolean)[0];
  return segment !== undefined && locales.includes(segment as Locale) && pathname.split('/').filter(Boolean).length === 1;
}

export function FloatingMobileCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const waitlist = useWaitlistDialog();
  const t = useTranslations('common');
  const pathname = usePathname();
  const onHomepage = isHomePath(pathname);

  useEffect(() => {
    if (!onHomepage) {
      setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      setIsVisible(window.scrollY > 200);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onHomepage]);

  if (!onHomepage) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="floating-waitlist-cta"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className="fixed bottom-0 left-0 right-0 z-[60] md:hidden bg-gradient-to-t from-[var(--forest-canopy)] via-[var(--forest-canopy)]/95 to-[var(--forest-canopy)]/0 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8"
        >
          <Button
            onClick={() => waitlist.setOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--data-emerald)] py-3 text-base font-bold text-[var(--forest-canopy)] shadow-xl hover:bg-emerald-400"
          >
            {t('joinWaitlist')}
            <ChevronUp className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
