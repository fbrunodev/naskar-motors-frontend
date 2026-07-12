'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSettings, getVehicles } from '@/lib/api';
import type { StoreSettings, Vehicle } from '@/types';
import Header from '@/components/Header';

// ── Icons ────────────────────────────────────────────────────────────────────

const WhatsAppIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const SpeedometerIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M5.636 18.364a9 9 0 1 1 12.728 0" />
    <path d="M12 12l3.5-3.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const LocationPinIcon = () => (
  <svg className="w-3 h-3 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M9 5l7 7-7 7" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  const decimals = price % 1 !== 0 ? 2 : 0;
  return price.toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  });
}

function formatKm(km: number): string {
  return km.toLocaleString('pt-BR') + ' km';
}

// ── VehicleCard ───────────────────────────────────────────────────────────────

function VehicleCard({ vehicle, settings }: {
  vehicle: Vehicle;
  settings: StoreSettings | null;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const sold = vehicle.is_sold;
  const city = settings?.city ?? '';
  const photos = vehicle.photos;
  const n = photos.length;

  function prev(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex(i => (i - 1 + n) % n);
  }

  function next(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex(i => (i + 1) % n);
  }

  return (
    <Link
      href={`/vehicles/${vehicle.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col transition-shadow hover:shadow-md ${sold ? 'opacity-60' : ''}`}
    >
      {/* Photo — 3:2 aspect ratio */}
      <div className="relative flex-shrink-0 overflow-hidden" style={{ paddingTop: '66%' }}>
        {n > 0 ? (
          <img
            src={photos[photoIndex]}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="object-cover"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 bg-gray-100">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badge top-left: Vendido / Destaque */}
        {sold ? (
          <span className="absolute top-2 left-2 bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
            Vendido
          </span>
        ) : vehicle.is_featured ? (
          <span className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider" style={{ backgroundColor: '#cc0000' }}>
            Destaque
          </span>
        ) : null}

        {/* Photo counter bottom-left */}
        {n > 1 && (
          <span className="absolute bottom-2 left-2 bg-black/60 text-white select-none" style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px' }}>
            {photoIndex + 1} / {n}
          </span>
        )}

        {/* Carousel arrows — visible only on card hover */}
        {n > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center justify-center bg-white rounded-full w-7 h-7 shadow-md text-gray-800 transition-opacity hover:opacity-90"
            >
              <ChevronLeftIcon />
            </button>
            <button
              onClick={next}
              aria-label="Próxima foto"
              className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center justify-center bg-white rounded-full w-7 h-7 shadow-md text-gray-800 transition-opacity hover:opacity-90"
            >
              <ChevronRightIcon />
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="px-3 pt-3 pb-3 flex flex-col gap-1.5 flex-1">
        <h3 className="text-[14px] font-bold text-gray-900 leading-tight line-clamp-1 uppercase">
          {vehicle.brand} {vehicle.model}
        </h3>

        {vehicle.description && (
          <p className="text-sm text-gray-400 leading-tight line-clamp-1 -mt-0.5">
            {vehicle.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
          <span className="flex items-center gap-1">
            <CalendarIcon />
            {vehicle.year}
          </span>
          <span className="flex items-center gap-1">
            <SpeedometerIcon />
            {formatKm(vehicle.km)}
          </span>
        </div>

        {city && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <LocationPinIcon />
            {city}
          </span>
        )}

        <p className="text-lg font-bold mt-auto pt-1" style={{ color: '#0a1628' }}>
          {formatPrice(vehicle.price)}
        </p>

        <div
          className="w-full py-2 rounded-lg text-center font-bold text-white transition-opacity hover:opacity-85"
          style={{ fontSize: '12px', backgroundColor: sold ? '#9ca3af' : '#0a1628' }}
        >
          {sold ? 'Indisponível' : 'Ver oferta'}
        </div>
      </div>
    </Link>
  );
}

// ── SkeletonCard ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col animate-pulse">
      <div className="bg-gray-200 flex-shrink-0" style={{ paddingTop: '66%' }} />
      <div className="px-3 pt-3 pb-3 flex flex-col gap-2">
        <div className="h-3.5 bg-gray-200 rounded w-4/5" />
        <div className="flex gap-3 mt-0.5">
          <div className="h-3 bg-gray-200 rounded w-10" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-20" />
        <div className="h-5 bg-gray-200 rounded w-2/5 mt-auto" />
        <div className="h-8 bg-gray-200 rounded-lg w-full" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const ITENS_POR_PAGINA = 12;

  // Derive all filters from URL params — single source of truth
  const searchTerm = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';
  const isFeatured = category === 'featured';
  const effectiveCategory = isFeatured ? '' : category;

  useEffect(() => {
    getSettings().then(setSettings).catch(console.error);
  }, []);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVehicles({
        category: effectiveCategory || undefined,
        is_featured: isFeatured ? true : undefined,
        brand: searchTerm || undefined,
      });

      // Client-side filter: match search against model too
      const filtered = searchTerm
        ? data.filter(v =>
            v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : data;

      const sorted = [...filtered].sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setVehicles(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [effectiveCategory, isFeatured, searchTerm]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  useEffect(() => { setPagina(1); }, [effectiveCategory, isFeatured, searchTerm]);

  const totalPaginas = Math.ceil(vehicles.length / ITENS_POR_PAGINA);
  const veiculosPaginados = vehicles.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA);

  const whatsapp = settings?.whatsapp?.replace(/\D/g, '') ?? '';
  const waMessage = encodeURIComponent('Olá, vim pelo catálogo online e gostaria de mais informações');
  const waUrl = whatsapp ? `https://wa.me/${whatsapp}?text=${waMessage}` : '#';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f2f4' }}>
      <Header />

      {/* ── GRID ── */}
      <div style={{ padding: '20px 40px' }}>
{loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-gray-400">
            <svg className="w-14 h-14 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium text-lg">Nenhum veículo encontrado</p>
            <button
              onClick={() => router.push('/')}
              className="mt-3 text-sm underline hover:text-gray-600"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {veiculosPaginados.map(v => (
              <VehicleCard key={v.id} vehicle={v} settings={settings} />
            ))}
          </div>
        )}

        {totalPaginas > 1 && !loading && (() => {
          const ir = (n: number) => { setPagina(n); window.scrollTo(0, 0); };
          const paginas: (number | '...')[] = [];
          if (totalPaginas <= 5) {
            for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
          } else {
            paginas.push(1);
            if (pagina > 3) paginas.push('...');
            for (let i = Math.max(2, pagina - 1); i <= Math.min(totalPaginas - 1, pagina + 1); i++) paginas.push(i);
            if (pagina < totalPaginas - 2) paginas.push('...');
            paginas.push(totalPaginas);
          }
          const btnBase = 'px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors';
          return (
            <div className="flex items-center justify-center gap-1 mt-6 flex-wrap">
              <button onClick={() => ir(pagina - 1)} disabled={pagina === 1}
                className={`${btnBase} border-gray-300 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed`}>
                ← Anterior
              </button>
              {paginas.map((p, i) => p === '...'
                ? <span key={`e${i}`} className="px-2 text-gray-400 text-sm">...</span>
                : <button key={p} onClick={() => ir(p as number)}
                    className={`${btnBase} ${pagina === p ? 'border-transparent text-white' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
                    style={pagina === p ? { background: '#0a1628' } : {}}>
                    {p}
                  </button>
              )}
              <button onClick={() => ir(pagina + 1)} disabled={pagina === totalPaginas}
                className={`${btnBase} border-gray-300 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed`}>
                Próximo →
              </button>
            </div>
          );
        })()}
      </div>

      {/* ── FOOTER ── */}
      <style>{`@media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr !important; } }`}</style>
      <footer style={{background: '#0a1628', color: 'white', paddingTop: '48px', paddingBottom: '24px', marginTop: '40px'}}>
        <div style={{maxWidth: '1200px', margin: '0 auto', padding: '0 40px'}}>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', marginBottom: '40px'}} className="footer-grid">

            {/* Coluna 1 — Sobre */}
            <div>
              <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '12px'}}>{settings?.name ?? 'Naskar Motors'}</h3>
              <p style={{fontSize: '13px', color: '#8899aa', lineHeight: '1.6', marginBottom: '20px'}}>
                Sua concessionária de confiança em {settings?.city ?? 'Fortaleza'}. Carros, motos e caminhões seminovos com procedência garantida.
              </p>
              <div style={{display: 'flex', gap: '12px'}}>
                <a href={`https://wa.me/${settings?.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  style={{width: '36px', height: '36px', background: '#25d366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                  style={{width: '36px', height: '36px', background: '#E1306C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                  style={{width: '36px', height: '36px', background: '#1877F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Coluna 2 — Links rápidos */}
            <div>
              <h4 style={{fontSize: '14px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#cc0000'}}>Links rápidos</h4>
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {[
                  {label: 'Início', href: '/'},
                  {label: 'Carros', href: '/?category=car'},
                  {label: 'Motos', href: '/?category=motorcycle'},
                  {label: 'Caminhões', href: '/?category=truck'},
                  {label: 'Fale conosco', href: `https://wa.me/${settings?.whatsapp?.replace(/\D/g, '')}`},
                ].map(link => (
                  <a key={link.label} href={link.href} style={{fontSize: '13px', color: '#8899aa', textDecoration: 'none'}}
                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                    onMouseLeave={e => e.currentTarget.style.color = '#8899aa'}>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Coluna 3 — Contato */}
            <div>
              <h4 style={{fontSize: '14px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#cc0000'}}>Contato</h4>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <div style={{display: 'flex', gap: '10px', alignItems: 'flex-start'}}>
                  <span style={{fontSize: '13px', color: '#8899aa'}}>📍</span>
                  <span style={{fontSize: '13px', color: '#8899aa'}}>Av. Carneiro de Mendonça, 1025, Joquei Clube, Fortaleza - CE</span>
                </div>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                  <span style={{fontSize: '13px', color: '#8899aa'}}>📱</span>
                  <a href={`https://wa.me/${settings?.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    style={{fontSize: '13px', color: '#8899aa', textDecoration: 'none'}}
                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                    onMouseLeave={e => e.currentTarget.style.color = '#8899aa'}>
                    {settings?.whatsapp ?? '(85) 99228-9191'}
                  </a>
                </div>
                <div style={{display: 'flex', gap: '10px', alignItems: 'flex-start'}}>
                  <span style={{fontSize: '13px', color: '#8899aa'}}>🕐</span>
                  <div style={{fontSize: '13px', color: '#8899aa', lineHeight: '1.6'}}>
                    <div>Seg - Sex: 8h às 18h</div>
                    <div>Sábado: 8h às 13h</div>
                  </div>
                </div>
              </div>
              <div style={{marginTop: '16px', borderRadius: '8px', overflow: 'hidden'}}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.2!2d-38.5316!3d-3.7436!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zQXZlbmlkYSBDYXJuZWlybyBkZSBNZW5kb27Dp2EsIDEwMjUsIEpvcXVlaSBDbHViZSwgRm9ydGFsZXphIC0gQ0U!5e0!3m2!1spt!2sbr!4v1234567890"
                  width="100%"
                  height="160"
                  style={{border: 0, borderRadius: '8px'}}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href="https://www.google.com/maps/search/Avenida+Carneiro+de+Mendon%C3%A7a,+1025,+Joquei+Clube,+Fortaleza+CE"
                target="_blank"
                rel="noopener noreferrer"
                style={{fontSize: '12px', color: '#cc0000', textDecoration: 'none', marginTop: '8px', display: 'inline-block'}}
              >
                📍 Abrir no Google Maps →
              </a>
            </div>
          </div>

          <div style={{borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px'}}>
            <span style={{fontSize: '12px', color: '#8899aa'}}>© 2026 {settings?.name ?? 'Naskar Motors'}. Todos os direitos reservados.</span>
            <a href="/admin/login" style={{fontSize: '11px', color: '#8899aa', textDecoration: 'none'}}
              onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
              onMouseLeave={e => e.currentTarget.style.color = '#8899aa'}>
              Área restrita
            </a>
          </div>

        </div>
      </footer>

      {/* ── FLOATING WHATSAPP BUTTON ── */}
      {whatsapp && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-opacity hover:opacity-85 z-50"
          style={{ backgroundColor: '#25d366' }}
        >
          <WhatsAppIcon className="w-7 h-7 text-white" />
        </a>
      )}
    </div>
  );
}
