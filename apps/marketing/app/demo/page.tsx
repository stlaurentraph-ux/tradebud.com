import Link from "next/link";
import { DEMO_LINKS } from "@/lib/demo-links";

const demos = [
  {
    slug: "offline-app",
    title: "Offline App Demo",
    description:
      "Walk-through of the field workflow for plot mapping, harvest logging, and compliance capture.",
    href: DEMO_LINKS.offlineApp,
  },
  {
    slug: "exporter-dashboard",
    title: "Exporter Dashboard Demo",
    description:
      "Showcase of package operations, compliance checks, and exporter-side traceability workflows.",
    href: DEMO_LINKS.exporterDashboard,
  },
  {
    slug: "importer-dashboard",
    title: "Importer Dashboard Demo",
    description:
      "Preview of buyer/importer-side verification, risk checks, and sourcing transparency views.",
    href: DEMO_LINKS.importerDashboard,
  },
];

export default function DemoHubPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-emerald-950">
      <div className="container mx-auto max-w-5xl px-4 py-12 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Tracebud Demo Hub
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-emerald-900/80 sm:text-base">
          Explore permanent public demos. These environments are separate from product
          deployments and stay available for visitors.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {demos.map((demo) => (
            <article
              key={demo.slug}
              className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold">{demo.title}</h2>
              <p className="mt-2 text-sm text-emerald-900/80">{demo.description}</p>
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={`/demo/${demo.slug}`}
                  className="text-sm font-semibold text-emerald-800 hover:text-emerald-900"
                >
                  Demo details
                </Link>
                <a
                  href={demo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  Open demo
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

