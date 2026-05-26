"use client";

import { motion } from "framer-motion";
import { Smartphone, Monitor, WifiOff, MapPin, Camera, CheckCircle } from "lucide-react";
import Image from "next/image";

export function Products() {
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
              An offline app for producers and field teams
            </h3>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Designed for low-connectivity environments. Icon-led flows, low-literacy assumptions, and no requirement for uninterrupted connectivity. Create usable origin proof directly from the farm.
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
              <div className="p-6 bg-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-lg font-bold text-gray-900">Compliance Overview</div>
                    <div className="text-sm text-gray-500">Kaffa Cooperative • 247 producers</div>
                  </div>
                  <div className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
                    87% Ready
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-emerald-700">214</div>
                    <div className="text-xs text-emerald-600">Verified</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-amber-700">28</div>
                    <div className="text-xs text-amber-600">Pending</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-700">5</div>
                    <div className="text-xs text-red-600">Action needed</div>
                  </div>
                </div>
                
                {/* Producer List Preview */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Recent Activity</div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[
                      { name: "Maria Santos", status: "Verified", color: "emerald" },
                      { name: "Jean Baptiste", status: "Verified", color: "emerald" },
                      { name: "Amara Diallo", status: "Pending", color: "amber" },
                    ].map((producer, i) => (
                      <div key={i} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            {producer.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm text-gray-700">{producer.name}</span>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          producer.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {producer.status}
                        </span>
                      </div>
                    ))}
                  </div>
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
              A dashboard for cooperatives, exporters, and buyers
            </h3>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              See what is ready, what is blocked, which shipments can be sealed, and which compliance issues need action. Your operational cockpit for turning field data into buyer-ready proof.
            </p>

            <div className="space-y-4">
              {[
                "Track readiness across all producers",
                "Identify missing evidence instantly",
                "Assemble DDS packages for shipment",
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-4">
                  <CheckCircle className="w-5 h-5 text-[var(--data-emerald)] flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
