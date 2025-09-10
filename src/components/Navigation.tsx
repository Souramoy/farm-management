import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Home, 
  Scan, 
  FileText, 
  GraduationCap, 
  Bell,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Scan, label: 'Scan', path: '/scan' },
    { icon: FileText, label: 'Compliance', path: '/compliance' },
    { icon: GraduationCap, label: 'Training', path: '/training' },
    { icon: Bell, label: 'Alerts', path: '/alerts' },
  ];

  const adminItems = user?.role === 'admin' ? [
    { icon: Settings, label: 'Admin', path: '/admin' }
  ] : [];

  const allItems = [...navItems, ...adminItems];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:top-0 md:left-0 md:bottom-auto md:w-64 md:h-screen">
      {/* Mobile Navigation */}
      <div className="md:hidden glass-strong border-t border-white/10 px-4 py-2">
        <div className="flex justify-around">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:h-full glass-strong border-r border-white/10">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">FarmManager</h2>
              <p className="text-xs text-gray-400">{user?.farmName}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4">
          <div className="space-y-2">
            {allItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{user?.username}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-2 text-gray-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navigation;