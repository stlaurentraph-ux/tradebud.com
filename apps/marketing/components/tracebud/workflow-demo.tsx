'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { 
  Upload, 
  CheckCircle2, 
  Smartphone, 
  FileCheck, 
  UserPlus,
  Inbox,
  MapPin,
  Shield
} from 'lucide-react';

const steps = [
  {
    id: 1,
    actor: 'Importer',
    actorColor: '#10B981',
    title: 'Sign Up & Access Dashboard',
    description: 'Create your account in 2 minutes. Access your compliance command center.',
    icon: UserPlus,
    mockup: 'desktop',
  },
  {
    id: 2,
    actor: 'Importer',
    actorColor: '#10B981',
    title: 'Upload Suppliers & Send Request',
    description: 'Import your supplier list via CSV. Send templated EUDR compliance requests with one click.',
    icon: Upload,
    mockup: 'desktop',
  },
  {
    id: 3,
    actor: 'Exporter',
    actorColor: '#78350F',
    title: 'Receive & Forward Upstream',
    description: 'Request lands in your inbox. Review and forward to your cooperative partners.',
    icon: Inbox,
    mockup: 'desktop',
  },
  {
    id: 4,
    actor: 'Cooperative',
    actorColor: '#F59E0B',
    title: 'Distribute to Producers',
    description: 'Assign compliance tasks to member farmers. Track who has responded.',
    icon: Inbox,
    mockup: 'desktop',
  },
  {
    id: 5,
    actor: 'Producer',
    actorColor: '#064E3B',
    title: 'Map Plot & Capture Evidence',
    description: 'Download the app (works offline). Walk your boundary to capture GPS polygon. Add harvest photos.',
    icon: Smartphone,
    mockup: 'phone',
  },
  {
    id: 6,
    actor: 'Cooperative',
    actorColor: '#F59E0B',
    title: 'Evidence Verified Automatically',
    description: 'Evidence rolls up from all members. Satellite deforestation check runs automatically. All plots verified.',
    icon: CheckCircle2,
    mockup: 'desktop',
  },
  {
    id: 7,
    actor: 'Exporter',
    actorColor: '#78350F',
    title: 'Package Ready to Ship',
    description: 'Complete evidence package with full audit trail. Identity-preserving batches ready for handoff.',
    icon: FileCheck,
    mockup: 'desktop',
  },
  {
    id: 8,
    actor: 'Importer',
    actorColor: '#10B981',
    title: 'EUDR Submission Ready',
    description: 'Full DDS package received with complete chain verification. Ready for EU authority submission.',
    icon: Shield,
    mockup: 'desktop',
  },
];

// Desktop browser frame mockup content for each step
function DesktopMockup({ step }: { step: typeof steps[0] }) {
  const Icon = step.icon;
  
  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 w-full max-w-md">
      {/* Browser chrome */}
      <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-3 border-b border-gray-200">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
        </div>
        <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-500 font-medium">
          app.tracebud.com
        </div>
      </div>
      
      {/* Dashboard content */}
      <div className="p-6 bg-gray-50 min-h-[280px]">
        {/* Sidebar indicator */}
        <div className="flex gap-4">
          <div className="w-12 bg-[var(--forest-canopy)] rounded-lg p-2 space-y-3 flex-shrink-0">
            <div className="w-full aspect-square rounded bg-white/20" />
            <div className="w-full aspect-square rounded bg-white/10" />
            <div className="w-full aspect-square rounded bg-white/10" />
            <div className="w-full aspect-square rounded bg-white/10" />
          </div>
          
          {/* Main content area */}
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-4 w-32 bg-gray-300 rounded" />
                <div className="h-3 w-20 bg-gray-200 rounded" />
              </div>
              <div 
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: step.actorColor }}
              >
                {step.actor}
              </div>
            </div>
            
            {/* Central icon/action */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 flex flex-col items-center justify-center">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${step.actorColor}20` }}
              >
                <Icon className="w-7 h-7" style={{ color: step.actorColor }} />
              </div>
              <div className="h-3 w-28 bg-gray-200 rounded mb-2" />
              <div className="h-2 w-40 bg-gray-100 rounded" />
            </div>
            
            {/* Action cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="h-2 w-12 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-16 bg-gray-300 rounded" />
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="h-2 w-10 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-14 bg-gray-300 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Phone mockup for farmer step
function PhoneMockup({ step }: { step: typeof steps[0] }) {
  return (
    <div className="relative mx-auto w-[200px]">
      {/* Phone frame */}
      <div className="bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
        <div className="bg-white rounded-[2rem] overflow-hidden">
          {/* Status bar */}
          <div className="bg-[var(--forest-canopy)] px-4 py-2 flex items-center justify-between">
            <span className="text-white text-[10px] font-medium">9:41</span>
            <div className="flex gap-1">
              <div className="w-3 h-2 bg-white/80 rounded-sm" />
              <div className="w-3 h-2 bg-white/80 rounded-sm" />
            </div>
          </div>
          
          {/* App content */}
          <div className="p-4 min-h-[320px] bg-gray-50">
            {/* Offline badge */}
            <div className="flex items-center gap-1.5 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px] text-gray-600 font-medium">Works Offline</span>
            </div>
            
            {/* Map area */}
            <div className="bg-[var(--data-emerald)]/10 rounded-xl p-3 mb-4 relative overflow-hidden">
              <div className="aspect-square rounded-lg bg-[var(--data-emerald)]/20 flex items-center justify-center relative">
                {/* Polygon shape */}
                <svg viewBox="0 0 100 100" className="w-20 h-20">
                  <polygon 
                    points="50,15 85,35 80,75 35,85 20,50" 
                    fill="rgba(16,185,129,0.3)" 
                    stroke="#10B981" 
                    strokeWidth="2"
                  />
                  <circle cx="50" cy="15" r="4" fill="#10B981" />
                  <circle cx="85" cy="35" r="4" fill="#10B981" />
                  <circle cx="80" cy="75" r="4" fill="#10B981" />
                  <circle cx="35" cy="85" r="4" fill="#10B981" />
                  <circle cx="20" cy="50" r="4" fill="#10B981" />
                </svg>
                <MapPin className="absolute w-6 h-6 text-[var(--forest-canopy)]" />
              </div>
            </div>
            
            {/* Info cards */}
            <div className="space-y-2">
              <div className="bg-white rounded-lg p-2.5 border border-gray-200 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[var(--data-emerald)]/20 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--data-emerald)]" />
                </div>
                <div>
                  <div className="h-2 w-16 bg-gray-200 rounded mb-1" />
                  <div className="h-1.5 w-24 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-gray-200 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center">
                  <Upload className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div>
                  <div className="h-2 w-20 bg-gray-200 rounded mb-1" />
                  <div className="h-1.5 w-16 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
            
            {/* Bottom button */}
            <button className="w-full mt-4 bg-[var(--data-emerald)] text-white text-xs font-semibold py-2.5 rounded-lg">
              Submit Evidence
            </button>
          </div>
        </div>
      </div>
      
      {/* Home indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-24 h-1 bg-gray-400 rounded-full" />
    </div>
  );
}

// Individual step component
function WorkflowStep({ step, index }: { step: typeof steps[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 1, 1]);
  const x = useTransform(scrollYProgress, [0, 0.5, 1], [50, 0, 0]);
  
  const Icon = step.icon;
  const isPhone = step.mockup === 'phone';
  const isEven = index % 2 === 0;
  
  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      className="relative grid md:grid-cols-2 gap-8 md:gap-16 items-center py-16 md:py-24"
    >
      {/* Content - alternates sides on desktop */}
      <motion.div 
        style={{ x: isEven ? undefined : x }}
        className={`space-y-4 ${isEven ? 'md:order-1' : 'md:order-2'}`}
      >
        {/* Step indicator */}
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: step.actorColor }}
          >
            {step.id}
          </div>
          <div 
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: `${step.actorColor}20`, color: step.actorColor }}
          >
            {step.actor}
          </div>
        </div>
        
        {/* Title & Description */}
        <h3 className="text-2xl md:text-3xl font-bold text-[var(--forest-canopy)]">
          {step.title}
        </h3>
        <p className="text-gray-600 text-lg leading-relaxed max-w-md">
          {step.description}
        </p>
        
        {/* Key action indicator */}
        <div className="flex items-center gap-2 text-sm text-[var(--data-emerald)] font-medium pt-2">
          <Icon className="w-4 h-4" />
          <span>
            {step.id === 8 ? 'Compliance Complete' : 
             step.id < 5 ? 'Request flows upstream' : 
             step.id === 5 ? 'Evidence captured' :
             'Evidence flows downstream'}
          </span>
        </div>
      </motion.div>
      
      {/* Mockup */}
      <motion.div 
        style={{ x: isEven ? x : undefined }}
        className={`flex justify-center ${isEven ? 'md:order-2' : 'md:order-1'}`}
      >
        {isPhone ? (
          <PhoneMockup step={step} />
        ) : (
          <DesktopMockup step={step} />
        )}
      </motion.div>
    </motion.div>
  );
}

export function WorkflowDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <section className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="text-sm font-semibold tracking-widest uppercase mb-3 text-[var(--data-emerald)]">
            See It In Action
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--forest-canopy)] mb-6 text-balance">
            From Request to EUDR Ready
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Follow the complete journey as a compliance request cascades upstream to producers, and verified evidence flows back downstream.
          </p>
        </motion.div>
        
        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mb-8"
        >
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
            <span>Scroll to explore</span>
          </div>
        </motion.div>
        
        {/* Steps */}
        <div ref={containerRef} className="relative">
          {/* Vertical timeline line - desktop only */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent" />
          
          {steps.map((step, index) => (
            <WorkflowStep key={step.id} step={step} index={index} />
          ))}
        </div>
        
        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16 pt-16 border-t border-gray-100"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--data-emerald)]/10 text-[var(--data-emerald)] font-semibold mb-6">
            <CheckCircle2 className="w-5 h-5" />
            Complete traceability in 8 simple steps
          </div>
          <p className="text-gray-600 max-w-md mx-auto">
            Ready to simplify your EUDR compliance?
          </p>
        </motion.div>
      </div>
    </section>
  );
}
