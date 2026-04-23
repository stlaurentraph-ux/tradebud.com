"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExitIntentModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if cursor is leaving from top of document
      if (e.clientY <= 0 && !isVisible && !submitted) {
        setIsVisible(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [isVisible, submitted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      fetch("/api/checklist/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            // Trigger PDF download
            const link = document.createElement("a");
            link.href = "/api/checklist/download";
            link.download = "EUDR-Compliance-Checklist.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setSubmitted(true);
            setTimeout(() => {
              setIsVisible(false);
              setSubmitted(false);
              setEmail("");
            }, 2000);
          }
        })
        .catch((err) => console.error("[v0] Error:", err));
    }
  };

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

            {!submitted ? (
              <>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--data-emerald)]/10 mb-4">
                  <Download className="w-6 h-6 text-[var(--data-emerald)]" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Hold on!
                </h3>
                <p className="text-gray-600 mb-6">
                  Before you go, grab our free EUDR Compliance Checklist. Get the 4-phase roadmap to EUDR readiness.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--data-emerald)] focus:border-transparent"
                  />
                  <Button
                    type="submit"
                    className="w-full bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold py-3 rounded-lg"
                  >
                    Download Checklist
                  </Button>
                </form>

                <p className="text-xs text-gray-500 text-center mt-4">
                  No spam. We&apos;ll only send EUDR updates.
                </p>
              </>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--data-emerald)]/10 mb-4 mx-auto">
                  <Download className="w-6 h-6 text-[var(--data-emerald)]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Check your email!
                </h3>
                <p className="text-gray-600">
                  Your EUDR Compliance Checklist is on its way.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
