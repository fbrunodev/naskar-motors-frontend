'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSettings, getMe } from '@/lib/api';
import { getToken, removeToken } from '@/lib/auth';
import { isPushSubscribed, subscribeToPush } from '@/lib/notifications';

// ---- Icons ----

const IconChart = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const IconCar = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17H7a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2h-2m-4 0h4m-4 0v2m4-2v2M3 9l1.5-4.5h15L21 9" />
  </svg>
);

const IconGear = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconTeam = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const IconEye = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const IconLogout = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const IconPlus = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

// ---- Desktop NavLink ----

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  external?: boolean;
}

function NavLink({ href, icon, label, active, external }: NavLinkProps) {
  const base: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 24px',
    color: '#fff',
    fontSize: '14px',
    textDecoration: 'none',
    transition: 'background 0.15s',
    borderLeft: active ? '3px solid #cc0000' : '3px solid transparent',
    backgroundColor: active ? 'rgba(255,255,255,0.1)' : undefined,
  };

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={base}
        onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = ''; }}
      >
        {icon} {label}
      </a>
    );
  }

  return (
    <Link href={href} style={base}
      onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = active ? 'rgba(255,255,255,0.1)' : ''; }}
    >
      {icon} {label}
    </Link>
  );
}

// ---- Mobile BottomNavItem ----

function BottomNavItem({ href, icon, label, active, highlight }: {
  href: string; icon: React.ReactNode; label: string; active: boolean; highlight?: boolean;
}) {
  const color = active ? '#cc0000' : 'rgba(255,255,255,0.6)';
  return (
    <Link href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', textDecoration: 'none', flex: 1 }}>
      {highlight ? (
        <span style={{ width: 40, height: 40, borderRadius: '50%', background: '#cc0000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </span>
      ) : (
        <span style={{ color, display: 'flex' }}>{icon}</span>
      )}
      <span style={{ fontSize: '10px', color: highlight ? '#cc0000' : color, fontWeight: active || highlight ? 600 : 400 }}>
        {label}
      </span>
    </Link>
  );
}

// ---- Component ----

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [storeName, setStoreName] = useState('');
  const [userRole, setUserRole] = useState('employee');
  const [notifBanner, setNotifBanner] = useState(false);
  const [subscribingNotif, setSubscribingNotif] = useState(false);

  useEffect(() => {
    getSettings().then(s => setStoreName(s.name)).catch(() => {});
    const token = getToken();
    if (token) getMe(token).then(u => setUserRole(u.role)).catch(() => {});

    if (typeof window !== 'undefined' && 'PushManager' in window && 'Notification' in window) {
      isPushSubscribed().then(subscribed => {
        if (!subscribed) setNotifBanner(true);
      });
    }
  }, []);

  async function handleSubscribeNotif() {
    const token = getToken();
    if (!token) return;
    setSubscribingNotif(true);
    try {
      await subscribeToPush(token);
      setNotifBanner(false);
    } catch {
      // Permission denied or error — hide banner anyway
      setNotifBanner(false);
    } finally { setSubscribingNotif(false); }
  }

  function logout() {
    if (!window.confirm('Tem certeza que deseja sair?')) return;
    removeToken();
    router.replace('/admin/login');
  }

  const isDashboard   = pathname === '/admin/dashboard';
  const isMyDashboard = pathname === '/admin/my-dashboard';
  const isVehicles    = pathname.startsWith('/admin/vehicles');
  const isNew         = pathname === '/admin/vehicles/new';
  const isSettings    = pathname === '/admin/settings';
  const isTeam        = pathname === '/admin/team';

  // Bottom nav uses stricter vehicle check (excludes /new which has its own slot)
  const isVehiclesList = pathname.startsWith('/admin/vehicles') && !isNew;

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex flex-col" style={{
        width: '240px',
        backgroundColor: '#0a1628',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 40,
      }}>

        {/* Logo */}
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: '16px', lineHeight: 1.3 }}>
            {storeName || 'Naskar Motors'}
          </p>
          <p style={{ color: '#cc0000', fontSize: '11px', marginTop: '5px', fontWeight: 700, letterSpacing: '0.08em' }}>
            PAINEL ADMIN
          </p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', paddingTop: '8px', paddingBottom: '8px' }}>
          {userRole === 'owner'
            ? <NavLink href="/admin/dashboard"    icon={<IconChart />} label="Dashboard"     active={isDashboard} />
            : <NavLink href="/admin/my-dashboard" icon={<IconChart />} label="Meu Dashboard" active={isMyDashboard} />
          }
          <NavLink href="/admin/vehicles" icon={<IconCar />} label="Veículos" active={isVehicles} />
          {userRole === 'owner' && (
            <NavLink href="/admin/settings" icon={<IconGear />} label="Configurações" active={isSettings} />
          )}
          {userRole === 'owner' && (
            <NavLink href="/admin/team" icon={<IconTeam />} label="Equipe" active={isTeam} />
          )}
          <NavLink href="/" icon={<IconEye />} label="Ver loja" active={false} external />
        </nav>

        {/* Notification banner */}
        {notifBanner && (
          <div style={{ padding: '12px 16px', background: 'rgba(204,0,0,0.08)', borderTop: '1px solid rgba(204,0,0,0.15)' }}>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', marginBottom: '8px', lineHeight: 1.5 }}>
              Receba alertas de vendas em tempo real.
            </p>
            <button
              onClick={handleSubscribeNotif}
              disabled={subscribingNotif}
              style={{ fontSize: '11px', fontWeight: 600, color: '#fff', background: '#cc0000', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', opacity: subscribingNotif ? 0.6 : 1 }}
            >
              {subscribingNotif ? 'Ativando...' : '🔔 Ativar notificações'}
            </button>
          </div>
        )}

        {/* Logout */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={logout}
            style={{ color: '#cc0000', fontSize: '14px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: 0 }}
          >
            <IconLogout /> Sair
          </button>
        </div>

      </aside>

      {/* Mobile bottom nav — hidden on desktop */}
      <nav className="md:hidden flex" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: 64,
        background: '#0a1628',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {userRole === 'owner' ? (
          <>
            <BottomNavItem href="/admin/dashboard"    icon={<IconChart size={22} />} label="Dashboard" active={isDashboard} />
            <BottomNavItem href="/admin/vehicles"     icon={<IconCar size={22} />}   label="Veículos"  active={isVehiclesList} />
            <BottomNavItem href="/admin/vehicles/new" icon={<IconPlus size={22} />}  label="Novo"      active={isNew} highlight />
            <BottomNavItem href="/admin/team"         icon={<IconTeam size={22} />}  label="Equipe"    active={isTeam} />
            <BottomNavItem href="/admin/settings"     icon={<IconGear size={22} />}  label="Configs"   active={isSettings} />
            <button onClick={logout} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <span style={{ color: '#cc0000', display: 'flex' }}><IconLogout /></span>
              <span style={{ fontSize: '10px', color: '#cc0000', fontWeight: 600 }}>Sair</span>
            </button>
          </>
        ) : (
          <>
            <BottomNavItem href="/admin/my-dashboard" icon={<IconChart size={22} />} label="Dashboard" active={isMyDashboard} />
            <BottomNavItem href="/admin/vehicles"     icon={<IconCar size={22} />}   label="Veículos"  active={isVehiclesList} />
            <BottomNavItem href="/admin/vehicles/new" icon={<IconPlus size={22} />}  label="Novo"      active={isNew} highlight />
            <button onClick={logout} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <span style={{ color: '#cc0000', display: 'flex' }}><IconLogout /></span>
              <span style={{ fontSize: '10px', color: '#cc0000', fontWeight: 600 }}>Sair</span>
            </button>
          </>
        )}
      </nav>
    </>
  );
}
