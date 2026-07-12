'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getVehicles, deleteVehicle, markVehicleSold, getSettings, updateVehicle, getMe } from '@/lib/api';
import { removeToken, isTokenValid } from '@/lib/auth';
import AdminLayout from '@/components/AdminLayout';
import type { Vehicle, StoreSettings } from '@/types';

function formatPrice(price: number) {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const CATEGORY_LABEL: Record<string, string> = {
  car: 'Carro',
  motorcycle: 'Moto',
  truck: 'Caminhão',
};

const SELECT_STYLE: React.CSSProperties = {
  fontSize: '13px', padding: '6px 10px', borderRadius: '8px',
  border: '1px solid #e5e7eb', background: '#fff', color: '#374151', outline: 'none',
};

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
const IconTag = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 9V4a1 1 0 011-1z" />
  </svg>
);
const IconPencil = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);
const IconTrash = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconRefresh = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const Thumb = ({ url }: { url?: string }) => (
  <div style={{ width: 80, height: 60, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
    {url
      ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 12 }}>—</div>
    }
  </div>
);

export default function AdminPage() {
  const router = useRouter();
  const [token, setTokenState] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('employee');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [soldingId, setSoldingId] = useState<number | null>(null);
  const [featuringId, setFeaturingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [soldConfirm, setSoldConfirm] = useState<{ id: number; name: string } | null>(null);

  const [searchText, setSearchText] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [pagina, setPagina] = useState(1);
  const ITENS_POR_PAGINA = 10;

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchText), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  useEffect(() => {
    if (!isTokenValid()) { removeToken(); router.replace('/admin/login'); return; }
    const t = localStorage.getItem('naskar_token')!;
    setTokenState(t);
    getMe(t).then(u => setUserRole(u.role)).catch(() => {});
  }, [router]);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try { setVehicles(await getVehicles({ include_sold: true })); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchVehicles();
    getSettings().then(setSettings).catch(console.error);
  }, [token, fetchVehicles]);

  function handleDelete(id: number, name: string) {
    setDeleteConfirm({ id, name });
  }

  async function confirmDelete() {
    if (!token || !deleteConfirm) return;
    const { id } = deleteConfirm;
    setDeleteConfirm(null);
    setDeletingId(id);
    try {
      await deleteVehicle(id, token);
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch { alert('Erro ao excluir veículo.'); }
    finally { setDeletingId(null); }
  }

  function handleMarkSold(id: number, name: string) {
    setSoldConfirm({ id, name });
  }

  async function confirmMarkSold() {
    if (!token || !soldConfirm) return;
    const { id } = soldConfirm;
    setSoldConfirm(null);
    setSoldingId(id);
    try {
      await markVehicleSold(id, token);
      setVehicles(prev => prev.map(v => v.id === id ? { ...v, is_sold: true, sold_at: new Date().toISOString() } : v));
    } catch { alert('Erro ao marcar como vendido.'); }
    finally { setSoldingId(null); }
  }

  function handleMarkAvailable(id: number) {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, is_sold: false, sold_at: null } : v));
  }

  async function handleToggleFeatured(vehicle: Vehicle) {
    if (!token) return;
    setFeaturingId(vehicle.id);
    try {
      const updated = await updateVehicle(vehicle.id, {
        category: vehicle.category, brand: vehicle.brand, model: vehicle.model,
        year: vehicle.year, km: vehicle.km, price: vehicle.price,
        color: vehicle.color ?? undefined, description: vehicle.description ?? undefined,
        is_featured: !vehicle.is_featured,
        transmission: vehicle.transmission ?? undefined, fuel: vehicle.fuel ?? undefined,
        doors: vehicle.doors ?? undefined, body_type: vehicle.body_type ?? undefined,
        brand_id: vehicle.brand_id ?? undefined, model_id: vehicle.model_id ?? undefined,
        features: vehicle.features ?? [],
      }, token);
      setVehicles(prev => prev.map(v => v.id === updated.id ? updated : v));
    } catch { alert('Erro ao atualizar destaque.'); }
    finally { setFeaturingId(null); }
  }

  const filteredVehicles = vehicles
    .filter(v => {
      const isSold = v.is_sold;
      if (filterStatus === 'available' && isSold) return false;
      if (filterStatus === 'sold' && !isSold) return false;
      if (filterCategory !== 'all' && v.category !== filterCategory) return false;
      if (searchDebounced) {
        const q = searchDebounced.toLowerCase();
        if (!`${v.brand} ${v.model}`.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'oldest':    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price_asc': return a.price - b.price;
        case 'price_desc':return b.price - a.price;
        case 'az':        return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
        default:          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    })
    .sort((a, b) => {
      if (a.is_sold !== b.is_sold) return a.is_sold ? 1 : -1;
      return 0;
    });

  const totalPaginas = Math.ceil(filteredVehicles.length / ITENS_POR_PAGINA);
  const veiculosPaginados = filteredVehicles.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA);

  const primaryColor = settings?.primary_color ?? '#0a1628';
  const total     = vehicles.length;
  const available = vehicles.filter(v => !v.is_sold).length;
  const sold      = vehicles.filter(v => v.is_sold).length;
  const featured  = vehicles.filter(v => v.is_featured).length;

  if (!token) return null;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Sold confirmation modal */}
        {soldConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
              <h3 className="text-base font-bold text-gray-900 mb-2">Marcar como vendido?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Tem certeza que deseja marcar{' '}
                <span className="font-semibold text-gray-800">{soldConfirm.name}</span>{' '}
                como vendido?
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setSoldConfirm(null)} className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button onClick={confirmMarkSold} className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors" style={{ background: '#0a1628' }}>
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
              <h3 className="text-base font-bold text-gray-900 mb-2">Excluir veículo</h3>
              <p className="text-sm text-gray-500 mb-6">
                Tem certeza que deseja excluir{' '}
                <span className="font-semibold text-gray-800">{deleteConfirm.name}</span>?
                {' '}Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors" style={{ background: '#cc0000' }}>
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: total,     sub: 'veículos',        icon: <IconCar />,   color: '#0a1628' },
            { label: 'Disponíveis', value: available, sub: 'à venda',   icon: <IconCheck />, color: '#22c55e' },
            { label: 'Vendidos', value: sold,    sub: 'comercializados', icon: <IconSold />,  color: '#9ca3af' },
            { label: 'Destaques', value: featured, sub: 'em destaque',  icon: <IconStar />,  color: '#fbbf24' },
          ].map(({ label, value, sub, icon, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, padding: 20, border: '0.5px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
                <span style={{ color }}>{icon}</span>
              </div>
              <p className="text-3xl font-bold" style={{ color: '#0a1628' }}>{loading ? '—' : value}</p>
              <p className="text-xs text-gray-400 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Vehicles section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Veículos</h1>
            <Link href="/admin/vehicles/new" className="text-sm text-white font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90" style={{ backgroundColor: primaryColor }}>
              + Novo veículo
            </Link>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              type="text"
              placeholder="Buscar marca ou modelo..."
              value={searchText}
              onChange={e => { setSearchText(e.target.value); setPagina(1); }}
              style={{ ...SELECT_STYLE, flexGrow: 1, minWidth: 180 }}
            />
            <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPagina(1); }} style={SELECT_STYLE}>
              <option value="all">Todas categorias</option>
              <option value="car">Carros</option>
              <option value="motorcycle">Motos</option>
              <option value="truck">Caminhões</option>
            </select>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPagina(1); }} style={SELECT_STYLE}>
              <option value="all">Todos status</option>
              <option value="available">Disponível</option>
              <option value="sold">Vendido</option>
            </select>
            <select value={sortOrder} onChange={e => { setSortOrder(e.target.value); setPagina(1); }} style={SELECT_STYLE}>
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="az">A–Z</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg">{vehicles.length === 0 ? 'Nenhum veículo cadastrado.' : 'Nenhum resultado para os filtros selecionados.'}</p>
              {vehicles.length === 0 && (
                <Link href="/admin/vehicles/new" className="mt-3 inline-block text-sm underline hover:text-gray-600">
                  Adicionar primeiro veículo
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden">

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-3 w-24">Foto</th>
                      <th className="px-4 py-3">Veículo</th>
                      <th className="px-4 py-3">Categoria</th>
                      <th className="px-4 py-3">Ano</th>
                      <th className="px-4 py-3">Preço</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {veiculosPaginados.map(vehicle => {
                      const isSold = vehicle.is_sold;
                      return (
                        <tr key={vehicle.id} className={`hover:bg-gray-50 transition-colors ${isSold ? 'opacity-60' : ''}`}>
                          <td className="px-4 py-3"><Thumb url={vehicle.photos[0]} /></td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{vehicle.brand} {vehicle.model}</p>
                            {vehicle.is_featured && <span className="text-xs text-amber-600 font-medium">★ Destaque</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{CATEGORY_LABEL[vehicle.category] ?? vehicle.category}</td>
                          <td className="px-4 py-3 text-gray-500">{vehicle.year}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{formatPrice(vehicle.price)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${isSold ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                              {isSold ? 'Vendido' : 'Disponível'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {isSold ? (
                                <button onClick={() => handleMarkAvailable(vehicle.id)} className="inline-flex items-center gap-1 text-xs border border-gray-300 text-gray-600 hover:bg-gray-50 px-2 py-1 rounded-md transition-colors">
                                  <IconRefresh /> Disponível
                                </button>
                              ) : (
                                <button onClick={() => handleMarkSold(vehicle.id, `${vehicle.brand} ${vehicle.model}`)} disabled={soldingId === vehicle.id} className="inline-flex items-center gap-1 text-xs border border-gray-300 text-gray-600 hover:bg-gray-50 px-2 py-1 rounded-md transition-colors disabled:opacity-50">
                                  <IconTag /> {soldingId === vehicle.id ? '...' : 'Vendido'}
                                </button>
                              )}
                              {userRole === 'owner' && (
                                <button
                                  onClick={() => handleToggleFeatured(vehicle)}
                                  disabled={featuringId === vehicle.id}
                                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                                  style={vehicle.is_featured
                                    ? { background: '#fef3c7', border: '1px solid #fbbf24', color: '#92400e' }
                                    : { border: '1px solid #e5e7eb', color: '#6b7280' }}
                                >
                                  {featuringId === vehicle.id ? '...' : vehicle.is_featured ? '★ Destaque' : '☆ Destacar'}
                                </button>
                              )}
                              <Link href={`/admin/vehicles/${vehicle.id}/edit`} className="inline-flex items-center gap-1 text-xs border border-blue-200 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors">
                                <IconPencil /> Editar
                              </Link>
                              {userRole === 'owner' && (
                                <button onClick={() => handleDelete(vehicle.id, `${vehicle.brand} ${vehicle.model}`)} disabled={deletingId === vehicle.id} className="inline-flex items-center gap-1 text-xs border border-red-200 text-red-500 hover:bg-red-50 px-2 py-1 rounded-md transition-colors disabled:opacity-50">
                                  <IconTrash /> {deletingId === vehicle.id ? '...' : 'Excluir'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden divide-y divide-gray-100">
                {veiculosPaginados.map(vehicle => {
                  const isSold = vehicle.is_sold;
                  return (
                    <div key={vehicle.id} className={`p-4 flex gap-3 ${isSold ? 'opacity-60' : ''}`}>
                      <Thumb url={vehicle.photos[0]} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-xs text-gray-500">{vehicle.year} · {formatPrice(vehicle.price)}</p>
                        <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isSold ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                          {isSold ? 'Vendido' : 'Disponível'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 items-end justify-center flex-shrink-0">
                        {isSold ? (
                          <button onClick={() => handleMarkAvailable(vehicle.id)} className="inline-flex items-center gap-1 text-xs border border-gray-300 text-gray-600 px-2 py-1 rounded-md">
                            <IconRefresh /> Disponível
                          </button>
                        ) : (
                          <button onClick={() => handleMarkSold(vehicle.id, `${vehicle.brand} ${vehicle.model}`)} disabled={soldingId === vehicle.id} className="inline-flex items-center gap-1 text-xs border border-gray-300 text-gray-600 px-2 py-1 rounded-md disabled:opacity-50">
                            <IconTag /> Vendido
                          </button>
                        )}
                        {userRole === 'owner' && (
                          <button
                            onClick={() => handleToggleFeatured(vehicle)}
                            disabled={featuringId === vehicle.id}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md disabled:opacity-50"
                            style={vehicle.is_featured
                              ? { background: '#fef3c7', border: '1px solid #fbbf24', color: '#92400e' }
                              : { border: '1px solid #e5e7eb', color: '#6b7280' }}
                          >
                            {featuringId === vehicle.id ? '...' : vehicle.is_featured ? '★ Destaque' : '☆ Destacar'}
                          </button>
                        )}
                        <Link href={`/admin/vehicles/${vehicle.id}/edit`} className="inline-flex items-center gap-1 text-xs border border-blue-200 text-blue-600 px-2 py-1 rounded-md">
                          <IconPencil /> Editar
                        </Link>
                        {userRole === 'owner' && (
                          <button onClick={() => handleDelete(vehicle.id, `${vehicle.brand} ${vehicle.model}`)} disabled={deletingId === vehicle.id} className="inline-flex items-center gap-1 text-xs border border-red-200 text-red-500 px-2 py-1 rounded-md disabled:opacity-50">
                            <IconTrash /> {deletingId === vehicle.id ? '...' : 'Excluir'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {totalPaginas > 1 && (() => {
            const ir = (n: number) => { setPagina(n); window.scrollTo({ top: 0, behavior: 'smooth' }); };
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
              <div className="flex items-center justify-center gap-1 mt-4 flex-wrap">
                <button onClick={() => ir(pagina - 1)} disabled={pagina === 1}
                  className={`${btnBase} border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed`}>
                  ← Anterior
                </button>
                {paginas.map((p, i) => p === '...'
                  ? <span key={`e${i}`} className="px-2 text-gray-400 text-sm">...</span>
                  : <button key={p} onClick={() => ir(p as number)}
                      className={`${btnBase} ${pagina === p ? 'border-transparent text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                      style={pagina === p ? { background: '#0a1628' } : {}}>
                      {p}
                    </button>
                )}
                <button onClick={() => ir(pagina + 1)} disabled={pagina === totalPaginas}
                  className={`${btnBase} border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed`}>
                  Próximo →
                </button>
              </div>
            );
          })()}
        </div>

      </div>
    </AdminLayout>
  );
}
