"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export function Hero() {
  const router = useRouter()

  const goToLeads = () => {
    router.push("/leads")
  }
  return (
    <section className="relative overflow-hidden bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text */}
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              EUDR compliance &amp; first-mile traceability
            </span>

            <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-primary text-balance md:text-5xl lg:text-6xl">
              The nature passport for global supply chains.
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-card-foreground/70 text-pretty lg:text-lg">
              Tracebud turns smallholder agricultural networks into verified, nature-positive supply chains. Free mapping for cooperatives. Pay-per-shipment compliance data for European brands.
            </p>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <Button
                size="lg"
                onClick={goToLeads}
                className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-forest-light"
              >
                Request a pilot
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
              >
                How our pricing works
              </Button>
            </div>
          </div>

          {/* Visual */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-lg">
              {/* Background warm photo */}
              <div className="absolute -bottom-4 -right-4 h-72 w-72 overflow-hidden rounded-2xl opacity-60 lg:h-80 lg:w-80">
                <Image
                  src="/images/farmer-cooperative.jpg"
                  alt="Coffee farmer in a lush green plantation holding a smartphone under warm natural lighting"
                  fill
                  className="object-cover"
                />
              </div>
              {/* Phone / SaaS overlay */}
              <div className="relative z-10 overflow-hidden rounded-2xl shadow-2xl shadow-primary/10">
                <Image
                  src="/images/hero-phone.jpg"
                  alt="Smartphone displaying satellite map with farm boundary GPS polygons overlaid on aerial imagery"
                  width={600}
                  height={450}
                  className="h-auto w-full"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
