
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { 
  Menu, X, Home, Heart, Activity, Map, MessageSquare, 
  Settings, LogOut, Bell, User as UserIcon, ShieldAlert,
  Droplet, Truck, FileText, Image
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active, onClick }: any) => (
  <Link 
    to={path} 
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, theme, toggleTheme, notifications } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard', roles: ['INDIVIDUAL', 'ORGANIZATION', 'ADMIN'] },
    { icon: Heart, label: 'Campaigns', path: '/campaigns', roles: ['INDIVIDUAL', 'ORGANIZATION'] },
    { icon: Droplet, label: 'Blood Bank', path: '/blood', roles: ['INDIVIDUAL', 'ORGANIZATION'] },
    { icon: ShieldAlert, label: 'Disaster Relief', path: '/disaster', roles: ['INDIVIDUAL', 'ORGANIZATION'] },
    { icon: Activity, label: 'Tutoring Center', path: '/tutoring', roles: ['INDIVIDUAL'] },
    { icon: Image, label: 'Gallery', path: '/gallery', roles: ['INDIVIDUAL', 'ORGANIZATION', 'ADMIN'] },
    { icon: Truck, label: 'Inventory', path: '/inventory', roles: ['ORGANIZATION'] },
    { icon: FileText, label: 'Reports', path: '/reports', roles: ['ORGANIZATION', 'ADMIN'] },
    { icon: UserIcon, label: 'Admin Console', path: '/admin', roles: ['ADMIN'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || 'INDIVIDUAL'));

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-r border-slate-200 dark:border-slate-700
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
              D
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-500">
              Daan Bridge
            </span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-500">
            <X size={24} />
          </button>
        </div>

        <nav className="px-4 space-y-2 mt-4">
          {filteredMenu.map((item) => (
            <SidebarItem 
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              active={location.pathname === item.path}
              onClick={() => setIsSidebarOpen(false)}
            />
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
           <div className="flex items-center space-x-3 mb-4 px-2">
             <img src={user?.avatar} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-primary-500" />
             <div className="flex-1 min-w-0">
               <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
               <p className="text-xs text-slate-500 truncate">{user?.role}</p>
             </div>
           </div>
           <div className="flex space-x-2">
              <Link to="/chat" className="flex-1 flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-primary-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors">
                <MessageSquare size={18} />
              </Link>
              <button onClick={toggleTheme} className="flex-1 flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-primary-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors">
                 {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button onClick={handleLogout} className="flex-1 flex items-center justify-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-500 transition-colors">
                <LogOut size={18} />
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto h-screen">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-600 dark:text-slate-300">
            <Menu size={24} />
          </button>
          
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 capitalize">
            {location.pathname.split('/')[1] || 'Dashboard'}
          </h2>

          <div className="flex items-center space-x-4">
             <Link to="/map" className="p-2 text-slate-500 hover:text-primary-600 transition-colors relative">
                <Map size={20} />
             </Link>
             <button className="p-2 text-slate-500 hover:text-primary-600 transition-colors relative">
                <Bell size={20} />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
             </button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
};
