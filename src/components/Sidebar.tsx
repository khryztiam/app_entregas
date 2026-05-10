// src/components/Sidebar.tsx
import type { CSSProperties } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { APP_NAME } from '@/config/app';
import { mapRoleToGeneric, ROLES } from '@/config/roles';
import {
  FaClipboardList, FaUserCog, FaSignOutAlt, FaTimes, FaChartBar, FaUsers, FaChartLine,
} from 'react-icons/fa';
import styles from '@/styles/Sidebar.module.css';

const ROLE_COLOR = {
  [ROLES.ADMINISTRACION]: '#4f46e5',
  [ROLES.USUARIO]:        '#0ea5e9',
};

const ICONS = {
  dashboard:    <FaChartBar />,
  summary:      <FaChartLine />,
  clipboard:    <FaClipboardList />,
  users:        <FaUserCog />,
  globalusers:  <FaUsers />,
} as const;

const NAV_BY_ROLE = {
  [ROLES.ADMINISTRACION]: [
    {
      label: 'Administración',
      links: [
        { href: '/admin/asignacion', icon: 'globalusers' as const, label: 'Gestión de Personas' },
        { href: '/admin/inventario', icon: 'clipboard' as const, label: 'Inventario' },
        { href: '/admin/usuarios',   icon: 'users' as const,     label: 'Usuarios' },
      ],
    },
    {
      label: 'Operaciones',
      links: [
        { href: '/dashboard', icon: 'summary' as const,   label: 'Monitoreo' },
        { href: '/prestamos', icon: 'dashboard' as const, label: 'Entregas' },
      ],
    },
  ],
  [ROLES.USUARIO]: [
    {
      label: 'Mi área',
      links: [
        { href: '/dashboard', icon: 'summary' as const,   label: 'Monitoreo' },
        { href: '/prestamos', icon: 'dashboard' as const, label: 'Entregas' },
        { href: '/admin/asignacion', icon: 'globalusers' as const, label: 'Gestión de Personas' },
      ],
    },
  ],
};

const HIDDEN_ROUTES = ['/', '/login', '/auth/login'];

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, userName, logout, role } = useAuth();
  const router = useRouter();
  const genericRole = mapRoleToGeneric(role);

  if (HIDDEN_ROUTES.includes(router.pathname)) return null;

  const sections  = NAV_BY_ROLE[genericRole as keyof typeof NAV_BY_ROLE] || [];
  const roleColor = ROLE_COLOR[genericRole as keyof typeof ROLE_COLOR] || '#4f46e5';

  return (
    <>
      <div 
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`} 
        onClick={onClose} 
      />
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <div className={styles.brandInner}>
            <div className={styles.logoMark}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className={styles.brandTitle}>{APP_NAME}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><FaTimes /></button>
        </div>

        <nav className={styles.nav}>
          {sections.map((section, idx) => (
            <div key={idx} className={styles.section}>
              <p className={styles.sectionLabel}>{section.label}</p>
              {section.links.map(({ href, icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={`${styles.navLink} ${router.pathname === href ? styles.navLinkActive : ''}`}
                  style={{ '--role-color': roleColor } as CSSProperties}
                >
                  <span className={styles.navIcon}>{ICONS[icon]}</span>
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.roleBadge} style={{ background: `${roleColor}22`, color: roleColor, border: `1px solid ${roleColor}44` }}>
            <span className={styles.roleDot} style={{ background: roleColor }} />
            {genericRole}
          </div>
          <div className={styles.userRow}>
            <div className={styles.userInfo}>
              <div className={styles.avatar} style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}aa)` }}>
                {(userName || user?.username || '?')[0].toUpperCase()}
              </div>
              <div className={styles.userDetails}>
                <p className={styles.userName}>{userName || user?.username}</p>
                <p className={styles.userEmail}>{user?.username}</p>
              </div>
            </div>
            <button className={styles.logoutBtn} onClick={async () => { await logout(); router.push('/'); }}><FaSignOutAlt size={14} /></button>
          </div>
        </div>
      </aside>
    </>
  );
}