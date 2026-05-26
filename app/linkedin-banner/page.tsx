"use client";

import {
  Shield,
  CheckCircle,
  BarChart3,
  Users,
  Smartphone,
  ClipboardCheck,
  Share2,
} from "lucide-react";

export default function LinkedInBanner() {
  return (
    <div className="min-h-screen bg-neutral-800 flex flex-col items-center justify-center p-8">
      <p className="text-white/70 text-sm mb-4">
        LinkedIn Company Banner (1128 x 191px) - Right-click to save or screenshot
      </p>
      
      {/* LinkedIn Banner - 1128x191 */}
      <div
        className="relative overflow-hidden"
        style={{ 
          width: 1128, 
          height: 191,
          backgroundColor: '#f8f6f1'
        }}
      >
        {/* Subtle dot pattern background */}
        <div className="absolute inset-0 opacity-[0.06]">
          <svg viewBox="0 0 1128 191" className="w-full h-full">
            <defs>
              <pattern id="dots" patternUnits="userSpaceOnUse" width="20" height="20">
                <circle cx="10" cy="10" r="1" fill="#064E3B" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Decorative leaf element bottom left - in the "danger zone" */}
        <div className="absolute bottom-0 left-0 w-44 h-36 opacity-25">
          <svg viewBox="0 0 176 144" className="w-full h-full">
            <path
              d="M20,144 Q50,90 100,60 Q140,35 160,15 Q130,60 100,90 Q70,115 40,130 Q25,140 20,144"
              fill="#10B981"
              opacity="0.5"
            />
            <path
              d="M0,144 Q40,95 90,65 Q130,40 150,20 Q120,65 85,95 Q45,125 0,144"
              fill="#064E3B"
              opacity="0.4"
            />
          </svg>
        </div>

        {/* Main content - pushed right to avoid profile picture overlap (~180px safe zone) */}
        <div className="relative h-full flex">
          {/* Left side - Logo and main message */}
          <div className="flex flex-col justify-center pl-48 pr-4 py-3" style={{ width: 440 }}>
            {/* Logo and brand */}
            <div className="flex items-center gap-2.5 mb-1.5">
              {/* Logo SVG inline */}
              <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
                <path d="M50 5C30 5 15 25 15 45C15 55 20 65 25 72L50 95L75 72C80 65 85 55 85 45C85 25 70 5 50 5Z" fill="#065F46"/>
                <path d="M35 30C35 30 45 25 55 30C65 35 70 45 65 55C60 65 50 70 40 65C30 60 25 50 30 40C33 33 35 30 35 30Z" fill="#10B981"/>
                <path d="M40 35C40 35 50 38 55 48C60 58 55 65 50 68" stroke="#065F46" strokeWidth="3" fill="none"/>
              </svg>
              <span style={{ color: '#064E3B', fontWeight: 700, fontSize: 18 }}>
                Tracebud
              </span>
            </div>

            {/* Main headline */}
            <h1 style={{ color: '#064E3B', fontWeight: 700, fontSize: 20, lineHeight: 1.15, marginBottom: 2 }}>
              Simple traceability
              <br />
              for the whole{" "}
              <span style={{ color: '#10B981' }}>supply chain.</span>
            </h1>

            {/* Subheadline */}
            <p style={{ color: 'rgba(6, 78, 59, 0.7)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#10B981">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              From origin to buyer, connected and verified.
            </p>

            {/* Feature icons */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(6, 78, 59, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield style={{ width: 13, height: 13, color: '#064E3B' }} />
                </div>
                <span style={{ fontSize: 7, color: 'rgba(6, 78, 59, 0.7)', marginTop: 2 }}>Build trust</span>
              </div>
              <div className="flex flex-col items-center">
                <div style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(6, 78, 59, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle style={{ width: 13, height: 13, color: '#064E3B' }} />
                </div>
                <span style={{ fontSize: 7, color: 'rgba(6, 78, 59, 0.7)', marginTop: 2 }}>Compliance</span>
              </div>
              <div className="flex flex-col items-center">
                <div style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(6, 78, 59, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 style={{ width: 13, height: 13, color: '#064E3B' }} />
                </div>
                <span style={{ fontSize: 7, color: 'rgba(6, 78, 59, 0.7)', marginTop: 2 }}>Efficiency</span>
              </div>
              <div className="flex flex-col items-center">
                <div style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(6, 78, 59, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users style={{ width: 13, height: 13, color: '#064E3B' }} />
                </div>
                <span style={{ fontSize: 7, color: 'rgba(6, 78, 59, 0.7)', marginTop: 2 }}>Empower</span>
              </div>
            </div>
          </div>

          {/* Right side - Supply chain visual */}
          <div className="flex-1 flex items-center justify-center relative pr-4">
            {/* Connecting dotted line */}
            <svg className="absolute" style={{ top: 22, left: 0, right: 20, height: 24 }} viewBox="0 0 480 24">
              <path
                d="M 20 12 Q 120 2 220 12 Q 320 22 400 12 Q 450 6 470 12"
                stroke="#10B981"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                fill="none"
              />
            </svg>

            {/* Supply chain stages */}
            <div className="flex items-end gap-1.5 relative z-10">
              {/* Stage 1: Farmer */}
              <div className="flex flex-col items-center">
                <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 3 }}>
                  <Smartphone style={{ width: 14, height: 14, color: '#10B981' }} />
                </div>
                <span style={{ fontSize: 7, color: 'rgba(6, 78, 59, 0.6)', marginBottom: 3 }}>Data captured</span>
                <div style={{ width: 72, height: 80, borderTopLeftRadius: 36, borderTopRightRadius: 36, background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))', border: '2px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.25)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users style={{ width: 24, height: 24, color: 'rgba(6, 78, 59, 0.5)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4, backgroundColor: '#064E3B', padding: '2px 8px', borderRadius: 999 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#10B981' }} />
                  </div>
                  <span style={{ fontSize: 7, color: 'white', fontWeight: 500 }}>Farmer</span>
                </div>
                <span style={{ fontSize: 6, color: 'rgba(6, 78, 59, 0.5)', marginTop: 2 }}>Grows with care</span>
              </div>

              {/* Stage 2: Cooperative */}
              <div className="flex flex-col items-center">
                <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 3 }}>
                  <ClipboardCheck style={{ width: 14, height: 14, color: '#10B981' }} />
                </div>
                <span style={{ fontSize: 7, color: 'rgba(6, 78, 59, 0.6)', marginBottom: 3 }}>Verified</span>
                <div style={{ width: 72, height: 80, borderTopLeftRadius: 36, borderTopRightRadius: 36, background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))', border: '2px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.25)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users style={{ width: 24, height: 24, color: 'rgba(6, 78, 59, 0.5)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4, backgroundColor: '#064E3B', padding: '2px 8px', borderRadius: 999 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'rgba(120, 53, 15, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#78350F' }} />
                  </div>
                  <span style={{ fontSize: 7, color: 'white', fontWeight: 500 }}>Cooperative</span>
                </div>
                <span style={{ fontSize: 6, color: 'rgba(6, 78, 59, 0.5)', marginTop: 2 }}>Organizes data</span>
              </div>

              {/* Stage 3: Exporter */}
              <div className="flex flex-col items-center">
                <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 3 }}>
                  <BarChart3 style={{ width: 14, height: 14, color: '#10B981' }} />
                </div>
                <span style={{ fontSize: 7, color: 'rgba(6, 78, 59, 0.6)', marginBottom: 3 }}>Consolidated</span>
                <div style={{ width: 72, height: 80, borderTopLeftRadius: 36, borderTopRightRadius: 36, background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))', border: '2px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.25)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users style={{ width: 24, height: 24, color: 'rgba(6, 78, 59, 0.5)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4, backgroundColor: '#064E3B', padding: '2px 8px', borderRadius: 999 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#10B981' }} />
                  </div>
                  <span style={{ fontSize: 7, color: 'white', fontWeight: 500 }}>Exporter</span>
                </div>
                <span style={{ fontSize: 6, color: 'rgba(6, 78, 59, 0.5)', marginTop: 2 }}>Prepares & ships</span>
              </div>

              {/* Stage 4: Buyer */}
              <div className="flex flex-col items-center">
                <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 3 }}>
                  <Share2 style={{ width: 14, height: 14, color: '#10B981' }} />
                </div>
                <span style={{ fontSize: 7, color: 'rgba(6, 78, 59, 0.6)', marginBottom: 3 }}>Shared</span>
                <div style={{ width: 72, height: 80, borderTopLeftRadius: 36, borderTopRightRadius: 36, background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))', border: '2px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.25)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users style={{ width: 24, height: 24, color: 'rgba(6, 78, 59, 0.5)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4, backgroundColor: '#064E3B', padding: '2px 8px', borderRadius: 999 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#10B981' }} />
                  </div>
                  <span style={{ fontSize: 7, color: 'white', fontWeight: 500 }}>Buyer</span>
                </div>
                <span style={{ fontSize: 6, color: 'rgba(6, 78, 59, 0.5)', marginTop: 2 }}>Buys confidently</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom tagline bar */}
        <div className="absolute" style={{ bottom: 0, right: 0, left: 180, height: 22, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.85) 20%, rgba(255,255,255,0.9))', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 12, gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#10B981">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span style={{ fontSize: 8, fontWeight: 600, color: '#064E3B' }}>
              Transparent. Responsible. Together.
            </span>
          </div>
          <div style={{ width: 1, height: 10, backgroundColor: 'rgba(6, 78, 59, 0.2)' }} />
          <span style={{ fontSize: 7, color: 'rgba(6, 78, 59, 0.6)' }}>
            Better for people. Better for the planet.
          </span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#10B981">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      </div>

      <p className="text-white/50 text-xs mt-4 max-w-lg text-center">
        The bottom-left corner (first ~180px) is kept clear for the profile picture overlap.
        <br />
        To export: Take a screenshot of just the banner or use browser dev tools to capture at exact dimensions.
      </p>
    </div>
  );
}
