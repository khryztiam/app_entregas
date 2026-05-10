// src/components/Layout.tsx
import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import {
  FaBars,
  FaChartBar,
  FaChartLine,
  FaClipboardList,
  FaUsers,
} from 'react-icons/fa';
import Sidebar from './Sidebar';
import styles from '@/styles/Layout.module.css';
import { APP_NAME } from '@/config/app';

const HEADER_ICONS = {
  dashboard: <FaChartBar />,
  summary: <FaChartLine />,
  control: <FaClipboardList />,
  globalusers: <FaUsers />,
  default: <FaClipboardList />,
} as const;

// ─── Metadata de cada ruta (título y subtítulo del Page Header) ───────────────
// Agrega aquí las rutas nuevas que crees en el futuro.
const PAGE_META = {
  '/dashboard':        { title: 'Panel de Control',       subtitle: 'Revision rapida movimientos'      },
  '/admin/asignacion':       { title: 'Gestión de Personas',          subtitle: 'Registro y administración de personas'   },
  '/admin/inventario':  { title: 'Control de servicios',       subtitle: 'Revisión y ajuste administrativo'   },
  '/admin/usuarios':            { title: 'Usuarios globales',          subtitle: 'Gestión global de usuarios'         },
  '/prestamos':       { title: 'Solicitudes de servicio',    subtitle: 'Crea y consulta solicitudes'         },
  '/personas':        { title: 'Gestión de Personas',    subtitle: 'Registro y administración de personas' },
} as const;

const ROUTE_ICON_BY_PATH = {
  '/dashboard': 'summary',
  '/admin/asignacion': 'dashboard',
  '/admin/inventario': 'control',
  '/admin/usuarios': 'globalusers',
  '/prestamos': 'control',
  '/personas': 'globalusers',
} as const;

// Rutas donde no se muestra el layout (login / raíz)
const NO_LAYOUT_ROUTES = ['/', '/auth/login', '/login'];

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  // En login y raíz renderizar solo el children sin layout
  if (NO_LAYOUT_ROUTES.includes(router.pathname)) {
    return <>{children}</>;
  }

  const meta = PAGE_META[router.pathname as keyof typeof PAGE_META] || { title: APP_NAME, subtitle: '' };
  const headerIcon = HEADER_ICONS[ROUTE_ICON_BY_PATH[router.pathname as keyof typeof ROUTE_ICON_BY_PATH] || 'default'] || HEADER_ICONS.default;

  return (
    <div className={styles.wrapper}>
      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Área principal ────────────────────────────────────────────── */}
      <div className={styles.main}>

        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            {/* Hamburger — visible en móvil vía CSS */}
            <button
              className={styles.hamburger}
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <FaBars size={20} />
            </button>

            <div className={styles.headerIcon} aria-hidden="true">
              {headerIcon}
            </div>

            <div className={styles.titleBlock}>
              <h1 className={styles.pageTitle}>{meta.title}</h1>
              {meta.subtitle && (
                <p className={styles.pageSubtitle}>{meta.subtitle}</p>
              )}
            </div>
          </div>
        </header>

        {/* Contenido de la página */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
