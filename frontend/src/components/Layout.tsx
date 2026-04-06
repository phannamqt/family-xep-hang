import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/queue', label: 'Danh sách xếp hàng', icon: '🏥' },
  { to: '/checkin', label: 'Check-in', icon: '✅' },
  { to: '/visits', label: 'Lượt khám', icon: '📋' },
  { to: '/patients', label: 'Bệnh nhân', icon: '👤' },
  { to: '/config', label: 'Cấu hình', icon: '⚙️' },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const currentPage = navItems.find(n => location.pathname.startsWith(n.to))?.label ?? 'Xếp Hàng';

  return (
    <div className="flex h-dvh bg-gray-50 overflow-hidden">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 flex-col shadow-sm shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-blue-700">Xếp Hàng</h1>
          <p className="text-xs text-gray-400">Smart Queue System</p>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── MOBILE OVERLAY ── */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* ── MOBILE DRAWER ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col
        transition-transform duration-250 ease-in-out md:hidden
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h1 className="text-lg font-bold text-blue-700">Xếp Hàng</h1>
            <p className="text-xs text-gray-400">Smart Queue System</p>
          </div>
          <button onClick={() => setOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl">
            ✕
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`
              }>
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden shrink-0 bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-3">
          <button onClick={() => setOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="7" x2="21" y2="7"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="17" x2="21" y2="17"/>
            </svg>
          </button>
          <span className="font-semibold text-gray-800 text-base">{currentPage}</span>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
