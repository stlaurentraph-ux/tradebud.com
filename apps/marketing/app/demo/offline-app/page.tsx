import Link from "next/link";
import { DEMO_LINKS } from "@/lib/demo-links";

export default function OfflineAppDemoPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-emerald-950">
      <div className="container mx-auto max-w-3xl px-4 py-12 lg:px-8">
        <Link href="/demo" className="text-sm font-medium text-emerald-800 hover:text-emerald-900">
          Back to Demo Hub
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Offline App Demo</h1>
        <p className="mt-3 text-sm text-emerald-900/80 sm:text-base">
          Permanent visitor demo of the field app experience for farmer onboarding,
          perimeter capture, and offline-first compliance workflows.
        </p>
        <div className="mt-6">
          <a
            href={DEMO_LINKS.offlineApp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Open Offline App Demo
          </a>
        </div>
      </div>
    </main>
  );
}

