"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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

const ROLE_OPTIONS = [
  { value: "Cooperative", key: "cooperative" },
  { value: "Exporter", key: "exporter" },
  { value: "Importer", key: "importer" },
  { value: "Sponsor (brand, country, NGO)", key: "sponsor" },
  { value: "Other", key: "other" },
] as const;

const COMMODITY_OPTIONS = [
  { value: "Coffee", key: "coffee" },
  { value: "Cocoa", key: "cocoa" },
  { value: "Palm Oil", key: "palmOil" },
  { value: "Rubber", key: "rubber" },
  { value: "Soy", key: "soy" },
  { value: "Cattle / Leather", key: "cattle" },
  { value: "Wood / Timber", key: "wood" },
  { value: "Other", key: "other" },
] as const;

const PRODUCER_RANGE_OPTIONS = [
  { value: "1 – 50 producers", key: "r1" },
  { value: "51 – 200 producers", key: "r2" },
  { value: "201 – 500 producers", key: "r3" },
  { value: "501 – 2,000 producers", key: "r4" },
  { value: "2,001 – 10,000 producers", key: "r5" },
  { value: "10,000+ producers", key: "r6" },
] as const;

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
  const t = useTranslations("marketing.waitlistDialog.success");

  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <AnimatedCheckmark />
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-bold text-[var(--forest-canopy)]">{t("title")}</h3>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">{t("description")}</p>
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
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("marketing.waitlistDialog");
  const tf = useTranslations("marketing.waitlistDialog.form");
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

    const form = e.currentTarget;
    const formData = new FormData(form);

    const email = (formData.get("email") as string).trim();
    const firstName = (formData.get("firstName") as string).trim();
    const lastName = (formData.get("lastName") as string).trim();
    const organisation = (formData.get("organisation") as string).trim();

    if (!email) {
      setError(tf("errors.emailRequired"));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(tf("errors.emailInvalid"));
      return;
    }
    if (!firstName.trim()) {
      setError(tf("errors.firstNameRequired"));
      return;
    }
    if (!lastName.trim()) {
      setError(tf("errors.lastNameRequired"));
      return;
    }
    if (!organisation) {
      setError(tf("errors.organisationRequired"));
      return;
    }
    if (!role) {
      setError(tf("errors.roleRequired"));
      return;
    }
    if (role === "Other" && !roleOther.trim()) {
      setError(tf("errors.roleOtherRequired"));
      return;
    }
    if (!commodity) {
      setError(tf("errors.commodityRequired"));
      return;
    }
    if (!producerRange) {
      setError(tf("errors.producerRangeRequired"));
      return;
    }

    setIsSubmitting(true);

    const payload = {
      email,
      first_name: firstName,
      last_name: lastName,
      organisation,
      role: role === "Other" ? roleOther.trim() : role,
      commodity,
      producer_range: producerRange,
    };

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data.error as string) || tf("errors.generic"));
      }

      setSubmitted(true);

      setTimeout(() => {
        router.push(`/${locale}/thank-you?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : tf("errors.generic");
      setError(message);
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
      <DialogContent className="max-h-[90vh] overflow-hidden rounded-2xl border-border/60 bg-background p-0 sm:max-w-2xl flex flex-col sm:flex-row">
        <div className="relative hidden sm:block w-[38%] flex-shrink-0 self-stretch">
          <Image
            src="/images/supply-chain-flow.jpg"
            alt="Coffee plantation aerial view"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--forest-canopy)]/40 via-[var(--forest-canopy)]/50 to-[var(--forest-canopy)]/80" />
          <div className="absolute inset-0 flex flex-col justify-between p-7">
            <p className="text-white/90 text-sm font-semibold tracking-wide uppercase">Tracebud</p>
            <div>
              <p className="text-white font-bold text-lg leading-snug mb-2">{t("sidePanel.tagline")}</p>
              <p className="text-white/70 text-xs leading-relaxed">{t("sidePanel.subline")}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {submitted ? (
            <div className="p-8">
              <SuccessState />
            </div>
          ) : (
            <div className="p-6 sm:p-8">
              <DialogHeader className="gap-2 pb-5">
                <DialogTitle className="text-2xl font-bold text-[var(--forest-canopy)]">{t("headline")}</DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-muted-foreground">{t("description")}</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="firstName">{tf("firstName")}</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder={tf("placeholders.firstName")}
                      required
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="lastName">{tf("lastName")}</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder={tf("placeholders.lastName")}
                      required
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">{tf("email")}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={tf("placeholders.email")}
                    required
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="organisation">{tf("organisation")}</Label>
                  <Input
                    id="organisation"
                    name="organisation"
                    placeholder={tf("placeholders.organisation")}
                    required
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>{tf("role")}</Label>
                  <Select
                    required
                    value={role}
                    onValueChange={(v) => {
                      setRole(v);
                      if (v !== "Other") setRoleOther("");
                    }}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl data-[placeholder]:text-muted-foreground">
                      <SelectValue placeholder={tf("placeholders.role")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="rounded-lg">
                          {tf(`roles.${option.key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {role === "Other" && (
                    <Input
                      value={roleOther}
                      onChange={(e) => setRoleOther(e.target.value)}
                      placeholder={tf("placeholders.roleOther")}
                      className="h-11 rounded-xl mt-1"
                      required
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>{tf("commodity")}</Label>
                  <Select required value={commodity} onValueChange={setCommodity}>
                    <SelectTrigger className="h-11 w-full rounded-xl data-[placeholder]:text-muted-foreground">
                      <SelectValue placeholder={tf("placeholders.commodity")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {COMMODITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="rounded-lg">
                          {tf(`commodities.${option.key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>{tf("producerRange")}</Label>
                  <Select required value={producerRange} onValueChange={setProducerRange}>
                    <SelectTrigger className="h-11 w-full rounded-xl data-[placeholder]:text-muted-foreground">
                      <SelectValue placeholder={tf("placeholders.producerRange")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {PRODUCER_RANGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="rounded-lg">
                          {tf(`producerRanges.${option.key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="mt-2 h-12 w-full rounded-xl bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("submitting")}
                    </>
                  ) : (
                    <>
                      {t("submit")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">{t("note")}</p>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useWaitlistDialog() {
  const [open, setOpen] = useState(false);
  return { open, setOpen, onOpenChange: setOpen };
}
