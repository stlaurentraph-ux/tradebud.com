"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WaitlistDialog, useWaitlistDialog } from "@/components/waitlist-dialog";

export function ExitIntentModal() {
  const [isVisible, setIsVisible] = useState(false);
  const waitlist = useWaitlistDialog();

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if cursor is leaving from top of document
      if (e.clientY <= 0 && !isVisible) {
        setIsVisible(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [isVisible]);

  return (
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

            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--data-emerald)]/10 mb-4">
              <Zap className="w-6 h-6 text-[var(--data-emerald)]" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Before you go...
            </h3>
            <p className="text-gray-600 mb-6">
              Join our waitlist to be first notified when Tracebud launches. Early adopters get priority support and special pricing.
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  setIsVisible(false);
                  waitlist.setOpen(true);
                }}
                className="w-full bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold py-3 rounded-lg"
              >
                Join the waitlist
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsVisible(false)}
                className="w-full border-gray-300 text-gray-900 hover:bg-gray-50 font-semibold py-3 rounded-lg"
              >
                Continue browsing
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Early adopters get priority support
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
  );
}
