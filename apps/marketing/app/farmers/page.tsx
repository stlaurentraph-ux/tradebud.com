"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { WifiOff, Camera, FileCheck, Shield, Smartphone, MapPin, CheckCircle, Users, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/tracebud/header";
import { Footer } from "@/components/tracebud/footer";

const features = [
  {
    icon: WifiOff,
    title: "Offline-First Mapping",
    description: "GPS polygon capture works without internet. Waypoint averaging filters multipath errors under tropical canopy.",
    image: "/images/feature-offline-mapping.jpg",
  },
  {
    icon: Camera,
    title: "Photo Vault",
    description: "Timestamped, geo-tagged photographs to override satellite false-positives during EU audits.",
    image: "/images/feature-photo-vault.jpg",
  },
  {
    icon: FileCheck,
    title: "Digital Receipts",
    description: "QR-based Proof of Compliance that you can port to any buyer. Your data, your ownership.",
    image: "/images/feature-digital-receipts.jpg",
  },
  {
    icon: Shield,
    title: "Simplified Declaration",
    description: "Low-risk country producers submit a one-time simplified declaration for market access.",
    image: "/images/feature-declaration.jpg",
  },
];

const steps = [
  { step: "1", title: "Download App", description: "Get the offline-capable app on your smartphone", image: "/images/step-download.jpg" },
  { step: "2", title: "Map Your Plot", description: "Walk your polygon boundary with GPS averaging", image: "/images/step-map-plot.jpg" },
  { step: "3", title: "Take Photos", description: "Capture evidence for verification", image: "/images/step-photos.jpg" },
  { step: "4", title: "Get Certified", description: "Receive your compliance passport", image: "/images/step-certified.jpg" },
];

export default function FarmersPage() {
  const [accountType, setAccountType] = useState<"farmer" | "cooperative">("farmer");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    primaryGoal: "",
    biggestChallenge: "",
    country: "",
    commodity: "",
    farmSize: "",
    // cooperative-only
    cooperativeName: "",
    cooperativeSize: "",
  });

  useEffect(() => {
    document.title = "Farmers | Tracebud - Map Your Farm, Access Every Market";
  }, []);

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("account");
    if (selected === "cooperative" || selected === "farmer") {
      setAccountType(selected);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.primaryGoal) {
      setSubmitError("Please select your primary goal.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: accountType,
          sourcePage: "/farmers",
          name: formData.fullName,
          email: formData.email,
          company: accountType === "cooperative" ? formData.cooperativeName || null : null,
          phone: formData.phone || null,
          country: formData.country || null,
          message: formData.biggestChallenge || null,
          payload: formData,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to submit form.");
      }

      setSubmitted(true);
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        primaryGoal: "",
        biggestChallenge: "",
        country: "",
        commodity: "",
        farmSize: "",
        cooperativeName: "",
        cooperativeSize: "",
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unexpected error while submitting.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero with Full-Bleed Image */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0">
          <Image
            src="/images/farmer-hero.jpg"
            alt="Aerial view of coffee farmland alongside tropical forest at golden hour"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-[var(--data-emerald)] text-[var(--forest-canopy)] px-5 py-2.5 rounded-full text-sm font-bold mb-8">
              <Smartphone className="w-4 h-4" />
              <span>Offline-First Mobile App</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
              Your Farm.<br />Your Data.<br />Any Market.
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">
              Map your plot offline, capture verification photos, and receive your EUDR compliance passport in minutes.
            </p>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-6 md:px-10 py-5 md:py-7 text-base md:text-xl rounded-full shadow-2xl w-full sm:w-auto"
                >
                  <a
                    href="https://cooperative-demo.tracebud.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Try demo dashboard
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/60 text-white hover:bg-white/10 bg-transparent px-6 md:px-10 py-5 md:py-7 text-base md:text-xl rounded-full w-full sm:w-auto"
                >
                  <a href="#signup">Request quote</a>
                </Button>
              </div>
              <p className="text-sm font-medium text-white/70">Mobile app for members</p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4">
                <Button
                  size="lg"
                  className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-6 md:px-10 py-5 md:py-7 text-base md:text-xl rounded-full shadow-2xl w-full sm:w-auto"
                >
                  Download App
                </Button>
                <a
                  href="https://offline-demo.tracebud.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/60 text-white hover:bg-white/10 bg-transparent px-6 md:px-10 py-5 md:py-7 text-base md:text-xl rounded-full w-full sm:w-auto"
                  >
                    Try the Demo App
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* App Screenshot Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Designed for every farmer
              </h2>
              <p className="text-xl text-foreground/70 mb-8 leading-relaxed">
                Our mobile app works without internet, speaks your language, and guides you step-by-step through the mapping process.
              </p>
              <ul className="space-y-4">
                {["Works 100% offline", "Available in 12+ languages", "No technical training required", "Instant polygon verification"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-lg text-foreground">
                    <CheckCircle className="w-6 h-6 text-[var(--data-emerald)] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex justify-center w-full"
            >
              {/* App Mockup Image */}
              <img
                src="/images/farmer-app-homepage.png"
                alt="Tracebud farmer app homepage - Maria Santos dashboard"
                className="w-72 md:w-80 h-auto"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features with Images */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Built for the Field
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Every feature designed for the realities of smallholder agriculture.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <div className="w-12 h-12 rounded-xl bg-[var(--data-emerald)] flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-foreground/70 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works with Images */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Get Compliant in 4 Steps
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((item, index) => (
              <motion.div
                key={item.step}
                className="group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-[var(--forest-canopy)]/40 group-hover:bg-[var(--forest-canopy)]/20 transition-colors" />
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-[var(--data-emerald)] text-[var(--forest-canopy)] text-lg font-bold flex items-center justify-center">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{item.title}</h3>
                <p className="text-foreground/70 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?q=80&w=2070&auto=format&fit=crop"
            alt="Coffee farmer smiling in plantation"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[var(--forest-canopy)]/80" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-2xl md:text-3xl text-white font-medium leading-relaxed mb-8 italic">
              "Before Tracebud, I had no proof my coffee was deforestation-free. Now I have a digital passport that opens doors to European buyers who pay premium prices."
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--data-emerald)]">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini_Generated_Image_ovl863ovl863ovl8.png-c53xqJEY3Dl9bxyOVl3m0cSYyKnxof.jpeg"
                  alt="Maria Santos"
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              <div className="text-left">
                <div className="text-white font-bold">Maria Santos</div>
                <div className="text-white/70">Coffee Farmer, Honduras</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sign-Up Form */}
      <section id="signup" className="py-16 md:py-24 px-4 md:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-10 md:mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              Get Started for Free
            </h2>
            <p className="text-base md:text-xl text-foreground/70 max-w-2xl mx-auto">
              Whether you farm independently or belong to a cooperative, Tracebud gets you EUDR-ready before the December 2026 deadline.
            </p>
          </motion.div>

          {/* Account type toggle */}
          <motion.div
            className="flex gap-3 mb-8 justify-center"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <button
              onClick={() => setAccountType("farmer")}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                accountType === "farmer"
                  ? "bg-[var(--forest-canopy)] text-white shadow-lg scale-105"
                  : "bg-muted text-foreground/70 hover:bg-muted/80"
              }`}
            >
              <User className="w-4 h-4" />
              Individual Farmer
            </button>
            <button
              onClick={() => setAccountType("cooperative")}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                accountType === "cooperative"
                  ? "bg-[var(--forest-canopy)] text-white shadow-lg scale-105"
                  : "bg-muted text-foreground/70 hover:bg-muted/80"
              }`}
            >
              <Users className="w-4 h-4" />
              Farmer Cooperative
            </button>
          </motion.div>

          {submitted ? (
            <motion.div
              className="bg-[var(--data-emerald)]/10 border border-[var(--data-emerald)]/30 rounded-2xl p-10 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <CheckCircle className="w-14 h-14 text-[var(--data-emerald)] mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-2">You&apos;re on the list!</h3>
              <p className="text-foreground/70 text-lg mb-6">
                Our team will reach out within 24 hours to set up your account and get you started.
              </p>
              <Button
                onClick={() => setSubmitted(false)}
                variant="outline"
                className="border-[var(--forest-canopy)] text-[var(--forest-canopy)] rounded-full"
              >
                Submit another
              </Button>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              className="bg-muted/30 rounded-2xl md:rounded-3xl p-6 md:p-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {/* Shared fields */}
              <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    {accountType === "cooperative" ? "Contact Person Name *" : "Full Name *"}
                  </label>
                  <Input
                    required
                    placeholder="Your full name"
                    value={formData.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    className="bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Work Email *</label>
                  <Input
                    required
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Phone Number (optional)</label>
                  <Input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Primary Goal *</label>
                  <Select onValueChange={(v) => update("primaryGoal", v)}>
                    <SelectTrigger className="bg-white text-sm">
                      <SelectValue placeholder="Select your top priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="map-plots-offline">Map plots offline</SelectItem>
                      <SelectItem value="prepare-eudr-compliance">Prepare EUDR compliance</SelectItem>
                      <SelectItem value="access-premium-buyers">Access premium buyers</SelectItem>
                      <SelectItem value="organize-cooperative-data">Organize cooperative data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Country</label>
                  <Select onValueChange={(v) => update("country", v)}>
                    <SelectTrigger className="bg-white text-sm">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Honduras", "Guatemala", "Colombia", "Brazil", "Ivory Coast", "Ghana", "Uganda", "Kenya", "Indonesia", "Vietnam", "Malaysia", "Other"].map((c) => (
                        <SelectItem key={c} value={c.toLowerCase().replace(" ", "-")}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Primary Commodity</label>
                  <Select onValueChange={(v) => update("commodity", v)}>
                    <SelectTrigger className="bg-white text-sm">
                      <SelectValue placeholder="Select commodity" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Coffee", "Cocoa", "Rubber", "Palm Oil", "Soy", "Cattle", "Wood", "Other"].map((c) => (
                        <SelectItem key={c} value={c.toLowerCase().replace(" ", "-")}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    {accountType === "cooperative" ? "Cooperative Size" : "Farm Size"}
                  </label>
                  <Select onValueChange={(v) => update("farmSize", v)}>
                    <SelectTrigger className="bg-white text-sm">
                      <SelectValue placeholder="Select size range" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountType === "farmer" ? (
                        <>
                          <SelectItem value="under-1">Under 1 ha</SelectItem>
                          <SelectItem value="1-5">1 – 5 ha</SelectItem>
                          <SelectItem value="5-20">5 – 20 ha</SelectItem>
                          <SelectItem value="over-20">Over 20 ha</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="under-100">Under 100 ha</SelectItem>
                          <SelectItem value="100-500">100 – 500 ha</SelectItem>
                          <SelectItem value="500-2000">500 – 2,000 ha</SelectItem>
                          <SelectItem value="over-2000">Over 2,000 ha</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cooperative-only fields */}
              {accountType === "cooperative" && (
                <motion.div
                  className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Cooperative Name *</label>
                    <Input
                      required={accountType === "cooperative"}
                      placeholder="Your cooperative's name"
                      value={formData.cooperativeName}
                      onChange={(e) => update("cooperativeName", e.target.value)}
                      className="bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Number of Member Farmers</label>
                    <Select onValueChange={(v) => update("cooperativeSize", v)}>
                      <SelectTrigger className="bg-white text-sm">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-50">Under 50</SelectItem>
                        <SelectItem value="50-200">50 – 200</SelectItem>
                        <SelectItem value="200-500">200 – 500</SelectItem>
                        <SelectItem value="500-2000">500 – 2,000</SelectItem>
                        <SelectItem value="over-2000">Over 2,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {/* Biggest challenge */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  What do you need most right now? *
                </label>
                <Textarea
                  required
                  placeholder="In 1-2 sentences, tell us the main result you want from Tracebud."
                  rows={3}
                  value={formData.biggestChallenge}
                  onChange={(e) => update("biggestChallenge", e.target.value)}
                  className="bg-white text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white font-bold px-8 md:px-12 py-4 md:py-6 text-base md:text-lg rounded-full w-full sm:w-auto gap-2"
                >
                  {isSubmitting
                    ? "Submitting..."
                    : accountType === "cooperative"
                      ? "Register My Cooperative"
                      : "Get My Compliance Passport"}
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <p className="text-xs text-foreground/50 text-center sm:text-left">
                  Free to start. No credit card required.
                </p>
              </div>
              {submitError ? (
                <p className="text-red-600 text-sm text-center mt-4">{submitError}</p>
              ) : null}
            </motion.form>
          )}

          {/* Secondary CTA */}
          <div className="text-center mt-10">
            <p className="text-foreground/60 text-sm mb-3">Are you an exporter or importer?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/exporters">
                <Button variant="outline" className="border-[var(--forest-canopy)] text-[var(--forest-canopy)] rounded-full text-sm px-6">
                  Exporter Dashboard
                </Button>
              </Link>
              <Link href="/importers">
                <Button variant="outline" className="border-[var(--forest-canopy)] text-[var(--forest-canopy)] rounded-full text-sm px-6">
                  Importer Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
