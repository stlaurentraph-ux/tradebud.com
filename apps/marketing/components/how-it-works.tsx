import { Smartphone, SatelliteDish, FileCheck } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Smartphone,
    title: "Free offline mobile mapping",
    description:
      "Cooperatives use our free, offline-first mobile app to map farm boundaries. Local agents capture precise GPS polygons and social data directly at the source\u2014even without internet.",
  },
  {
    number: "02",
    icon: SatelliteDish,
    title: "Automated verification",
    description:
      "Farm coordinates are automatically cross-referenced against satellite imagery APIs on our backend to verify zero deforestation after the December 31, 2020 cutoff date.",
  },
  {
    number: "03",
    icon: FileCheck,
    title: "Pay-to-Unlock EUDR dossier",
    description:
      "Tracebud compiles the verified data into a flawless Type I/Type II GeoJSON file. European buyers pay a flat, per-shipment fee to unlock the data required for customs clearance.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-accent">
            How it works
          </span>
          <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-primary text-balance md:text-4xl">
            From farm boundary to customs clearance in three steps
          </h2>
        </div>

        {/* Timeline */}
        <div className="relative mt-16">
          {/* Vertical line (desktop) */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-border lg:block" />

          <div className="flex flex-col gap-12 lg:gap-0">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0
              return (
                <div
                  key={step.number}
                  className="relative lg:grid lg:grid-cols-2 lg:gap-12"
                >
                  {/* Dot on the line */}
                  <div className="absolute left-1/2 top-8 z-10 hidden h-4 w-4 -translate-x-1/2 rounded-full border-4 border-accent bg-background lg:block" />

                  {/* Content */}
                  <div
                    className={`rounded-2xl bg-card p-8 shadow-sm lg:py-10 ${
                      isEven
                        ? "lg:col-start-1 lg:pr-16 lg:text-right"
                        : "lg:col-start-2 lg:pl-16"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-4 ${
                        isEven ? "lg:flex-row-reverse" : ""
                      }`}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <step.icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-bold tracking-wider text-accent">
                        STEP {step.number}
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-primary">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-card-foreground/60">
                      {step.description}
                    </p>
                  </div>

                  {/* Empty column for alternating layout */}
                  {isEven ? (
                    <div className="hidden lg:col-start-2 lg:block" />
                  ) : (
                    <div className="hidden lg:col-start-1 lg:row-start-1 lg:block" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
