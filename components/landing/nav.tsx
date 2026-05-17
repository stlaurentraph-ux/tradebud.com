'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Product', href: '#product' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'For cooperatives', href: '#cooperatives' },
    { label: 'For exporters', href: '#exporters' },
    { label: 'For buyers', href: '#buyers' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0d1510]/95 backdrop-blur-md border-b border-[#253b2a]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-[#2d6a4f] flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
              <path
                d="M10 2 L14 7 L10 5 L6 7 Z M6 7 L10 5 L10 18 L6 14 Z M14 7 L10 5 L10 18 L14 14 Z"
                fill="#74c69d"
              />
            </svg>
          </div>
          <span className="text-[#f0ece4] font-semibold text-base tracking-tight">Tracebud</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="px-3.5 py-2 text-sm text-[#8fa893] hover:text-[#f0ece4] transition-colors rounded-md hover:bg-[#1a2a1e]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#demo"
            className="px-4 py-2 text-sm font-medium bg-[#2d6a4f] text-[#f0ece4] rounded-md hover:bg-[#40916c] transition-colors"
          >
            Book a demo
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-[#8fa893] hover:text-[#f0ece4] transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#0d1510] border-b border-[#253b2a] px-6 pb-6 pt-2">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-3 text-sm text-[#8fa893] hover:text-[#f0ece4] transition-colors border-b border-[#1a2a1e] last:border-0"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#demo"
              onClick={() => setOpen(false)}
              className="mt-3 px-4 py-3 text-sm font-medium bg-[#2d6a4f] text-[#f0ece4] rounded-md text-center hover:bg-[#40916c] transition-colors"
            >
              Book a demo
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
