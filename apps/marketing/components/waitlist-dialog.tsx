"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES = [
  "Cooperative",
  "Exporter",
  "Importer",
  "Sponsor (brand, country, NGO)",
  "Other",
];

const COMMODITIES = [
  "Coffee",
  "Cocoa",
  "Palm Oil",
  "Rubber",
  "Soy",
  "Cattle / Leather",
  "Wood / Timber",
  "Other",
];

const PRODUCER_RANGES = [
  "1 – 50 producers",
  "51 – 200 producers",
  "201 – 500 producers",
  "501 – 2,000 producers",
  "2,001 – 10,000 producers",
  "10,000+ producers",
];

function AnimatedCheckmark() {
  const circleRef = useRef<SVGCircleElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const circle = circleRef.current;
    const path = pathRef.current;
    if (!circle || !path) return;

    circle.style.strokeDasharray = "166";
    circle.style.strokeDashoffset = "166";
    path.style.strokeDasharray = "48";
    path.style.strokeDashoffset = "48";

    requestAnimationFrame(() => {
      circle.style.transition = "stroke-dashoffset 0.6s ease-in-out";
      circle.style.strokeDashoffset = "0";
      setTimeout(() => {
        path.style.transition = "stroke-dashoffset 0.3s ease-in-out";
        path.style.strokeDashoffset = "0";
      }, 400);
    });
  }, []);

  return (
    <svg className="mx-auto h-16 w-16" viewBox="0 0 52 52" fill="none" aria-hidden="true">
      <circle ref={circleRef} cx="26" cy="26" r="25" fill="none" stroke="var(--data-emerald)" strokeWidth="2" />
      <path ref={pathRef} fill="none" stroke="var(--data-emerald)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
    </svg>
  );
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <AnimatedCheckmark />
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-bold text-[var(--forest-canopy)]">
          {"You're on the list."}
        </h3>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
          {"We'll be in touch as soon as Tracebud is ready for you. Early adopters get priority support and onboarding."}
        </p>
      </div>
    </div>
  );
}

export function WaitlistDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [role, setRole] = useState("");
  const [roleOther, setRoleOther] = useState("");
  const [commodity, setCommodity] = useState("");
  const [producerRange, setProducerRange] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!role) {
      setError("Please select your role.");
      return;
    }
    if (role === "Other" && !roleOther.trim()) {
      setError("Please describe your role.");
      return;
    }
    if (!commodity) {
      setError("Please select a commodity.");
      return;
    }
    if (!producerRange) {
      setError("Please select the number of producers.");
      return;
    }

    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      email: (formData.get("email") as string).trim(),
      first_name: (formData.get("firstName") as string).trim(),
      last_name: (formData.get("lastName") as string).trim(),
      organisation: (formData.get("organisation") as string).trim(),
      role: role === "Other" ? roleOther.trim() : role,
      commodity,
      producer_range: producerRange,
    };

    try {
      // Submit to API route
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setTimeout(() => {
        setSubmitted(false);
        setRole("");
        setRoleOther("");
        setCommodity("");
        setProducerRange("");
        setError(null);
      }, 300);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-border/60 bg-background p-0 sm:max-w-md">
        {submitted ? (
          <div className="p-8">
            <SuccessState />
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            <DialogHeader className="gap-2 pb-5">
              <DialogTitle className="text-2xl font-bold text-[var(--forest-canopy)]">
                Join the waitlist
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                Be among the first to access Tracebud. Early adopters receive priority support and onboarding from our team.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              {/* Name row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Maria"
                    required
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Gonzalez"
                    required
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              {/* Work email */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="maria@company.com"
                  required
                  className="h-11 rounded-xl"
                />
              </div>

              {/* Organisation */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="organisation">Organisation</Label>
                <Input
                  id="organisation"
                  name="organisation"
                  placeholder="Cooperative Sol Naciente"
                  required
                  className="h-11 rounded-xl"
                />
              </div>

              {/* Role */}
              <div className="flex flex-col gap-1.5">
                <Label>Your role</Label>
                <Select required value={role} onValueChange={(v) => { setRole(v); if (v !== "Other") setRoleOther(""); }}>
                  <SelectTrigger className="h-11 w-full rounded-xl data-[placeholder]:text-muted-foreground">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="rounded-lg">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {role === "Other" && (
                  <Input
                    value={roleOther}
                    onChange={(e) => setRoleOther(e.target.value)}
                    placeholder="Please describe your role"
                    className="h-11 rounded-xl mt-1"
                    required
                  />
                )}
              </div>

              {/* Commodity */}
              <div className="flex flex-col gap-1.5">
                <Label>Main commodity</Label>
                <Select required value={commodity} onValueChange={setCommodity}>
                  <SelectTrigger className="h-11 w-full rounded-xl data-[placeholder]:text-muted-foreground">
                    <SelectValue placeholder="Select a commodity" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {COMMODITIES.map((c) => (
                      <SelectItem key={c} value={c} className="rounded-lg">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Number of producers */}
              <div className="flex flex-col gap-1.5">
                <Label>Number of producers to make comply</Label>
                <Select required value={producerRange} onValueChange={setProducerRange}>
                  <SelectTrigger className="h-11 w-full rounded-xl data-[placeholder]:text-muted-foreground">
                    <SelectValue placeholder="Select a range" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {PRODUCER_RANGES.map((r) => (
                      <SelectItem key={r} value={r} className="rounded-lg">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="mt-2 h-12 w-full rounded-xl bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Join the waitlist
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                No spam, ever. Unsubscribe at any time.
              </p>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function useWaitlistDialog() {
  const [open, setOpen] = useState(false);
  return { open, setOpen, onOpenChange: setOpen };
}
