"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useLeadForm } from "@/components/lead-form-provider"

export function FooterCTA() {
  const { openForm } = useLeadForm()
  return (
    <footer className="bg-primary py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <h2 className="font-serif text-3xl font-bold leading-tight text-primary-foreground text-balance md:text-4xl">
          Stop guessing about your origin data.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-primary-foreground/70 text-pretty lg:text-lg">
          Whether you are a cooperative looking for free mapping tools, or an
          enterprise brand needing immediate EUDR compliance, Tracebud bridges
          the gap.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4">
          <Button
            size="lg"
            onClick={openForm}
            className="rounded-full bg-primary-foreground px-8 text-primary hover:bg-primary-foreground/90"
          >
            Contact our team
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <a
            href="#"
            className="text-sm font-medium text-primary-foreground/60 underline underline-offset-4 transition-colors hover:text-primary-foreground/80"
          >
            Read our EUDR readiness guide
          </a>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 border-t border-primary-foreground/10 pt-8">
          <p className="text-xs text-primary-foreground/40">
            &copy; {new Date().getFullYear()} Tracebud. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
