import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/queue', label: 'Xếp hàng', icon: '🏥' },
  { to: '/checkin', label: 'Check-in', icon: '✅' },
  { to: '/visits', label: 'Lượt khám', icon: '📋' },
  { to: '/patients', label: 'Bệnh nhân', icon: '👤' },
  { to: '/config', label: 'Cấu hình', icon: '⚙️' },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-blue-700">Xếp Hàng</h1>
          <p className="text-xs text-gray-400">Smart Queue System</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
