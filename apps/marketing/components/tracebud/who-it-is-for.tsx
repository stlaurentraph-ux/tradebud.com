"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Sprout, Building2, Ship, ShoppingBag } from "lucide-react";

export function WhoItIsFor() {
  const t = useTranslations("marketing");

  const personas = [
    { 
      keyPrefix: "whoItIsForSection.personas.producers",
      icon: Sprout,
      color: "bg-emerald-50",
      iconColor: "text-emerald-600",
      borderColor: "hover:border-emerald-300",
    },
    { 
      keyPrefix: "whoItIsForSection.personas.cooperatives",
      icon: Building2,
      color: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "hover:border-blue-300",
    },
    { 
      keyPrefix: "whoItIsForSection.personas.exporters",
      icon: Ship,
      color: "bg-amber-50",
      iconColor: "text-amber-600",
      borderColor: "hover:border-amber-300",
    },
    { 
      keyPrefix: "whoItIsForSection.personas.buyers",
      icon: ShoppingBag,
      color: "bg-purple-50",
      iconColor: "text-purple-600",
      borderColor: "hover:border-purple-300",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23064E3B' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-semibold text-[var(--data-emerald)] tracking-wide uppercase mb-4">
            Built for everyone in the chain
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-6 text-balance leading-[1.1]">
            {t("whoItIsForSection.headline")}
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            {t("whoItIsForSection.description")}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {personas.map((persona, index) => (
            <motion.div
              key={persona.keyPrefix}
              className={`group relative p-8 rounded-3xl bg-white border-2 border-gray-100 ${persona.borderColor} transition-all duration-300 hover:shadow-xl`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl ${persona.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <persona.icon className={`w-8 h-8 ${persona.iconColor}`} />
              </div>
              
              <h3 className="text-xl font-bold text-[var(--forest-canopy)] mb-3">
                {t(`${persona.keyPrefix}.title`)}
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                {t(`${persona.keyPrefix}.description`)}
              </p>
              
              {/* Decorative corner */}
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
