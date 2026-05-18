'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Globe, ArrowDown, ArrowUp, CheckCircle2, Clock, AlertCircle,
  WifiOff, MapPin, Camera, FileText, Package, Send, Layers,
  ChevronRight, BarChart3, AlertTriangle, Users,
} from 'lucide-react';

// ─── Stage visuals ──────────────────────────────────────────────────────────

function StageVisual1() {
  const actors = [
    { label: 'Buyer', color: 'var(--color-accent)', ring: 'var(--color-accent-light)', pos: 'top-0 left-1/2 -translate-x-1/2' },
    { label: 'Exporter', color: 'var(--color-primary)', ring: 'var(--color-primary-faint)', pos: 'top-1/3 left-0' },
    { label: 'Cooperative', color: 'var(--color-primary)', ring: 'var(--color-primary-faint)', pos: 'top-1/3 right-0' },
    { label: 'Sponsor', color: 'var(--color-foreground-muted)', ring: 'var(--color-surface-secondary)', pos: 'bottom-0 left-1/4' },
    { label: 'Producer', color: 'var(--color-foreground-muted)', ring: 'var(--color-surface-secondary)', pos: 'bottom-0 right-1/4' },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-foreground-faint mb-4">
        Request entry points
      </div>
      <div className="relative h-48">
        {/* Center hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-primary-faint border-2 border-primary flex items-center justify-center z-10">
          <Layers size={20} className="text-primary" />
        </div>

        {/* Actor nodes */}
        {actors.map((a) => (
          <div key={a.label} className={`absolute ${a.pos} flex flex-col items-center gap-1`}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center border"
              style={{ background: a.ring, borderColor: a.color }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
            </div>
            <span className="text-[9px] font-medium" style={{ color: a.color }}>{a.label}</span>
          </div>
        ))}

        {/* Lines from center to actors */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 5 }}>
          <line x1="50%" y1="50%" x2="50%" y2="8%" stroke="var(--color-primary)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <line x1="50%" y1="50%" x2="8%" y2="35%" stroke="var(--color-primary)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <line x1="50%" y1="50%" x2="92%" y2="35%" stroke="var(--color-primary)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <line x1="50%" y1="50%" x2="25%" y2="88%" stroke="var(--color-primary)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <line x1="50%" y1="50%" x2="75%" y2="88%" stroke="var(--color-primary)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
        </svg>
      </div>
      <p className="text-xs text-foreground-muted mt-2">Any actor in the chain can open the workflow</p>
    </div>
  );
}

function StageVisual2() {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground-faint">Outreach</span>
        <span className="text-[9px] text-primary bg-primary-faint px-2 py-0.5 rounded-full">3 sent</span>
      </div>
      <div className="p-4 space-y-2">
        {[
          { to: 'Santa Rosa Coop', via: 'Via cooperative', status: 'Delivered', icon: CheckCircle2, col: 'text-success' },
          { to: 'Finca El Roble', via: 'Direct producer', status: 'Pending', icon: Clock, col: 'text-warning' },
          { to: 'Caficultores Norte', via: 'Via exporter', status: 'Delivered', icon: CheckCircle2, col: 'text-success' },
        ].map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.to} className="flex items-center gap-3 px-3 py-2.5 bg-surface-secondary rounded-lg">
              <Icon size={12} className={`flex-shrink-0 ${r.col}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-foreground truncate">{r.to}</p>
                <p className="text-[9px] text-foreground-faint">{r.via}</p>
              </div>
              <span className={`text-[9px] font-medium ${r.col}`}>{r.status}</span>
            </div>
          );
        })}
      </div>

      <div className="px-4 pt-0 pb-4">
        <div className="border-t border-border pt-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-foreground-faint mb-2">Inbox</div>
          <div className="flex items-center gap-3 px-3 py-2.5 bg-accent-light border border-accent-border rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
            <p className="text-[11px] text-accent flex-1">1 response awaiting review</p>
            <ChevronRight size={10} className="text-accent" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StageVisual3() {
  return (
    <div className="w-full max-w-[260px] mx-auto">
      <div className="bg-surface border border-border rounded-[2rem] overflow-hidden p-1">
        <div className="bg-surface-secondary rounded-[1.75rem] overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 py-3 text-[9px] text-foreground-faint">
            <span>9:41</span>
            <div className="flex items-center gap-1 text-accent">
              <WifiOff size={9} />
              <span>Offline</span>
            </div>
          </div>

          <div className="px-4 pb-6 space-y-3">
            {/* Header */}
            <div>
              <p className="text-xs font-bold text-foreground">Field Capture</p>
              <p className="text-[9px] text-foreground-muted">Plot survey · HN-COP-044</p>
            </div>

            {/* Map placeholder */}
            <div className="bg-primary-faint rounded-xl h-28 relative flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 100 80" className="w-full h-full absolute opacity-70">
                <polygon points="15,70 30,20 65,12 85,45 75,72 25,75" fill="#14532d" stroke="#16a34a" strokeWidth="2" />
                <circle cx="48" cy="46" r="4" fill="#16a34a" />
                <path d="M 30,20 L 65,12 L 85,45 L 75,72 L 25,75 L 15,70 Z" fill="none" stroke="#16a34a" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
              </svg>
              <div className="absolute top-2 left-2 bg-surface/80 text-primary text-[8px] px-2 py-0.5 rounded">
                14.8024°N 87.9134°W
              </div>
              <div className="absolute bottom-2 right-2 bg-primary text-[8px] text-white px-2 py-0.5 rounded">
                2.4 ha
              </div>
            </div>

            {/* Evidence list */}
            <div className="space-y-2">
              {[
                { icon: MapPin, label: 'GPS polygon', done: true },
                { icon: FileText, label: 'Consent form signed', done: true },
                { icon: Camera, label: 'Photo evidence (3)', done: true },
                { icon: FileText, label: 'Harvest record', done: false },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-success/20' : 'bg-accent-light'}`}>
                      <Icon size={8} className={item.done ? 'text-success' : 'text-warning'} />
                    </div>
                    <span className={`text-[9px] ${item.done ? 'text-foreground-muted' : 'text-accent'}`}>{item.label}</span>
                    {!item.done && <span className="ml-auto text-[8px] text-warning">Required</span>}
                  </div>
                );
              })}
            </div>

            {/* Sync indicator */}
            <div className="bg-accent-light border border-accent-border rounded-lg px-3 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              <span className="text-[9px] text-accent">Will sync when online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StageVisual4() {
  const blockers = [
    { id: 'BLK-12', desc: 'Missing FPIC consent', plot: 'HN-COP-044', severity: 'high', due: '2d' },
    { id: 'BLK-09', desc: 'Plot geometry outdated', plot: 'HN-YOR-018', severity: 'medium', due: '4d' },
    { id: 'BLK-07', desc: 'Harvest volume mismatch', plot: 'HN-COP-039', severity: 'high', due: '1d' },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={12} className="text-destructive" />
          <span className="text-[11px] font-semibold text-foreground">Open Blockers</span>
        </div>
        <span className="text-[9px] bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded-full">
          3 critical
        </span>
      </div>

      <div className="p-4 space-y-2">
        {blockers.map((b) => (
          <div key={b.id} className={`p-3 rounded-lg border ${b.severity === 'high' ? 'bg-destructive/5 border-destructive/20' : 'bg-surface-secondary border-border'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-mono text-foreground-faint">{b.id}</span>
                  <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded ${b.severity === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                    {b.severity}
                  </span>
                </div>
                <p className="text-[10px] text-foreground">{b.desc}</p>
                <p className="text-[9px] text-foreground-faint mt-0.5">{b.plot}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1">
                  <Clock size={9} className="text-foreground-faint" />
                  <span className={`text-[9px] font-semibold ${b.due === '1d' ? 'text-destructive' : 'text-foreground-muted'}`}>{b.due}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="px-4 pb-4">
        <div className="bg-surface-secondary border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-foreground-muted">Requests resolved</span>
            <span className="text-[10px] font-semibold text-foreground">9 / 14</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-success rounded-full" style={{ width: '64%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StageVisual5() {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground">Shipment SHP-2026-0189</p>
          <p className="text-[9px] text-foreground-muted mt-0.5">Honduras Washed · 18,400 kg</p>
        </div>
        <span className="text-[9px] font-medium bg-success/10 text-success border border-success/20 px-2 py-1 rounded-md">
          Ready to handoff
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Readiness checklist */}
        {[
          { label: 'Plot geometry verified', done: true },
          { label: 'Consent records complete', done: true },
          { label: 'Deforestation assessment', done: true },
          { label: 'Harvest records linked', done: true },
          { label: 'Buyer proof package built', done: true },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={9} className="text-success" />
            </div>
            <span className="text-[10px] text-foreground-muted">{item.label}</span>
          </div>
        ))}

        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-foreground-muted">Proof packages</span>
            <span className="text-[9px] text-primary">3 buyer-ready</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['Rainforest Alliance', 'EU Importer A', 'DDS Draft'].map((b) => (
              <div key={b} className="bg-primary-faint border border-primary-light rounded-lg p-2 text-center">
                <Package size={10} className="text-primary mx-auto mb-1" />
                <p className="text-[8px] text-primary leading-tight">{b}</p>
              </div>
            ))}
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-mid transition-colors text-white text-xs font-semibold py-2.5 rounded-lg min-h-[44px]">
          <Send size={12} />
          Send to buyer
        </button>
      </div>
    </div>
  );
}

// ─── Stages config ─────────────────────────────────────────────────────────

const stages = [
  {
    step: '01',
    title: 'Start the process anywhere.',
    copy: 'A buyer, exporter, cooperative, sponsor, or producer can open the workflow. No single entry point.',
    Visual: StageVisual1,
  },
  {
    step: '02',
    title: 'Reach the right farm or supplier.',
    copy: 'Requests move upstream until they reach the relevant producer, plot, or organisation.',
    Visual: StageVisual2,
  },
  {
    step: '03',
    title: 'Collect proof offline.',
    copy: 'Use the app to capture producer records, plot geometry, consent, photos, and documents in low-connectivity environments.',
    Visual: StageVisual3,
  },
  {
    step: '04',
    title: 'Resolve blockers early.',
    copy: 'Track open requests, reminders, missing proof, and blocking issues before shipment deadlines.',
    Visual: StageVisual4,
  },
  {
    step: '05',
    title: 'Prepare buyer-ready handoff.',
    copy: 'Connect verified records to batches, shipments, and due-diligence preparation.',
    Visual: StageVisual5,
  },
];

export function ProductStory() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = stageRefs.current.findIndex((r) => r === entry.target);
            if (idx !== -1) setActive(idx);
          }
        });
      },
      {
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0,
      }
    );

    stageRefs.current.forEach((r) => r && observer.observe(r));
    return () => observer.disconnect();
  }, []);

  const ActiveVisual = stages[active].Visual;

  return (
    <section id="how-it-works" className="py-20 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight text-balance">
            From field capture to shipment readiness.
          </h2>
        </div>

        {/* Scroll-driven layout */}
        <div className="relative flex flex-col lg:flex-row gap-12 lg:gap-16" ref={sectionRef}>
          {/* Left: sticky steps rail */}
          <div className="lg:w-[42%] lg:sticky lg:top-24 lg:self-start">
            {/* Step indicator */}
            <div className="hidden lg:flex flex-col gap-6 mb-8">
              {stages.map((s, i) => (
                <button
                  key={s.step}
                  onClick={() => {
                    stageRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className={`flex items-center gap-3 text-left group transition-all ${
                    active === i ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all flex-shrink-0 ${
                      active === i
                        ? 'bg-primary border-primary-mid text-white'
                        : 'bg-surface border-border text-foreground-faint'
                    }`}
                  >
                    {s.step}
                  </div>
                  <span className={`text-sm font-medium ${active === i ? 'text-foreground' : 'text-foreground-faint'}`}>
                    {s.title.replace('.', '')}
                  </span>
                </button>
              ))}
            </div>

            {/* Active stage text (desktop only) */}
            <div className="hidden lg:block bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-mono text-foreground-faint">Stage {stages[active].step}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 leading-tight">
                {stages[active].title}
              </h3>
              <p className="text-sm text-foreground-muted leading-relaxed">{stages[active].copy}</p>
            </div>
          </div>

          {/* Right: scrollable stages (desktop) / stacked (mobile) */}
          <div className="lg:w-[58%]">
            {/* Desktop: fixed visual updated by scroll */}
            <div className="hidden lg:block sticky top-24">
              <ActiveVisual />
            </div>

            {/* Scroll triggers on desktop — invisible spacers */}
            <div className="hidden lg:flex flex-col">
              {stages.map((s, i) => (
                <div
                  key={s.step}
                  ref={(el) => { stageRefs.current[i] = el; }}
                  style={{ height: '80vh' }}
                  className="flex items-center"
                />
              ))}
            </div>

            {/* Mobile: stacked cards */}
            <div className="flex flex-col gap-10 lg:hidden">
              {stages.map((s) => {
                const Visual = s.Visual;
                return (
                  <div key={s.step} className="flex flex-col gap-6">
                    <div>
                      <span className="text-xs font-mono text-foreground-faint">Stage {s.step}</span>
                      <h3 className="text-xl font-bold text-foreground mt-1 mb-2">{s.title}</h3>
                      <p className="text-sm text-foreground-muted leading-relaxed">{s.copy}</p>
                    </div>
                    <Visual />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Pillars ────────────────────────────────────────────────────────────────

function PillarVisual1() {
  return (
    <div className="bg-surface-secondary rounded-lg p-3 border border-border">
      {[
        { label: 'Plot polygon saved', icon: MapPin, done: true },
        { label: 'Consent form signed', icon: FileText, done: true },
        { label: 'Photos captured (4)', icon: Camera, done: true },
      ].map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex items-center gap-2 py-1.5">
            <Icon size={10} className="text-primary" />
            <span className="text-[10px] text-foreground-muted">{item.label}</span>
            <CheckCircle2 size={9} className="text-success ml-auto" />
          </div>
        );
      })}
      <div className="mt-2 flex items-center gap-1.5 bg-accent-light px-2 py-1.5 rounded">
        <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
        <span className="text-[9px] text-accent">Offline · syncs when connected</span>
      </div>
    </div>
  );
}

function PillarVisual2() {
  return (
    <div className="bg-surface-secondary rounded-lg p-3 border border-border space-y-2">
      {[
        { org: 'Santa Rosa Coop', status: 'Responded', col: 'text-success' },
        { org: 'Finca El Roble', status: '2 days left', col: 'text-warning' },
        { org: 'Caficultores', status: 'Reminder sent', col: 'text-foreground-muted' },
      ].map((r) => (
        <div key={r.org} className="flex items-center justify-between px-2 py-1.5 bg-surface rounded">
          <span className="text-[10px] text-foreground-muted">{r.org}</span>
          <span className={`text-[9px] font-medium ${r.col}`}>{r.status}</span>
        </div>
      ))}
    </div>
  );
}

function PillarVisual3() {
  return (
    <div className="bg-surface-secondary rounded-lg p-3 border border-border space-y-2">
      {[
        { label: 'Proof collected', pct: 87, color: 'bg-success' },
        { label: 'Requests closed', pct: 71, color: 'bg-primary' },
        { label: 'Shipment ready', pct: 54, color: 'bg-warning' },
      ].map((r) => (
        <div key={r.label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-foreground-muted">{r.label}</span>
            <span className="text-[10px] font-semibold text-foreground">{r.pct}%</span>
          </div>
          <div className="h-1.5 bg-border rounded-full">
            <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const pillars = [
  {
    label: '01',
    title: 'Collect proof offline.',
    body: 'Capture producer records, plot maps, consent, and evidence in the field — no connectivity required.',
    Visual: PillarVisual1,
  },
  {
    label: '02',
    title: 'Request missing proof upstream.',
    body: 'Send one-off or campaign-based requests, follow up with reminders, and close gaps before deadlines.',
    Visual: PillarVisual2,
  },
  {
    label: '03',
    title: 'Manage shipment readiness.',
    body: 'See what is ready, what is blocked, and what still needs action before buyer handoff.',
    Visual: PillarVisual3,
  },
];

export function Pillars() {
  return (
    <section className="py-20 px-6 bg-surface-secondary border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            The product
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight text-balance">
            One app for the field. One dashboard for the chain.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((p) => {
            const Visual = p.Visual;
            return (
              <div key={p.label} className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4 hover:border-border-strong transition-colors">
                <span className="text-[10px] font-mono text-foreground-faint">{p.label}</span>
                <Visual />
                <div>
                  <h3 className="font-semibold text-foreground mb-1.5">{p.title}</h3>
                  <p className="text-sm text-foreground-muted leading-relaxed">{p.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
