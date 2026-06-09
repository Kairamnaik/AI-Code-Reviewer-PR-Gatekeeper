import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  GitBranch, 
  ShieldAlert, 
  FileCode, 
  LogOut, 
  User as UserIcon
} from 'lucide-react';
import logoSvg from '../assets/vite.svg';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Repositories', path: '/repositories', icon: GitBranch },
    { name: 'PR Reviews', path: '/reviews', icon: FileCode },
    { name: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white/80 border-r border-slate-200 flex flex-col justify-between backdrop-blur-md">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-200/60">
            <img src={logoSvg} alt="PR Gatekeeper Logo" className="w-8 h-8" />
            <div>
              <span className="font-bold text-lg tracking-wider text-gradient-purple font-sans">PR GATEKEEPER</span>
              <span className="block text-[10px] text-indigo-600 uppercase font-semibold">AI Auditor</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-indigo-600/10 text-indigo-600 border border-indigo-500/20 glow-indigo' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile section */}
        <div className="p-4 border-t border-slate-200/60">
          <div className="flex items-center justify-between bg-slate-100/60 p-3 rounded-xl border border-slate-200/50">
            <div className="flex items-center gap-3 min-w-0">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.username} 
                  className="w-9 h-9 rounded-full border border-slate-350 object-cover" 
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-600/10 text-indigo-600 border border-indigo-500/30 flex items-center justify-center">
                  <UserIcon size={18} />
                </div>
              )}
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-slate-700 truncate">{user?.username}</span>
                <span className="block text-[11px] text-slate-400 truncate">{user?.email || 'GitHub Connected'}</span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg transition-colors hover:bg-rose-50"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white/40 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-800 uppercase font-sans">
              {menuItems.find(m => m.path === location.pathname)?.name || 'Audit Details'}
            </h1>
            <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Gatekeeper Online
            </span>
          </div>

          <div className="flex items-center gap-4">
          </div>
        </header>

        {/* Page Content Router View */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 relative flex flex-col justify-between">
          {/* Subtle glowing ambient spots */}
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/8 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
          
          <div className="relative z-10 max-w-7xl w-full mx-auto flex-1">
            {children}
          </div>

          {/* Centered Middle-Bottom Footer */}
          <footer className="relative z-10 text-center text-[10px] text-slate-400 font-medium leading-relaxed mt-12 border-t border-slate-200/55 pt-6 max-w-7xl w-full mx-auto">
            <div>© 2026 AI Code Reviewer & PR gatekeeper All rights reserved.</div>
            <div className="text-indigo-600 font-bold uppercase tracking-wider mt-1">DESIGNED BY BHUKYA KAIRAM</div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
