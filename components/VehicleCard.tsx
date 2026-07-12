'use client';

import { useRouter } from 'next/navigation';
import type { Vehicle, StoreSettings } from '@/types';

interface VehicleCardProps {
  vehicle: Vehicle;
  settings: StoreSettings | null;
}

function formatPrice(price: number): string {
  const decimals = price % 1 !== 0 ? 2 : 0;
  return price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatKm(km: number): string {
  return km.toLocaleString('pt-BR') + ' km';
}

const CalendarIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// Speedometer / gauge icon (ti-gauge style)
const SpeedometerIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M5.636 18.364a9 9 0 1 1 12.728 0" />
    <path d="M12 12l3.5 -3.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const LocationPinIcon = () => (
  <svg className="w-3 h-3 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default function VehicleCard({ vehicle, settings }: VehicleCardProps) {
  const router = useRouter();
  const primaryColor = settings?.primary_color ?? '#0a1628';
  const secondaryColor = settings?.secondary_color ?? '#cc0000';
  const city = settings?.city ?? '';
  return (
    <div
      onClick={() => router.push(`/vehicles/${vehicle.id}`)}
      className={`group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer flex flex-col transition-shadow duration-200 hover:shadow-md ${vehicle.is_sold ? 'opacity-60 grayscale' : ''}`}
    >
      {/* ── PHOTO ── */}
      <div className="relative h-52 bg-gray-100 flex-shrink-0 overflow-hidden">
        {vehicle.photos.length > 0 ? (
          <img
            src={vehicle.photos[0]}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Sem foto</span>
          </div>
        )}

        {/* Top-left badge: VENDIDO takes priority */}
        {vehicle.is_sold ? (
          <span className="absolute top-3 left-3 bg-gray-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-sm uppercase tracking-wider shadow">
            Vendido
          </span>
        ) : vehicle.is_featured ? (
          <span
            className="absolute top-3 left-3 text-white text-[11px] font-bold px-2.5 py-1 rounded-sm uppercase tracking-wider shadow"
            style={{ backgroundColor: secondaryColor }}
          >
            Destaque
          </span>
        ) : null}

      </div>

      {/* ── CONTENT ── */}
      <div className="px-4 pt-3.5 pb-4 flex flex-col gap-2 flex-1">

        {/* Brand + Model — ALL CAPS */}
        <h3 className="text-[15px] font-extrabold text-gray-900 uppercase leading-tight tracking-tight line-clamp-1">
          {vehicle.brand} {vehicle.model}
        </h3>

        {/* Version / description */}
        {vehicle.description ? (
          <p className="text-xs text-gray-400 leading-tight line-clamp-1 -mt-0.5">
            {vehicle.description}
          </p>
        ) : (
          <p className="text-xs text-gray-300 -mt-0.5">{vehicle.year}</p>
        )}

        {/* Year + KM */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mt-0.5">
          <span className="flex items-center gap-1.5">
            <CalendarIcon />
            {vehicle.year}
          </span>
          <span className="flex items-center gap-1.5">
            <SpeedometerIcon />
            {formatKm(vehicle.km)}
          </span>
        </div>

        {/* City */}
        {city && (
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <LocationPinIcon />
            {city}
          </span>
        )}

        {/* Price — pinned to bottom */}
        <p className="text-xl font-black mt-auto pt-2" style={{ color: primaryColor }}>
          {formatPrice(vehicle.price)}
        </p>

        {/* CTA button */}
        <button
          onClick={e => { e.stopPropagation(); router.push(`/vehicles/${vehicle.id}`); }}
          className="w-full py-3 rounded-lg font-bold text-sm text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: primaryColor }}
        >
          Ver oferta
        </button>
      </div>
    </div>
  );
}
