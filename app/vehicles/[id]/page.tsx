'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getVehicle, getSettings } from '@/lib/api';
import Header from '@/components/Header';
import type { Vehicle, StoreSettings } from '@/types';

function formatPrice(p: number) {
  const decimals = p % 1 !== 0 ? 2 : 0;
  return p.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatKm(km: number) {
  return km.toLocaleString('pt-BR') + ' km';
}

const WhatsAppIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const ChevronLeft = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

function PhotoPlaceholder() {
  return (
    <div className="h-[380px] bg-gray-200 flex items-center justify-center text-gray-300">
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 animate-pulse">
      <div className="h-16 bg-gray-300" />
      <div className="flex h-[380px] gap-[10px]">
        <div className="bg-gray-300 flex-shrink-0" style={{ width: '33.33%' }} />
        <div className="bg-gray-200 flex-shrink-0" style={{ width: '33.33%' }} />
        <div className="bg-gray-300 flex-shrink-0" style={{ width: '33.33%' }} />
      </div>
      <div className="mx-auto px-4" style={{ maxWidth: '1200px', marginTop: '-40px', position: 'relative', zIndex: 10 }}>
        <div className="bg-white rounded-2xl p-8 flex gap-8">
          <div className="flex-1 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-28" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="grid grid-cols-4 gap-4 pt-5 border-t border-gray-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-10" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          </div>
          <div className="w-80 space-y-3">
            <div className="h-8 bg-gray-200 rounded w-2/3" />
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VehicleDetailPage() {
  const params = useParams();
  const vehicleId = Number(params.id);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [offset, setOffset] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    getSettings().then(setSettings).catch(console.error);
    getVehicle(vehicleId)
      .then(v => { setVehicle(v); setOffset(0); })
      .catch(() => setNotFound(true));
  }, [vehicleId]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const n = vehicle?.photos.length ?? 1;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') setLightboxIndex(i => ((i ?? 0) - 1 + n) % n);
      if (e.key === 'ArrowRight') setLightboxIndex(i => ((i ?? 0) + 1) % n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, vehicle?.photos.length]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
          <p className="text-lg font-medium mb-3">Veículo não encontrado.</p>
          <Link href="/" className="text-sm underline hover:text-gray-600">← Voltar ao catálogo</Link>
        </div>
      </div>
    );
  }

  if (!vehicle) return <PageSkeleton />;

  const secondaryColor = settings?.secondary_color ?? '#cc0000';
  const whatsapp = settings?.whatsapp?.replace(/\D/g, '') ?? '';
  const message = encodeURIComponent(`Olá, tenho interesse no ${vehicle.brand} ${vehicle.model} ${vehicle.year}`);
  const waUrl = `https://wa.me/${whatsapp}?text=${message}`;

  const photos = vehicle.photos;
  const n = photos.length;

  const isMoto = vehicle.category === 'motorcycle';
  const specs = [
    { label: 'Ano',           value: vehicle.year },
    { label: 'Quilometragem', value: formatKm(vehicle.km) },
    { label: 'Cor',           value: vehicle.color || '—' },
    ...(isMoto ? [
      ...(vehicle.cilindrada  ? [{ label: 'Cilindrada',    value: `${vehicle.cilindrada} cc` }] : []),
      ...(vehicle.marchas     ? [{ label: 'Marchas',       value: String(vehicle.marchas) }] : []),
      ...(vehicle.motor_type  ? [{ label: 'Motor',         value: vehicle.motor_type }] : []),
      ...(vehicle.cooling     ? [{ label: 'Refrigeração',  value: vehicle.cooling }] : []),
      ...(vehicle.moto_style  ? [{ label: 'Estilo',        value: vehicle.moto_style }] : []),
      ...(vehicle.starter     ? [{ label: 'Partida',       value: vehicle.starter }] : []),
      ...(vehicle.front_brake ? [{ label: 'Fr. dianteiro', value: vehicle.front_brake }] : []),
      ...(vehicle.rear_brake  ? [{ label: 'Fr. traseiro',  value: vehicle.rear_brake }] : []),
      ...(vehicle.fuel_system ? [{ label: 'Alimentação',   value: vehicle.fuel_system }] : []),
    ] : [
      ...(vehicle.transmission ? [{ label: 'Câmbio',      value: vehicle.transmission }] : []),
      ...(vehicle.fuel         ? [{ label: 'Combustível', value: vehicle.fuel }] : []),
      ...(vehicle.doors        ? [{ label: 'Portas',      value: String(vehicle.doors) }] : []),
      ...(vehicle.body_type    ? [{ label: 'Carroceria',  value: vehicle.body_type }] : []),
    ]),
  ];

  const showDescriptionSection = !!vehicle.description && vehicle.description.trim() !== vehicle.model.trim();

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      {/* ── GALLERY ── */}
      {n === 0 ? (
        <PhotoPlaceholder />
      ) : (
        <div
          className="relative overflow-hidden"
          style={{ marginTop: '50px' }}
          onTouchStart={e => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
          onTouchEnd={e => {
            const dx = e.changedTouches[0].clientX - touchStart.current.x;
            const dy = e.changedTouches[0].clientY - touchStart.current.y;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
              if (dx < 0) setOffset(o => (o + 1) % n);
              else setOffset(o => (o - 1 + n) % n);
            }
          }}
        >
          <div className="flex h-[320px] md:h-[380px] md:gap-[10px]">
            {[0, 1].map(i => {
              const photoIndex = (offset + i) % n;
              return (
                <div
                  key={`${offset}-${i}`}
                  className="relative overflow-hidden flex-shrink-0 cursor-pointer w-full md:w-1/2"
                  onClick={() => setLightboxIndex(photoIndex)}
                >
                  <img
                    src={photos[photoIndex]}
                    alt={`${vehicle.brand} ${vehicle.model} — foto ${photoIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setOffset(o => (o - 1 + n) % n)}
            aria-label="Foto anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors z-10"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => setOffset(o => (o + 1) % n)}
            aria-label="Próxima foto"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors z-10"
          >
            <ChevronRight />
          </button>
        </div>
      )}

      {/* ── DOTS (mobile only) ── */}
      {n > 1 && (
        <div className="flex justify-center items-center gap-2 py-3 md:hidden">
          {Array.from({ length: n }).map((_, i) => (
            <button
              key={i}
              onClick={() => setOffset(i)}
              aria-label={`Foto ${i + 1}`}
              style={{
                width: i === offset % n ? 10 : 6,
                height: i === offset % n ? 10 : 6,
                borderRadius: '50%',
                background: i === offset % n ? secondaryColor : '#d1d5db',
                border: 'none',
                padding: 0,
                flexShrink: 0,
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}

      {/* ── TWO SIBLING CARDS — float over gallery ── */}
      <div className="mt-0 md:-mt-10" style={{ marginLeft: 'auto', marginRight: 'auto', position: 'relative', zIndex: 10, maxWidth: '1200px', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '40px' }}>
        <div className="flex flex-col md:flex-row" style={{ gap: '24px', alignItems: 'flex-start' }}>

          {/* ── LEFT: content card ── */}
          <div className="flex-1 min-w-0 pb-20 md:pb-0 w-full" style={{ background: '#ffffff', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>

            {(vehicle.is_featured || vehicle.is_sold) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {vehicle.is_featured && (
                  <span className="text-white text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wide" style={{ backgroundColor: secondaryColor }}>
                    Destaque
                  </span>
                )}
                {vehicle.is_sold && (
                  <span className="bg-gray-700 text-white text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wide">
                    Vendido
                  </span>
                )}
              </div>
            )}

            <h1 className="text-3xl font-bold leading-tight mb-1">
              <span className="text-gray-900">{vehicle.brand} </span>
              <span style={{ color: '#cc0000' }}>{vehicle.model}</span>
            </h1>
            {vehicle.description && (
              <p className="text-sm text-gray-500 line-clamp-1 mb-5">{vehicle.description}</p>
            )}

            {/* Specs */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4"
              style={{ gap: '20px', borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}
            >
              {specs.map(s => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">{s.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            {showDescriptionSection && (
              <div style={{ borderTop: '1px solid #f0f0f0', marginTop: '20px', paddingTop: '20px' }}>
                <h2 className="text-xs text-gray-400 uppercase tracking-wide mb-2">Sobre este veículo</h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {vehicle.description}
                </p>
              </div>
            )}

          </div>

          {/* ── RIGHT: conversion card (desktop only) ── */}
          <div
            className="hidden md:flex flex-col"
            style={{
              width: '360px',
              flexShrink: 0,
              position: 'sticky',
              top: '96px',
              alignSelf: 'flex-start',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
              padding: '24px',
            }}
          >
            <p className="font-black mb-4 leading-none" style={{ fontSize: '1.75rem', color: '#0a1628' }}>
              {formatPrice(vehicle.price)}
            </p>

            {vehicle.is_sold ? (
              <div className="bg-gray-100 text-gray-500 text-center py-3 px-4 rounded-lg text-sm font-medium">
                Este veículo já foi vendido
              </div>
            ) : (
              <>
                {whatsapp && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full text-white font-semibold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#25d366', borderRadius: '8px', padding: '12px 16px', fontSize: '14px' }}
                  >
                    <WhatsAppIcon />
                    Tenho interesse
                  </a>
                )}
                {whatsapp && (
                  <a
                    href={`tel:+${whatsapp}`}
                    className="flex items-center justify-center w-full font-medium transition-colors hover:bg-gray-50"
                    style={{ border: '1.5px solid #0a1628', color: '#0a1628', borderRadius: '8px', padding: '10px 16px', marginTop: '8px', fontSize: '13px' }}
                  >
                    Ligar agora
                  </a>
                )}
                <p className="text-center text-xs text-gray-400" style={{ marginTop: '12px' }}>
                  Resposta em minutos
                </p>
              </>
            )}
          </div>

        </div>{/* end flex */}

      </div>{/* end wrapper */}

      {vehicle.features && vehicle.features.length > 0 && (
        <div className="md:pr-96" style={{ marginLeft: 'auto', marginRight: 'auto', position: 'relative', zIndex: 5, maxWidth: '1200px', paddingLeft: '16px', paddingBottom: '40px', marginTop: '16px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '0.5px solid #e5e7eb' }}>
            <p className="text-xs text-gray-400 uppercase tracking-wide" style={{ marginBottom: '16px' }}>Itens de veículo</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {vehicle.features.map((feature, i) => (
                <span key={i} style={{ fontSize: '14px', fontWeight: 600, color: '#222' }}>{feature}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE STICKY BOTTOM BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between md:hidden">
        <div>
          <p className="text-xs text-gray-400">Preço</p>
          <p className="text-xl font-bold text-[#0a1628]">{formatPrice(vehicle.price)}</p>
        </div>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#25d366] text-white font-semibold px-5 py-3 rounded-lg text-sm">
          <WhatsAppIcon /> Tenho interesse
        </a>
      </div>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400 bg-white">
        {settings?.name ?? 'Naskar Motors'}{settings?.city ? ` · ${settings.city}` : ''}
      </footer>

      {/* ── LIGHTBOX ── */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label="Fechar"
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-colors z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={photos[lightboxIndex]}
            alt={`${vehicle.brand} ${vehicle.model} — foto ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain select-none"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={e => { e.stopPropagation(); setLightboxIndex(i => ((i ?? 0) - 1 + n) % n); }}
            aria-label="Foto anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full w-11 h-11 flex items-center justify-center transition-colors"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setLightboxIndex(i => ((i ?? 0) + 1) % n); }}
            aria-label="Próxima foto"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full w-11 h-11 flex items-center justify-center transition-colors"
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
