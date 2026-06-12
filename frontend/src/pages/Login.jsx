import { ShieldAlert, Sparkles, Zap } from 'lucide-react';
import logoSvg from '../assets/vite.svg';

const GithubIcon = (props) => (
  <svg 
    viewBox="0 0 24 24" 
    width="20" 
    height="20" 
    stroke="currentColor" 
    strokeWidth="2" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const Login = () => {
  const handleGithubLogin = () => {
    // Redirect browser directly to backend login endpoint
    const backendUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') 
      : 'https://ai-code-reviewer-pr-gatekeeper.onrender.com';
    window.location.href = `${backendUrl}/api/auth/github`;
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden font-sans text-slate-800">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      <div className="relative z-10 w-full max-w-md p-8">
        {/* App Logo/Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600/10 p-4 rounded-2xl border border-indigo-500/20 text-indigo-600 mb-4 shadow-lg shadow-indigo-500/5">
            <img src={logoSvg} alt="PR Gatekeeper Logo" className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider text-gradient-purple uppercase font-sans">
            PR GATEKEEPER
          </h1>
          <p className="text-slate-550 text-sm mt-1.5 font-medium tracking-wide">
            Production-Grade AI Code Reviewer
          </p>
        </div>

        {/* Glassmorphism Auth Card */}
        <div className="glass-panel p-8 rounded-3xl glow-indigo relative border-slate-200">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-800">Connect Account</h2>
            <p className="text-xs text-slate-500 mt-1">
              Authorize via GitHub to start scanning repositories
            </p>
          </div>

          <button
            onClick={handleGithubLogin}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:scale-[1.01] hover:shadow-indigo-600/30 active:scale-[0.99] cursor-pointer"
          >
            <GithubIcon />
            <span>Continue with GitHub</span>
          </button>

          <div className="border-t border-slate-200 my-6"></div>

          {/* Feature list */}
          <div className="space-y-4">
            <div className="flex gap-3 items-start text-left">
              <div className="bg-indigo-600/10 p-1.5 rounded-lg text-indigo-600 border border-indigo-500/15 mt-0.5">
                <ShieldAlert size={14} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-800">Security Guardrails</h4>
                <p className="text-[11px] text-slate-500">Scan for SQLi, XSS, exposed secrets, and logic vulnerability vectors.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start text-left">
              <div className="bg-emerald-600/10 p-1.5 rounded-lg text-emerald-600 border border-emerald-500/15 mt-0.5">
                <Zap size={14} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-800">Webhook Automation</h4>
                <p className="text-[11px] text-slate-500">Installs event hooks that automatically trigger reviews on open pull requests.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start text-left">
              <div className="bg-amber-600/10 p-1.5 rounded-lg text-amber-600 border border-amber-500/15 mt-0.5">
                <Sparkles size={14} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-800">Gemini Review Engine</h4>
                <p className="text-[11px] text-slate-500">Publishes inline reviewer feedback and copyable fixes directly on line commits.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-8">
          By signing in you agree to allow PR Gatekeeper to register webhooks and write review comments to your linked repos.
        </p>
      </div>
    </div>
  );
};

export default Login;
