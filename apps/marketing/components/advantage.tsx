import { Check } from "lucide-react"

const brandBenefits = [
  "No bloated SaaS subscriptions. Only pay when you need to unlock a verified EUDR GeoJSON dossier.",
  "Zero compliance risk with flawless data formatted exactly for the EU Information System.",
  "Scope 3 ready. A verified foundation for future carbon and biodiversity reporting.",
]

const coopBenefits = [
  "100% Free software forever. We will never charge a farmer to map their land.",
  "The Data Dividend. You own your data. When brands pay to unlock your compliance files, you receive a direct revenue share.",
  "Premium market access. Guarantee your place in the European market.",
]

export function Advantage() {
  return (
    <section id="pricing" className="bg-secondary py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-accent">
            Pricing &amp; Competitive Moat
          </span>
          <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-primary text-balance md:text-4xl">
            The Tracebud advantage
          </h2>
        </div>

        {/* Cards */}
        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {/* Enterprise Brands */}
          <div
            id="for-brands"
            className="flex flex-col rounded-2xl bg-card p-8 shadow-sm lg:p-10"
          >
            <div className="mb-6">
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                The Payers
              </span>
              <h3 className="mt-4 text-2xl font-bold text-primary">
                For Enterprise Brands
              </h3>
            </div>
            <ul className="flex flex-1 flex-col gap-5">
              {brandBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm leading-relaxed text-card-foreground/70">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cooperatives */}
          <div
            id="for-cooperatives"
            className="flex flex-col rounded-2xl border-2 border-accent/20 bg-accent/5 p-8 shadow-sm lg:p-10"
          >
            <div className="mb-6">
              <span className="inline-block rounded-full bg-accent/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
                The Beneficiaries
              </span>
              <h3 className="mt-4 text-2xl font-bold text-primary">
                For Cooperatives &amp; Farmers
              </h3>
            </div>
            <ul className="flex flex-1 flex-col gap-5">
              {coopBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <Check className="h-3 w-3 text-accent" />
                  </div>
                  <span className="text-sm leading-relaxed text-card-foreground/70">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
