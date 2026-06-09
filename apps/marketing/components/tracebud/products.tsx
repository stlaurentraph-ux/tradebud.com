"use client";

import { motion } from "framer-motion";
import { Smartphone, Monitor, WifiOff, MapPin, Camera, CheckCircle, Upload, Send, GitBranch, Eye, Package } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function Products() {
<<<<<<< HEAD
  const t = useTranslations("marketing");
=======
  const t = useTranslations("marketing.productsSection");
  const preview = useTranslations("marketing.productsSection.dashboardPreview");

  const mobileFeatures = [
    { icon: CheckCircle, text: t("mobileApp.features.free") },
    { icon: WifiOff, text: t("mobileApp.features.offline") },
    { icon: MapPin, text: t("mobileApp.features.gps") },
    { icon: Camera, text: t("mobileApp.features.photo") },
  ];

  const dashboardFeatures = [
    { icon: Upload, text: t("dashboard.features.import") },
    { icon: Send, text: t("dashboard.features.bulkRequest") },
    { icon: GitBranch, text: t("dashboard.features.cascade") },
    { icon: Eye, text: t("dashboard.features.readiness") },
    { icon: CheckCircle, text: t("dashboard.features.evidence") },
    { icon: Package, text: t("dashboard.features.dds") },
  ];

>>>>>>> 9ee0440373a9b3b88b4c628aecea1e7fbed04893
  return (
    <section id="products" className="scroll-mt-20 py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-medium text-[var(--data-emerald)] tracking-wide uppercase mb-4">
<<<<<<< HEAD
            {t("productsSection.headline")}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-4">
            {t("productsSection.intro")}
=======
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-6">
            {t("title")}
>>>>>>> 9ee0440373a9b3b88b4c628aecea1e7fbed04893
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t("intro")}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-32">
          <motion.div
            className="order-2 lg:order-1"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--data-emerald)]/10 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-[var(--data-emerald)]" />
              </div>
              <span className="text-sm font-semibold text-[var(--data-emerald)] uppercase tracking-wide">
                {t("mobileApp.label")}
              </span>
            </div>

            <h3 className="text-2xl md:text-3xl font-bold text-[var(--forest-canopy)] mb-4">
<<<<<<< HEAD
              {t("productsSection.mobileApp.headline")}
            </h3>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              {t("productsSection.mobileApp.description")}
            </p>
            
            <p className="text-sm text-[var(--data-emerald)] font-medium mb-8">
              {t("productsSection.mobileApp.supportingText")}
            </p>

            <div className="space-y-4">
              {[
                { icon: CheckCircle, text: "Free for producers. No training-heavy setup." },
                { icon: WifiOff, text: "Works offline, syncs when connectivity returns." },
                { icon: MapPin, text: "Walk the boundary to capture GPS polygons." },
                { icon: Camera, text: "Photo evidence and consent recording." },
              ].map((feature, index) => (
=======
              {t("mobileApp.headline")}
            </h3>

            <p className="text-lg text-gray-600 leading-relaxed mb-8">{t("mobileApp.description")}</p>

            <div className="space-y-4">
              {mobileFeatures.map((feature, index) => (
>>>>>>> 9ee0440373a9b3b88b4c628aecea1e7fbed04893
                <div key={index} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--warm-stone)] flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-[var(--forest-canopy)]" />
                  </div>
                  <span className="text-gray-700">{feature.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="order-1 lg:order-2"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative w-[280px] mx-auto">
              <Image
                src="/images/farmer-app-homepage.png"
                alt="Tracebud Farmer App"
                width={320}
                height={693}
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative w-full bg-gray-50 rounded-xl border border-gray-200 shadow-2xl overflow-hidden">
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-md px-3 py-1.5 text-xs text-gray-500 border border-gray-200">
                    dashboard.tracebud.com
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-bold text-gray-900">{preview("networkTitle")}</div>
                    <div className="text-xs text-gray-500">{preview("networkSubtitle")}</div>
                  </div>
                  <button type="button" className="bg-[var(--forest-canopy)] text-white text-[10px] font-semibold px-2 py-1.5 rounded-md flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    {preview("importCsv")}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-emerald-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-emerald-700">214</div>
                    <div className="text-[9px] text-emerald-600">{preview("ready")}</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-amber-700">28</div>
                    <div className="text-[9px] text-amber-600">{preview("pending")}</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-red-700">5</div>
                    <div className="text-[9px] text-red-600">{preview("missingData")}</div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <input type="checkbox" className="rounded border-gray-300 w-3 h-3" defaultChecked readOnly />
                    <span className="text-[10px] text-blue-800 font-medium">{preview("selected")}</span>
                  </div>
                  <button type="button" className="bg-blue-600 text-white text-[9px] font-semibold px-2 py-1 rounded flex items-center gap-1">
                    <Send className="w-2.5 h-2.5" />
                    {preview("bulkRequest")}
                  </button>
                </div>

                <div className="border border-gray-200 rounded-md overflow-hidden mb-4">
                  <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
                    <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-wide">{preview("networkLabel")}</div>
                    <div className="flex items-center gap-1 text-[9px] text-gray-500">
                      <GitBranch className="w-2.5 h-2.5" />
                      <span>{preview("cascadesToSource")}</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[
                      { name: "Sidama Coop", type: preview("cooperative"), forwards: preview("forwardsProducers"), color: "blue" },
                      { name: "Ethiopia Export", type: preview("exporter"), forwards: preview("forwardsCoops"), color: "purple" },
                    ].map((contact, i) => (
                      <div key={i} className="px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded border-gray-300 w-3 h-3" defaultChecked readOnly />
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-medium text-gray-600">
                            {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-[11px] text-gray-700 font-medium">{contact.name}</div>
                            <div className="text-[9px] text-gray-400">{contact.type}</div>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                            contact.color === "blue" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {contact.forwards}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <span className="text-[11px] font-semibold text-emerald-800">{preview("shipmentLabel")}</span>
                    </div>
                    <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full">{preview("readyToSeal")}</span>
                  </div>
                  <div className="h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "94%" }} />
                  </div>
                  <div className="text-[9px] text-emerald-600 mt-1">{preview("completion")}</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--forest-canopy)]/10 flex items-center justify-center">
                <Monitor className="w-6 h-6 text-[var(--forest-canopy)]" />
              </div>
              <span className="text-sm font-semibold text-[var(--forest-canopy)] uppercase tracking-wide">
                {t("dashboard.label")}
              </span>
            </div>
<<<<<<< HEAD
            
            <h3 className="text-2xl md:text-3xl font-bold text-[var(--forest-canopy)] mb-4">
              {t("productsSection.dashboard.headline")}
            </h3>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              {t("productsSection.dashboard.description")}
            </p>
            
            <p className="text-sm text-[var(--data-emerald)] font-medium mb-8">
              {t("productsSection.dashboard.supportingText")}
            </p>

            <div className="space-y-4">
              {[
                { icon: Upload, text: "Bulk import contacts via CSV upload" },
                { icon: Send, text: "Send requests to hundreds of contacts at once" },
                { icon: GitBranch, text: "Requests cascade through your network to source" },
                { icon: Eye, text: "Track readiness across all network members" },
                { icon: CheckCircle, text: "Identify missing evidence instantly" },
                { icon: Package, text: "Assemble shipment-ready compliance records." },
              ].map((feature, index) => (
=======

            <h3 className="text-2xl md:text-3xl font-bold text-[var(--forest-canopy)] mb-4">{t("dashboard.headline")}</h3>

            <p className="text-lg text-gray-600 leading-relaxed mb-8">{t("dashboard.description")}</p>

            <div className="space-y-4">
              {dashboardFeatures.map((feature, index) => (
>>>>>>> 9ee0440373a9b3b88b4c628aecea1e7fbed04893
                <div key={index} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--warm-stone)] flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-[var(--forest-canopy)]" />
                  </div>
                  <span className="text-gray-700">{feature.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
