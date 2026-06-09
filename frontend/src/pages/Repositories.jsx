import React, { useState, useEffect } from 'react';
import { 
  Search, 
  GitFork, 
  Plus, 
  Trash2, 
  Loader,
  Shield,
  Activity,
  Globe,
  Lock
} from 'lucide-react';
import API from '../services/api';

const Repositories = () => {
  const [repos, setRepos] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);

  const fetchRepos = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/repos');
      setRepos(data);
      setError(null);
    } catch (err) {
      console.error('[Repositories] Fetch failed:', err);
      setError('Failed to fetch repositories. Please make sure your token is valid.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleLink = async (repo) => {
    setActionLoading(prev => ({ ...prev, [repo.id]: true }));
    try {
      await API.post('/repos/link', {
        repoId: repo.id,
        name: repo.name,
        owner: repo.owner,
        visibility: repo.visibility,
        defaultBranch: repo.defaultBranch
      });
      await fetchRepos();
    } catch (err) {
      console.error('[Repositories] Link failed:', err);
      alert('Failed to connect repository. Try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [repo.id]: false }));
    }
  };

  const handleUnlink = async (dbId, repoId) => {
    if (!window.confirm('Are you sure you want to disconnect this repository? This will tear down webhooks.')) {
      return;
    }
    setActionLoading(prev => ({ ...prev, [repoId]: true }));
    try {
      await API.delete(`/repos/${dbId}`);
      await fetchRepos();
    } catch (err) {
      console.error('[Repositories] Unlink failed:', err);
      alert('Failed to disconnect repository. Try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [repoId]: false }));
    }
  };

  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(search.toLowerCase()) ||
    repo.owner.toLowerCase().includes(search.toLowerCase())
  );

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
        <button 
          onClick={fetchRepos}
          className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded-lg"
        >
          Retry Fetch
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Search Bar header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-450 text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60"
          />
        </div>
        <span className="text-xs font-semibold text-slate-400">
          Showing {filteredRepos.length} of {repos.length} repositories
        </span>
      </div>

      {/* Grid of Repository Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRepos.length > 0 ? (
          filteredRepos.map((repo) => (
            <div 
              key={repo.id} 
              className={`glass-panel p-6 rounded-2xl flex flex-col justify-between h-56 transition-all duration-300 relative overflow-hidden ${
                repo.linked 
                  ? 'border-indigo-500/30 shadow-md shadow-indigo-500/5 glow-indigo' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Card background effect */}
              {repo.linked && (
                <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
              )}

              <div>
                {/* Repo Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-slate-400 mt-0.5 flex-shrink-0">
                      <GitFork size={16} />
                    </span>
                    <span className="font-bold text-slate-800 truncate text-base hover:text-indigo-600">
                      {repo.name}
                    </span>
                  </div>
                  
                  {/* Public / Private Badge */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                    repo.visibility === 'private' 
                      ? 'bg-purple-50 text-purple-600 border-purple-200' 
                      : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                  }`}>
                    {repo.visibility === 'private' ? <Lock size={10} /> : <Globe size={10} />}
                    {repo.visibility}
                  </span>
                </div>

                {/* Owner and details */}
                <span className="block text-xs text-slate-500 font-semibold mt-1">
                  Owner: {repo.owner}
                </span>

                {/* Details list when connected */}
                {repo.linked && (
                  <div className="mt-4 space-y-2 border-t border-slate-200/50 pt-3 text-left">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <Activity size={12} className="text-slate-400" />
                        Webhook Status
                      </span>
                      <span className={`font-semibold capitalize ${
                        repo.webhookStatus === 'active' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {repo.webhookStatus}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <Shield size={12} className="text-slate-400" />
                        Security Score
                      </span>
                      <span className={`font-extrabold ${
                        repo.securityScore >= 90 ? 'text-emerald-600' : repo.securityScore >= 70 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {repo.securityScore} / 100
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Linking Button actions */}
              <div className="mt-6 flex justify-end">
                {repo.linked ? (
                  <button
                    disabled={actionLoading[repo.id]}
                    onClick={() => handleUnlink(repo.dbId, repo.id)}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    {actionLoading[repo.id] ? (
                      <Loader className="animate-spin" size={14} />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    <span>Disconnect Repo</span>
                  </button>
                ) : (
                  <button
                    disabled={actionLoading[repo.id]}
                    onClick={() => handleLink(repo)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/10 active:scale-[0.99] cursor-pointer"
                  >
                    {actionLoading[repo.id] ? (
                      <Loader className="animate-spin" size={14} />
                    ) : (
                      <Plus size={14} />
                    )}
                    <span>Connect Repo</span>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-slate-100/50 rounded-2xl border border-slate-200 text-slate-400">
            <GitFork size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-sm">No repositories found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Repositories;
