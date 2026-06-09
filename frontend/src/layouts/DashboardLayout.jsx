import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  GitBranch, 
  ShieldAlert, 
  FileCode, 
  LogOut, 
  User as UserIcon,
  Activity
} from 'lucide-react';

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
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/60 border-r border-slate-800/80 flex flex-col justify-between backdrop-blur-md">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/50">
            <div className="bg-indigo-600/20 p-2 rounded-lg border border-indigo-500/40 text-indigo-400">
              <Activity size={20} />
            </div>
            <div>
              <span className="font-bold text-lg tracking-wider text-gradient-purple font-sans">PR GATEKEEPER</span>
              <span className="block text-[10px] text-indigo-400/80 uppercase font-semibold">AI Auditor</span>
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
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/25 glow-indigo' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
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
        <div className="p-4 border-t border-slate-800/50 space-y-4">
          <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
            <div className="flex items-center gap-3 min-w-0">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.username} 
                  className="w-9 h-9 rounded-full border border-slate-700 object-cover" 
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
                  <UserIcon size={18} />
                </div>
              )}
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-slate-200 truncate">{user?.username}</span>
                <span className="block text-[11px] text-slate-500 truncate">{user?.email || 'GitHub Connected'}</span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition-colors hover:bg-rose-500/10"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
          
          <div className="text-center text-[9px] text-slate-500 font-medium leading-relaxed border-t border-slate-800/30 pt-3">
            <div>© 2026 AI Code Reviewer & PR gatekeeper All rights reserved.</div>
            <div className="text-indigo-400 font-bold uppercase tracking-wider mt-0.5">DESIGNED BY BHUKYA KAIRAM</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800/50 bg-slate-950/20 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-100 uppercase font-sans">
              {menuItems.find(m => m.path === location.pathname)?.name || 'Audit Details'}
            </h1>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Gatekeeper Online
            </span>
          </div>

          <div className="flex items-center gap-4">
          </div>
        </header>

        {/* Page Content Router View */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-950/40 relative">
          {/* Subtle glowing ambient spots */}
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
