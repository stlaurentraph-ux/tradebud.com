"use client"

import { useState, useRef, useEffect, type FormEvent } from "react"
import { ArrowRight, Loader2 } from "lucide-react"
import { submitLead } from "@/apps/marketing/app/actions/leads"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

function AnimatedCheckmark() {
  const circleRef = useRef<SVGCircleElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const circle = circleRef.current
    const path = pathRef.current
    if (!circle || !path) return

    circle.style.strokeDasharray = "166"
    circle.style.strokeDashoffset = "166"
    path.style.strokeDasharray = "48"
    path.style.strokeDashoffset = "48"

    requestAnimationFrame(() => {
      circle.style.transition = "stroke-dashoffset 0.6s ease-in-out"
      circle.style.strokeDashoffset = "0"

      setTimeout(() => {
        path.style.transition = "stroke-dashoffset 0.3s ease-in-out"
        path.style.strokeDashoffset = "0"
      }, 400)
    })
  }, [])

  return (
    <svg
      className="mx-auto h-20 w-20"
      viewBox="0 0 52 52"
      fill="none"
      aria-hidden="true"
    >
      <circle
        ref={circleRef}
        cx="26"
        cy="26"
        r="25"
        fill="none"
        stroke="#064E3B"
        strokeWidth="2"
      />
      <path
        ref={pathRef}
        fill="none"
        stroke="#064E3B"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.1 27.2l7.1 7.2 16.7-16.8"
      />
    </svg>
  )
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <AnimatedCheckmark />
      <div className="flex flex-col gap-2">
        <h3 className="font-serif text-2xl font-bold text-primary">
          Request received.
        </h3>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
          A Tracebud supply chain expert will be in touch within 24 hours.
        </p>
      </div>
    </div>
  )
}

export function LeadFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [submitted, setSubmitted] = useState(false)
  const [lookingFor, setLookingFor] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const result = await submitLead({
      first_name: (formData.get("firstName") as string).trim(),
      last_name: (formData.get("lastName") as string).trim(),
      email: (formData.get("email") as string).trim(),
      company: (formData.get("company") as string).trim(),
      looking_for: lookingFor,
      volume: (formData.get("volume") as string)?.trim() || null,
      message: (formData.get("message") as string)?.trim() || null,
    })

    setIsSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSubmitted(true)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      // Reset state when dialog closes
      setTimeout(() => {
        setSubmitted(false)
        setLookingFor("")
        setError(null)
      }, 300)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl border-border/60 bg-background p-0 sm:max-w-lg">
        {submitted ? (
          <div className="p-8">
            <SuccessState />
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            <DialogHeader className="gap-2 pb-6">
              <DialogTitle className="font-serif text-2xl font-bold text-primary md:text-3xl">
                {"Let\u2019s map your supply chain."}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                Whether you need to unlock EUDR compliance data or map your
                cooperative for free, our team is ready to help.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              )}
              {/* First & Last Name */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="firstName" className="text-card-foreground">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Maria"
                    required
                    className="h-11 rounded-xl border-border bg-card text-card-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lastName" className="text-card-foreground">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Gonzalez"
                    required
                    className="h-11 rounded-xl border-border bg-card text-card-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-card-foreground">
                  Work email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="maria@company.com"
                  required
                  className="h-11 rounded-xl border-border bg-card text-card-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
                />
              </div>

              {/* Company */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="company" className="text-card-foreground">
                  Company / Cooperative name
                </Label>
                <Input
                  id="company"
                  name="company"
                  placeholder="Cooperative Sol Naciente"
                  required
                  className="h-11 rounded-xl border-border bg-card text-card-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
                />
              </div>

              {/* Looking For */}
              <div className="flex flex-col gap-2">
                <Label className="text-card-foreground">
                  I am primarily looking for...
                </Label>
                <Select
                  required
                  value={lookingFor}
                  onValueChange={setLookingFor}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-border bg-card text-card-foreground focus-visible:border-primary focus-visible:ring-primary/20 data-[placeholder]:text-muted-foreground">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="eudr-compliance" className="rounded-lg text-card-foreground focus:bg-primary/5 focus:text-primary">
                      EUDR Compliance Data (Enterprise Brand / Roaster)
                    </SelectItem>
                    <SelectItem value="free-mapping" className="rounded-lg text-card-foreground focus:bg-primary/5 focus:text-primary">
                      Free Mapping Software (Cooperative / Producer)
                    </SelectItem>
                    <SelectItem value="partnership" className="rounded-lg text-card-foreground focus:bg-primary/5 focus:text-primary">
                      Partnership / Other
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Volume */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="volume" className="text-card-foreground">
                  Estimated volume or hectares
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="volume"
                  name="volume"
                  placeholder="e.g. 500 MT or 2,000 hectares"
                  className="h-11 rounded-xl border-border bg-card text-card-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
                />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="message" className="text-card-foreground">
                  Message / Specific requirements
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder="Tell us about your supply chain, timeline, or any questions you have..."
                  className="rounded-xl border-border bg-card text-card-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="mt-2 h-12 w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Request
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                We respect your privacy. No spam, ever.
              </p>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function useLeadFormDialog() {
  const [open, setOpen] = useState(false)
  return { open, setOpen, onOpenChange: setOpen }
}
