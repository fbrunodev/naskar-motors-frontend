'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getUsers, createUser, deleteUser, getMe, updateEmployeeGoal,
  getVehicles, getSettings, sendNotificationToUser,
} from '@/lib/api';
import { getToken, isTokenValid, removeToken } from '@/lib/auth';
import AdminLayout from '@/components/AdminLayout';
import type { User, Vehicle } from '@/types';

const INPUT = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors';
const LABEL = 'block text-xs font-medium text-gray-500 mb-1';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function fmtCur(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function SummaryCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 700, color: '#0a1628', marginTop: 6, lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export default function TeamPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [commissionRate, setCommissionRate] = useState(2.0);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [goalModal, setGoalModal] = useState<{ id: number; name: string } | null>(null);
  const [goalInput, setGoalInput] = useState(5);
  const [savingGoal, setSavingGoal] = useState(false);

  const [perfModal, setPerfModal] = useState<User | null>(null);

  const [notifyModal, setNotifyModal] = useState<User | null>(null);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifResult, setNotifResult] = useState('');

  const now = new Date();
  const som = new Date(now.getFullYear(), now.getMonth(), 1);
  const soldVehicles = vehicles.filter(v => v.is_sold);

  function salesMes(userId: number): Vehicle[] {
    return soldVehicles.filter(v => v.sold_by === userId && v.sold_at && new Date(v.sold_at) >= som);
  }

  function salesAll(userId: number): Vehicle[] {
    return soldVehicles.filter(v => v.sold_by === userId);
  }

  const totalFuncionarios = users.length;
  const vendasEquipeMes = users.reduce((acc, u) => acc + salesMes(u.id).length, 0);
  let melhorVendedor: User | null = null;
  let maxVendasMes = 0;
  for (const u of users) {
    const cnt = salesMes(u.id).length;
    if (cnt > maxVendasMes) { maxVendasMes = cnt; melhorVendedor = u; }
  }

  useEffect(() => {
    if (!isTokenValid()) { removeToken(); router.replace('/admin/login'); return; }
    const t = getToken()!;
    setToken(t);
    getMe(t).then(u => {
      if (u.role !== 'owner') { router.replace('/admin'); return; }
      Promise.all([getUsers(t), getVehicles({ include_sold: true }), getSettings()])
        .then(([us, vs, s]) => {
          setUsers(us);
          setVehicles(vs);
          setCommissionRate(s.commission_rate ?? 2.0);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }).catch(() => router.replace('/admin/login'));
  }, [router]);

  function openAdd() {
    setAddName(''); setAddEmail(''); setAddPassword(''); setAddError('');
    setShowAdd(true);
  }

  async function handleCreate() {
    if (!token) return;
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) { setAddError('Preencha todos os campos.'); return; }
    setAdding(true); setAddError('');
    try {
      const user = await createUser({ name: addName, email: addEmail, password: addPassword }, token);
      setUsers(prev => [...prev, user]);
      setShowAdd(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Erro ao criar usuário.');
    } finally { setAdding(false); }
  }

  async function handleSaveGoal() {
    if (!token || !goalModal) return;
    setSavingGoal(true);
    try {
      const updated = await updateEmployeeGoal(goalModal.id, goalInput, token);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setGoalModal(null);
    } catch { alert('Erro ao salvar meta.'); }
    finally { setSavingGoal(false); }
  }

  async function handleDelete() {
    if (!token || !deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteUser(deleteConfirm.id, token);
      setUsers(prev => prev.filter(u => u.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch { alert('Erro ao remover usuário.'); }
    finally { setDeleting(false); }
  }

  async function handleSendNotif() {
    if (!token || !notifyModal || !notifyMsg.trim()) return;
    setSendingNotif(true); setNotifResult('');
    try {
      await sendNotificationToUser(notifyModal.id, notifyMsg, token);
      setNotifResult('Enviado!');
    } catch { setNotifResult('Erro ao enviar.'); }
    finally { setSendingNotif(false); }
  }

  if (!token) return null;

  const perfSalesAll = perfModal ? salesAll(perfModal.id) : [];
  const perfTotalRevenue = perfSalesAll.reduce((acc, v) => acc + v.price, 0);
  const perfTotalCommission = perfSalesAll.reduce((acc, v) => acc + v.price * ((v.commission_rate ?? commissionRate) / 100), 0);
  const perfLast10 = [...perfSalesAll]
    .sort((a, b) => new Date(b.sold_at ?? 0).getTime() - new Date(a.sold_at ?? 0).getTime())
    .slice(0, 10);

  const MODAL_WRAP = 'fixed inset-0 z-50 flex items-center justify-center p-4';
  const MODAL_OVERLAY: React.CSSProperties = { background: 'rgba(0,0,0,0.45)' };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Add modal ── */}
        {showAdd && (
          <div className={MODAL_WRAP} style={MODAL_OVERLAY}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
              <h3 className="text-base font-bold text-gray-900 mb-5">Adicionar funcionário</h3>
              <div className="space-y-3">
                <div><label className={LABEL}>Nome</label><input className={INPUT} value={addName} onChange={e => setAddName(e.target.value)} autoFocus /></div>
                <div><label className={LABEL}>E-mail</label><input className={INPUT} type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)} /></div>
                <div><label className={LABEL}>Senha</label><input className={INPUT} type="password" value={addPassword} onChange={e => setAddPassword(e.target.value)} /></div>
                {addError && <p className="text-xs text-red-500">{addError}</p>}
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button onClick={handleCreate} disabled={adding} className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: '#0a1628' }}>
                  {adding ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete modal ── */}
        {deleteConfirm && (
          <div className={MODAL_WRAP} style={MODAL_OVERLAY}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
              <h3 className="text-base font-bold text-gray-900 mb-2">Remover funcionário</h3>
              <p className="text-sm text-gray-500 mb-6">Tem certeza que deseja remover <span className="font-semibold text-gray-800">{deleteConfirm.name}</span>?</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: '#cc0000' }}>
                  {deleting ? 'Removendo...' : 'Remover'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Goal modal ── */}
        {goalModal && (
          <div className={MODAL_WRAP} style={MODAL_OVERLAY}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 360, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
              <h3 className="text-base font-bold text-gray-900 mb-1">Meta mensal</h3>
              <p className="text-sm text-gray-400 mb-5">{goalModal.name}</p>
              <div>
                <label className={LABEL}>Meta de vendas por mês</label>
                <input className={INPUT} type="number" min={1} value={goalInput} onChange={e => setGoalInput(parseInt(e.target.value) || 1)} autoFocus />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => setGoalModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSaveGoal} disabled={savingGoal} className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: '#0a1628' }}>
                  {savingGoal ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Performance modal ── */}
        {perfModal && (
          <div className={MODAL_WRAP} style={MODAL_OVERLAY}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 560, width: '100%', maxHeight: '82vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Performance</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{perfModal.name}</p>
                </div>
                <button onClick={() => setPerfModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none mt-0.5">×</button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Total de vendas', value: perfSalesAll.length, color: '#0a1628' },
                  { label: 'Faturamento total', value: fmtCur(perfTotalRevenue), color: '#0a1628' },
                  { label: 'Comissão estimada', value: fmtCur(perfTotalCommission), color: '#22c55e' },
                ].map(c => (
                  <div key={c.label} style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px' }}>
                    <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: c.color, marginTop: 4 }}>{c.value}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Últimas vendas</p>
              {perfLast10.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma venda registrada.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {perfLast10.map(v => (
                    <div key={v.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{v.brand} {v.model} {v.year}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{v.sold_at ? fmtDate(v.sold_at) : '—'}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{fmtCur(v.price)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Notify modal ── */}
        {notifyModal && (
          <div className={MODAL_WRAP} style={MODAL_OVERLAY}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 440, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Enviar notificação</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{notifyModal.name}</p>
                </div>
                <button onClick={() => { setNotifyModal(null); setNotifyMsg(''); setNotifResult(''); }} className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none mt-0.5">×</button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {['💪 Continue assim!', '🎯 Falta pouco para a meta!', '🏆 Excelente trabalho!'].map(msg => (
                  <button key={msg} onClick={() => setNotifyMsg(msg)}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition-colors">
                    {msg}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label className={LABEL}>Mensagem</label>
                <textarea
                  className={`${INPUT} resize-none`}
                  rows={3}
                  value={notifyMsg}
                  onChange={e => setNotifyMsg(e.target.value)}
                  placeholder="Digite sua mensagem..."
                />
              </div>

              <div className="flex items-center gap-3 justify-end">
                {notifResult && (
                  <span className={`text-xs font-medium ${notifResult.includes('Erro') ? 'text-red-500' : 'text-green-600'}`}>{notifResult}</span>
                )}
                <button
                  onClick={handleSendNotif}
                  disabled={sendingNotif || !notifyMsg.trim()}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: '#0a1628' }}
                >
                  {sendingNotif ? 'Enviando...' : 'Enviar notificação'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Equipe</h1>
          <button onClick={openAdd} className="text-sm text-white font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90" style={{ background: '#0a1628' }}>
            + Adicionar funcionário
          </button>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label="Total de funcionários" value={totalFuncionarios} />
          <SummaryCard label="Vendas da equipe este mês" value={vendasEquipeMes} />
          <SummaryCard
            label="Melhor vendedor do mês"
            value={melhorVendedor && maxVendasMes > 0 ? melhorVendedor.name : '—'}
            sub={melhorVendedor && maxVendasMes > 0 ? `${maxVendasMes} venda${maxVendasMes !== 1 ? 's' : ''} este mês` : undefined}
          />
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-sm text-center text-gray-400">Carregando...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-sm text-center text-gray-400">Nenhum funcionário cadastrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3">Nome</th>
                    <th className="px-5 py-3">E-mail</th>
                    <th className="px-5 py-3">Vendas do mês</th>
                    <th className="px-5 py-3">Faturamento</th>
                    <th className="px-5 py-3">Meta</th>
                    <th className="px-5 py-3">Meta mensal</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => {
                    const sm = salesMes(u.id);
                    const fat = sm.reduce((acc, v) => acc + v.price, 0);
                    const meta = u.monthly_goal ?? 5;
                    const pct = Math.min(100, Math.round((sm.length / meta) * 100));
                    const barColor = pct >= 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#cc0000';
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">{u.name}</td>
                        <td className="px-5 py-3 text-gray-500">{u.email}</td>
                        <td className="px-5 py-3 font-semibold text-gray-800">{sm.length}</td>
                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmtCur(fat)}</td>
                        <td className="px-5 py-3">
                          <div style={{ width: 80, height: 6, background: '#f3f4f6', borderRadius: 99 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 99, transition: 'width 0.4s' }} />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{sm.length}/{meta}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-gray-900">{u.monthly_goal ?? 5} / mês</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                            Ativo
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { setGoalInput(u.monthly_goal ?? 5); setGoalModal({ id: u.id, name: u.name }); }}
                              className="text-xs border px-2.5 py-1 rounded-md transition-colors whitespace-nowrap hover:opacity-80"
                              style={{ borderColor: '#0a1628', color: '#0a1628' }}
                            >
                              Meta
                            </button>
                            <button
                              onClick={() => setPerfModal(u)}
                              className="text-xs border px-2.5 py-1 rounded-md transition-colors whitespace-nowrap hover:opacity-80"
                              style={{ borderColor: '#6366f1', color: '#6366f1' }}
                            >
                              Performance
                            </button>
<button
                              onClick={() => setDeleteConfirm({ id: u.id, name: u.name })}
                              className="text-xs border border-red-200 text-red-500 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors"
                            >
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
