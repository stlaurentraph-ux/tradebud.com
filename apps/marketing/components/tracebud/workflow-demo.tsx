'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ChevronRight, MapPin, Upload, CheckCircle2, Smartphone, BarChart3, FileCheck, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    id: 1,
    actor: 'Importer/Brand',
    title: 'Create Account & Login',
    description: 'Sign up and access your EUDR compliance dashboard',
    icon: Globe,
    color: '#10B981',
    screen: 'Dashboard home with empty state, ready to add suppliers',
  },
  {
    id: 2,
    actor: 'Importer/Brand',
    title: 'Upload Suppliers & Send Request',
    description: 'Import CSV of suppliers, send templated compliance request',
    icon: Upload,
    color: '#10B981',
    screen: 'CSV upload interface, request campaign creation',
  },
  {
    id: 3,
    actor: 'Exporter',
    title: 'Receive & Forward Request',
    description: 'Get request in inbox, forward to your cooperative partners',
    icon: ChevronRight,
    color: '#78350F',
    screen: 'Inbox showing incoming request, forward action',
  },
  {
    id: 4,
    actor: 'Cooperative',
    title: 'Assign to Farmers',
    description: 'Receive request, distribute to member farmers',
    icon: ChevronRight,
    color: '#F59E0B',
    screen: 'Cooperative inbox, farmer assignment interface',
  },
  {
    id: 5,
    actor: 'Farmer/Producer',
    title: 'Download App & Map Plot',
    description: 'Download mobile app (works offline), walk plot boundary, capture GPS polygon + harvest photos',
    icon: Smartphone,
    color: '#064E3B',
    screen: 'Mobile app showing GPS plot mapping, photo capture, offline indicator',
  },
  {
    id: 6,
    actor: 'Cooperative',
    title: 'Evidence Rolls Up & Verified',
    description: 'Evidence rolls up from members, automatic satellite deforestation check passes all plots',
    icon: CheckCircle2,
    color: '#F59E0B',
    screen: 'Dashboard showing verified evidence, deforestation check results',
  },
  {
    id: 7,
    actor: 'Exporter',
    title: 'Evidence Package Ready',
    description: 'Complete evidence package with audit trail and identity-preserving batches ready to ship',
    icon: FileCheck,
    color: '#78350F',
    screen: 'DDS package preview, document vault, audit trail visible',
  },
  {
    id: 8,
    actor: 'Importer/Brand',
    title: 'Receive Full Chain & EUDR Submit',
    description: 'Full DDS package with audit trail received. EUDR submission ready for EU authorities',
    icon: CheckCircle2,
    color: '#10B981',
    screen: 'Final dashboard showing EUDR-ready badge, verification complete',
  },
];

export function WorkflowDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoPlay]);

  const handleNext = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
    setAutoPlay(false);
  };

  const handlePrev = () => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
    setAutoPlay(false);
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <section className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="text-sm font-semibold tracking-widest uppercase mb-3 text-[var(--data-emerald)]">
            Complete Workflow
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--forest-canopy)] mb-6 text-balance">
            From Sign-up to EUDR Ready
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Watch how requests cascade upstream and evidence flows back downstream—transforming compliance chaos into a simple, automated workflow.
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-12">
          {steps.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => {
                setCurrentStep(index);
                setAutoPlay(false);
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentStep ? 'bg-[var(--data-emerald)]' : 'bg-gray-300'
              }`}
              animate={{
                width: index === currentStep ? 32 : 8,
              }}
              whileHover={{ width: 16 }}
            />
          ))}
        </div>

        {/* Main Demo Area */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left: Step Info */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Actor Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white w-fit"
              style={{ backgroundColor: step.color }}
            >
              <Icon className="w-4 h-4" />
              {step.actor}
            </div>

            {/* Step Number & Title */}
            <div>
              <div className="text-[var(--data-emerald)] font-bold mb-2">Step {step.id} of {steps.length}</div>
              <h3 className="text-3xl md:text-4xl font-bold text-[var(--forest-canopy)] mb-4 text-balance">
                {step.title}
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">{step.description}</p>
            </div>

            {/* Screen Description */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-700 italic">{step.screen}</p>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handlePrev}
                variant="outline"
                className="flex-1"
              >
                ← Previous
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)]"
              >
                Next →
              </Button>
            </div>

            {/* Auto-play toggle */}
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className="text-sm text-gray-600 hover:text-[var(--forest-canopy)] transition-colors"
            >
              {autoPlay ? '⏸ Pause autoplay' : '▶ Resume autoplay'}
            </button>
          </motion.div>

          {/* Right: Mock Screen */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            {/* Browser Frame */}
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
              {/* Browser Chrome */}
              <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-600 font-medium">tracebud.com/dashboard</p>
                </div>
              </div>

              {/* Content Area */}
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Icon className="w-20 h-20 mx-auto" style={{ color: step.color }} />
                  </motion.div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">{step.title}</h4>
                    <p className="text-sm text-gray-600 max-w-xs mx-auto">{step.screen}</p>
                  </div>
                  {currentStep === steps.length - 1 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold text-sm mt-4"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      EUDR Compliant
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Step Timeline (Desktop) */}
        <div className="hidden lg:block mt-16 pt-12 border-t border-gray-200">
          <div className="flex justify-between items-start gap-2">
            {steps.map((s, index) => (
              <motion.button
                key={s.id}
                onClick={() => {
                  setCurrentStep(index);
                  setAutoPlay(false);
                }}
                className="flex-1 text-center group cursor-pointer"
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold transition-all group-hover:scale-110 mb-2"
                  style={{
                    backgroundColor: index <= currentStep ? s.color : '#E5E7EB',
                    color: index <= currentStep ? 'white' : '#6B7280',
                  }}
                >
                  {s.id}
                </div>
                <p className="text-xs font-semibold text-gray-600 group-hover:text-[var(--forest-canopy)] transition-colors max-w-xs mx-auto">
                  {s.actor}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
