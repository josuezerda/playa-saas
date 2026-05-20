'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Fuel, Users, Receipt, Link2, Settings, MessageSquare, ArrowLeft, LogOut, FileSpreadsheet } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import styles from './sidebar.module.css';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Panel de Control', icon: Fuel },
  { href: '/dashboard/empleados', label: 'Empleados y Roles', icon: Users },
  { href: '/dashboard/planillas', label: 'Planillas y Reportes', icon: FileSpreadsheet },
  { href: '/dashboard/crm', label: 'CRM — Clientes', icon: MessageSquare },
  { href: '/dashboard/facturacion', label: 'Facturación AFIP', icon: Receipt },
  { href: '/dashboard/integraciones', label: 'Integraciones', icon: Link2 },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
];

interface GlobalSidebarProps {
  isSuperadmin: boolean;
  tenantId?: string;
}

export default function GlobalSidebar({ isSuperadmin, tenantId }: GlobalSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Prioridad: 1) URL ?tenant=X, 2) prop tenantId del layout
  const activeTenant = searchParams.get('tenant') || tenantId || '';
  const tenantQueryString = activeTenant ? `?tenant=${activeTenant}` : '';

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className={styles.globalSidebar}>
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}><Fuel size={20} color="white" /></div>
        <span className={styles.logoText}>Surt<span className={styles.logoHighlight}>OS</span></span>
      </div>

      <nav className={styles.navMenu}>
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const hrefWithTenant = `${item.href}${tenantQueryString}`;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={hrefWithTenant} 
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={18} className={styles.navIcon} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className={styles.sidebarFooter}>
        {isSuperadmin && (
          <div className={styles.superadminActions}>
            <Link href="/admin" className={styles.btnBackAdmin}>
              <ArrowLeft size={14} />
              Plan Maestro
            </Link>
            <button onClick={handleLogout} className={styles.btnLogout}>
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        )}
        <div className={styles.versionInfo}>
          VOX Forecourt SaaS<br/>
          Versión 2.0.1
        </div>
      </div>
    </aside>
  );
}
