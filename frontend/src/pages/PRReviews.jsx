import React, { useState, useEffect } from 'react';
import { 
  GitPullRequest, 
  ShieldAlert, 
  Loader, 
  ChevronRight, 
  Code, 
  Copy, 
  Check, 
  Calendar, 
  User, 
  Filter,
  ArrowLeft
} from 'lucide-react';
import API from '../services/api';

const PRReviews = () => {
  const [prs, setPrs] = useState([]);
  const [selectedPr, setSelectedPr] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loadingPrs, setLoadingPrs] = useState(true);
  const [loadingFindings, setLoadingFindings] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Filters
  const [repoFilter, setRepoFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPrs = async () => {
    try {
      setLoadingPrs(true);
      const { data } = await API.get('/reviews/prs');
      setPrs(data);
    } catch (err) {
      console.error('[PRReviews] Fetch PRs failed:', err);
    } finally {
      setLoadingPrs(false);
    }
  };

  useEffect(() => {
    fetchPrs();
  }, []);

  const selectPr = async (pr) => {
    setSelectedPr(pr);
    try {
      setLoadingFindings(true);
      const { data } = await API.get('/reviews', {
        params: { prId: pr._id }
      });
      setFindings(data);
    } catch (err) {
      console.error('[PRReviews] Fetch findings failed:', err);
    } finally {
      setLoadingFindings(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group findings by file path
  const groupFindingsByFile = (findingsList) => {
    const grouped = {};
    findingsList.forEach(finding => {
      const file = finding.file;
      if (!grouped[file]) grouped[file] = [];
      grouped[file].push(finding);
    });
    return grouped;
  };

  // Filter PRs list
  const filteredPrs = prs.filter(pr => {
    const matchesRepo = !repoFilter || pr.repoName === repoFilter;
    const matchesStatus = !statusFilter || pr.status === statusFilter;
    const matchesSeverity = !severityFilter || pr.severityCounts[severityFilter] > 0;
    return matchesRepo && matchesStatus && matchesSeverity;
  });

  // Unique list of repos for filter dropdown
  const uniqueRepos = Array.from(new Set(prs.map(pr => pr.repoName)));

  // Severity color maps
  const SEVERITY_BADGES = {
    Critical: 'bg-rose-50 text-rose-600 border-rose-200',
    High: 'bg-orange-50 text-orange-600 border-orange-200',
    Medium: 'bg-amber-50 text-amber-600 border-amber-200',
    Low: 'bg-blue-50 text-blue-600 border-blue-200',
    Info: 'bg-slate-50 text-slate-650 border-slate-200'
  };

  if (loadingPrs) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  const groupedFindings = groupFindingsByFile(findings);

  return (
    <div className="flex flex-col lg:flex-row h-[78vh] gap-6 pb-6 overflow-hidden">
      
      {/* Left Column: Filter and list of PRs */}
      <div className={`w-full lg:w-[35%] flex flex-col h-full bg-white/50 border border-slate-200 rounded-2xl p-4 overflow-hidden ${
        selectedPr ? 'hidden lg:flex' : 'flex'
      }`}>
        {/* Filters */}
        <div className="space-y-3 pb-4 border-b border-slate-200 text-left">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <Filter size={14} />
            <span>Filters</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Repo Dropdown */}
            <select
              value={repoFilter}
              onChange={(e) => setRepoFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg p-2 text-[11px] text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">All Repos</option>
              {uniqueRepos.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            {/* Severity Dropdown */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg p-2 text-[11px] text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg p-2 text-[11px] text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="merged">Merged</option>
            </select>
          </div>
        </div>

        {/* PRs list scroll area */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1 text-left">
          {filteredPrs.length > 0 ? (
            filteredPrs.map((pr) => {
              const totalSevIssues = pr.severityCounts.Critical + pr.severityCounts.High;
              return (
                <div
                  key={pr._id}
                  onClick={() => selectPr(pr)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedPr?._id === pr._id
                      ? 'bg-indigo-50 border-indigo-200/80'
                      : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold mb-1">
                      <GitPullRequest size={14} />
                      <span>PR #{pr.prNumber}</span>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                      pr.status === 'open' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      pr.status === 'merged' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {pr.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 line-clamp-1 mt-0.5">
                    {pr.title || `Review on PR #${pr.prNumber}`}
                  </h3>

                  <div className="flex justify-between items-center mt-3 text-[11px] text-slate-500 font-medium">
                    <span className="truncate max-w-[150px] font-semibold">{pr.repoOwner}/{pr.repoName}</span>
                    <span className={`font-extrabold ${
                      pr.securityScore >= 90 ? 'text-emerald-600' : pr.securityScore >= 70 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      Score: {pr.securityScore}
                    </span>
                  </div>

                  {/* Issues indicators */}
                  <div className="flex gap-2 mt-3 text-[10px]">
                    {pr.severityCounts.Critical > 0 && (
                      <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold border border-rose-200">
                        {pr.severityCounts.Critical} Critical
                      </span>
                    )}
                    {pr.severityCounts.High > 0 && (
                      <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-bold border border-orange-200">
                        {pr.severityCounts.High} High
                      </span>
                    )}
                    {pr.severityCounts.Medium > 0 && (
                      <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold border border-amber-200">
                        {pr.severityCounts.Medium} Med
                      </span>
                    )}
                    {pr.severityCounts.Low + pr.severityCounts.Info > 0 && (
                      <span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded font-semibold border border-slate-200">
                        {pr.severityCounts.Low + pr.severityCounts.Info} Other
                      </span>
                    )}
                    {pr.totalIssues === 0 && (
                      <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                        Clean Pass
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              No pull requests matched filters.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Detailed Drill Down */}
      <div className={`flex-1 flex flex-col h-full bg-white/50 border border-slate-200 rounded-2xl p-6 overflow-hidden ${
        selectedPr ? 'flex' : 'hidden lg:flex items-center justify-center text-slate-400'
      }`}>
        {selectedPr ? (
          <>
            {/* PR detail Header */}
            <div className="border-b border-slate-200 pb-4 mb-4 text-left">
              {/* Back to list on mobile */}
              <button 
                onClick={() => setSelectedPr(null)}
                className="flex lg:hidden items-center gap-1 text-xs text-indigo-650 font-bold mb-3 hover:text-indigo-500"
              >
                <ArrowLeft size={14} /> Back to PR List
              </button>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 border border-indigo-200">
                    <GitPullRequest size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 leading-snug">
                      {selectedPr.title || `PR #${selectedPr.prNumber}`}
                    </h2>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                      <span className="text-indigo-600 font-semibold">{selectedPr.repoOwner}/{selectedPr.repoName}</span>
                      <span className="flex items-center gap-1"><User size={12} /> {selectedPr.author}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(selectedPr.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right flex items-center gap-3">
                  <div className="bg-white px-4 py-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">PR Score</span>
                    <span className={`text-xl font-extrabold ${
                      selectedPr.securityScore >= 90 ? 'text-emerald-600' : selectedPr.securityScore >= 70 ? 'text-amber-600' : 'text-rose-650'
                    }`}>
                      {selectedPr.securityScore}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Findings container */}
            <div className="flex-1 overflow-y-auto pr-1">
              {loadingFindings ? (
                <div className="flex h-full items-center justify-center">
                  <Loader className="animate-spin text-indigo-500" size={24} />
                </div>
              ) : findings.length > 0 ? (
                Object.keys(groupedFindings).map((filePath) => (
                  <div key={filePath} className="mb-6 text-left">
                    {/* File Path Header */}
                    <div className="bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 flex items-center gap-2 mb-3">
                      <Code size={14} className="text-slate-500" />
                      <span className="text-xs font-bold text-slate-700 font-mono tracking-tight">{filePath}</span>
                    </div>

                    {/* File Findings */}
                    <div className="space-y-4 ml-1">
                      {groupedFindings[filePath].map((finding) => (
                        <div 
                          key={finding._id}
                          className="bg-white/60 border border-slate-200 p-5 rounded-2xl space-y-3 relative hover:border-slate-300 transition-all"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold font-mono px-2 py-0.5 rounded">
                                Line {finding.lineNumber}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${SEVERITY_BADGES[finding.severity] || SEVERITY_BADGES.Info}`}>
                                {finding.severity}
                              </span>
                            </div>
                          </div>

                          <h4 className="text-sm font-bold text-slate-800 mt-1">
                            {finding.issue}
                          </h4>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {finding.explanation}
                          </p>

                          {finding.fix && (
                            <div className="border border-slate-200 rounded-xl overflow-hidden mt-3 bg-slate-950">
                              <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Fix</span>
                                <button
                                  onClick={() => copyToClipboard(finding.fix, finding._id)}
                                  className="text-slate-400 hover:text-slate-100 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                >
                                  {copiedId === finding._id ? (
                                    <>
                                      <Check size={12} className="text-emerald-400" />
                                      <span className="text-emerald-400">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="p-4 overflow-x-auto text-[11px] font-mono text-left text-slate-300 max-h-40 font-sans leading-relaxed">
                                <code>{finding.fix}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center flex-col text-slate-400 py-16">
                  <ShieldAlert size={40} className="text-slate-300 mb-2" />
                  <span className="text-xs font-semibold uppercase tracking-wider">No issue findings recorded for this review.</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <GitPullRequest size={48} className="text-slate-300 mb-2" />
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Select a Pull Request to inspect details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PRReviews;
