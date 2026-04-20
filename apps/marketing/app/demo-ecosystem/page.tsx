import type { Metadata } from "next";

import { DemoEcosystemView } from "@/components/tracebud/demo-ecosystem-view";

export const metadata: Metadata = {
  title: "Tracebud Demo Atlas",
  description: "Standalone ecosystem diagrams for Tracebud demo walkthroughs.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DemoEcosystemPage() {
  return <DemoEcosystemView />;
}
