"use client";

import { Camera, FileCheck, Hand, Leaf, MapPin, QrCode, Satellite, Scale, Shield, WifiOff } from "lucide-react";

function Feature({
  icon,
  title,
  description,
  tag,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="mb-1 flex items-center gap-2">
          <p className="text-sm font-semibold text-stone-900">{title}</p>
          <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-700">{tag}</span>
        </div>
        <p className="text-xs leading-relaxed text-stone-600">{description}</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 text-center">
          <div className="mb-2 inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg">
              <Leaf className="h-7 w-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold text-emerald-900">Tracebud</h1>
              <p className="text-sm font-medium text-emerald-600">Farmer Field App</p>
            </div>
          </div>
          <p className="text-stone-600">Interactive Prototype - EUDR Compliance Made Simple</p>
        </header>

        <section className="flex flex-col items-start justify-center gap-8 xl:flex-row">
          <div className="mx-auto w-[340px] shrink-0">
            <div className="rounded-[3rem] bg-gradient-to-b from-slate-800 to-slate-900 p-3 shadow-2xl">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950">
                <div className="absolute left-1/2 top-2 z-20 h-7 w-28 -translate-x-1/2 rounded-full bg-black" />
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini_Generated_Image_ovl863ovl863ovl8.png-c53xqJEY3Dl9bxyOVl3m0cSYyKnxof.jpeg"
                  alt="Tracebud field app screen"
                  className="h-[690px] w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="w-full max-w-lg">
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xl">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <Shield className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">EUDR Compliance Features</h2>
                  <p className="text-sm text-stone-500">Everything farmers need for EU market access</p>
                </div>
              </div>

              <div className="space-y-3">
                <Feature
                  icon={<Satellite className="h-5 w-5 text-emerald-600" />}
                  title="Adaptive GPS Mapping"
                  tag="GNSS"
                  description="Waypoint averaging handles tropical canopy interference. 60-120 second averaging at each vertex filters multipath errors."
                />
                <Feature
                  icon={<Camera className="h-5 w-5 text-amber-600" />}
                  title="Ground-Truth Photo Vault"
                  tag="Verification"
                  description="360-degree timestamped photos override satellite false-positives during EU audits. Proves pruning vs deforestation."
                />
                <Feature
                  icon={<FileCheck className="h-5 w-5 text-blue-600" />}
                  title="Land Tenure Support"
                  tag="Legality"
                  description="OCR for Clave Catastral. Supports Productor en Posesion declarations for informal smallholders."
                />
                <Feature
                  icon={<Hand className="h-5 w-5 text-purple-600" />}
                  title="FPIC & Labor Compliance"
                  tag="Human Rights"
                  description="Digital repository for community assembly minutes, social agreements, and ILO labor standard attestations."
                />
                <Feature
                  icon={<Scale className="h-5 w-5 text-rose-600" />}
                  title="Yield Cap Validation"
                  tag="Anti-Fraud"
                  description="Cross-references harvest weight against polygon carrying capacity. Flags transactions exceeding 1,500kg/ha."
                />
                <Feature
                  icon={<QrCode className="h-5 w-5 text-teal-600" />}
                  title="Digital Compliance Receipt"
                  tag="Traceability"
                  description="QR-based proof of compliance portable to any buyer. Full traceability from plot to port."
                />
              </div>

              <div className="mt-6 border-t border-stone-200 pt-5">
                <div className="mb-3 flex items-center gap-2">
                  <WifiOff className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-semibold text-stone-900">100% Offline Capable</p>
                    <p className="text-sm text-stone-500">Sync when connectivity returns</p>
                  </div>
                </div>
                <p className="mb-4 text-sm text-stone-600">
                  Click through the app to explore all screens and farmer workflows.
                </p>
                <a
                  href="https://exporter-demo.tracebud.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl bg-emerald-600 py-3.5 text-center font-semibold text-white shadow-lg shadow-emerald-200 transition-colors hover:bg-emerald-700"
                >
                  Request Full Demo
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
