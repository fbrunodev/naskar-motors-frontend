'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSettings, getMe, updateSettings, uploadLogo, updateMe } from '@/lib/api';
import { getToken, isTokenValid, removeToken } from '@/lib/auth';
import { isPushSubscribed, subscribeToPush, unsubscribeFromPush, testPushNotification } from '@/lib/notifications';
import AdminLayout from '@/components/AdminLayout';
import type { User } from '@/types';

const INPUT = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors';
const LABEL = 'block text-xs font-medium text-gray-500 mb-1';
const CARD  = 'bg-white rounded-xl border border-gray-100 shadow-sm p-6';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={CARD}>
      <h2 className="text-sm font-semibold text-gray-700 mb-5">{title}</h2>
      {children}
    </div>
  );
}

function maskWhatsApp(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2)  return d.length ? `(${d}` : '';
  if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

export default function SettingsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  // Store data
  const [storeName, setStoreName]   = useState('');
  const [city, setCity]             = useState('');
  const [whatsapp, setWhatsapp]     = useState('');
  const [logoUrl, setLogoUrl]       = useState<string | null>(null);
  const [savingStore, setSavingStore] = useState(false);
  const [storeMsg, setStoreMsg]     = useState('');

  // Commission
  const [commissionRate, setCommissionRate] = useState(2.0);
  const [savingCommission, setSavingCommission] = useState(false);
  const [commissionMsg, setCommissionMsg] = useState('');

  // Colors
  const [primary, setPrimary]       = useState('#0a1628');
  const [secondary, setSecondary]   = useState('#cc0000');

  // Account — dados pessoais
  const [acName, setAcName]         = useState('');
  const [acEmail, setAcEmail]       = useState('');
  const [acDataPw, setAcDataPw]     = useState('');
  const [savingData, setSavingData] = useState(false);
  const [dataMsg, setDataMsg]       = useState('');

  // Account — alterar senha
  const [acCurrentPw, setAcCurrentPw] = useState('');
  const [acNewPw, setAcNewPw]         = useState('');
  const [acConfirmPw, setAcConfirmPw] = useState('');
  const [savingPw, setSavingPw]       = useState(false);
  const [pwMsg, setPwMsg]             = useState('');

  const [logoUploading, setLogoUploading] = useState(false);

  // Push notifications
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushMsg, setPushMsg] = useState('');

  useEffect(() => {
    if (!isTokenValid()) { removeToken(); router.replace('/admin/login'); return; }
    const t = getToken()!;
    setToken(t);
    getSettings().then(s => {
      setStoreName(s.name);
      setCity(s.city ?? '');
      setWhatsapp(s.whatsapp ?? '');
      setLogoUrl(s.logo_url ?? null);
      setPrimary(s.primary_color ?? '#0a1628');
      setSecondary(s.secondary_color ?? '#cc0000');
      setCommissionRate(s.commission_rate ?? 2.0);
    }).catch(console.error);
    getMe(t).then(u => {
      setMe(u);
      setAcName(u.name);
      setAcEmail(u.email);
      if (u.role !== 'owner') router.replace('/admin');
    }).catch(() => router.replace('/admin/login'));

    if (typeof window !== 'undefined' && 'PushManager' in window) {
      setPushSupported(true);
      isPushSubscribed().then(setPushEnabled);
    }
  }, [router]);

  async function handleTogglePush() {
    if (!token) return;
    setPushLoading(true); setPushMsg('');
    try {
      if (pushEnabled) {
        await unsubscribeFromPush(token);
        setPushEnabled(false);
        setPushMsg('Notificações desativadas.');
      } else {
        await subscribeToPush(token);
        setPushEnabled(true);
        setPushMsg('Notificações ativadas!');
      }
    } catch (err) {
      setPushMsg(err instanceof Error ? err.message : 'Erro ao configurar notificações.');
    } finally { setPushLoading(false); }
  }

  async function handleTestPush() {
    if (!token) return;
    setPushMsg('');
    try {
      await testPushNotification(token);
      setPushMsg('Notificação enviada!');
    } catch { setPushMsg('Erro ao enviar.'); }
  }

  async function handleSaveStore() {
    if (!token) return;
    setSavingStore(true); setStoreMsg('');
    try {
      await updateSettings({ name: storeName, city: city || null, whatsapp: whatsapp || null, primary_color: primary, secondary_color: secondary }, token);
      setStoreMsg('Salvo com sucesso!');
    } catch { setStoreMsg('Erro ao salvar.'); }
    finally { setSavingStore(false); }
  }

  async function handleSaveCommission() {
    if (!token) return;
    setSavingCommission(true); setCommissionMsg('');
    try {
      await updateSettings({ name: storeName, city: city || null, whatsapp: whatsapp || null, primary_color: primary, secondary_color: secondary, commission_rate: commissionRate }, token);
      setCommissionMsg('Comissão salva!');
    } catch { setCommissionMsg('Erro ao salvar.'); }
    finally { setSavingCommission(false); }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setLogoUploading(true);
    try {
      const { url } = await uploadLogo(file, token);
      setLogoUrl(url);
    } catch { alert('Erro ao enviar logo.'); }
    finally { setLogoUploading(false); }
  }

  function pwStrength(pw: string): { label: string; color: string; pct: number } {
    if (!pw) return { label: '', color: '', pct: 0 };
    const score =
      (pw.length >= 8  ? 1 : 0) +
      (pw.length >= 12 ? 1 : 0) +
      (/[A-Z]/.test(pw)         ? 1 : 0) +
      (/\d/.test(pw)            ? 1 : 0) +
      (/[^a-zA-Z0-9]/.test(pw) ? 1 : 0);
    if (score <= 2) return { label: 'Fraca', color: '#cc0000', pct: 33  };
    if (score <= 3) return { label: 'Média', color: '#f97316', pct: 66  };
    return              { label: 'Forte', color: '#22c55e', pct: 100 };
  }

  async function handleSaveData() {
    if (!token) return;
    if (!acDataPw) { setDataMsg('Informe sua senha atual para salvar.'); return; }
    setSavingData(true); setDataMsg('');
    try {
      const updated = await updateMe({ name: acName || undefined, email: acEmail || undefined, current_password: acDataPw }, token);
      setMe(updated);
      setAcDataPw('');
      setDataMsg('Dados atualizados!');
    } catch (err: unknown) {
      setDataMsg(err instanceof Error ? err.message : 'Erro ao atualizar.');
    } finally { setSavingData(false); }
  }

  async function handleChangePw() {
    if (!token) return;
    if (!acCurrentPw) { setPwMsg('Informe sua senha atual.'); return; }
    if (acNewPw.length < 8) { setPwMsg('A nova senha deve ter pelo menos 8 caracteres.'); return; }
    if (acNewPw !== acConfirmPw) { setPwMsg('As senhas não coincidem.'); return; }
    setSavingPw(true); setPwMsg('');
    try {
      await updateMe({ current_password: acCurrentPw, new_password: acNewPw }, token);
      setAcCurrentPw(''); setAcNewPw(''); setAcConfirmPw('');
      setPwMsg('Senha alterada com sucesso!');
    } catch (err: unknown) {
      setPwMsg(err instanceof Error ? err.message : 'Erro ao alterar senha.');
    } finally { setSavingPw(false); }
  }

  if (!token || !me) return null;

  return (
    <AdminLayout>
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        <h1 className="text-xl font-bold text-gray-900">Configurações</h1>

        {/* Dados da Loja */}
        <Section title="Dados da Loja">
          <div className="space-y-4">
            <div>
              <label className={LABEL}>Nome da loja</label>
              <input className={INPUT} value={storeName} onChange={e => setStoreName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Cidade</label>
                <input className={INPUT} value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: Fortaleza, CE" />
              </div>
              <div>
                <label className={LABEL}>WhatsApp</label>
                <input className={INPUT} value={whatsapp} onChange={e => setWhatsapp(maskWhatsApp(e.target.value))} placeholder="(85) 99999-9999" />
              </div>
            </div>

            {/* Logo */}
            <div>
              <label className={LABEL}>Logo da loja</label>
              <div className="flex items-center justify-end gap-4">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-14 w-auto object-contain rounded border border-gray-100" />
                ) : (
                  <div className="h-14 w-20 rounded border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">Sem logo</div>
                )}
                <button
                  onClick={() => logoRef.current?.click()}
                  disabled={logoUploading}
                  className="text-sm px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {logoUploading ? 'Enviando...' : 'Trocar logo'}
                </button>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button onClick={handleSaveStore} disabled={savingStore}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: '#0a1628' }}>
                {savingStore ? 'Salvando...' : 'Salvar'}
              </button>
              {storeMsg && <span className={`text-xs font-medium ${storeMsg.includes('Erro') ? 'text-red-500' : 'text-green-600'}`}>{storeMsg}</span>}
            </div>
          </div>
        </Section>

        {/* Comissão de Vendas */}
        <Section title="Comissão de Vendas">
          <p className="text-xs text-gray-400 mb-4">Taxa de comissão padrão aplicada a todos os vendedores</p>
          <div className="space-y-4">
            <div>
              <label className={LABEL}>Comissão (%)</label>
              <input
                className={`${INPUT} max-w-[200px]`}
                type="number"
                step={0.5}
                min={0}
                max={100}
                value={commissionRate}
                onChange={e => setCommissionRate(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-400 mt-1">Ex: 2% sobre o valor de cada veículo vendido</p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button onClick={handleSaveCommission} disabled={savingCommission}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: '#0a1628' }}>
                {savingCommission ? 'Salvando...' : 'Salvar comissão'}
              </button>
              {commissionMsg && <span className={`text-xs font-medium ${commissionMsg.includes('Erro') ? 'text-red-500' : 'text-green-600'}`}>{commissionMsg}</span>}
            </div>
          </div>
        </Section>

        {/* Notificações Push */}
        <Section title="Notificações Push">
          {!pushSupported ? (
            <p className="text-xs text-gray-400">Notificações não disponíveis neste navegador.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Alertas em tempo real</p>
                <p className="text-xs text-gray-400 mt-0.5">Vendas, metas e veículos encalhados</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                {pushEnabled ? (
                  <span className="text-sm font-semibold text-green-600">Notificações ativas ✓</span>
                ) : (
                  <button
                    onClick={handleTogglePush}
                    disabled={pushLoading}
                    className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: '#0a1628' }}
                  >
                    {pushLoading ? 'Aguarde...' : 'Ativar notificações push'}
                  </button>
                )}
                {pushEnabled && (
                  <button
                    onClick={handleTestPush}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Testar
                  </button>
                )}
                {pushMsg && (
                  <span className={`text-xs font-medium ${pushMsg.includes('Erro') || pushMsg.includes('negada') ? 'text-red-500' : 'text-green-600'}`}>
                    {pushMsg}
                  </span>
                )}
              </div>
            </div>
          )}
        </Section>

        {/* Dados pessoais */}
        <Section title="Dados pessoais">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Nome</label>
                <input className={INPUT} value={acName} onChange={e => setAcName(e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>E-mail</label>
                <input className={INPUT} type="email" value={acEmail} onChange={e => setAcEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={LABEL}>Senha atual (obrigatória para salvar)</label>
              <input className={INPUT} type="password" value={acDataPw} onChange={e => setAcDataPw(e.target.value)} autoComplete="current-password" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button onClick={handleSaveData} disabled={savingData}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: '#0a1628' }}>
                {savingData ? 'Salvando...' : 'Atualizar dados'}
              </button>
              {dataMsg && <span className={`text-xs font-medium ${dataMsg.includes('Erro') || dataMsg.includes('Informe') || dataMsg.includes('incorreta') ? 'text-red-500' : 'text-green-600'}`}>{dataMsg}</span>}
            </div>
          </div>
        </Section>

        {/* Alterar senha */}
        <Section title="Alterar senha">
          <div className="space-y-4">
            <div>
              <label className={LABEL}>Senha atual</label>
              <input className={INPUT} type="password" value={acCurrentPw} onChange={e => setAcCurrentPw(e.target.value)} autoComplete="current-password" />
            </div>
            <div>
              <label className={LABEL}>Nova senha</label>
              <input className={INPUT} type="password" value={acNewPw} onChange={e => setAcNewPw(e.target.value)} autoComplete="new-password" />
              {acNewPw && (() => {
                const { label, color, pct } = pwStrength(acNewPw);
                return (
                  <div className="mt-2">
                    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <p className="text-xs mt-1 font-medium" style={{ color }}>{label}</p>
                  </div>
                );
              })()}
            </div>
            <div>
              <label className={LABEL}>Confirmar nova senha</label>
              <input className={INPUT} type="password" value={acConfirmPw} onChange={e => setAcConfirmPw(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button onClick={handleChangePw} disabled={savingPw}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: '#0a1628' }}>
                {savingPw ? 'Alterando...' : 'Alterar senha'}
              </button>
              {pwMsg && <span className={`text-xs font-medium ${pwMsg.includes('sucesso') ? 'text-green-600' : 'text-red-500'}`}>{pwMsg}</span>}
            </div>
          </div>
        </Section>

      </div>
    </AdminLayout>
  );
}
