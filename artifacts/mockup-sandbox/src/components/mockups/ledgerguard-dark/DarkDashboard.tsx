import React, { useState, useEffect } from "react";
import { 
  Shield, Wallet, Sun, Moon, Activity, ArrowUpRight, 
  ArrowDownRight, AlertTriangle, ShieldCheck, Clock,
  CheckCircle2, XCircle, LayoutDashboard, Settings, History
} from "lucide-react";

export function DarkDashboard() {
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`min-h-screen relative overflow-hidden font-sans ${isDarkMode ? 'dark' : ''}`} style={{ backgroundColor: '#080e1a', color: '#e2e8f0' }}>
      <style>{`
        :root {
          --bg-dark: #080e1a;
          --bg-card: rgba(13, 20, 36, 0.8);
          --primary: #6d28ff;
          --accent: #14f195;
          --text-main: #e2e8f0;
          --text-muted: #94a3b8;
          --border-glow: rgba(109, 40, 255, 0.2);
        }

        @keyframes glow-drift {
          0% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          33% { transform: translate(30px, -50px) scale(1.1); opacity: 0.6; }
          66% { transform: translate(-20px, 20px) scale(0.9); opacity: 0.5; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
        }

        @keyframes pulse-dot {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(20, 241, 149, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(20, 241, 149, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(20, 241, 149, 0); }
        }

        @keyframes slide-up-fade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes count-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .bg-grid {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          mask-image: radial-gradient(circle at center, black 40%, transparent 80%);
        }

        .glass-card {
          background: var(--bg-card);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--border-glow);
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .glass-card:hover {
          box-shadow: 0 0 24px rgba(109, 40, 255, 0.3);
          border-color: rgba(109, 40, 255, 0.4);
          transform: translateY(-2px);
        }

        .text-gradient {
          background: linear-gradient(to right, #6d28ff, #14f195);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-item {
          transition: all 0.2s ease;
        }
        
        .nav-item:hover, .nav-item.active {
          color: #fff;
          text-shadow: 0 0 8px rgba(109, 40, 255, 0.5);
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: -16px;
          top: 50%;
          transform: translateY(-50%);
          height: 60%;
          width: 3px;
          background: #6d28ff;
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 8px #6d28ff;
        }

        .risk-badge-low {
          background: rgba(20, 241, 149, 0.1);
          color: #14f195;
          border: 1px solid rgba(20, 241, 149, 0.3);
          box-shadow: 0 0 10px rgba(20, 241, 149, 0.2);
        }

        .risk-badge-medium {
          background: rgba(245, 158, 11, 0.1);
          color: #fcd34d;
          border: 1px solid rgba(245, 158, 11, 0.3);
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
        }

        .risk-badge-high {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.3);
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
        }

        .animate-in {
          animation: slide-up-fade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        
        .counter-in {
          animation: count-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }

        .glow-orb-1 {
          position: absolute;
          top: -20%;
          left: -10%;
          width: 60vw;
          height: 60vw;
          background: radial-gradient(circle, rgba(109, 40, 255, 0.15) 0%, rgba(109, 40, 255, 0) 70%);
          border-radius: 50%;
          filter: blur(60px);
          animation: glow-drift 20s infinite alternate ease-in-out;
          pointer-events: none;
          z-index: 0;
        }

        .glow-orb-2 {
          position: absolute;
          bottom: -20%;
          right: -10%;
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, rgba(20, 241, 149, 0.1) 0%, rgba(20, 241, 149, 0) 70%);
          border-radius: 50%;
          filter: blur(60px);
          animation: glow-drift 25s infinite alternate-reverse ease-in-out;
          pointer-events: none;
          z-index: 0;
        }
      `}</style>

      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="glow-orb-1" />
        <div className="glow-orb-2" />
        <div className="absolute inset-0 bg-grid z-0 opacity-40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen">
        
        {/* Sidebar */}
        <div className="w-64 border-r border-[#6d28ff]/20 bg-[#080e1a]/80 backdrop-blur-md hidden md:flex flex-col p-6">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-2 bg-[#6d28ff]/20 rounded-xl border border-[#6d28ff]/40 shadow-[0_0_15px_rgba(109,40,255,0.3)]">
              <Shield className="w-6 h-6 text-[#6d28ff]" />
            </div>
            <span className="font-bold text-xl tracking-wide text-white">LedgerGuard</span>
          </div>

          <nav className="flex-1 space-y-4">
            <a href="#" className="nav-item active relative flex items-center gap-3 text-[#e2e8f0] px-4 py-3 rounded-lg bg-[#6d28ff]/10">
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </a>
            <a href="#" className="nav-item relative flex items-center gap-3 text-[#94a3b8] px-4 py-3 rounded-lg hover:bg-white/5">
              <Activity className="w-5 h-5" />
              <span className="font-medium">Transactions</span>
            </a>
            <a href="#" className="nav-item relative flex items-center gap-3 text-[#94a3b8] px-4 py-3 rounded-lg hover:bg-white/5">
              <History className="w-5 h-5" />
              <span className="font-medium">Audit Log</span>
            </a>
            <a href="#" className="nav-item relative flex items-center gap-3 text-[#94a3b8] px-4 py-3 rounded-lg hover:bg-white/5">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-medium">Policies</span>
            </a>
          </nav>

          <div className="mt-auto">
            <a href="#" className="nav-item relative flex items-center gap-3 text-[#94a3b8] px-4 py-3 rounded-lg hover:bg-white/5">
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen overflow-y-auto">
          {/* Topbar */}
          <header className="sticky top-0 z-20 bg-[#080e1a]/80 backdrop-blur-md border-b border-[#6d28ff]/20 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-white md:hidden">LedgerGuard</h1>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#14f195]/10 border border-[#14f195]/20 shadow-[0_0_10px_rgba(20,241,149,0.1)]">
                <div className="w-2 h-2 rounded-full bg-[#14f195]" style={{ animation: 'pulse-dot 2s infinite' }} />
                <span className="text-xs font-medium text-[#14f195]">Ledger Connected</span>
              </div>
              
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full hover:bg-white/10 text-[#94a3b8] transition-colors"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button className="flex items-center gap-2 bg-gradient-to-r from-[#6d28ff] to-[#5118d6] hover:to-[#6d28ff] text-white px-5 py-2.5 rounded-xl font-medium shadow-[0_0_20px_rgba(109,40,255,0.4)] transition-all transform hover:scale-[1.02] border border-[#6d28ff]/50">
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            </div>
          </header>

          {/* Dashboard Body */}
          <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
            
            {/* Header Section */}
            <div className="mb-8 animate-in" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-3xl font-bold text-white mb-2">Treasury Overview</h2>
              <p className="text-[#94a3b8]">Real-time risk and balance metrics for your Solana multisig.</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              
              <div className="glass-card p-6 animate-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-lg bg-[#6d28ff]/10 text-[#6d28ff]">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium flex items-center gap-1 text-[#14f195] bg-[#14f195]/10 px-2 py-1 rounded">
                    <ArrowUpRight className="w-3 h-3" /> +2.4%
                  </span>
                </div>
                <p className="text-sm text-[#94a3b8] mb-1">Treasury Balance</p>
                <div className="flex items-baseline gap-2">
                  <h3 className={`text-3xl font-bold text-gradient ${mounted ? 'counter-in' : 'opacity-0'}`}>
                    1,247.85
                  </h3>
                  <span className="text-lg font-medium text-[#94a3b8]">SOL</span>
                </div>
                <p className="text-xs text-[#94a3b8] mt-2">≈ $184,681.80 USD</p>
              </div>

              <div className="glass-card p-6 animate-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium flex items-center gap-1 text-red-400 bg-red-400/10 px-2 py-1 rounded">
                    <ArrowDownRight className="w-3 h-3" /> -1.2%
                  </span>
                </div>
                <p className="text-sm text-[#94a3b8] mb-1">Monthly Outflow</p>
                <div className="flex items-baseline gap-2">
                  <h3 className={`text-3xl font-bold text-white ${mounted ? 'counter-in' : 'opacity-0'}`}>
                    42.50
                  </h3>
                  <span className="text-lg font-medium text-[#94a3b8]">SOL</span>
                </div>
              </div>

              <div className="glass-card p-6 animate-in" style={{ animationDelay: '0.4s' }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-sm text-[#94a3b8] mb-1">Risk Score</p>
                <div className="flex items-center gap-3">
                  <h3 className={`text-3xl font-bold text-white ${mounted ? 'counter-in' : 'opacity-0'}`}>
                    32
                  </h3>
                  <span className="risk-badge-low px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                    Low
                  </span>
                </div>
              </div>

              <div className="glass-card p-6 animate-in" style={{ animationDelay: '0.5s' }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-lg bg-[#14f195]/10 text-[#14f195]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-sm text-[#94a3b8] mb-1">Health Score</p>
                <div className="flex items-end gap-1">
                  <h3 className={`text-3xl font-bold text-white ${mounted ? 'counter-in' : 'opacity-0'}`}>
                    87
                  </h3>
                  <span className="text-lg font-medium text-[#94a3b8] mb-1">/100</span>
                </div>
                <div className="w-full bg-[#334155] h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-[#14f195] h-full rounded-full w-[87%] shadow-[0_0_10px_#14f195]" />
                </div>
              </div>
            </div>

            {/* Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              
              {/* Pending Approvals */}
              <div className="glass-card p-6 animate-in flex flex-col h-full" style={{ animationDelay: '0.6s' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#6d28ff]" />
                    Pending Approvals
                  </h3>
                  <span className="bg-[#6d28ff]/20 text-[#6d28ff] px-2.5 py-0.5 rounded-full text-xs font-bold">3</span>
                </div>
                
                <div className="space-y-4 flex-1">
                  {[
                    { id: 'TX-892', amount: '15.00', to: '8xK9...2mPq', time: '2 hrs ago', type: 'Payroll' },
                    { id: 'TX-893', amount: '2.50', to: '4fT2...9pAz', time: '5 hrs ago', type: 'SaaS' },
                    { id: 'TX-894', amount: '120.00', to: 'Venture DAO', time: '1 day ago', type: 'Investment' }
                  ].map((tx, i) => (
                    <div key={tx.id} className="p-4 rounded-xl bg-[#080e1a]/50 border border-white/5 hover:border-[#6d28ff]/30 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#6d28ff]/10 flex items-center justify-center text-[#6d28ff] font-medium border border-[#6d28ff]/20 group-hover:shadow-[0_0_10px_rgba(109,40,255,0.2)] transition-shadow">
                          {tx.type[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{tx.type} • {tx.amount} SOL</p>
                          <p className="text-xs text-[#94a3b8]">To: {tx.to} <span className="mx-1">•</span> {tx.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-2.5 text-sm font-medium text-[#94a3b8] hover:text-white transition-colors border border-white/5 rounded-xl hover:bg-white/5">
                  View All Approvals
                </button>
              </div>

              {/* Recent Activity */}
              <div className="glass-card p-6 animate-in flex flex-col h-full" style={{ animationDelay: '0.7s' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#14f195]" />
                    Recent Activity
                  </h3>
                </div>
                
                <div className="space-y-0 relative flex-1">
                  <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-[#6d28ff]/50 via-white/10 to-transparent"></div>
                  
                  {[
                    { title: 'Policy Updated', desc: 'Daily limit increased to 50 SOL', time: '10m ago', icon: <Settings className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { title: 'Transaction Approved', desc: 'TX-891 • 5.00 SOL', time: '1h ago', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { title: 'New Device Authorized', desc: 'MacBook Pro (San Francisco)', time: '3h ago', icon: <Shield className="w-4 h-4" />, color: 'text-[#6d28ff]', bg: 'bg-[#6d28ff]/10' },
                    { title: 'High Risk Transfer Blocked', desc: 'Attempted transfer to known scam address', time: '2d ago', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-400', bg: 'bg-red-500/10' },
                  ].map((act, i) => (
                    <div key={i} className="relative pl-12 py-4 flex items-start group">
                      <div className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border border-white/5 z-10 bg-[#080e1a] ${act.color}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${act.bg}`}>
                          {act.icon}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-[#14f195] transition-colors">{act.title}</p>
                        <p className="text-xs text-[#94a3b8] mt-1">{act.desc}</p>
                        <p className="text-xs text-[#334155] mt-1">{act.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom Section */}
            <div className="glass-card p-4 animate-in flex items-center justify-between" style={{ animationDelay: '0.8s' }}>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <ShieldCheck className="w-4 h-4 text-[#94a3b8]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">4 Active Security Policies</p>
                  <p className="text-xs text-[#94a3b8]">Enforcing multisig rules and velocity limits</p>
                </div>
              </div>
              <button className="text-sm font-medium text-[#6d28ff] hover:text-[#8b5cf6] transition-colors px-4 py-2 hover:bg-[#6d28ff]/10 rounded-lg">
                Manage Policies
              </button>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}
