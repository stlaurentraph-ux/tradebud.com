"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WaitlistDialog, useWaitlistDialog } from "@/components/waitlist-dialog";

export function ExitIntentModal() {
  const [isVisible, setIsVisible] = useState(false);
  const waitlist = useWaitlistDialog();

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
              className="bg-white rounded-3xl p-8 md:p-10 max-w-md w-full mx-4 shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setIsVisible(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              <h3 className="text-2xl font-bold text-[var(--forest-canopy)] mb-3">
                Be ready for EUDR, without the complexity.
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Tracebud helps your network collect, share, and reuse origin data — simply, affordably, and in a way that includes farmers, cooperatives, exporters, and buyers.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setIsVisible(false);
                    waitlist.setOpen(true);
                  }}
                  className="w-full bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold py-3 rounded-lg"
                >
                  Join the pilot
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setIsVisible(false)}
                  className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-lg"
                >
                  Keep browsing
                </Button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-4">
                Limited spots for early pilot partners.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
    </>
  );
}
