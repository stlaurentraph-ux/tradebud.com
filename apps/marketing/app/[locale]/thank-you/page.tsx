'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Share2, Calendar, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('marketing.thankYou');
  const email = searchParams.get('email') || '';
  const confirmationSent = searchParams.get('confirmed') === '1';

  useEffect(() => {
    trackMarketingEvent('marketing_thank_you_viewed');
  }, []);

  const handleShare = (platform: string) => {
    const text = encodeURIComponent('I just joined Tracebud to access EU markets with full supply chain traceability. Join me!');
    const url = 'https://tracebud.com';

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--forest-canopy)] to-[var(--forest-light)] flex items-center justify-center px-6 py-20">
      <div className="max-w-xl w-full">
        <motion.div
          className="flex justify-center mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[var(--data-emerald)] rounded-full blur-2xl opacity-50 animate-pulse" />
            <div className="relative bg-[var(--data-emerald)] rounded-full p-6">
              <Check className="w-12 h-12 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('title')}</h1>
          <p className="text-white/80 text-lg mb-2">{t('description')}</p>
          {email && confirmationSent && (
            <p className="text-[var(--data-emerald)] font-semibold">{t('confirmationSent', { email })}</p>
          )}
          {email && !confirmationSent && (
            <p className="text-white/70 text-sm">{t('savedWithoutEmail', { email })}</p>
          )}
        </motion.div>

        <motion.div
          className="space-y-6 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-[var(--data-emerald)] rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div className="w-0.5 h-12 bg-[var(--data-emerald)]/30 my-2" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{t('timeline.submittedTitle')}</h3>
              <p className="text-white/70">{t('timeline.submittedDescription')}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="w-0.5 h-12 bg-[var(--data-emerald)]/30 my-2" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{t('timeline.followUpTitle')}</h3>
              <p className="text-white/70">{t('timeline.followUpDescription')}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{t('timeline.accessTitle')}</h3>
              <p className="text-white/70">{t('timeline.accessDescription')}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-[var(--data-emerald)]" />
            <h3 className="font-semibold text-white">{t('shareTitle')}</h3>
          </div>
          <p className="text-white/70 mb-4">{t('shareDescription')}</p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleShare('twitter')}
              variant="outline"
              className="min-w-24 flex-1 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              Share on X
            </Button>
            <Button
              onClick={() => handleShare('linkedin')}
              variant="outline"
              className="min-w-24 flex-1 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              Share on LinkedIn
            </Button>
            <Button
              onClick={() => handleShare('facebook')}
              variant="outline"
              className="min-w-24 flex-1 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              Share on Facebook
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Link href={`/${locale}`} className="flex-1">
            <Button className="w-full bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold py-3 rounded-full">
              {t('backHome')}
            </Button>
          </Link>
          <a href="mailto:hello@tracebud.com" className="flex-1">
            <Button
              variant="outline"
              className="w-full rounded-full border-white/40 bg-white/10 py-3 font-bold text-white hover:bg-white/20 hover:text-white"
            >
              {t('contactUs')}
            </Button>
          </a>
        </motion.div>

        <motion.p
          className="text-center text-white/60 text-sm mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {t('supportPrompt')}{' '}
          <a href="mailto:support@tracebud.com" className="text-[var(--data-emerald)] hover:underline">
            support@tracebud.com
          </a>
        </motion.p>
      </div>
    </main>
  );
}
