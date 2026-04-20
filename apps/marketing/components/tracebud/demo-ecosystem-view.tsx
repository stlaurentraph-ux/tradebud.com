"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Gauge,
  GitBranch,
  LayoutGrid,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AudienceMode = "commercial" | "compliance" | "operations";
type CanonicalColumn = {
  title: string;
  points: {
    label: string;
    modes: AudienceMode[];
  }[];
};

const audienceModes: { id: AudienceMode; label: string }[] = [
  { id: "commercial", label: "Commercial" },
  { id: "compliance", label: "Compliance" },
  { id: "operations", label: "Operations" },
];

const sections = [
  { id: "system-map", label: "System map" },
  { id: "proof-rails", label: "Proof rails" },
  { id: "lifecycle-controls", label: "Lifecycle controls" },
  { id: "failure-recovery", label: "Failure recovery" },
] as const;

const canonicalColumns: CanonicalColumn[] = [
  {
    title: "Actors",
    points: [
      { label: "Farmers and field teams", modes: ["commercial", "operations"] },
      { label: "Cooperative and exporter operations", modes: ["commercial", "operations"] },
      { label: "Compliance and filing officers", modes: ["compliance", "operations"] },
      { label: "Importers and regulators", modes: ["commercial", "compliance"] },
    ],
  },
  {
    title: "Data and controls",
    points: [
      { label: "Offline capture and sync", modes: ["operations"] },
      { label: "Geospatial and rule validation", modes: ["compliance", "operations"] },
      { label: "Evidence and package assembly", modes: ["compliance", "operations"] },
      { label: "Role-scoped transitions", modes: ["compliance", "operations"] },
    ],
  },
  {
    title: "Outcomes",
    points: [
      { label: "Buyer-ready traceability", modes: ["commercial"] },
      { label: "DDS submission readiness", modes: ["compliance"] },
      { label: "Audit-ready event history", modes: ["compliance", "operations"] },
      { label: "Exception recovery loop", modes: ["operations", "compliance"] },
    ],
  },
];

const proofRails = [
  {
    title: "Permissions",
    detail: "Only role-scoped users can run high-risk transitions or compliance actions.",
  },
  {
    title: "State transitions",
    detail: "Each domain follows canonical lifecycle steps with explicit ownership.",
  },
  {
    title: "Exception recovery",
    detail: "Blocked states route into deterministic queues with reason codes and retries.",
  },
  {
    title: "Analytics and audit",
    detail: "Every critical operation emits event telemetry for operator and compliance review.",
  },
];

const lifecycleDomains = [
  {
    name: "Plot",
    states: "Draft -> Mapped -> Validated -> Approved -> Archived",
    owner: "Field lead, reviewer, compliance lead",
  },
  {
    name: "Package",
    states: "Declared -> Bundled -> Evidence complete -> Ready to file -> Filed",
    owner: "Ops lead, compliance reviewer",
  },
  {
    name: "Filing",
    states: "Prepared -> Submitted -> Acknowledged -> Accepted or flagged -> Closed loop",
    owner: "Compliance and integration operator",
  },
];

const failureLanes = [
  {
    trigger: "Permission denial",
    response: "Transition blocked, audit event logged, reassignment required.",
    link: "#lifecycle-controls",
    linkLabel: "See lifecycle controls",
  },
  {
    trigger: "Invalid sequence or stale sync",
    response: "Unsafe write rejected, canonical ordering replay, conflict task issued.",
    link: "#system-map",
    linkLabel: "See system map",
  },
  {
    trigger: "Evidence gap or failed submission",
    response: "Queue hold with reason code, retry/escalate path, status feedback retained.",
    link: "#proof-rails",
    linkLabel: "See proof rails",
  },
];

const panelClass = "border-[var(--forest-canopy)]/15 bg-white/95 backdrop-blur-sm shadow-[0_8px_30px_-16px_rgba(6,78,59,0.45)]";
const sectionKickerClass = "text-xs font-semibold uppercase tracking-wide text-[var(--forest-canopy)]/75";
const subtleChipClass =
  "rounded-full border border-[var(--forest-canopy)]/20 bg-[var(--forest-canopy)]/8 px-3 py-1 text-xs font-semibold text-[var(--forest-canopy)] transition hover:bg-[var(--forest-canopy)]/14";

function highlightClass(active: boolean) {
  if (active) {
    return "border-[var(--data-emerald)]/45 bg-[var(--data-emerald)]/8 text-foreground";
  }
  return "border-border bg-background text-foreground/75";
}

export function DemoEcosystemView() {
  const [audience, setAudience] = useState<AudienceMode>("commercial");
  const [activeSection, setActiveSection] = useState<string>("system-map");
  const [demoDayMode, setDemoDayMode] = useState<boolean>(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0.2, 0.4, 0.6] },
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main
      className={`min-h-screen ${
        demoDayMode
          ? "bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_35%),linear-gradient(180deg,#f8fffd_0%,#f3fbf8_100%)]"
          : "bg-[radial-gradient(circle_at_top,rgba(6,78,59,0.08),transparent_35%),linear-gradient(180deg,#fbfefc_0%,#f7fbf9_100%)]"
      }`}
    >
      <section className={`px-6 text-white ${demoDayMode ? "py-16" : "py-14"}`}>
        <div className={`mx-auto ${demoDayMode ? "max-w-7xl" : "max-w-6xl"}`}>
          <div className="rounded-3xl border border-[var(--forest-canopy)]/20 bg-gradient-to-br from-[var(--forest-canopy)] via-[var(--forest-light)] to-[var(--forest-canopy)] p-7 shadow-[0_24px_80px_-30px_rgba(6,78,59,0.75)] md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Badge className="border border-white/20 bg-white/10 text-white hover:bg-white/10">
                Tracebud Demo Atlas
              </Badge>
              <button
                type="button"
                onClick={() => setDemoDayMode((current) => !current)}
                className={`rounded-full border px-4 py-2 font-bold transition ${
                  demoDayMode
                    ? "border-[var(--data-emerald)] bg-[var(--data-emerald)] text-[var(--forest-canopy)] text-base shadow-lg"
                    : "border-white/35 bg-white/10 text-white text-sm hover:border-[var(--data-emerald)]/70"
                }`}
              >
                Demo Day Mode: {demoDayMode ? "ON" : "OFF"}
              </button>
            </div>
            <h1 className={`mt-4 text-balance font-bold ${demoDayMode ? "text-4xl md:text-6xl" : "text-3xl md:text-5xl"}`}>
              Tracebud ecosystem map in one clear narrative
            </h1>
            <p
              className={`mt-4 max-w-4xl leading-relaxed text-white/90 ${
                demoDayMode ? "text-lg md:text-xl" : "text-base md:text-lg"
              }`}
            >
              {demoDayMode
                ? "Field capture -> controls -> filing outcomes. Use this page as your presenter script."
                : "One canonical view from field capture to compliance outcomes, with explicit controls, lifecycle gates, and recovery behavior."}
            </p>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {sections.map((section, index) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border border-[var(--forest-canopy)]/25 bg-white px-4 py-2 text-sm font-semibold text-[var(--forest-canopy)] transition hover:border-[var(--forest-canopy)]/40 hover:bg-[var(--forest-canopy)]/5"
              >
                {index + 1}. {section.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="system-map" className={`px-6 ${demoDayMode ? "py-10" : "py-7"}`}>
        <div className={`mx-auto grid ${demoDayMode ? "max-w-7xl lg:grid-cols-[250px_1fr]" : "max-w-6xl lg:grid-cols-[220px_1fr]"} gap-6`}>
          <aside className="lg:sticky lg:top-6 lg:h-fit">
            <Card className={`py-4 ${panelClass} ${demoDayMode ? "shadow-md" : ""}`}>
              <CardHeader className="px-4 pb-0">
                <CardTitle className={`${demoDayMode ? "text-base" : "text-sm"} text-[var(--forest-canopy)]`}>Live progress</CardTitle>
                <CardDescription>Highlights current section while scrolling.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 px-4">
                {sections.map((section, index) => {
                  const isActive = activeSection === section.id;
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className={`block rounded-md border px-3 py-2 transition ${
                        isActive
                          ? "border-[var(--forest-canopy)] bg-[var(--forest-canopy)]/15 text-[var(--forest-canopy)] shadow-sm ring-2 ring-[var(--forest-canopy)]/30 text-base font-extrabold"
                          : `${demoDayMode ? "border-border text-base font-semibold text-foreground/90" : "border-border text-sm text-foreground/80"} hover:border-[var(--forest-canopy)]/40`
                      }`}
                    >
                      {index + 1}. {section.label}
                    </a>
                  );
                })}
              </CardContent>
            </Card>
          </aside>

          <div className={demoDayMode ? "space-y-6" : "space-y-5"}>
          <Card className={`${panelClass} ${demoDayMode ? "py-6 shadow-md" : "py-4"}`}>
            <CardHeader>
              <p className={sectionKickerClass}>1. System map</p>
              <CardTitle className="mt-2 flex items-center gap-2 border-l-4 border-[var(--forest-canopy)] pl-3 text-[var(--forest-canopy)]">
                <LayoutGrid className="h-5 w-5" />
                Canonical architecture flow
              </CardTitle>
              <CardDescription>
                {demoDayMode
                  ? "Presenter step 1: orient the audience with this map."
                  : "Start here in demos. Everything else explains this map in more depth."}
              </CardDescription>
              <div className="mt-2 flex flex-wrap gap-2">
                {audienceModes.map((mode) => {
                  const active = audience === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setAudience(mode.id)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                        active
                          ? "border-[var(--forest-canopy)] bg-[var(--forest-canopy)] text-white"
                          : "border-border bg-background text-foreground/80 hover:border-[var(--forest-canopy)]/40"
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent className={demoDayMode ? "space-y-6" : "space-y-4"}>
              <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
                {canonicalColumns.map((column, index) => (
                  <div key={column.title} className="contents md:block">
                    <div className={`rounded-2xl border border-[var(--forest-canopy)]/20 ${demoDayMode ? "bg-white p-5" : "bg-background/80 p-4"}`}>
                      <p className="mb-3 text-sm font-semibold text-[var(--forest-canopy)]">{column.title}</p>
                      <div className="space-y-2">
                        {column.points.map((point) => {
                          const active = point.modes.includes(audience);
                          return (
                            <div
                              key={point.label}
                              className={`rounded-xl border px-3 py-2 leading-snug ${demoDayMode ? "text-lg font-medium" : "text-sm"} ${highlightClass(active)}`}
                            >
                              {point.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {index < canonicalColumns.length - 1 ? (
                      <div className="hidden items-center justify-center md:flex">
                        <div className="flex items-center gap-1">
                          <span className="h-px w-6 bg-[var(--forest-canopy)]/30" />
                          <ArrowRight className="h-4 w-4 text-[var(--forest-canopy)]/70" />
                          <span className="h-px w-6 bg-[var(--forest-canopy)]/30" />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              <p className={`${demoDayMode ? "text-base" : "text-sm"} text-muted-foreground`}>
                {demoDayMode ? (
                  <>
                    Live script focus: <span className="font-semibold text-foreground capitalize">{audience}</span>. Speak only highlighted nodes.
                  </>
                ) : (
                  <>
                    Audience focus: <span className="font-semibold text-foreground capitalize">{audience}</span>. Highlighted nodes are the talking points for this audience.
                  </>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="#proof-rails"
                  className={subtleChipClass}
                >
                  Why this is trustworthy {"->"} proof rails
                </a>
                <a
                  href="#failure-recovery"
                  className={subtleChipClass}
                >
                  Where this can fail {"->"} recovery lanes
                </a>
              </div>
            </CardContent>
          </Card>

          <Card id="proof-rails" className={`${panelClass} ${demoDayMode ? "py-6 shadow-md" : "py-4"}`}>
            <CardHeader>
              <p className={sectionKickerClass}>2. Proof rails</p>
              <CardTitle className="mt-2 flex items-center gap-2 border-l-4 border-[var(--forest-canopy)] pl-3 text-[var(--forest-canopy)]">
                <ShieldCheck className="h-5 w-5" />
                Why the flow is reliable
              </CardTitle>
              <CardDescription>
                {demoDayMode
                  ? "Presenter step 2: prove trust with these four rails."
                  : "Four non-negotiable rails you can reference in every demo."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {proofRails.map((rail) => (
                <div key={rail.title} className={`rounded-2xl border border-border bg-background/70 ${demoDayMode ? "p-5" : "p-4"}`}>
                  <p className={`flex items-center gap-2 font-semibold text-foreground ${demoDayMode ? "text-base" : ""}`}>
                    <CheckCircle2 className="h-4 w-4 text-[var(--forest-canopy)]" />
                    {rail.title}
                  </p>
                  <p className={`mt-2 text-foreground/80 ${demoDayMode ? "text-base" : "text-sm"}`}>{rail.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card id="lifecycle-controls" className={`${panelClass} ${demoDayMode ? "py-6 shadow-md" : "py-4"}`}>
            <CardHeader>
              <p className={sectionKickerClass}>3. Lifecycle controls</p>
              <CardTitle className="mt-2 flex items-center gap-2 border-l-4 border-[var(--forest-canopy)] pl-3 text-[var(--forest-canopy)]">
                <GitBranch className="h-5 w-5" />
                State transitions by domain
              </CardTitle>
              <CardDescription>
                {demoDayMode
                  ? "Presenter step 3: show who can move each state."
                  : "Canonical states and role ownership for plot, package, and filing domains."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {lifecycleDomains.map((domain) => (
                <div key={domain.name} className={`rounded-2xl border border-border bg-background/70 ${demoDayMode ? "p-5" : "p-4"}`}>
                  <p className={`font-semibold text-foreground ${demoDayMode ? "text-base" : ""}`}>{domain.name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-[var(--forest-canopy)]/70">
                    <span>Flow:</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                  <p className={`mt-1 text-foreground/80 ${demoDayMode ? "text-base" : "text-sm"}`}>{domain.states}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Owner: {domain.owner}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card id="failure-recovery" className={`${panelClass} ${demoDayMode ? "py-6 shadow-md" : "py-4"}`}>
            <CardHeader>
              <p className={sectionKickerClass}>4. Failure recovery</p>
              <CardTitle className="mt-2 flex items-center gap-2 border-l-4 border-[var(--forest-canopy)] pl-3 text-[var(--forest-canopy)]">
                <AlertTriangle className="h-5 w-5" />
                Failure modes with explicit recovery paths
              </CardTitle>
              <CardDescription>
                {demoDayMode
                  ? "Presenter step 4: close with resilience and recovery."
                  : "Demo this section last to show resilience without compromising audit integrity."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {failureLanes.map((lane) => (
                <div key={lane.trigger} className={`rounded-2xl border border-border bg-background/70 ${demoDayMode ? "p-5" : "p-4"}`}>
                  <p className={`${demoDayMode ? "text-base" : "text-sm"} font-semibold text-foreground`}>Trigger: {lane.trigger}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs font-medium text-[var(--forest-canopy)]/70">
                    <Gauge className="h-3.5 w-3.5" />
                    <span>Recovery path activated</span>
                  </div>
                  <p className={`mt-2 text-foreground/80 ${demoDayMode ? "text-base" : "text-sm"}`}>{lane.response}</p>
                  <a
                    href={lane.link}
                    className="mt-2 inline-block text-xs font-semibold text-[var(--forest-canopy)] hover:text-[var(--forest-light)]"
                  >
                    Cross-link: {lane.linkLabel} {"->"}
                  </a>
                </div>
              ))}
              <a
                href="#system-map"
                className="inline-block text-sm font-semibold text-[var(--forest-canopy)] hover:text-[var(--forest-light)]"
              >
                Return to canonical system map {"->"}
              </a>
            </CardContent>
          </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
