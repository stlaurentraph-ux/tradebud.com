"use client";

import { motion } from "framer-motion";
import {
  Building2,
  GitBranch,
  ShieldCheck,
  Share2,
  UsersRound,
  Wallet,
} from "lucide-react";

const pillars = [
  {
    icon: Building2,
    title: "One platform, many organizations",
    body: "Cooperatives, exporters, and importers each operate as their own tenant with strict data isolation. Users can belong to more than one organization and switch active context per session.",
  },
  {
    icon: Share2,
    title: "Multi-directional network",
    body: "Tracebud is not a single ladder from farm to port. Brands, cooperatives, exporters, and farmers can each enter independently—requests, shipments, and mapping jobs can start from wherever you sit in the chain.",
  },
  {
    icon: Wallet,
    title: "Request–grant & data sovereignty",
    body: "Farmers keep a self-sovereign profile: they can grant or revoke access to verified plots and GeoIDs. Open DPI such as AgStack helps avoid vendor lock-in and keeps interoperability in farmers’ hands.",
  },
  {
    icon: UsersRound,
    title: "Delegated administration",
    body: "Each organization invites its own staff, assigns tenant-scoped roles, and runs its workspace—without waiting on central IT for every permission change.",
  },
];

export function NetworkSovereignty() {
  return (
    <section
      id="platform-architecture"
      className="py-24 md:py-32 px-6 bg-gradient-to-b from-muted/40 to-background border-y border-border"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-14 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--data-emerald)]/15 text-[var(--forest-canopy)] px-4 py-1.5 text-sm font-semibold mb-6 border border-[var(--data-emerald)]/25">
            <GitBranch className="w-4 h-4" />
            Platform architecture
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-5 tracking-tight text-balance">
            Built as an open network—not a single fixed chain
          </h2>
          <p className="text-foreground/80 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            EUDR compliance needs traceability, but real supply chains branch, backtrack, and restart from cooperatives or brands.
            Tracebud is designed as unified multi-tenant SaaS with peer-style workflows and farmer-controlled sharing.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
          {pillars.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm hover:border-[var(--data-emerald)]/40 hover:shadow-md transition-all"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--data-emerald)]/15 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-[var(--forest-canopy)]" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{item.body}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="mt-12 md:mt-16 flex flex-col sm:flex-row items-center justify-center gap-3 rounded-2xl bg-[var(--forest-canopy)] text-white px-6 py-5 md:py-6"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <ShieldCheck className="w-8 h-8 text-[var(--data-emerald)] shrink-0" />
          <p className="text-center sm:text-left text-sm md:text-base text-white/90 max-w-2xl leading-relaxed">
            <span className="font-semibold text-white">Tenant-scoped RBAC</span> evaluates every action in the context of the
            active organization—so permissions stay consistent when people wear more than one hat across the network.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
