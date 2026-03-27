"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LeadFormProvider } from "@/components/lead-form-provider"
import { DEMO_LINKS } from "@/lib/demo-links"

export default function Home() {
  const router = useRouter()

  const scrollToId = useCallback((id: string) => {
    if (typeof window === "undefined") return
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const goToLeads = useCallback(() => {
    router.push("/leads")
  }, [router])

  const openExporterDemo = useCallback(() => {
    if (typeof window === "undefined") return
    window.open(DEMO_LINKS.exporterDashboard, "_blank", "noopener,noreferrer")
  }, [])

  return (
    <LeadFormProvider>
      <main className="min-h-screen bg-stone-50 text-emerald-900 flex flex-col">
        {/* NAVBAR */}
        <header className="sticky top-0 z-30 border-b border-emerald-100/60 bg-stone-50/80 backdrop-blur-md">
          <div className="container mx-auto flex items-center justify-between px-4 py-4 md:py-5 lg:px-8">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-900 text-stone-50 text-lg font-semibold shadow-sm shadow-emerald-900/30">
                T
              </span>
              <span className="text-3xl font-bold tracking-tight">
                Tracebud
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-emerald-900/80">
              <button
                className="transition-colors hover:text-emerald-900"
                onClick={() => scrollToId("how-it-works")}
              >
                How it Works
              </button>
              <button
                className="transition-colors hover:text-emerald-900"
                onClick={() => scrollToId("pricing-model")}
              >
                Pricing Model
              </button>
              <button
                className="transition-colors hover:text-emerald-900"
                onClick={() => scrollToId("for-brands")}
              >
                For Brands
              </button>
              <button
                className="transition-colors hover:text-emerald-900"
                onClick={() => scrollToId("for-cooperatives")}
              >
                For Cooperatives
              </button>
            </nav>

            <div className="flex items-center gap-3">
              <Button
                className="hidden sm:inline-flex rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-500/40 transition hover:bg-orange-700"
                onClick={goToLeads}
              >
                Request a Pilot
              </Button>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 left-[-10%] h-72 w-72 rounded-full bg-orange-200/60 blur-3xl" />
            <div className="absolute -bottom-24 right-[-10%] h-72 w-72 rounded-full bg-emerald-200/70 blur-3xl" />
          </div>

          <div className="container mx-auto px-4 pt-10 pb-8 md:pt-16 md:pb-16 lg:flex lg:items-center lg:gap-16 lg:px-8 lg:pt-20 lg:pb-20">
            <div className="max-w-xl space-y-6 md:space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-800 shadow-sm shadow-emerald-100 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-emerald-50/80 text-[10px] uppercase tracking-wide text-emerald-900"
                >
                  EUDR ready
                </Badge>
                <span>EUDR compliance & first-mile traceability</span>
              </div>

              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                The nature passport for global supply chains.
              </h1>

              <p className="text-balance text-sm leading-relaxed text-emerald-900/80 sm:text-base md:text-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                Tracebud turns smallholder agricultural networks into verified,
                nature-positive supply chains. Free mapping for cooperatives.
                Pay-per-shipment compliance data for European brands.
              </p>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-full bg-orange-600 px-6 text-sm font-semibold text-white shadow-lg shadow-orange-500/40 transition hover:bg-orange-700"
                  onClick={goToLeads}
                >
                  Request a Pilot
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto rounded-full border-orange-600 bg-transparent px-6 text-sm font-semibold text-orange-700 shadow-sm transition hover:bg-orange-50"
                  onClick={() => scrollToId("pricing-model")}
                >
                  How our pricing works
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto rounded-full border-emerald-700 bg-transparent px-6 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
                  onClick={openExporterDemo}
                >
                  Try the demo dashboard for exporters
                </Button>
              </div>

              <div className="grid gap-4 pt-4 text-xs text-emerald-900/70 sm:grid-cols-3 sm:text-sm">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                  <p className="font-semibold text-emerald-900">
                    Built for smallholders
                  </p>
                  <p>Offline-first mobile mapping for rural networks.</p>
                </div>
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                  <p className="font-semibold text-emerald-900">
                    Brand-grade assurance
                  </p>
                  <p>Deforestation checks aligned with EUDR, CSRD & TNFD.</p>
                </div>
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                  <p className="font-semibold text-emerald-900">
                    Shipment-level pricing
                  </p>
                  <p>Only pay when you export verified data.</p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex-1 lg:mt-0">
              <div className="relative mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-emerald-100 via-stone-50 to-orange-100 blur-xl" />
                <Card className="relative overflow-hidden rounded-3xl border-emerald-100/80 bg-white/80 shadow-xl shadow-emerald-200/40 backdrop-blur">
                  <CardHeader className="border-b border-emerald-50 bg-gradient-to-r from-emerald-50/80 to-stone-50/80 pb-3">
                    <CardTitle className="text-base font-semibold text-emerald-950">
                      Live shipment dossier
                    </CardTitle>
                    <CardDescription className="text-xs text-emerald-900/80">
                      Example export for a cocoa cooperative in West Africa.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                          Shipment ID
                        </p>
                        <p className="font-semibold text-emerald-950">
                          TRB-2026-0412
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                          Commodity
                        </p>
                        <p className="font-semibold text-emerald-950">
                          Cocoa beans
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                          Verified plots
                        </p>
                        <p className="font-semibold text-emerald-950">
                          426 smallholders
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                          Deforestation status
                        </p>
                        <p className="font-semibold text-emerald-950">
                          No alerts since 2020
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 text-[11px] leading-snug text-emerald-900">
                      <p className="mb-1 font-semibold text-emerald-950">
                        GeoJSON dossier ready
                      </p>
                      <p className="text-emerald-900/80">
                        Full coordinate polygons, farmer registry and
                        risk-scoring packaged in a single, EUDR-compliant file
                        for your importer.
                      </p>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-dashed border-emerald-200 bg-stone-50/80 px-3 py-2 text-[11px]">
                      <div>
                        <p className="font-semibold text-emerald-950">
                          Export to brand
                        </p>
                        <p className="text-[10px] text-emerald-900/80">
                          One-click dossier export per shipment.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="rounded-full bg-orange-600 px-3 text-[11px] font-semibold text-white hover:bg-orange-700"
                      >
                        Unlock dossier
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM / STAKES */}
        <section
          id="problem"
          className="border-t border-emerald-100/60 bg-stone-50/80"
        >
          <div className="container mx-auto px-4 py-12 md:py-16 lg:px-8">
            <div className="mx-auto max-w-3xl text-center space-y-4 md:space-y-5">
              <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
                The EUDR deadline has passed. Is your sourcing at risk?
              </h2>
              <p className="text-sm leading-relaxed text-emerald-900/80 sm:text-base">
                The majority of global agricultural commodities are grown by
                smallholders who cannot afford expensive enterprise tracing
                software. Without verified GPS polygons, European brands face
                severe fines, and millions of farmers face market exclusion.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <Card className="group relative overflow-hidden rounded-xl border-emerald-100 bg-white/80 shadow-sm shadow-emerald-100 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-100/70">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-emerald-500 to-orange-500 opacity-80" />
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-emerald-950">
                    Regulatory pressure
                  </CardTitle>
                  <CardDescription className="text-sm text-emerald-900/80">
                    Strict EUDR, CSRD, and TNFD reporting mandates are now
                    active.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="group relative overflow-hidden rounded-xl border-emerald-100 bg-white/80 shadow-sm shadow-emerald-100 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-100/70">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-orange-500 to-emerald-500 opacity-80" />
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-emerald-950">
                    The data gap
                  </CardTitle>
                  <CardDescription className="text-sm text-emerald-900/80">
                    Middlemen and aggregators obscure the true origin of raw
                    materials.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="group relative overflow-hidden rounded-xl border-emerald-100 bg-white/80 shadow-sm shadow-emerald-100 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-100/70">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-600 via-orange-500 to-emerald-500 opacity-80" />
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-emerald-950">
                    The SaaS barrier
                  </CardTitle>
                  <CardDescription className="text-sm text-emerald-900/80">
                    Traditional compliance software charges the cooperative,
                    pricing smallholders out.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="border-t border-emerald-100/60 bg-white/80"
        >
          <div className="container mx-auto px-4 py-12 md:py-16 lg:px-8">
            <div className="mx-auto max-w-3xl text-center space-y-3 md:space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
                How Tracebud works
              </h2>
              <p className="text-sm leading-relaxed text-emerald-900/80 sm:text-base">
                A mobile-first workflow that starts with the cooperative, not
                the corporate headquarters.
              </p>
            </div>

            <div className="mt-10 space-y-6 md:space-y-8">
              <Card className="relative overflow-hidden rounded-xl border-emerald-100 bg-stone-50/80 shadow-sm shadow-emerald-100">
                <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:gap-6 md:p-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900 text-sm font-semibold text-stone-50 shadow-sm shadow-emerald-900/40">
                    1
                  </div>
                  <div className="space-y-2 text-sm md:text-base">
                    <h3 className="font-semibold text-emerald-950">
                      Free offline mobile mapping
                    </h3>
                    <p className="text-emerald-900/80">
                      Cooperatives use our free, offline-first mobile app to
                      map farmer plots, register producers and capture
                      high-quality field data even in low-connectivity regions.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden rounded-xl border-emerald-100 bg-stone-50/80 shadow-sm shadow-emerald-100">
                <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:gap-6 md:p-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900 text-sm font-semibold text-stone-50 shadow-sm shadow-emerald-900/40">
                    2
                  </div>
                  <div className="space-y-2 text-sm md:text-base">
                    <h3 className="font-semibold text-emerald-950">
                      Automated deforestation verification
                    </h3>
                    <p className="text-emerald-900/80">
                      Farm coordinates are automatically cross-referenced
                      against deforestation and land-use change datasets,
                      generating auditable risk scores aligned with EUDR and
                      other reporting frameworks.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden rounded-xl border-emerald-100 bg-stone-50/80 shadow-sm shadow-emerald-100">
                <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:gap-6 md:p-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900 text-sm font-semibold text-stone-50 shadow-sm shadow-emerald-900/40">
                    3
                  </div>
                  <div className="space-y-2 text-sm md:text-base">
                    <h3 className="font-semibold text-emerald-950">
                      Pay-to-Unlock EUDR dossier
                    </h3>
                    <p className="text-emerald-900/80">
                      Tracebud compiles verified data into flawless GeoJSON and
                      documentation per shipment. Brands pay per exported
                      dossier, funding the cooperative&apos;s data operations
                      instead of charging them.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* PRICING ADVANTAGE */}
        <section
          id="pricing-model"
          className="border-t border-emerald-100/60 bg-stone-50/90"
        >
          <div className="container mx-auto px-4 py-12 md:py-16 lg:px-8">
            <div className="mx-auto max-w-3xl text-center space-y-3 md:space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
                A pricing model aligned with impact
              </h2>
              <p className="text-sm leading-relaxed text-emerald-900/80 sm:text-base">
                We keep software free for cooperatives, and price compliance
                data where value is captured: at shipment.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {/* Brands */}
              <Card
                id="for-brands"
                className="relative overflow-hidden rounded-xl border-emerald-100 bg-white/80 shadow-md shadow-emerald-100/70"
              >
                <CardHeader className="space-y-2">
                  <Badge className="w-fit rounded-full bg-emerald-900 px-3 py-1 text-[11px] font-medium text-stone-50">
                    For enterprise brands
                  </Badge>
                  <CardTitle className="text-lg font-semibold text-emerald-950">
                    Shipment-linked costs, not license bloat
                  </CardTitle>
                  <CardDescription className="text-sm text-emerald-900/80">
                    Only pay when you unlock a compliant dossier attached to a
                    real shipment.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-emerald-900/90">
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-600" />
                      <span className="font-semibold">
                        No bloated SaaS subscriptions
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-600" />
                      <span className="font-semibold">Zero compliance risk</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-600" />
                      <span className="font-semibold">Scope 3 ready</span>
                    </li>
                  </ul>
                  <div className="pt-3">
                    <Button
                      className="w-full rounded-full bg-orange-600 text-sm font-semibold text-white shadow-sm shadow-orange-500/40 hover:bg-orange-700"
                      onClick={goToLeads}
                    >
                      Talk to our team
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Cooperatives */}
              <Card
                id="for-cooperatives"
                className="relative overflow-hidden rounded-xl border-emerald-100 bg-emerald-50/90 shadow-md shadow-emerald-100/70"
              >
                <CardHeader className="space-y-2">
                  <Badge className="w-fit rounded-full bg-emerald-900 px-3 py-1 text-[11px] font-medium text-stone-50">
                    For cooperatives & farmers
                  </Badge>
                  <CardTitle className="text-lg font-semibold text-emerald-950">
                    Turn compliance into a new revenue stream
                  </CardTitle>
                  <CardDescription className="text-sm text-emerald-900/80">
                    We never charge cooperatives for the core software. Ever.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-emerald-900/90">
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-600" />
                      <span className="font-semibold">
                        100% Free software forever
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-600" />
                      <span className="font-semibold">Data Dividend</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-600" />
                      <span className="font-semibold">
                        Premium market access
                      </span>
                    </li>
                  </ul>
                  <div className="pt-3">
                    <Button
                      variant="outline"
                      className="w-full rounded-full border-orange-600 bg-transparent text-sm font-semibold text-orange-700 hover:bg-orange-50"
                      onClick={goToLeads}
                    >
                      Start a free mapping pilot
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FOOTER CTA */}
        <footer className="mt-auto border-t border-emerald-900 bg-emerald-900 text-stone-50">
          <div className="container mx-auto px-4 py-10 md:py-12 lg:px-8">
            <div className="mx-auto flex max-w-3xl flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-lg font-semibold md:text-xl">
                  Stop guessing about your origin data.
                </p>
                <p className="text-sm text-emerald-100/90 md:text-base">
                  Whether you&apos;re a cooperative or enterprise brand,
                  Tracebud bridges the gap between first-mile reality and
                  regulatory compliance.
                </p>
              </div>
              <Button
                size="lg"
                className="w-full rounded-full bg-orange-600 px-6 text-sm font-semibold text-white shadow-lg shadow-orange-500/40 transition hover:bg-orange-700 md:w-auto"
                onClick={goToLeads}
              >
                Contact our team
              </Button>
            </div>
          </div>
        </footer>
      </main>
    </LeadFormProvider>
  )
}
