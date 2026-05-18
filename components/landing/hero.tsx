'use client';

import { ArrowRight, Wifi, WifiOff, Clock, CheckCircle2, AlertCircle, ChevronRight, Layers } from 'lucide-react';

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[180px] sm:w-[200px] md:w-[180px] lg:w-[220px]">
      {/* Phone frame */}
      <div className="relative bg-surface border border-border rounded-[2rem] overflow-hidden shadow-xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-surface rounded-b-xl z-10" />

        {/* Screen */}
        <div className="pt-8 pb-6 px-4 min-h-[380px] sm:min-h-[420px] bg-surface-secondary">
          {/* Status bar */}
          <div className="flex items-center justify-between text-[9px] text-foreground-faint mb-4 px-1">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <WifiOff size={9} className="text-accent" />
              <span className="text-accent">Offline</span>
            </div>
          </div>

          {/* App header */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Layers size={10} className="text-primary-light" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-foreground">Field Capture</p>
              <p className="text-[8px] text-foreground-muted">Plot HN-COP-041</p>
            </div>
          </div>

          {/* Offline sync banner */}
          <div className="bg-accent-light border border-accent-border rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <p className="text-[9px] text-accent">3 records pending sync</p>
          </div>

          {/* Plot card */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden mb-3">
            <div className="bg-primary-faint h-20 relative flex items-center justify-center">
              {/* Simplified plot map */}
              <svg viewBox="0 0 80 60" className="w-20 h-16 opacity-80">
                <polygon
                  points="10,50 25,15 55,10 70,35 60,55 20,58"
                  fill="#14532d"
                  stroke="#16a34a"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <circle cx="40" cy="33" r="3" fill="#16a34a" />
                <circle cx="40" cy="33" r="6" fill="none" stroke="#16a34a" strokeWidth="0.75" opacity="0.5" />
              </svg>
              <span className="absolute top-2 right-2 text-[8px] text-primary bg-primary-light px-1.5 py-0.5 rounded">2.4 ha</span>
            </div>
            <div className="px-3 py-2">
              <p className="text-[10px] font-semibold text-foreground">Plot HN-COP-041</p>
              <p className="text-[8px] text-foreground-muted mt-0.5">Juan Esteban Flores · Copán</p>
            </div>
          </div>

          {/* Evidence items */}
          <div className="space-y-2">
            {[
              { label: 'GPS polygon', done: true },
              { label: 'Consent form', done: true },
              { label: 'Photo evidence', done: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${item.done ? 'bg-success/20' : 'bg-border'}`}>
                    {item.done ? (
                      <CheckCircle2 size={8} className="text-success" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground-faint" />
                    )}
                  </div>
                  <span className="text-[9px] text-foreground-muted">{item.label}</span>
                </div>
                {!item.done && (
                  <span className="text-[8px] text-accent">Required</span>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-4 bg-primary rounded-lg py-2.5 text-center">
            <span className="text-[10px] font-semibold text-white">Save offline</span>
          </div>
        </div>
      </div>

      {/* Glow */}
      <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl -z-10" />
    </div>
  );
}

function DashboardMockup() {
  const requests = [
    { id: 'REQ-441', org: 'Santa Rosa Coop', status: 'Pending', due: '2d', blocker: true },
    { id: 'REQ-438', org: 'Caficultores Norte', status: 'Complete', due: '5d', blocker: false },
    { id: 'REQ-435', org: 'Finca El Roble', status: 'Overdue', due: '–', blocker: true },
  ];

  const readiness = [
    { label: 'Proof collected', pct: 87 },
    { label: 'Requests closed', pct: 71 },
    { label: 'Shipment ready', pct: 54 },
  ];

  return (
    <div className="relative w-full max-w-[460px] md:max-w-[400px] lg:max-w-[520px]">
      {/* Dashboard frame */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xl">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-secondary">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-border" />
            <div className="w-2.5 h-2.5 rounded-full bg-border" />
            <div className="w-2.5 h-2.5 rounded-full bg-border" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[10px] text-foreground-faint">tracebud.app / dashboard</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Shipment Readiness</h3>
              <p className="text-[10px] text-foreground-muted">SHP-2026-0189 · Honduras Washed</p>
            </div>
            <span className="text-[10px] font-medium bg-accent-light text-accent border border-accent-border px-2 py-1 rounded-md">
              In progress
            </span>
          </div>

          {/* Readiness bars */}
          <div className="space-y-2.5">
            {readiness.map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-foreground-muted">{r.label}</span>
                  <span className="text-[10px] font-semibold text-foreground">{r.pct}%</span>
                </div>
                <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full transition-all"
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Requests table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">Open Requests</span>
              <span className="text-[9px] text-foreground-faint">3 of 12</span>
            </div>
            <div className="space-y-1.5">
              {requests.map((r) => (
                <div key={r.id} className="flex items-center gap-2 px-3 py-2 bg-surface-secondary rounded-lg">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    r.status === 'Complete' ? 'bg-success' :
                    r.status === 'Overdue' ? 'bg-destructive' :
                    'bg-warning'
                  }`} />
                  <span className="text-[9px] font-mono text-foreground-faint w-14">{r.id}</span>
                  <span className="text-[9px] text-foreground-muted flex-1 truncate">{r.org}</span>
                  <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded ${
                    r.status === 'Complete' ? 'bg-success/10 text-success' :
                    r.status === 'Overdue' ? 'bg-destructive/10 text-destructive' :
                    'bg-warning/10 text-warning'
                  }`}>{r.status}</span>
                  {r.blocker && (
                    <AlertCircle size={10} className="text-destructive flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Status row */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5 flex-1 px-3 py-2 bg-primary-faint border border-primary-light rounded-lg">
              <CheckCircle2 size={10} className="text-success" />
              <span className="text-[9px] text-primary">14 plots verified</span>
            </div>
            <div className="flex items-center gap-1.5 flex-1 px-3 py-2 bg-accent-light border border-accent-border rounded-lg">
              <Clock size={10} className="text-accent" />
              <span className="text-[9px] text-accent">5 responses pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Glow */}
      <div className="absolute -inset-6 bg-primary/5 rounded-full blur-3xl -z-10" />
    </div>
  );
}

export function Hero() {
  const badges = [
    { label: 'Offline app' },
    { label: 'Upstream requests' },
    { label: 'Shipment readiness' },
    { label: 'Buyer-ready proof' },
  ];

  return (
    <section id="product" className="relative min-h-screen flex flex-col justify-center pt-24 pb-16 px-6 overflow-hidden bg-background">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#14532d 1px, transparent 1px), linear-gradient(90deg, #14532d 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Gradient orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto w-full">
        {/* Eyebrow */}
        <div className="mb-6 flex justify-center md:justify-start">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-primary border border-primary-light bg-primary-faint px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            EUDR compliance platform for smallholder coffee
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* Left: copy */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-[2.25rem] sm:text-5xl lg:text-[3.25rem] font-bold text-foreground leading-[1.12] tracking-tight text-balance">
              Collect origin proof offline.{' '}
              <span className="text-primary">Manage shipment readiness</span>{' '}
              in one dashboard.{' '}
              <span className="text-accent">Keep smallholders connected to EU markets.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-foreground-muted leading-relaxed max-w-xl mx-auto lg:mx-0">
              Tracebud helps cooperatives, exporters, and buyers collect farm-level proof, request missing data upstream, and turn origin records into buyer-ready EUDR workflows.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-mid transition-colors text-sm min-h-[44px]"
              >
                Book a demo
                <ArrowRight size={16} />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-border text-foreground-muted font-medium rounded-lg hover:border-border-strong hover:text-foreground transition-colors text-sm min-h-[44px]"
              >
                See the workflow
                <ChevronRight size={16} />
              </a>
            </div>

            {/* Badges */}
            <div className="mt-8 flex flex-wrap gap-2 justify-center lg:justify-start">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-border bg-surface rounded-full"
                >
                  <span className="w-1 h-1 rounded-full bg-success" />
                  {b.label}
                </span>
              ))}
            </div>
          </div>

          {/* Right: product visuals - improved tablet stacking */}
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 lg:gap-8 w-full max-w-2xl mx-auto lg:mx-0">
            <PhoneMockup />
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
