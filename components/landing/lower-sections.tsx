import { ArrowRight, CheckCircle2, Users, Truck, Package, Leaf, ChevronRight } from 'lucide-react';

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
    accent: '#74c69d',
    bg: '#1a3a25',
    border: '#2d6a4f',
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
    accent: '#c8a96e',
    bg: '#2a2218',
    border: '#c8a96e40',
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
    accent: '#8fa893',
    bg: '#1a2a1e',
    border: '#253b2a',
  },
];

export function Audience() {
  return (
    <section
      id="cooperatives"
      className="py-20 px-6 border-t border-[#253b2a]"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#74c69d] mb-3">
            Who it&apos;s for
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#f0ece4] leading-tight text-balance">
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
                className="relative flex flex-col gap-5 rounded-xl p-6 border transition-colors"
                style={{ background: p.bg, borderColor: p.border }}
              >
                <div>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 border"
                    style={{ background: `${p.accent}18`, borderColor: `${p.accent}30` }}
                  >
                    <Icon size={18} style={{ color: p.accent }} />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: p.accent }}>
                    {p.role}
                  </p>
                  <h3 className="text-base font-bold text-[#f0ece4] mb-2">{p.tagline}</h3>
                  <p className="text-sm text-[#8fa893] leading-relaxed">{p.body}</p>
                </div>

                <ul className="flex flex-col gap-2 mt-auto">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${p.accent}18` }}
                      >
                        <CheckCircle2 size={8} style={{ color: p.accent }} />
                      </div>
                      <span className="text-xs text-[#8fa893] leading-relaxed">{pt}</span>
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
    <section className="py-20 px-6 bg-[#131f17] border-t border-[#253b2a]">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          {/* Left */}
          <div className="lg:w-1/2">
            <div className="w-10 h-10 rounded-lg bg-[#1a3a25] border border-[#2d6a4f]/40 flex items-center justify-center mb-5">
              <Leaf size={18} className="text-[#74c69d]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#74c69d] mb-3">
              Beyond compliance
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f0ece4] leading-tight mb-4 text-balance">
              Use the same infrastructure to support better farming outcomes.
            </h2>
            <p className="text-base text-[#8fa893] leading-relaxed">
              Tracebud is also evolving into infrastructure buyers and supply-chain partners can use to support regenerative farming practices and fairer farmer income on top of the same producer, plot, and shipment data foundation.
            </p>
            <p className="mt-4 text-sm text-[#536858] leading-relaxed">
              The product model already supports consented impact data, regenerative-practice tracking, programme records, premiums, and living-income logic linked to plots and organisations.
            </p>
          </div>

          {/* Right: capability tags */}
          <div className="lg:w-1/2">
            <div className="bg-[#0d1510] border border-[#253b2a] rounded-xl p-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#536858] mb-4">
                Infrastructure already supports
              </p>
              <div className="flex flex-wrap gap-2">
                {extras.map((e) => (
                  <span
                    key={e}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#74c69d] bg-[#1a3a25] border border-[#2d6a4f]/30 rounded-full"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#52b788]" />
                    {e}
                  </span>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-[#253b2a]">
                <p className="text-xs text-[#536858] leading-relaxed">
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

// ─── Final CTA ───────────────────────────────────────────────────────────────

export function FinalCTA() {
  return (
    <section id="demo" className="py-24 px-6 border-t border-[#253b2a]">
      <div className="max-w-3xl mx-auto text-center">
        <div className="w-12 h-12 rounded-xl bg-[#1a3a25] border border-[#2d6a4f]/40 flex items-center justify-center mx-auto mb-6">
          <svg viewBox="0 0 20 20" fill="none" className="w-6 h-6">
            <path d="M10 2 L14 7 L10 5 L6 7 Z M6 7 L10 5 L10 18 L6 14 Z M14 7 L10 5 L10 18 L14 14 Z" fill="#74c69d" />
          </svg>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-[#f0ece4] leading-tight text-balance mb-4">
          Make compliance easier to start, easier to complete, and easier to reuse.
        </h2>

        <p className="text-lg text-[#8fa893] leading-relaxed mb-8 max-w-xl mx-auto">
          See how Tracebud helps smallholder coffee supply chains collect origin proof offline, request missing data upstream, and prepare buyer-ready EUDR workflows.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:hello@tracebud.com"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#2d6a4f] text-[#f0ece4] font-semibold rounded-lg hover:bg-[#40916c] transition-colors text-base min-h-[52px]"
          >
            Book a demo
            <ArrowRight size={18} />
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#253b2a] text-[#8fa893] font-medium rounded-lg hover:border-[#2f4d35] hover:text-[#f0ece4] transition-colors text-base min-h-[52px]"
          >
            See the workflow
            <ChevronRight size={18} />
          </a>
        </div>

        <p className="mt-8 text-sm text-[#536858]">
          Built for cooperatives, exporters, and buyers in regulated coffee supply chains.
        </p>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

export function Footer() {
  return (
    <footer className="border-t border-[#253b2a] px-6 py-10">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[#2d6a4f] flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
              <path d="M10 2 L14 7 L10 5 L6 7 Z M6 7 L10 5 L10 18 L6 14 Z M14 7 L10 5 L10 18 L14 14 Z" fill="#74c69d" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-[#f0ece4]">Tracebud</span>
          <span className="text-[10px] text-[#536858] ml-2">EUDR compliance for smallholder coffee supply chains</span>
        </div>

        <div className="flex items-center gap-6">
          {['Product', 'How it works', 'Book a demo'].map((l) => (
            <a key={l} href="#" className="text-xs text-[#536858] hover:text-[#8fa893] transition-colors">
              {l}
            </a>
          ))}
        </div>

        <p className="text-xs text-[#536858]">
          &copy; {new Date().getFullYear()} Tracebud
        </p>
      </div>
    </footer>
  );
}
