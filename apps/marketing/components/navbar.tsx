"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

const navLinks = [
  { label: "How it Works", href: "#how-it-works" },
  { label: "Pricing Model", href: "#pricing" },
  { label: "For Brands", href: "#for-brands" },
  { label: "For Cooperatives", href: "#for-cooperatives" },
]
export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  const goToLeads = () => {
    router.push("/leads")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <a href="#" className="text-xl font-bold tracking-tight text-primary">
          Tracebud
        </a>

        {/* Desktop Links */}
        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-card-foreground/70 transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <Button
            onClick={goToLeads}
            className="rounded-full bg-accent px-6 text-accent-foreground hover:bg-accent/90"
          >
            Request Pilot
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-primary"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border/50 bg-background px-6 pb-6 md:hidden">
          <ul className="flex flex-col gap-4 pt-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block text-sm font-medium text-card-foreground/70 transition-colors hover:text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Button
              onClick={() => {
                setMobileOpen(false)
                goToLeads()
              }}
              className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Request Pilot
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
