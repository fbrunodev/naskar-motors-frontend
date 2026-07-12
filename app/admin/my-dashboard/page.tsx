'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getMe, getMyStats, getSettings } from '@/lib/api';
import { getToken, isTokenValid, removeToken } from '@/lib/auth';
import AdminLayout from '@/components/AdminLayout';
import type { User, EmployeeStats } from '@/types';

function formatPrice(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

const CARD_STYLE: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: 20,
  border: '0.5px solid #e5e7eb',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const TOOLTIP_STYLE = { borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', fontSize: '13px' };
const RADIAN = Math.PI / 180;

function formatPriceShort(v: number) {
  if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`;
  return `R$${v.toFixed(0)}`;
}

export default function MyDashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalCommissionRate, setGlobalCommissionRate] = useState(2);

  useEffect(() => {
    if (!isTokenValid()) { removeToken(); router.replace('/admin/login'); return; }
    const token = getToken()!;

    getSettings().then(s => setGlobalCommissionRate(s.commission_rate ?? 2)).catch(() => {});

    getMe(token)
      .then(u => {
        setMe(u);
        return getMyStats(token);
      })
      .then(s => setStats(s))
      .catch(() => router.replace('/admin/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const commissionRate = globalCommissionRate;

  const historico = stats?.historico ?? [];

  const ultimos6Meses = (() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { mes: d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }), _y: d.getFullYear(), _m: d.getMonth(), vendas: 0, comissao: 0 };
    });
    historico.forEach(v => {
      if (!v.sold_at) return;
      const sd = new Date(v.sold_at);
      const slot = months.find(x => x._y === sd.getFullYear() && x._m === sd.getMonth());
      if (slot) { slot.vendas += 1; slot.comissao += v.price * (v.commission_rate ?? globalCommissionRate) / 100; }
    });
    return months.map(({ mes, vendas, comissao }) => ({ mes, vendas, comissao }));
  })();

  const porCategoria = [
    { name: 'Carros',    value: historico.filter(v => v.category === 'car').length,        fill: '#0a1628' },
    { name: 'Motos',     value: historico.filter(v => v.category === 'motorcycle').length,  fill: '#cc0000' },
    { name: 'Caminhões', value: historico.filter(v => v.category === 'truck').length,       fill: '#888888' },
  ].filter(c => c.value > 0);

  if (!me) return null;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Olá, {me.name}! 👋</h1>
          <p className="text-sm text-gray-400 mt-1">Aqui estão seus números de vendas.</p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Vendas este mês',
              value: loading ? '—' : String(stats?.vendas_mes ?? 0),
              sub: 'veículos vendidos',
              color: '#0a1628',
            },
            {
              label: 'Faturamento gerado',
              value: loading ? '—' : formatPrice(stats?.faturamento_mes ?? 0),
              sub: 'no mês atual',
              color: '#22c55e',
            },
            {
              label: 'Comissão estimada',
              value: loading ? '—' : formatPrice(stats?.comissao_mes ?? 0),
              sub: `${commissionRate}% por venda`,
              color: '#f97316',
            },
            {
              label: 'Total de vendas',
              value: loading ? '—' : String(stats?.total_vendas ?? 0),
              sub: 'histórico completo',
              color: '#6366f1',
            },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={CARD_STYLE}>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">{label}</p>
              <p className="text-2xl font-bold" style={{ color: '#0a1628' }}>{value}</p>
              <p className="text-xs mt-1" style={{ color }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Bar — vendas por mês */}
            <div style={{ ...CARD_STYLE, padding: 24 }}>
              <h2 className="text-sm font-semibold text-gray-700 mb-5">Minhas vendas por mês</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ultimos6Meses} barSize={28}>
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f3f4f6' }} formatter={(v: number) => [v, 'Vendas']} />
                  <Bar dataKey="vendas" name="Vendas" fill="#0a1628" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Line — comissão por mês */}
            <div style={{ ...CARD_STYLE, padding: 24 }}>
              <h2 className="text-sm font-semibold text-gray-700 mb-5">Comissão por mês</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={ultimos6Meses}>
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={formatPriceShort} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [formatPrice(v), 'Comissão']} />
                  <Line type="monotone" dataKey="comissao" name="Comissão" stroke="#25d366" strokeWidth={2} dot={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pie — por categoria */}
            <div style={{ ...CARD_STYLE, padding: 24 }}>
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Vendas por categoria</h2>
              {porCategoria.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm text-gray-400">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={porCategoria}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
                        cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number;
                      }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600}>
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                    >
                      {porCategoria.map(entry => <Cell key={entry.name} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Goal card */}
            <div style={{ ...CARD_STYLE, padding: 24 }}>
              <h2 className="text-sm font-semibold text-gray-700 mb-5">Meta do Mês</h2>
              {(() => {
                const vendasMes = stats?.vendas_mes ?? 0;
                const meta = me.monthly_goal ?? 5;
                const pct = Math.min(Math.round((vendasMes / meta) * 100), 100);
                const barColor = pct >= 100 ? '#22c55e' : pct >= 50 ? '#f97316' : '#cc0000';

                const hoje = new Date();
                const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
                const diasRestantes = ultimoDiaMes - hoje.getDate();
                const vendasRestantes = Math.max(0, meta - vendasMes);
                const ritmo = diasRestantes > 0 && vendasRestantes > 0
                  ? Math.ceil(diasRestantes / vendasRestantes)
                  : 0;

                return (
                  <div className="space-y-4">
                    <p className="text-3xl font-bold text-gray-900">
                      {vendasMes}
                      <span className="text-base font-normal text-gray-400 ml-2">de {meta} vendas</span>
                    </p>
                    <div>
                      <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                      <p className="text-xs mt-2 font-medium" style={{ color: barColor }}>{pct}% da meta atingida</p>
                    </div>
                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12, marginTop: 12 }} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span>{vendasMes >= meta ? '🎉' : '🎯'}</span>
                        {vendasMes >= meta ? (
                          <span className="text-sm font-semibold text-green-600">Meta batida! Parabéns!</span>
                        ) : (
                          <span className="text-sm text-gray-600">Faltam {vendasRestantes} venda{vendasRestantes !== 1 ? 's' : ''} para bater a meta</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span className="text-sm text-gray-600">{diasRestantes} dia{diasRestantes !== 1 ? 's' : ''} restante{diasRestantes !== 1 ? 's' : ''} no mês</span>
                      </div>
                      {vendasRestantes > 0 && diasRestantes > 0 && (
                        <div className="flex items-center gap-2">
                          <span>💡</span>
                          <span className="text-sm text-gray-500 italic">Venda 1 carro a cada {ritmo} dia{ritmo !== 1 ? 's' : ''} para bater a meta</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>
        )}

        {/* Last sales */}
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Minhas últimas vendas</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-sm text-center text-gray-400">Carregando...</div>
            ) : !stats || stats.historico.length === 0 ? (
              <div className="p-8 text-sm text-center text-gray-400">Nenhuma venda registrada ainda.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 w-16 hidden sm:table-cell">Foto</th>
                    <th className="px-4 py-3">Veículo</th>
                    <th className="px-4 py-3">Preço</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Vendido em</th>
                    <th className="px-4 py-3 text-right">Comissão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.historico.map(v => {
                    const commission = v.price * (v.commission_rate ?? globalCommissionRate) / 100;
                    return (
                      <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div style={{ width: 56, height: 42, borderRadius: 6, overflow: 'hidden', background: '#f3f4f6' }}>
                            {v.photos?.[0]
                              ? <img src={v.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#d1d5db' }}>—</div>
                            }
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{v.brand} {v.model}</p>
                          <p className="text-xs text-gray-400">{v.year}</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">{formatPrice(v.price)}</td>
                        <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                          {v.sold_at ? formatDate(v.sold_at) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">
                          {formatPrice(commission)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {!loading && stats && stats.historico.length > 0 && (
            <p className="text-xs text-gray-400 mt-2 text-right">
              * Comissão estimada baseada em {commissionRate}% por venda
            </p>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
