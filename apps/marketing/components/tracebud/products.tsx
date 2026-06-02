"use client";

import { motion } from "framer-motion";
import { Smartphone, Monitor, WifiOff, MapPin, Camera, CheckCircle, Upload, Send, GitBranch, Eye, Package, Wifi, Users, Lock, FileText, Database } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function Products() {
  const t = useTranslations("marketing");
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-medium text-[var(--data-emerald)] tracking-wide uppercase mb-4">
            Two products, one workflow
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-6">
            Built for how supply chains actually work
          </h2>
        </motion.div>

        {/* The App */}
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
              <span className="text-sm font-semibold text-[var(--data-emerald)] uppercase tracking-wide">Mobile App</span>
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold text-[var(--forest-canopy)] mb-4">
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
                { icon: WifiOff, text: "Works offline, syncs when connectivity returns" },
                { icon: MapPin, text: "Walk the boundary to capture GPS polygon" },
                { icon: Camera, text: "Photo evidence and consent recording" },
              ].map((feature, index) => (
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

        {/* The Dashboard */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Dashboard Mockup UI */}
            <div className="relative w-full bg-gray-50 rounded-xl border border-gray-200 shadow-2xl overflow-hidden">
              {/* Browser Chrome */}
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
              
              {/* Dashboard Content */}
              <div className="p-4 bg-white">
                {/* Header with Import Button */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-bold text-gray-900">Network Management</div>
                    <div className="text-xs text-gray-500">Kaffa Cooperative • 247 contacts</div>
                  </div>
                  <button className="bg-[var(--forest-canopy)] text-white text-[10px] font-semibold px-2 py-1.5 rounded-md flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    Import CSV
                  </button>
                </div>
                
                {/* Stats Grid - Readiness Tracking */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-emerald-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-emerald-700">214</div>
                    <div className="text-[9px] text-emerald-600">Ready</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-amber-700">28</div>
                    <div className="text-[9px] text-amber-600">Pending</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-red-700">5</div>
                    <div className="text-[9px] text-red-600">Missing data</div>
                  </div>
                </div>
                
                {/* Bulk Action Bar */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <input type="checkbox" className="rounded border-gray-300 w-3 h-3" defaultChecked readOnly />
                    <span className="text-[10px] text-blue-800 font-medium">48 selected</span>
                  </div>
                  <button className="bg-blue-600 text-white text-[9px] font-semibold px-2 py-1 rounded flex items-center gap-1">
                    <Send className="w-2.5 h-2.5" />
                    Bulk Request
                  </button>
                </div>
                
                {/* Contact List with Forward Chain */}
                <div className="border border-gray-200 rounded-md overflow-hidden mb-4">
                  <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
                    <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-wide">Network</div>
                    <div className="flex items-center gap-1 text-[9px] text-gray-500">
                      <GitBranch className="w-2.5 h-2.5" />
                      <span>Cascades to source</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[
                      { name: "Sidama Coop", type: "Cooperative", forwards: "→ 89 producers", color: "blue" },
                      { name: "Ethiopia Export", type: "Exporter", forwards: "→ 3 coops", color: "purple" },
                    ].map((contact, i) => (
                      <div key={i} className="px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded border-gray-300 w-3 h-3" defaultChecked readOnly />
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-medium text-gray-600">
                            {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-[11px] text-gray-700 font-medium">{contact.name}</div>
                            <div className="text-[9px] text-gray-400">{contact.type}</div>
                          </div>
                        </div>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                          contact.color === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {contact.forwards}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* DDS Package Assembly */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <span className="text-[11px] font-semibold text-emerald-800">Shipment #2847</span>
                    </div>
                    <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full">Ready to seal</span>
                  </div>
                  <div className="h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94%' }} />
                  </div>
                  <div className="text-[9px] text-emerald-600 mt-1">94% complete • 2 items pending</div>
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
              <span className="text-sm font-semibold text-[var(--forest-canopy)] uppercase tracking-wide">Dashboard</span>
            </div>
            
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
                { icon: Package, text: "Assemble DDS packages for shipment" },
              ].map((feature, index) => (
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

        {/* Built for Real Operations */}
        <div className="mt-32 pt-20 border-t border-gray-200">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Image */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/gis-geolocation.jpg"
                  alt="Aerial view of large farm with multiple fields surrounded by jungle"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-canopy)]/30 via-transparent to-transparent" />
              </div>
              
              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--data-emerald)]/10 flex items-center justify-center">
                    <Wifi className="w-5 h-5 text-[var(--data-emerald)]" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[var(--forest-canopy)]">100%</div>
                    <div className="text-xs text-gray-500">Offline capable</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm font-semibold text-[var(--data-emerald)] tracking-wide uppercase mb-4">
                Real-world ready
              </p>
              <h3 className="text-2xl md:text-3xl font-bold text-[var(--forest-canopy)] mb-4">
                {t("builtForRealitiesSection.headline")}
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                {t("builtForRealitiesSection.description")}
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: Wifi, keyPrefix: "builtForRealitiesSection.features.offline" },
                  { icon: Users, keyPrefix: "builtForRealitiesSection.features.roleBasedAccess" },
                  { icon: Lock, keyPrefix: "builtForRealitiesSection.features.consentBased" },
                  { icon: FileText, keyPrefix: "builtForRealitiesSection.features.auditLogs" },
                  { icon: Database, keyPrefix: "builtForRealitiesSection.features.reusableData" },
                  { icon: Upload, keyPrefix: "builtForRealitiesSection.features.csvUpload" },
                ].map((feature) => (
                  <div key={feature.keyPrefix} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--warm-stone)] flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 text-[var(--forest-canopy)]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--forest-canopy)]">
                        {t(`${feature.keyPrefix}.title`)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t(`${feature.keyPrefix}.description`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
