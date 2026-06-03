// src/components/Layout.jsx

import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FlaskConical, ClipboardList,
  ShoppingBag, Package, LogOut, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const adminNav = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/admin/dashboard' },
  { icon: FlaskConical,    label: 'Products',  to: '/admin/products'  },
  { icon: ClipboardList,   label: 'Orders',    to: '/admin/orders'    },
];

const sellerNav = [
  { icon: ShoppingBag, label: 'Shop',      to: '/seller/shop'      },
  { icon: Package,     label: 'My Orders', to: '/seller/my-orders' },
];

const pageMeta = {
  '/admin/dashboard': { title: 'Dashboard',  sub: 'Lab inventory overview' },
  '/admin/products':  { title: 'Products',   sub: 'Manage chemicals and equipment' },
  '/admin/orders':    { title: 'Orders',     sub: 'Review and manage seller orders' },
  '/seller/shop':     { title: 'Shop',       sub: 'Browse products and place orders' },
  '/seller/my-orders':{ title: 'My Orders',  sub: 'Your order history' },
};

export default function Layout({ children }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const nav     = isAdmin ? adminNav : sellerNav;
  const meta    = pageMeta[pathname] || { title: 'AASAMED', sub: '' };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><FlaskConical size={17} /></div>
          <div>
            <div className="brand-text">AASAMED</div>
            <div className="brand-sub">Lab Management</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">{isAdmin ? 'Admin' : 'Seller'}</div>
          {nav.map(({ icon: Icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button
            id="logout-btn"
            className="btn btn-outline btn-full btn-sm"
            onClick={() => { logout(); navigate('/login'); }}
            style={{ color: 'var(--red)', borderColor: '#fecaca', fontSize: 12 }}
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            <h2>{meta.title}</h2>
            {meta.sub && <p>{meta.sub}</p>}
          </div>
          <div className="topbar-right">
            <span className={`badge ${user?.role === 'admin' ? 'badge-blue' : 'badge-gray'}`}>
              <User size={10} /> {user?.role}
            </span>
          </div>
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
