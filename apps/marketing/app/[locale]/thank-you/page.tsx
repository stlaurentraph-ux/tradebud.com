'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Share2, Calendar, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ThankYouPage() {
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get email from URL params
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get('email') || '');
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
        {/* Success Icon */}
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

        {/* Main Content */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            You&apos;re on the list!
          </h1>
          <p className="text-white/80 text-lg mb-2">
            Thank you for joining the Tracebud waitlist.
          </p>
          {email && (
            <p className="text-[var(--data-emerald)] font-semibold">
              Confirmation sent to {email}
            </p>
          )}
        </motion.div>

        {/* Timeline */}
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
              <h3 className="font-semibold text-white text-lg">Application submitted</h3>
              <p className="text-white/70">We&apos;ve received your details and reviewed your role.</p>
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
              <h3 className="font-semibold text-white text-lg">Onboarding call (2-3 weeks)</h3>
              <p className="text-white/70">We&apos;ll schedule a personalized walkthrough based on your role.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">Go live (Q2 2025)</h3>
              <p className="text-white/70">Full platform access with priority support for early pilots.</p>
            </div>
          </div>
        </motion.div>

        {/* Share Section */}
        <motion.div
          className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-[var(--data-emerald)]" />
            <h3 className="font-semibold text-white">Spread the word</h3>
          </div>
          <p className="text-white/70 mb-4">
            Invite other producers, exporters, or importers to join the pilot.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleShare('twitter')}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 flex-1 min-w-24"
            >
              Share on X
            </Button>
            <Button
              onClick={() => handleShare('linkedin')}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 flex-1 min-w-24"
            >
              Share on LinkedIn
            </Button>
            <Button
              onClick={() => handleShare('facebook')}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 flex-1 min-w-24"
            >
              Share on Facebook
            </Button>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Link href="/" className="flex-1">
            <Button
              className="w-full bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold py-3 rounded-full"
            >
              Back to home
            </Button>
          </Link>
          <a href="mailto:support@tracebud.com" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-white/30 text-white hover:bg-white/10 font-bold py-3 rounded-full"
            >
              Contact us
            </Button>
          </a>
        </motion.div>

        {/* Support Message */}
        <motion.p
          className="text-center text-white/60 text-sm mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Questions? Email us at{' '}
          <a href="mailto:support@tracebud.com" className="text-[var(--data-emerald)] hover:underline">
            support@tracebud.com
          </a>
        </motion.p>
      </div>
    </main>
  );
}
