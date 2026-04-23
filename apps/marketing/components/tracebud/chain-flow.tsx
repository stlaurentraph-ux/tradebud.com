'use client'

import { motion } from 'framer-motion'

// Fixed 900x480 viewBox — more vertical room for arcs to breathe
// Nodes evenly spaced at x: 120, 360, 540, 780 (inner padding)
// Node center y: 240, radius: 44
// Data arrows (L→R) above nodes — adjacent at y-10, arcs curve up
// Request arrows (R→L) below nodes — adjacent at y+10, arcs curve down

const W = 900
const H = 480
const NODE_R = 44
const NODE_Y = 240

const nodes = [
  { x: 120, label: 'Producers' },
  { x: 360, label: 'Cooperatives' },
  { x: 600, label: 'Exporters' },
  { x: 780, label: 'Importers/Brands' },
]

// Edge positions (where arrows start/end — just outside circle)
const edge = (x: number, side: 'left' | 'right') =>
  side === 'left' ? x - NODE_R - 6 : x + NODE_R + 6

export function ChainFlow() {
  return (
    <section id="supply-chain" className="py-24 md:py-32 bg-white scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="text-sm font-semibold tracking-widest uppercase mb-3 text-[var(--data-emerald)]">
            Decentralized Compliance Network
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--forest-canopy)] mb-6 text-balance">
            Requests flow upstream. Evidence flows back.
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start from any point in your supply chain. Upload contacts, send a templated EUDR compliance request. It cascades upstream to the source. Evidence flows back to every downstream buyer—automatically through Tracebud.
          </p>
        </motion.div>

        {/* Desktop SVG diagram */}
        <motion.div 
          className="hidden md:block"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            <defs>
              {/* Solid arrowheads using Tracebud colors */}
              <marker id="arrG" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0,0 8,3 0,6" fill="var(--forest-canopy)" />
              </marker>
              <marker id="arrA" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0,0 8,3 0,6" fill="var(--data-emerald)" />
              </marker>
            </defs>

            {/* ========== DATA ARROWS — forest-canopy, LEFT → RIGHT, above nodes ========== */}

            {/* Adjacent: F→C, C→E, E→I — straight, slightly above centerline */}
            <line x1={edge(120,'right')} y1={NODE_Y - 10} x2={edge(360,'left')} y2={NODE_Y - 10}
                  stroke="var(--forest-canopy)" strokeWidth="2" markerEnd="url(#arrG)" />
            <line x1={edge(360,'right')} y1={NODE_Y - 10} x2={edge(600,'left')} y2={NODE_Y - 10}
                  stroke="var(--forest-canopy)" strokeWidth="2" markerEnd="url(#arrG)" />
            <line x1={edge(600,'right')} y1={NODE_Y - 10} x2={edge(780,'left')} y2={NODE_Y - 10}
                  stroke="var(--forest-canopy)" strokeWidth="2" markerEnd="url(#arrG)" />

            {/* Skip-1: F→E, C→I — arc up */}
            <path d={`M ${edge(120,'right')},${NODE_Y - 26} Q 360,90 ${edge(600,'left')},${NODE_Y - 26}`}
                  fill="none" stroke="var(--forest-canopy)" opacity="0.45" strokeWidth="1.5" markerEnd="url(#arrG)" />
            <path d={`M ${edge(360,'right')},${NODE_Y - 26} Q 570,90 ${edge(780,'left')},${NODE_Y - 26}`}
                  fill="none" stroke="var(--forest-canopy)" opacity="0.45" strokeWidth="1.5" markerEnd="url(#arrG)" />

            {/* Skip-2: F→I — widest arc above */}
            <path d={`M ${edge(120,'right')},${NODE_Y - 44} Q 450,30 ${edge(780,'left')},${NODE_Y - 44}`}
                  fill="none" stroke="var(--forest-canopy)" opacity="0.25" strokeWidth="1.5" markerEnd="url(#arrG)" />

            {/* ========== REQUEST ARROWS — data-emerald, RIGHT → LEFT, below nodes ========== */}

            {/* Adjacent: I→E, E→C, C→F — straight, slightly below centerline */}
            <line x1={edge(780,'left')} y1={NODE_Y + 10} x2={edge(600,'right')} y2={NODE_Y + 10}
                  stroke="var(--data-emerald)" strokeWidth="2" strokeDasharray="8,4" markerEnd="url(#arrA)" />
            <line x1={edge(600,'left')} y1={NODE_Y + 10} x2={edge(360,'right')} y2={NODE_Y + 10}
                  stroke="var(--data-emerald)" strokeWidth="2" strokeDasharray="8,4" markerEnd="url(#arrA)" />
            <line x1={edge(360,'left')} y1={NODE_Y + 10} x2={edge(120,'right')} y2={NODE_Y + 10}
                  stroke="var(--data-emerald)" strokeWidth="2" strokeDasharray="8,4" markerEnd="url(#arrA)" />

            {/* Skip-1: I→C, E→F — arc down */}
            <path d={`M ${edge(780,'left')},${NODE_Y + 26} Q 570,380 ${edge(360,'right')},${NODE_Y + 26}`}
                  fill="none" stroke="var(--data-emerald)" opacity="0.45" strokeWidth="1.5" strokeDasharray="8,4" markerEnd="url(#arrA)" />
            <path d={`M ${edge(600,'left')},${NODE_Y + 26} Q 360,380 ${edge(120,'right')},${NODE_Y + 26}`}
                  fill="none" stroke="var(--data-emerald)" opacity="0.45" strokeWidth="1.5" strokeDasharray="8,4" markerEnd="url(#arrA)" />

            {/* Skip-2: I→F — widest arc below */}
            <path d={`M ${edge(780,'left')},${NODE_Y + 44} Q 450,440 ${edge(120,'right')},${NODE_Y + 44}`}
                  fill="none" stroke="var(--data-emerald)" opacity="0.25" strokeWidth="1.5" strokeDasharray="8,4" markerEnd="url(#arrA)" />

            {/* ========== NODE CIRCLES + LABELS ========== */}
            {nodes.map((node) => (
              <g key={node.label}>
                <circle cx={node.x} cy={NODE_Y} r={NODE_R} fill="var(--forest-canopy)" />
                {/* + badge */}
                <circle cx={node.x + NODE_R * 0.72} cy={NODE_Y - NODE_R * 0.72} r={13} fill="var(--data-emerald)" />
                <text x={node.x + NODE_R * 0.72} y={NODE_Y - NODE_R * 0.72 + 5} textAnchor="middle" fill="white" fontSize="15" fontWeight="bold">+</text>
                {/* Label */}
                <text x={node.x} y={NODE_Y + NODE_R + 28} textAnchor="middle" fill="var(--forest-canopy)" fontSize="15" fontWeight="600" fontFamily="system-ui, sans-serif">
                  {node.label}
                </text>
              </g>
            ))}

            {/* ========== ICONS inside circles ========== */}
            {/* Farmers - sprout */}
            <g transform={`translate(${120 - 14}, ${NODE_Y - 16})`}>
              <path d="M12 22V12M12 12C12 12 12 8 8 4C8 4 4 8 8 12C8 12 4 12 4 16C4 20 8 20 12 16M12 12C12 12 12 8 16 4C16 4 20 8 16 12C16 12 20 12 20 16C20 20 16 20 12 16"
                    stroke="#f5f0e8" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            {/* Exporters - ship */}
            <g transform={`translate(${360 - 14}, ${NODE_Y - 14})`}>
              <path d="M2 20L4 21C6 22 8 22 10 21L12 20L14 21C16 22 18 22 20 21L22 20M4 17L2 10H6L8 4H16L18 10H22L20 17"
                    stroke="#f5f0e8" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            {/* Importers - coffee */}
            <g transform={`translate(${600 - 14}, ${NODE_Y - 14})`}>
              <path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 2v3M10 2v3M14 2v3"
                    stroke="#f5f0e8" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            {/* Brands - star */}
            <g transform={`translate(${780 - 14}, ${NODE_Y - 14})`}>
              <path d="M12 2L14 8L20 8L15.5 12L17.5 20L12 15L6.5 20L8.5 12L4 8L10 8L12 2Z"
                    stroke="#f5f0e8" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
          </svg>

          {/* Legend */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-10 items-center mt-8">
            <div className="flex items-center gap-2">
              <svg width="44" height="10" viewBox="0 0 44 10">
                <line x1="2" y1="5" x2="34" y2="5" stroke="var(--forest-canopy)" strokeWidth="2" />
                <polygon points="42,5 34,2 34,8" fill="var(--forest-canopy)" />
              </svg>
              <span className="text-sm font-medium text-[var(--forest-canopy)]">Data</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="44" height="10" viewBox="0 0 44 10">
                <line x1="10" y1="5" x2="42" y2="5" stroke="var(--data-emerald)" strokeWidth="2" strokeDasharray="6,3" />
                <polygon points="2,5 10,2 10,8" fill="var(--data-emerald)" />
              </svg>
              <span className="text-sm font-medium text-[var(--forest-canopy)]">Requests</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white bg-[var(--data-emerald)]">+</div>
              <span className="text-sm font-medium text-[var(--forest-canopy)]">Start from anywhere: request upstream or send data downstream</span>
            </div>
          </div>
        </motion.div>

        {/* Mobile layout */}
        <div className="md:hidden space-y-3">
          {[
            { label: 'Producers', desc: 'Send data to their buyers' },
            { label: 'Cooperatives', desc: 'Request upstream, send data downstream' },
            { label: 'Exporters', desc: 'Request upstream, send data downstream' },
            { label: 'Importers/Brands', desc: 'Request from any supplier' },
          ].map((actor, i) => (
            <motion.div
              key={actor.label}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{ backgroundColor: 'var(--data-emerald)', backgroundImage: 'linear-gradient(135deg, var(--data-emerald), var(--data-emerald))' }}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--forest-canopy)" strokeWidth="2">
                    {i === 0 && <path d="M12 22V12M12 12C12 12 12 8 8 4C8 4 4 8 8 12C8 12 4 12 4 16C4 20 8 20 12 16M12 12C12 12 12 8 16 4C16 4 20 8 16 12C16 12 20 12 20 16C20 20 16 20 12 16" />}
                    {i === 1 && <path d="M12 2L15 10H23L17 16L19 24L12 19L5 24L7 16L1 10H9L12 2Z" />}
                    {i === 2 && <path d="M2 20L4 21C6 22 8 22 10 21L12 20L14 21C16 22 18 22 20 21L22 20M4 17L2 10H6L8 4H16L18 10H22L20 17" />}
                    {i === 3 && <path d="M12 2L14 8L20 8L15.5 12L17.5 20L12 15L6.5 20L8.5 12L4 8L10 8L12 2Z" />}
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white bg-white text-[var(--data-emerald)]">+</div>
              </div>
              <div>
                <span className="text-sm font-semibold block text-white">{actor.label}</span>
                <span className="text-xs text-white/80">{actor.desc}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
