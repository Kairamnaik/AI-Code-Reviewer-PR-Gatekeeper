import React, { useState, useEffect } from 'react';
import { Shield, Loader, Clock, User, Activity } from 'lucide-react';
import API from '../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/audit-logs');
      setLogs(data);
      setError(null);
    } catch (err) {
      console.error('[AuditLogs] Fetch failed:', err);
      setError('Failed to retrieve audit log records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionColor = (action) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'LINK_REPO':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'UNLINK_REPO':
        return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'AI_REVIEW':
        return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'WEBHOOK_EVENT':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center border-rose-500/20 text-rose-455">
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 text-left">
      <div className="glass-panel rounded-2xl border-slate-200 p-6 overflow-hidden">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <Shield size={16} className="text-indigo-500" />
              Security Audit Trail
            </h3>
            <p className="text-xs text-slate-500">Immutable trail of developer actions, webhook triggers, and code audits</p>
          </div>
          
          <button
            onClick={fetchLogs}
            className="text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-1.5 px-3.5 rounded-lg transition-all cursor-pointer"
          >
            Refresh Logs
          </button>
        </div>

        {/* Audit Timeline */}
        <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div key={log._id} className="relative">
                {/* Timeline Dot */}
                <span className="absolute -left-9 top-1.5 flex items-center justify-center h-6 w-6 rounded-full bg-white border border-slate-200 text-slate-400">
                  <Activity size={10} />
                </span>

                <div className="bg-white/60 border border-slate-200/50 p-4 rounded-xl max-w-4xl hover:border-slate-300 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 font-mono">
                        <User size={12} className="text-slate-400" />
                        {log.user}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                      <Clock size={10} />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 font-sans leading-relaxed">
                    {log.details}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-400 py-12 text-xs font-semibold uppercase tracking-wider">
              No audit logs captured.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
