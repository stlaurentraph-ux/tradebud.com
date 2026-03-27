import { ShieldAlert, Unlink, Lock } from "lucide-react"

const problems = [
  {
    icon: ShieldAlert,
    title: "Regulatory pressure",
    description:
      "Strict EUDR, CSRD, and TNFD reporting mandates are now active.",
  },
  {
    icon: Unlink,
    title: "The data gap",
    description:
      "Middlemen and aggregators obscure the true origin of raw materials.",
  },
  {
    icon: Lock,
    title: "The SaaS barrier",
    description:
      "Traditional compliance software charges the cooperative, pricing smallholders out of the market.",
  },
]

export function Stakes() {
  return (
    <section className="bg-secondary py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-bold leading-tight text-primary text-balance md:text-4xl">
            The EUDR deadline has passed. Is your sourcing at risk?
          </h2>
          <p className="mt-6 text-base leading-relaxed text-card-foreground/70 text-pretty lg:text-lg">
            The majority of global agricultural commodities are grown by
            smallholders who cannot afford expensive enterprise tracing
            software. Without verified GPS polygons, European brands face severe
            fines, and millions of farmers face market exclusion. The old SaaS
            models are too expensive for the first mile.
          </p>
        </div>

        {/* Problem cards */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="group rounded-2xl bg-card p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
                <problem.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-primary">
                {problem.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-card-foreground/60">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
