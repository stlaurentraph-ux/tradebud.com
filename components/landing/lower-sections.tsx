'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Users, Truck, Package, Leaf, ChevronRight, Loader2 } from 'lucide-react';

// ─── Audience section ────────────────────────────────────────────────────────

const personas = [
  {
    id: 'cooperatives',
    icon: Users,
    role: 'Cooperatives',
    tagline: 'Bulk outreach. Better member data.',
    body: 'Run bulk member outreach, collect missing plot and document data, and improve readiness before handoff.',
    points: [
      'Upload member lists and trigger field campaigns',
      'Track per-member completion and blockers',
      'Aggregate proof before shipment deadlines',
    ],
    accentClass: 'text-primary',
    bgClass: 'bg-primary-faint',
    borderClass: 'border-primary-light',
    iconBgClass: 'bg-primary/10 border-primary/30',
    tagBgClass: 'bg-primary/10',
  },
  {
    id: 'exporters',
    icon: Truck,
    role: 'Exporters',
    tagline: 'Upstream gaps. Closed faster.',
    body: 'Close upstream data gaps faster and prepare shipments with clearer lineage and readiness status.',
    points: [
      'See which cooperatives still have open requests',
      'Track readiness per shipment in real time',
      'Build buyer-ready proof packages before deadlines',
    ],
    accentClass: 'text-accent',
    bgClass: 'bg-accent-light',
    borderClass: 'border-accent-border',
    iconBgClass: 'bg-accent/10 border-accent/30',
    tagBgClass: 'bg-accent/10',
  },
  {
    id: 'buyers',
    icon: Package,
    role: 'Buyers',
    tagline: 'Proof visibility. No surprises.',
    body: 'See which shipments are supported, which proof is missing, and where follow-up is still needed.',
    points: [
      'Review shipment readiness before contracting',
      'Receive structured EUDR-ready proof packages',
      'Identify gaps and request upstream resolution',
    ],
    accentClass: 'text-foreground-muted',
    bgClass: 'bg-surface-secondary',
    borderClass: 'border-border',
    iconBgClass: 'bg-foreground/5 border-foreground/10',
    tagBgClass: 'bg-foreground/5',
  },
];

export function Audience() {
  return (
    <section
      id="cooperatives"
      className="py-20 px-6 border-t border-border bg-background"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Who it&apos;s for
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight text-balance">
            Built for every actor that depends on getting compliance right.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {personas.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                id={p.id}
                className={`relative flex flex-col gap-5 rounded-xl p-6 border transition-colors ${p.bgClass} ${p.borderClass}`}
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 border ${p.iconBgClass}`}
                  >
                    <Icon size={18} className={p.accentClass} />
                  </div>
                  <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${p.accentClass}`}>
                    {p.role}
                  </p>
                  <h3 className="text-base font-bold text-foreground mb-2">{p.tagline}</h3>
                  <p className="text-sm text-foreground-muted leading-relaxed">{p.body}</p>
                </div>

                <ul className="flex flex-col gap-2 mt-auto">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${p.tagBgClass}`}
                      >
                        <CheckCircle2 size={8} className={p.accentClass} />
                      </div>
                      <span className="text-xs text-foreground-muted leading-relaxed">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Beyond compliance ───────────────────────────────────────────────────────

export function BeyondCompliance() {
  const extras = [
    'Consented impact data',
    'Regenerative-practice tracking',
    'Programme records',
    'Premiums and living-income logic',
    'Plot-linked outcomes',
    'Trading-relationship data',
  ];

  return (
    <section className="py-20 px-6 bg-surface-secondary border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          {/* Left */}
          <div className="lg:w-1/2">
            <div className="w-10 h-10 rounded-lg bg-primary-faint border border-primary-light flex items-center justify-center mb-5">
              <Leaf size={18} className="text-primary" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Beyond compliance
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-4 text-balance">
              Use the same infrastructure to support better farming outcomes.
            </h2>
            <p className="text-base text-foreground-muted leading-relaxed">
              Tracebud is also evolving into infrastructure buyers and supply-chain partners can use to support regenerative farming practices and fairer farmer income on top of the same producer, plot, and shipment data foundation.
            </p>
            <p className="mt-4 text-sm text-foreground-faint leading-relaxed">
              The product model already supports consented impact data, regenerative-practice tracking, programme records, premiums, and living-income logic linked to plots and organisations.
            </p>
          </div>

          {/* Right: capability tags */}
          <div className="lg:w-1/2">
            <div className="bg-surface border border-border rounded-xl p-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground-faint mb-4">
                Infrastructure already supports
              </p>
              <div className="flex flex-wrap gap-2">
                {extras.map((e) => (
                  <span
                    key={e}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary bg-primary-faint border border-primary-light rounded-full"
                  >
                    <span className="w-1 h-1 rounded-full bg-success" />
                    {e}
                  </span>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-xs text-foreground-faint leading-relaxed">
                  The same producer, plot, and shipment data that powers EUDR compliance also supports programme monitoring, impact attribution, and living-income frameworks — without duplicating collection work.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA with contact form ─────────────────────────────────────────────

export function FinalCTA() {
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('loading');
    
    // Simulate form submission - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, just show success. In production, integrate with your backend
    setFormState('success');
    setEmail('');
    setName('');
    setMessage('');
  };

  return (
    <section id="demo" className="py-24 px-6 border-t border-border bg-background">
      <div className="max-w-3xl mx-auto text-center">
        <div className="w-12 h-12 rounded-xl bg-primary-faint border border-primary-light flex items-center justify-center mx-auto mb-6">
          <svg viewBox="0 0 20 20" fill="none" className="w-6 h-6">
            <path d="M10 2 L14 7 L10 5 L6 7 Z M6 7 L10 5 L10 18 L6 14 Z M14 7 L10 5 L10 18 L14 14 Z" fill="#14532d" />
          </svg>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight text-balance mb-4">
          Make compliance easier to start, easier to complete, and easier to reuse.
        </h2>

        <p className="text-lg text-foreground-muted leading-relaxed mb-8 max-w-xl mx-auto">
          See how Tracebud helps smallholder coffee supply chains collect origin proof offline, request missing data upstream, and prepare buyer-ready EUDR workflows.
        </p>

        {/* Contact Form */}
        {formState === 'success' ? (
          <div className="max-w-md mx-auto bg-primary-faint border border-primary-light rounded-xl p-6 mb-8">
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
            <p className="text-foreground font-semibold mb-1">Thank you for reaching out!</p>
            <p className="text-sm text-foreground-muted">We&apos;ll be in touch within 24 hours to schedule your demo.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-surface border border-border rounded-xl p-6 mb-8 text-left">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 min-h-[44px] text-base bg-surface-secondary border border-border rounded-lg text-foreground placeholder:text-foreground-faint focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 min-h-[44px] text-base bg-surface-secondary border border-border rounded-lg text-foreground placeholder:text-foreground-faint focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1.5">
                  Tell us about your supply chain
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 text-base bg-surface-secondary border border-border rounded-lg text-foreground placeholder:text-foreground-faint focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Which commodity, origins, and volumes do you work with?"
                />
              </div>
              <button
                type="submit"
                disabled={formState === 'loading'}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-mid transition-colors text-base min-h-[52px] disabled:opacity-70"
              >
                {formState === 'loading' ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Book a demo
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <a
          href="#how-it-works"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-border text-foreground-muted font-medium rounded-lg hover:border-border-strong hover:text-foreground transition-colors text-base min-h-[52px]"
        >
          See the workflow
          <ChevronRight size={18} />
        </a>

        <p className="mt-8 text-sm text-foreground-faint">
          Built for cooperatives, exporters, and buyers in regulated coffee supply chains.
        </p>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

const footerLinks = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Book a demo', href: '#demo' },
];

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-10 bg-background">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
              <path d="M10 2 L14 7 L10 5 L6 7 Z M6 7 L10 5 L10 18 L6 14 Z M14 7 L10 5 L10 18 L14 14 Z" fill="#d1fae5" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-foreground">Tracebud</span>
          <span className="text-[10px] text-foreground-faint ml-2 hidden sm:inline">EUDR compliance for smallholder coffee supply chains</span>
        </div>

        <nav className="flex items-center gap-6">
          {footerLinks.map((l) => (
            <a 
              key={l.label} 
              href={l.href} 
              className="text-xs text-foreground-faint hover:text-foreground-muted transition-colors min-h-[44px] flex items-center"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <p className="text-xs text-foreground-faint">
          &copy; {new Date().getFullYear()} Tracebud
        </p>
      </div>
    </footer>
  );
}
