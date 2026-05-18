'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Focus trap for mobile menu
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

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
          ? 'bg-surface/95 backdrop-blur-md border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
              <path
                d="M10 2 L14 7 L10 5 L6 7 Z M6 7 L10 5 L10 18 L6 14 Z M14 7 L10 5 L10 18 L14 14 Z"
                fill="#d1fae5"
              />
            </svg>
          </div>
          <span className="text-foreground font-semibold text-base tracking-tight">Tracebud</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="px-3.5 py-2 text-sm text-foreground-muted hover:text-foreground transition-colors rounded-md hover:bg-surface-secondary"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#demo"
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary-mid transition-colors"
          >
            Book a demo
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          ref={toggleRef}
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          ref={menuRef}
          className="md:hidden bg-surface border-b border-border px-6 pb-6 pt-2"
          role="navigation"
        >
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-3 min-h-[44px] flex items-center text-sm text-foreground-muted hover:text-foreground transition-colors border-b border-border last:border-0"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#demo"
              onClick={() => setOpen(false)}
              className="mt-3 px-4 py-3 min-h-[44px] text-sm font-medium bg-primary text-white rounded-md text-center hover:bg-primary-mid transition-colors"
            >
              Book a demo
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
