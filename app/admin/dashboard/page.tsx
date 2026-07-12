'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getVehicles } from '@/lib/api';
import { removeToken, isTokenValid } from '@/lib/auth';
import AdminLayout from '@/components/AdminLayout';
import type { Vehicle } from '@/types';

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const CAT_COLORS: Record<string, string> = { Carros: '#0a1628', Motos: '#cc0000', 'Caminhões': '#888888' };

function formatPrice(p: number) {
  return p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function computeSalesByMonth(vehicles: Vehicle[]) {
  const now = new Date();
  const slots = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${MONTHS_PT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      Vendas: 0,
    };
  });
  vehicles.forEach(v => {
    if (!v.sold_at) return;
    const d = new Date(v.sold_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const slot = slots.find(s => s.key === key);
    if (slot) slot.Vendas++;
  });
  return slots;
}

function computeCategoryDist(vehicles: Vehicle[]) {
  const labels: Record<string, string> = { car: 'Carros', motorcycle: 'Motos', truck: 'Caminhões' };
  const counts: Record<string, number> = {};
  vehicles.forEach(v => { counts[v.category] = (counts[v.category] ?? 0) + 1; });
  return Object.entries(counts)
    .map(([cat, value]) => { const name = labels[cat] ?? cat; return { name, value, fill: CAT_COLORS[name] ?? '#888888' }; })
    .sort((a, b) => b.value - a.value);
}

const IconCar = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17H7a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2h-2m-4 0h4m-4 0v2m4-2v2M3 9l1.5-4.5h15L21 9" />
  </svg>
);
const IconCheck = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconSold = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const IconStar = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

function MetricCard({ label, value, sub, icon, iconColor, loading }: {
  label: string; value: number; sub: string;
  icon: React.ReactNode; iconColor: string; loading: boolean;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '0.5px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <p className="text-3xl font-bold" style={{ color: '#0a1628' }}>{loading ? '—' : value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

const CARD_STYLE = { background: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
const TOOLTIP_STYLE = { borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', fontSize: '13px' };

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isTokenValid()) {
      removeToken();
      router.replace('/admin/login');
      return;
    }
    setToken(localStorage.getItem('naskar_token'));
  }, [router]);

  useEffect(() => {
    if (!token) return;
    getVehicles({ include_sold: true })
      .then(setVehicles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const total     = vehicles.length;
  const available = vehicles.filter(v => !v.is_sold).length;
  const sold      = vehicles.filter(v => v.is_sold).length;
  const featured  = vehicles.filter(v => v.is_featured).length;

  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();
  const vendidosMes = vehicles.filter(v => {
    if (!v.is_sold || !v.sold_at) return false;
    const data = new Date(v.sold_at);
    return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
  });
  const faturamentoMes = vendidosMes.reduce((acc, v) => acc + v.price, 0);
  const todosVendidos = vehicles.filter(v => v.is_sold);
  const ticketMedio = todosVendidos.length > 0
    ? todosVendidos.reduce((acc, v) => acc + v.price, 0) / todosVendidos.length
    : 0;
  const estoqueValor = vehicles.filter(v => !v.is_sold).reduce((acc, v) => acc + v.price, 0);

  const salesData       = computeSalesByMonth(vehicles).filter(s => s.Vendas > 0);
  const catData         = computeCategoryDist(vehicles);
  const recentVehicles  = [...vehicles]
    .filter(v => v.is_sold && v.sold_at)
    .sort((a, b) => new Date(b.sold_at!).getTime() - new Date(a.sold_at!).getTime())
    .slice(0, 5);

  const rankingMarcas = Object.entries(
    vehicles.filter(v => v.is_sold).reduce((acc, v) => {
      acc[v.brand] = (acc[v.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const encalhados = vehicles.filter(v => {
    if (v.is_sold) return false;
    const dias = Math.floor((Date.now() - new Date(v.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return dias > 30;
  }).map(v => ({
    ...v,
    diasNoEstoque: Math.floor((Date.now() - new Date(v.created_at).getTime()) / (1000 * 60 * 60 * 24)),
  })).sort((a, b) => b.diasNoEstoque - a.diasNoEstoque).slice(0, 5);

  if (!token) return null;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total no estoque" value={total}     sub="veículos"        icon={<IconCar />}   iconColor="#0a1628" loading={loading} />
          <MetricCard label="Disponíveis"       value={available} sub="à venda"         icon={<IconCheck />} iconColor="#22c55e" loading={loading} />
          <MetricCard label="Vendidos"          value={sold}      sub="comercializados" icon={<IconSold />}  iconColor="#9ca3af" loading={loading} />
          <MetricCard label="Destaques"         value={featured}  sub="em destaque"     icon={<IconStar />}  iconColor="#fbbf24" loading={loading} />
        </div>

        {/* Financial metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Faturamento do Mês', icon: '💰', value: faturamentoMes, sub: 'este mês' },
            { label: 'Ticket Médio',       icon: '📊', value: ticketMedio,    sub: 'por veículo vendido' },
            { label: 'Estoque em Valor',   icon: '🏪', value: estoqueValor,   sub: 'em estoque' },
          ].map(({ label, icon, value, sub }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '0.5px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
                <span className="text-lg">{icon}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: '#0a1628' }}>{loading ? '—' : formatPrice(value)}</p>
              <p className="text-xs text-gray-400 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="md:col-span-2" style={{ ...CARD_STYLE, padding: '24px' }}>
            <h2 className="text-sm font-semibold text-gray-700 mb-5">Vendas por mês</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={salesData} barSize={28}>
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="Vendas" fill="#0a1628" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ ...CARD_STYLE, padding: '24px' }}>
            <h2 className="text-sm font-semibold text-gray-700 mb-5">Por categoria</h2>
            {loading || catData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
                {loading ? 'Carregando...' : 'Sem dados'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={catData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
                      cx: number; cy: number; midAngle: number;
                      innerRadius: number; outerRadius: number; percent: number;
                    }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600}>
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                    labelLine={false}
                  >
                    {catData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>

        {/* Recent vehicles */}
        <div style={{ ...CARD_STYLE, overflow: 'hidden' }}>
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Últimos vendidos</h2>
          </div>
          {loading ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="w-12 h-10 rounded-lg bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-40" />
                    <div className="h-3 bg-gray-200 rounded w-20" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-20 flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : recentVehicles.length === 0 ? (
            <p className="text-sm text-gray-400 px-6 py-5">Nenhum veículo vendido ainda.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentVehicles.map(v => (
                <a key={v.id} href={`/admin/vehicles/${v.id}/edit`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {v.photos[0] ? (
                      <img src={v.photos[0]} alt="" className="w-12 h-12 object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">—</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{v.brand} {v.model}</p>
                    <p className="text-xs text-gray-400">{v.sold_at ? formatDate(v.sold_at) : '—'}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 flex-shrink-0">{formatPrice(v.price)}</p>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Ranking + Encalhados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Marcas mais vendidas */}
          <div style={{ ...CARD_STYLE, overflow: 'hidden' }}>
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">Marcas mais vendidas</h2>
            </div>
            {loading ? (
              <div className="px-6 py-5 text-sm text-gray-400">Carregando...</div>
            ) : rankingMarcas.length === 0 ? (
              <div className="px-6 py-5 text-sm text-gray-400">Nenhuma venda registrada.</div>
            ) : (
              <div className="px-6 py-4 space-y-4">
                {rankingMarcas.map(([marca, qtd], i) => (
                  <div key={marca}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 w-5">{i + 1}º</span>
                        <span className="text-sm font-semibold text-gray-800">{marca}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-500">{qtd} venda{qtd !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '6px' }}>
                      <div style={{ background: '#0a1628', borderRadius: '4px', height: '6px', width: `${(qtd / rankingMarcas[0][1]) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Veículos encalhados */}
          <div style={{ ...CARD_STYLE, overflow: 'hidden' }}>
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Veículos encalhados</h2>
              {!loading && encalhados.length > 0 && (
                <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ background: '#cc0000' }}>
                  {encalhados.length}
                </span>
              )}
            </div>
            {loading ? (
              <div className="px-6 py-5 text-sm text-gray-400">Carregando...</div>
            ) : encalhados.length === 0 ? (
              <div className="px-6 py-5 flex items-center gap-2 text-sm font-medium" style={{ color: '#22c55e' }}>
                <span>✓</span> Nenhum veículo há mais de 30 dias no estoque
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {encalhados.map(v => (
                  <a key={v.id} href={`/admin/vehicles/${v.id}/edit`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {v.photos[0] ? (
                        <img src={v.photos[0]} alt="" className="w-12 h-12 object-cover rounded-lg" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">—</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{v.brand} {v.model}</p>
                      <p className="text-xs font-medium" style={{ color: v.diasNoEstoque > 60 ? '#cc0000' : '#f97316' }}>
                        {v.diasNoEstoque} dias no estoque
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 flex-shrink-0">{formatPrice(v.price)}</p>
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
