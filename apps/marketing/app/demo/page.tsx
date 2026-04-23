"use client";

import { Header } from "@/components/tracebud/header";
import { Footer } from "@/components/tracebud/footer";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getCreateAccountUrl } from "@/lib/dashboard";

const benefits = [
  "See the full platform in action",
  "Get answers to your specific use case",
  "Learn about implementation timeline",
  "No commitment required",
];

export default function DemoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would submit to a backend/calendar service
    console.log("Demo request:", formData);
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left: Info */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Book a 15-min Demo
              </h1>
              <p className="text-lg text-foreground/70 mb-8">
                See how Tracebud can help you achieve EUDR compliance in days, not months.
              </p>

              <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center gap-3 text-foreground/80">
                  <div className="w-10 h-10 rounded-full bg-[var(--data-emerald)]/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[var(--data-emerald)]" />
                  </div>
                  <span>15 minutes</span>
                </div>
                <div className="flex items-center gap-3 text-foreground/80">
                  <div className="w-10 h-10 rounded-full bg-[var(--data-emerald)]/10 flex items-center justify-center">
                    <Video className="w-5 h-5 text-[var(--data-emerald)]" />
                  </div>
                  <span>Video call (Google Meet or Zoom)</span>
                </div>
                <div className="flex items-center gap-3 text-foreground/80">
                  <div className="w-10 h-10 rounded-full bg-[var(--data-emerald)]/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[var(--data-emerald)]" />
                  </div>
                  <span>Pick a time that works for you</span>
                </div>
              </div>

              <div className="bg-muted/30 rounded-2xl p-6">
                <h3 className="font-semibold text-foreground mb-4">What you&apos;ll learn:</h3>
                <ul className="space-y-3">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3 text-foreground/80">
                      <CheckCircle2 className="w-5 h-5 text-[var(--data-emerald)] flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Form */}
            <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
              {/* Prominent "Start Immediately" option */}
              <div className="bg-[var(--data-emerald)]/10 border border-[var(--data-emerald)]/20 rounded-xl p-5 mb-6">
                <p className="text-sm font-medium text-foreground mb-2">
                  Want to explore on your own first?
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Get instant access. No demo needed. Start your 30-day free trial now.
                </p>
                <Link href={getCreateAccountUrl()}>
                  <Button className="w-full bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold py-5 rounded-full">
                    Start Free Trial
                  </Button>
                </Link>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-muted-foreground">Or book a personalized demo</span>
                </div>
              </div>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Full Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[var(--data-emerald)] focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Work Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[var(--data-emerald)] focus:border-transparent"
                      placeholder="you@company.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                      Company *
                    </label>
                    <input
                      id="company"
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[var(--data-emerald)] focus:border-transparent"
                      placeholder="Company name"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-foreground mb-2">
                      Your Role *
                    </label>
                    <select
                      id="role"
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[var(--data-emerald)] focus:border-transparent bg-white"
                    >
                      <option value="">Select your role</option>
                      <option value="importer">Importer / Brand</option>
                      <option value="exporter">Exporter / Trader</option>
                      <option value="cooperative">Cooperative Manager</option>
                      <option value="sustainability">Sustainability / Compliance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Anything specific you want to discuss? (Optional)
                    </label>
                    <textarea
                      id="message"
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[var(--data-emerald)] focus:border-transparent resize-none"
                      placeholder="Tell us about your use case..."
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white font-bold py-6 text-lg rounded-full"
                  >
                    Request Demo
                  </Button>

                  <p className="text-xs text-center text-foreground/60">
                    We&apos;ll reach out within 24 hours to confirm your slot.
                  </p>
                </form>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-[var(--data-emerald)]/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-[var(--data-emerald)]" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">Demo Requested!</h3>
                  <p className="text-foreground/70 mb-6">
                    We&apos;ll reach out to {formData.email} within 24 hours to schedule your call.
                  </p>
                  <Link href="/">
                    <Button variant="outline" className="rounded-full">
                      Back to Homepage
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
