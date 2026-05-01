'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fuel, Users, Receipt, Link2, Settings } from 'lucide-react';
import styles from './sidebar.module.css';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Panel de Control', icon: Fuel },
  { href: '/dashboard/empleados', label: 'Empleados y Roles', icon: Users },
  { href: '/dashboard/facturacion', label: 'Facturación AFIP', icon: Receipt },
  { href: '/dashboard/integraciones', label: 'Integraciones', icon: Link2 },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
];

export default function GlobalSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.globalSidebar}>
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}><Fuel size={20} color="white" /></div>
        <span className={styles.logoText}>Surt<span className={styles.logoHighlight}>OS</span></span>
      </div>

      <nav className={styles.navMenu}>
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={18} className={styles.navIcon} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className={styles.sidebarFooter}>
        <div className={styles.versionInfo}>
          VOX Forecourt SaaS<br/>
          Versión 2.0.1
        </div>
      </div>
    </aside>
  );
}
