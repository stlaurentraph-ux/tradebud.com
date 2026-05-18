import { Clock, Layers, RefreshCw } from 'lucide-react';

export function Mission() {
  return (
    <section className="py-20 px-6 border-t border-border bg-background">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
          Why Tracebud exists
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight text-balance">
          Keep smallholders connected to the market.
        </h2>
        <p className="mt-6 text-lg text-foreground-muted leading-relaxed">
          Tracebud exists to keep smallholders connected to the market by making compliance easier to start, easier to complete, and easier to reuse.
        </p>
        <p className="mt-4 text-base text-foreground-faint leading-relaxed">
          Instead of rebuilding proof shipment by shipment, Tracebud helps the chain start earlier, collect better records at origin, and reuse verified data across handoffs and trading relationships.
        </p>

        {/* Stat strip */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
          {[
            { value: 'Offline-first', label: 'Field app built for low connectivity' },
            { value: 'End-to-end', label: 'From farm capture to buyer handoff' },
            { value: 'Reusable', label: 'Verified records travel with the chain' },
          ].map((s) => (
            <div key={s.value} className="px-6 py-6 bg-surface text-center">
              <p className="text-lg font-bold text-primary">{s.value}</p>
              <p className="mt-1 text-xs text-foreground-muted leading-relaxed">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Problem() {
  const problems = [
    {
      icon: Clock,
      title: 'Proof arrives late.',
      body: 'Plot data, consent, harvest records, and evidence are often collected only when shipments need to move.',
    },
    {
      icon: Layers,
      title: 'Requests are fragmented.',
      body: 'Buyers, exporters, and cooperatives chase proof across emails, spreadsheets, consultants, and disconnected tools.',
    },
    {
      icon: RefreshCw,
      title: 'Records are not reusable.',
      body: 'The same compliance work gets rebuilt again and again instead of moving through the chain as usable proof.',
    },
  ];

  return (
    <section className="py-20 px-6 bg-surface-secondary border-y border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
            The problem
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight text-balance">
            Most compliance systems start too late.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {problems.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="group bg-surface border border-border rounded-xl p-6 hover:border-border-strong transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-faint border border-primary-light flex items-center justify-center mb-4">
                  <Icon size={18} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">{p.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
