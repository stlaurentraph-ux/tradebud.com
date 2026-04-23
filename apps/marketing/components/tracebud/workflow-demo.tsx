"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Upload,
  CheckCircle2,
  MapPin,
  Shield,
  Package,
  Send,
  ChevronRight,
  User,
  WifiOff,
  Home,
  TreeDeciduous,
  Scale,
  Settings,
  Clock,
  Globe,
  FileText,
} from "lucide-react";

const steps = [
  {
    id: 1,
    actor: "Importer",
    actorColor: "#3B82F6",
    title: "Sign Up & Access Dashboard",
    description: "Create your account in minutes. Your compliance command center awaits.",
    screen: "dashboard-empty",
  },
  {
    id: 2,
    actor: "Importer",
    actorColor: "#3B82F6",
    title: "Upload Suppliers & Send Requests",
    description: "Import your supplier CSV. Send templated EUDR compliance requests with one click.",
    screen: "csv-upload",
  },
  {
    id: 3,
    actor: "Exporter",
    actorColor: "#D97706",
    title: "Receive & Forward Upstream",
    description: "Request lands in your inbox. Review and forward to your cooperative partners.",
    screen: "inbox-exporter",
  },
  {
    id: 4,
    actor: "Cooperative",
    actorColor: "#059669",
    title: "Assign to Producers",
    description: "Break down the request. Assign evidence collection tasks to member farmers.",
    screen: "inbox-coop",
  },
  {
    id: 5,
    actor: "Producer",
    actorColor: "#064E3B",
    title: "Walk Plot & Capture Evidence",
    description: "Download the app (works offline). Walk your boundary to capture GPS polygon + photos.",
    screen: "mobile-app",
  },
  {
    id: 6,
    actor: "Cooperative",
    actorColor: "#059669",
    title: "Evidence Verified Automatically",
    description: "Evidence rolls up from all members. Satellite deforestation check runs automatically.",
    screen: "coop-dashboard",
  },
  {
    id: 7,
    actor: "Exporter",
    actorColor: "#D97706",
    title: "Package Ready to Ship",
    description: "Complete evidence chain with full audit trail. Identity-preserving batch ready.",
    screen: "exporter-dashboard",
  },
  {
    id: 8,
    actor: "Importer",
    actorColor: "#3B82F6",
    title: "EUDR Verified & Ready",
    description: "Full DDS package received. Complete chain verified. Submit to EU with confidence.",
    screen: "importer-verified",
  },
];

// Realistic mini sidebar matching actual dashboard
function MiniSidebar({ activeItem = "Dashboard" }: { activeItem?: string }) {
  const items = [
    { icon: Home, label: "Dashboard" },
    { icon: Package, label: "Packages" },
    { icon: Send, label: "Requests" },
    { icon: MapPin, label: "Plots" },
  ];

  return (
    <div className="w-12 bg-[#064E3B] flex flex-col items-center py-3 gap-1 flex-shrink-0">
      <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center mb-3">
        <span className="text-[#064E3B] font-bold text-[10px]">TB</span>
      </div>
      {items.map((item) => (
        <div
          key={item.label}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
            activeItem === item.label ? "bg-white/20" : ""
          }`}
        >
          <item.icon className={`w-3.5 h-3.5 ${activeItem === item.label ? "text-white" : "text-white/60"}`} />
        </div>
      ))}
    </div>
  );
}

// Desktop browser frame
function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200 w-full max-w-sm">
      {/* Browser chrome */}
      <div className="bg-gray-100 px-3 py-2 flex items-center gap-2 border-b border-gray-200">
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded px-2 py-0.5 text-[10px] text-gray-400 ml-2">
          app.tracebud.com
        </div>
      </div>
      <div className="flex h-[260px]">{children}</div>
    </div>
  );
}

// Phone frame matching the actual offline app
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-[180px] mx-auto">
      <div className="bg-slate-900 rounded-[2rem] p-1.5 shadow-xl">
        <div className="bg-slate-950 rounded-[1.75rem] overflow-hidden relative">
          {/* Dynamic Island */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-14 h-4 bg-black rounded-full z-20" />
          <div className="bg-stone-50 min-h-[340px] flex flex-col">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Screen: Empty Dashboard
function DashboardEmptyScreen() {
  return (
    <BrowserFrame>
      <MiniSidebar activeItem="Dashboard" />
      <div className="flex-1 p-3 bg-gray-50 overflow-hidden">
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-900">Welcome to Tracebud</p>
          <p className="text-[10px] text-gray-500">Start by adding your suppliers</p>
        </div>
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[10px] font-medium text-gray-700">No packages yet</p>
          <p className="text-[9px] text-gray-500 mt-0.5">Send your first request to get started</p>
          <button className="mt-2 px-3 py-1 bg-emerald-600 text-white text-[10px] font-medium rounded">
            Get Started
          </button>
        </div>
      </div>
    </BrowserFrame>
  );
}

// Screen: CSV Upload
function CsvUploadScreen() {
  return (
    <BrowserFrame>
      <MiniSidebar activeItem="Requests" />
      <div className="flex-1 p-3 bg-gray-50 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-900">Send Requests</p>
          <span className="text-[9px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">Step 1/2</span>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Upload className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-900">Import Suppliers</p>
              <p className="text-[9px] text-gray-500">Upload CSV with contacts</p>
            </div>
          </div>
          <div className="border-2 border-dashed border-emerald-200 rounded-lg p-3 text-center bg-emerald-50/50">
            <p className="text-[10px] text-gray-600">suppliers.csv</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">12 contacts ready</p>
          </div>
          <button className="mt-2 w-full px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-medium rounded flex items-center justify-center gap-1">
            <Send className="w-3 h-3" />
            Send Requests
          </button>
        </div>
      </div>
    </BrowserFrame>
  );
}

// Screen: Exporter Inbox
function InboxExporterScreen() {
  return (
    <BrowserFrame>
      <MiniSidebar activeItem="Requests" />
      <div className="flex-1 p-3 bg-gray-50 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-gray-900">Inbox</p>
            <p className="text-[9px] text-gray-500">1 new request</p>
          </div>
          <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-[9px] font-bold text-amber-600">1</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 border-l-4 border-l-amber-500">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-[9px] font-bold text-blue-600">EC</span>
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-900">EU Coffee Importers</p>
                <p className="text-[9px] text-gray-500">EUDR Compliance Request</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1 text-[9px] text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Due: 14 days</span>
            </div>
            <button className="px-2 py-1 bg-emerald-600 text-white text-[9px] font-medium rounded flex items-center gap-0.5">
              Forward <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

// Screen: Cooperative Inbox
function InboxCoopScreen() {
  return (
    <BrowserFrame>
      <MiniSidebar activeItem="Requests" />
      <div className="flex-1 p-3 bg-gray-50 overflow-hidden">
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-900">Assign to Producers</p>
          <p className="text-[9px] text-gray-500">Select members for this request</p>
        </div>
        <div className="space-y-1.5">
          {["Maria Santos", "Juan Garcia", "Rosa Mendez"].map((name, i) => (
            <div key={name} className="bg-white rounded-lg border border-gray-200 p-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <User className="w-3 h-3 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-gray-900">{name}</p>
                  <p className="text-[9px] text-gray-500">{3 - i} plots</p>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          ))}
        </div>
        <button className="mt-2 w-full px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-medium rounded">
          Send to 3 Producers
        </button>
      </div>
    </BrowserFrame>
  );
}

// Screen: Mobile App (Producer)
function MobileAppScreen() {
  return (
    <PhoneFrame>
      {/* Status bar */}
      <div className="bg-emerald-700 pt-6 pb-1 px-3 flex items-center justify-between">
        <span className="text-white text-[9px] font-medium">9:41</span>
        <div className="flex items-center gap-1 bg-amber-500/30 px-1.5 py-0.5 rounded-full">
          <WifiOff className="w-2.5 h-2.5 text-amber-300" />
          <span className="text-amber-300 text-[8px] font-semibold">Offline</span>
        </div>
      </div>
      {/* Header */}
      <div className="bg-emerald-700 px-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-3 h-3 text-white" />
          </div>
          <div>
            <p className="text-white text-[9px] font-semibold">Maria Santos</p>
            <p className="text-emerald-200 text-[8px]">Honduras</p>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 p-2.5 bg-stone-50">
        <div className="bg-white rounded-lg border border-gray-200 p-2 mb-2">
          <p className="text-[9px] font-semibold text-gray-900 mb-1">Recording Boundary</p>
          <div className="h-20 bg-emerald-50 rounded relative overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 160 80">
              <polygon
                points="20,60 50,15 110,20 140,55 100,70 40,68"
                fill="rgba(16, 185, 129, 0.2)"
                stroke="#10B981"
                strokeWidth="2"
              />
              {[[20,60], [50,15], [110,20], [140,55], [100,70], [40,68]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="4" fill="#10B981" />
              ))}
            </svg>
            <div className="absolute bottom-1 right-1 bg-emerald-600 text-white text-[7px] px-1 py-0.5 rounded font-medium">
              6 waypoints
            </div>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button className="flex-1 bg-red-500 text-white text-[9px] font-medium py-1.5 rounded-lg flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-white rounded-sm" />
            Stop
          </button>
          <button className="flex-1 bg-emerald-600 text-white text-[9px] font-medium py-1.5 rounded-lg">
            Add Photo
          </button>
        </div>
      </div>
      {/* Tab bar */}
      <div className="bg-white border-t border-gray-200 px-2 pb-4 pt-1.5">
        <div className="flex justify-around">
          {[
            { icon: Home, label: "Home", active: false },
            { icon: TreeDeciduous, label: "Plots", active: true },
            { icon: Scale, label: "Harvests", active: false },
            { icon: Settings, label: "Settings", active: false },
          ].map((tab) => (
            <div key={tab.label} className="flex flex-col items-center gap-0.5">
              <tab.icon className={`w-4 h-4 ${tab.active ? "text-emerald-600" : "text-gray-400"}`} />
              <span className={`text-[7px] ${tab.active ? "text-emerald-600 font-medium" : "text-gray-400"}`}>
                {tab.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

// Screen: Cooperative Dashboard (Verified)
function CoopDashboardScreen() {
  return (
    <BrowserFrame>
      <MiniSidebar activeItem="Dashboard" />
      <div className="flex-1 p-3 bg-gray-50 overflow-hidden">
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-900">Member Evidence</p>
          <p className="text-[9px] text-gray-500">All plots verified</p>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <p className="text-[9px] text-gray-500">Plots</p>
            <p className="text-base font-bold text-emerald-600">8/8</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <p className="text-[9px] text-gray-500">Deforestation</p>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-600">Clear</span>
            </div>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-semibold text-emerald-800">All Evidence Collected</span>
          </div>
          <p className="text-[9px] text-emerald-700">Ready to forward to exporter</p>
        </div>
      </div>
    </BrowserFrame>
  );
}

// Screen: Exporter Dashboard (Package Ready)
function ExporterDashboardScreen() {
  return (
    <BrowserFrame>
      <MiniSidebar activeItem="Packages" />
      <div className="flex-1 p-3 bg-gray-50 overflow-hidden">
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-900">DDS Package Ready</p>
          <p className="text-[9px] text-gray-500">Complete evidence compiled</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-gray-900">PKG-2024-0891</span>
            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-medium rounded">Sealed</span>
          </div>
          <div className="space-y-1 text-[9px] text-gray-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span>8 plots from Honduras</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-gray-400" />
              <span>Destination: Hamburg, DE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-gray-400" />
              <span>Audit trail attached</span>
            </div>
          </div>
          <button className="mt-2 w-full px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-medium rounded">
            Send to Importer
          </button>
        </div>
      </div>
    </BrowserFrame>
  );
}

// Screen: Importer Verified
function ImporterVerifiedScreen() {
  return (
    <BrowserFrame>
      <MiniSidebar activeItem="Packages" />
      <div className="flex-1 p-3 bg-gray-50 overflow-hidden">
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-900">EUDR Verified</p>
          <p className="text-[9px] text-gray-500">Ready for EU submission</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-3 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-[11px] font-semibold text-emerald-900">Compliance Verified</p>
          <p className="text-[9px] text-emerald-700 mt-0.5">All 8 plots deforestation-free</p>
          <div className="mt-2 flex gap-1.5">
            <button className="flex-1 px-2 py-1.5 bg-emerald-600 text-white text-[9px] font-medium rounded">
              Submit to TRACES
            </button>
            <button className="px-2 py-1.5 bg-white border border-gray-200 text-gray-700 text-[9px] font-medium rounded">
              Export
            </button>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

// Screen renderer
function ScreenContent({ screenType }: { screenType: string }) {
  switch (screenType) {
    case "dashboard-empty":
      return <DashboardEmptyScreen />;
    case "csv-upload":
      return <CsvUploadScreen />;
    case "inbox-exporter":
      return <InboxExporterScreen />;
    case "inbox-coop":
      return <InboxCoopScreen />;
    case "mobile-app":
      return <MobileAppScreen />;
    case "coop-dashboard":
      return <CoopDashboardScreen />;
    case "exporter-dashboard":
      return <ExporterDashboardScreen />;
    case "importer-verified":
      return <ImporterVerifiedScreen />;
    default:
      return <DashboardEmptyScreen />;
  }
}

// Individual workflow step
function WorkflowStep({ step, index }: { step: typeof steps[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.4, 1, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 1]);

  const isEven = index % 2 === 0;
  const isMobile = step.screen === "mobile-app";

  return (
    <motion.div
      ref={ref}
      style={{ opacity, scale }}
      className={`flex flex-col md:flex-row items-center gap-6 md:gap-12 py-12 md:py-20 ${
        isEven ? "md:flex-row" : "md:flex-row-reverse"
      }`}
    >
      {/* Text content */}
      <div className={`flex-1 max-w-md ${isEven ? "md:text-right" : "md:text-left"}`}>
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
            isEven ? "md:ml-auto" : ""
          }`}
          style={{ backgroundColor: `${step.actorColor}15`, color: step.actorColor }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: step.actorColor }} />
          {step.actor}
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-[var(--forest-canopy)] mb-2">{step.title}</h3>
        <p className="text-gray-600 leading-relaxed">{step.description}</p>
        <div className="mt-3 text-xs text-gray-400">Step {step.id} of {steps.length}</div>
      </div>

      {/* Timeline node (desktop) */}
      <div className="hidden md:flex flex-col items-center gap-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
          style={{ backgroundColor: step.actorColor }}
        >
          {step.id}
        </div>
        {index < steps.length - 1 && <div className="w-0.5 h-12 bg-gray-200" />}
      </div>

      {/* Screen mockup */}
      <div className={`flex-1 flex ${isEven ? "justify-start" : "justify-end"} ${isMobile ? "justify-center" : ""}`}>
        <ScreenContent screenType={step.screen} />
      </div>
    </motion.div>
  );
}

export function WorkflowDemo() {
  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="text-sm font-semibold tracking-widest uppercase mb-3 text-[var(--data-emerald)]">
            See It In Action
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--forest-canopy)] mb-4 text-balance">
            From Request to EUDR Verified
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Follow the complete journey as compliance requests cascade upstream—and verified evidence flows back.
          </p>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mb-8"
        >
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
            <span>Scroll to explore</span>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical line (desktop) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent -translate-x-1/2" />

          {steps.map((step, index) => (
            <WorkflowStep key={step.id} step={step} index={index} />
          ))}
        </div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12 pt-12 border-t border-gray-100"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--data-emerald)]/10 text-[var(--data-emerald)] font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Full traceability in 8 steps
          </div>
        </motion.div>
      </div>
    </section>
  );
}
