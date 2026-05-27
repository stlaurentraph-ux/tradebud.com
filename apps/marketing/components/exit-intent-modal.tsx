"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { WaitlistDialog, useWaitlistDialog } from "@/components/waitlist-dialog";
import { useTranslations } from "next-intl";

export function ExitIntentModal() {
  const [isVisible, setIsVisible] = useState(false);
  const waitlist = useWaitlistDialog();
  const t = useTranslations("marketing");

  useEffect(() => {
    const alreadySeen = localStorage.getItem("exit_intent_seen");
    if (alreadySeen) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !isVisible) {
        setIsVisible(true);
        localStorage.setItem("exit_intent_seen", "1");
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [isVisible]);

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsVisible(false)}
          >
            <motion.div
              className="relative bg-white rounded-3xl overflow-hidden max-w-2xl w-full mx-4 shadow-2xl flex"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left: Image panel */}
              <div className="relative hidden sm:block w-[42%] flex-shrink-0">
                <Image
                  src="/images/inclusion-visual.jpg"
                  alt="Smallholder farmer using Tracebud"
                  fill
                  className="object-cover"
                />
                {/* Subtle dark vignette at bottom for legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-canopy)]/60 via-transparent to-transparent" />
                {/* Badge pinned to bottom */}
                <div className="absolute bottom-5 left-5 right-5">
                  <p className="text-white text-xs font-medium leading-snug opacity-90">
                    Free for producers. Built for real field conditions.
                  </p>
                </div>
              </div>

              {/* Right: Content */}
              <div className="flex-1 p-8">
                {/* Close button */}
                <button
                  onClick={() => setIsVisible(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>

                <h3 className="text-2xl font-bold text-[var(--forest-canopy)] mb-3 text-balance pr-6">
                  {t("exitIntentModal.headline")}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-7 text-sm">
                  {t("exitIntentModal.description")}
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setIsVisible(false);
                      waitlist.setOpen(true);
                    }}
                    className="w-full bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold py-3 rounded-lg"
                  >
                    {t("exitIntentModal.cta.primary")}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => setIsVisible(false)}
                    className="w-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-lg"
                  >
                    {t("exitIntentModal.cta.secondary")}
                  </Button>
                </div>

                <p className="text-xs text-gray-400 text-center mt-4">
                  {t("exitIntentModal.note")}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
    </>
  );
}
