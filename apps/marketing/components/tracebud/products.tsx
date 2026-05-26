"use client";

import { motion } from "framer-motion";
import { Smartphone, Monitor, WifiOff, MapPin, Camera, CheckCircle, Upload, Send, GitBranch } from "lucide-react";
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
                {/* Header with Import Button */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-lg font-bold text-gray-900">Network Management</div>
                    <div className="text-sm text-gray-500">Kaffa Cooperative • 247 contacts</div>
                  </div>
                  <button className="bg-[var(--forest-canopy)] text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Import CSV
                  </button>
                </div>
                
                {/* Bulk Action Bar */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked readOnly />
                    <span className="text-sm text-blue-800 font-medium">48 contacts selected</span>
                  </div>
                  <button className="bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5">
                    <Send className="w-3 h-3" />
                    Send Bulk Request
                  </button>
                </div>
                
                {/* Contact List with Forward Chain */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Your Network</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <GitBranch className="w-3 h-3" />
                      <span>Requests cascade to source</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[
                      { name: "Sidama Cooperative", type: "Cooperative", forwards: "→ 89 producers", color: "blue" },
                      { name: "Ethiopia Export Co.", type: "Exporter", forwards: "→ 3 cooperatives", color: "purple" },
                      { name: "Maria Santos", type: "Producer", forwards: "Direct", color: "emerald" },
                    ].map((contact, i) => (
                      <div key={i} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="rounded border-gray-300" defaultChecked={i < 2} readOnly />
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm text-gray-700 font-medium">{contact.name}</div>
                            <div className="text-xs text-gray-400">{contact.type}</div>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          contact.color === 'blue' ? 'bg-blue-100 text-blue-700' : 
                          contact.color === 'purple' ? 'bg-purple-100 text-purple-700' : 
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {contact.forwards}
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
              Upload your entire network in bulk—producers, cooperatives, exporters. Send compliance requests to hundreds of contacts at once. They forward requests down their chain until proof reaches the source.
            </p>

            <div className="space-y-4">
              {[
                { icon: Upload, text: "Bulk import contacts via CSV upload" },
                { icon: Send, text: "Send requests to hundreds of contacts at once" },
                { icon: GitBranch, text: "Requests cascade through your network to source" },
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
      </div>
    </section>
  );
}
