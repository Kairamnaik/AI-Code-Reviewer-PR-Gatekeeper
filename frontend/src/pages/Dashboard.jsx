import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts';
import { 
  GitBranch, 
  FileCode, 
  AlertTriangle, 
  ShieldCheck, 
  Bell,
  Loader
} from 'lucide-react';
import API from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, chartsRes, notifRes] = await Promise.all([
          API.get('/dashboard/stats'),
          API.get('/dashboard/charts'),
          API.get('/notifications')
        ]);
        setStats(statsRes.data);
        setCharts(chartsRes.data);
        setNotifications(notifRes.data);
        setError(null);
      } catch (err) {
        console.error('[Dashboard] Data fetch failed:', err);
        setError('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center border-rose-500/20 text-rose-400">
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  const SEVERITY_COLORS = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#f59e0b',
    Low: '#3b82f6',
    Info: '#64748b'
  };

  // Format circular score border color
  const getScoreColorClass = (score) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-500';
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        
        {/* Security Score Card */}
        <Link to="/repositories" className="glass-panel p-6 rounded-2xl glow-indigo border-slate-200 flex flex-col items-center justify-center text-center col-span-1 md:col-span-2 lg:col-span-1 glass-panel-hover cursor-pointer block transition-all duration-350">
          <span className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wider">Security Score</span>
          <div className="relative flex items-center justify-center h-28 w-28">
            {/* SVG Circle Dial */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200"
                strokeWidth="2.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`transition-all duration-1000 ${
                  stats?.securityScore >= 90 ? 'text-emerald-500' : stats?.securityScore >= 70 ? 'text-amber-500' : 'text-rose-500'
                }`}
                strokeDasharray={`${stats?.securityScore || 0}, 100`}
                strokeWidth="2.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-2xl font-extrabold tracking-tight ${getScoreColorClass(stats?.securityScore)}`}>
                {stats?.securityScore}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Grade</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 mt-4 font-medium">Weighted repository score</span>
        </Link>

        {/* Stats cards */}
        <Link to="/repositories" className="glass-panel p-6 rounded-2xl border-slate-200 flex items-center gap-5 glass-panel-hover cursor-pointer block transition-all duration-350">
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-blue-600">
            <GitBranch size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">Connected Repos</span>
            <span className="text-3xl font-extrabold text-slate-800 mt-1 block tracking-tight">{stats?.totalRepositories}</span>
          </div>
        </Link>

        <Link to="/reviews" className="glass-panel p-6 rounded-2xl border-slate-200 flex items-center gap-5 glass-panel-hover cursor-pointer block transition-all duration-350">
          <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200 text-indigo-600">
            <FileCode size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">PRs Evaluated</span>
            <span className="text-3xl font-extrabold text-slate-800 mt-1 block tracking-tight">{stats?.totalPullRequests}</span>
          </div>
        </Link>

        <Link to="/reviews" className="glass-panel p-6 rounded-2xl border-slate-200 flex items-center gap-5 glass-panel-hover cursor-pointer block transition-all duration-350">
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-600">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">Completed Reviews</span>
            <span className="text-3xl font-extrabold text-slate-800 mt-1 block tracking-tight">{stats?.totalReviews}</span>
          </div>
        </Link>

        <Link to="/reviews" className="glass-panel p-6 rounded-2xl border-slate-200 flex items-center gap-5 glass-panel-hover cursor-pointer block transition-all duration-350">
          <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-rose-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">Issues Identified</span>
            <span className="text-3xl font-extrabold text-slate-800 mt-1 block tracking-tight">{stats?.issuesFound}</span>
          </div>
        </Link>
      </div>

      {/* Analytics Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart: Reviews per day */}
        <div className="glass-panel p-6 rounded-2xl border-slate-200 lg:col-span-2 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Review Frequency</h3>
            <p className="text-xs text-slate-500">Total automated PR code reviews performed over the last 7 days</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.reviewsPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)' }}
                  labelStyle={{ color: '#64748b', fontWeight: 'bold', fontSize: 11 }}
                  itemStyle={{ color: '#1e293b', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="reviews" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorReviews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Issues By Severity */}
        <div className="glass-panel p-6 rounded-2xl border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Issue Breakdown</h3>
            <p className="text-xs text-slate-500">Identified software vulnerabilities distributed by severity level</p>
          </div>
          <div className="h-72 w-full mt-4">
            {charts?.issuesBySeverity && charts.issuesBySeverity.some(c => c.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.issuesBySeverity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)' }}
                    labelStyle={{ color: '#64748b', fontWeight: 'bold', fontSize: 11 }}
                    itemStyle={{ color: '#1e293b', fontSize: 12 }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {charts.issuesBySeverity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center flex-col text-slate-400">
                <ShieldCheck size={48} className="text-emerald-500/30 mb-2" />
                <span className="text-xs font-semibold uppercase tracking-wider">No vulnerabilities found</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Repo Activity chart */}
        <div className="glass-panel p-6 rounded-2xl border-slate-200 lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Repository Activity</h3>
            <p className="text-xs text-slate-500">Total detected Pull Requests per connected repository</p>
          </div>
          <div className="h-64 w-full">
            {charts?.repoActivity && charts.repoActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.repoActivity} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)' }}
                    itemStyle={{ color: '#6366f1', fontSize: 12 }}
                  />
                  <Bar dataKey="prCount" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
                No active repositories connected.
              </div>
            )}
          </div>
        </div>

        {/* Notifications feed */}
        <div className="glass-panel p-6 rounded-2xl border-slate-200 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <Bell size={16} className="text-indigo-500" />
                Alerts & Feeds
              </h3>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-200/50">
                Recent
              </span>
            </div>
            <div className="space-y-3.5 overflow-y-auto max-h-[220px]">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div key={notif._id} className="text-left bg-slate-100/55 p-3 rounded-xl border border-slate-200/55 flex items-start gap-3">
                    <span className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                      notif.type === 'ERROR' ? 'bg-rose-500' : notif.type === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}></span>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-700 truncate">{notif.title}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                      <span className="block text-[9px] text-slate-400 mt-1.5 font-medium">
                        {new Date(notif.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 py-12 text-xs font-semibold uppercase tracking-wider">
                  No notifications recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
