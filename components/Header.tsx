'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { getSettings } from '@/lib/api';
import type { StoreSettings } from '@/types';

// ── Icons ─────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.89 9.11 19.79 19.79 0 01.82.5 2 2 0 012.81 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const local = digits.startsWith('55') ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return raw;
}

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Início',  href: '/' },
  { label: 'Carros',  href: '/?category=car' },
  { label: 'Motos',   href: '/?category=motorcycle' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getSettings().then(setSettings).catch(console.error);
  }, []);

  // Sync input with URL param (e.g. back navigation)
  useEffect(() => {
    setSearchValue(searchParams.get('search') ?? '');
  }, [searchParams]);

  const whatsapp = settings?.whatsapp?.replace(/\D/g, '') ?? '';
  const waUrl = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Olá, tenho interesse em um veículo!')}` : '#';
  const formattedPhone = settings?.whatsapp ? formatPhone(settings.whatsapp) : '';
  const currentCategory = searchParams.get('category') ?? '';

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/' && currentCategory === '';
    if (href === '/?category=car') return pathname === '/' && currentCategory === 'car';
    if (href === '/?category=motorcycle') return pathname === '/' && currentCategory === 'motorcycle';
    return false;
  }

  function pushSearch(val: string) {
    const params = new URLSearchParams(window.location.search);
    if (val) params.set('search', val);
    else params.delete('search');
    router.push(`/?${params.toString()}`);
  }

  function handleSearchChange(val: string) {
    setSearchValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushSearch(val), 300);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pushSearch(searchValue);
    setMobileSearchOpen(false);
  }

  const mobileLinks = [
    ...NAV_LINKS,
    { label: 'Fale conosco', href: waUrl, external: true },
  ];

  return (
    <header className="relative z-30" style={{ backgroundColor: '#0a1628', height: '64px' }}>
      <div className="h-full px-6 flex items-center">

        {/* ── Left: Logo ── */}
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            {settings?.logo_url && (
              <img src={settings.logo_url} alt={settings.name} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
            )}
            <div className="leading-none">
              <p className="text-white" style={{ fontWeight: 600, fontSize: '15px' }}>
                {settings?.name ?? 'Naskar Motors'}
              </p>
              {settings?.city && (
                <p style={{ fontSize: '11px', color: '#cc0000', marginTop: '2px' }}>{settings.city}</p>
              )}
            </div>
          </Link>
        </div>

        {/* ── Center: Nav links + search bar ── */}
        <div className="hidden md:flex flex-1 items-center justify-center" style={{ gap: '20px' }}>
          <nav className="flex items-center" style={{ gap: '20px' }}>
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: '13px',
                  color: isActive(link.href) ? '#cc0000' : '#ffffff',
                  textDecoration: isActive(link.href) ? 'underline' : 'none',
                  textUnderlineOffset: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {link.label}
              </Link>
            ))}
            <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#ffffff', whiteSpace: 'nowrap' }}>
              Fale conosco
            </a>
          </nav>

          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '7px 12px',
              width: '260px',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <span className="text-white/60 flex-shrink-0"><SearchIcon /></span>
            <input
              type="text"
              value={searchValue}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Buscar modelo..."
              className="flex-1 bg-transparent text-white placeholder-white/50 outline-none"
              style={{ border: 'none', fontSize: '13px', minWidth: 0 }}
            />
          </form>
        </div>

        {/* ── Right: Phone + mobile icons ── */}
        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          {formattedPhone && (
            <div className="hidden md:flex items-center gap-1.5" style={{ color: '#8899aa', fontSize: '12px' }}>
              <PhoneIcon />
              {formattedPhone}
            </div>
          )}

          {/* Mobile: search icon */}
          <button
            onClick={() => { setMobileSearchOpen(o => !o); setMenuOpen(false); }}
            className="md:hidden text-white p-1"
            aria-label="Buscar"
          >
            {mobileSearchOpen ? <XIcon /> : <SearchIcon />}
          </button>

          {/* Mobile: hamburger */}
          <button
            onClick={() => { setMenuOpen(o => !o); setMobileSearchOpen(false); }}
            className="md:hidden text-white p-1"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {menuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* ── Mobile search panel ── */}
      {mobileSearchOpen && (
        <div className="md:hidden absolute left-0 right-0 z-40 border-t" style={{ top: '64px', backgroundColor: '#0a1628', borderColor: 'rgba(255,255,255,0.1)', padding: '12px 16px' }}>
          <form onSubmit={handleSearchSubmit} className="flex items-center" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px 14px', gap: '8px' }}>
            <span className="text-white/60 flex-shrink-0"><SearchIcon /></span>
            <input
              type="text"
              value={searchValue}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Buscar por marca ou modelo..."
              className="flex-1 bg-transparent text-white placeholder-white/50 outline-none"
              style={{ border: 'none', fontSize: '14px' }}
              autoFocus
            />
          </form>
        </div>
      )}

      {/* ── Mobile nav dropdown ── */}
      {menuOpen && (
        <div className="md:hidden absolute left-0 right-0 z-40 border-t" style={{ top: '64px', backgroundColor: '#0a1628', borderColor: 'rgba(255,255,255,0.1)', padding: '16px' }}>
          <div className="flex flex-col" style={{ gap: '20px' }}>
            {mobileLinks.map(link =>
              'external' in link && link.external ? (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} style={{ fontSize: '14px', color: '#ffffff' }}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} style={{ fontSize: '14px', color: isActive(link.href) ? '#cc0000' : '#ffffff' }}>
                  {link.label}
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}
