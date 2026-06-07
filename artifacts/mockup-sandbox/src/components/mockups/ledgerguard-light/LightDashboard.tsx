import React, { useState } from "react";
import { 
  Shield, 
  Sun,
  Moon,
  Wallet,
  LayoutDashboard,
  ArrowRightLeft,
  Settings,
  Sparkles,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Activity
} from "lucide-react";

export function LightDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        .font-inter { font-family: 'Inter', sans-serif; }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse-dot {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          70% { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        .animate-pulse-dot {
          animation: pulse-dot 2s infinite;
        }

        .stat-card-hover {
          transition: all 0.2s ease;
        }
        
        .stat-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .gradient-text {
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-image: linear-gradient(to right, #5b21b6, #0ea5e9);
        }
      `}</style>

      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-[1px_0_10px_rgba(0,0,0,0.02)] z-10">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Shield size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">LedgerGuard</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            isActive={activeNav === "dashboard"}
            onClick={() => setActiveNav("dashboard")}
          />
          <NavItem 
            icon={<ArrowRightLeft size={20} />} 
            label="Transactions" 
            isActive={activeNav === "transactions"}
            onClick={() => setActiveNav("transactions")}
          />
          <NavItem 
            icon={<Sparkles size={20} />} 
            label="AI Treasury" 
            isActive={activeNav === "ai-treasury"}
            onClick={() => setActiveNav("ai-treasury")}
            badge="New"
          />
          <NavItem 
            icon={<ShieldAlert size={20} />} 
            label="Policies" 
            isActive={activeNav === "policies"}
            onClick={() => setActiveNav("policies")}
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            isActive={activeNav === "settings"}
            onClick={() => setActiveNav("settings")}
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=treasury" alt="Avatar" className="w-full h-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Treasury Admin</p>
              <p className="text-xs text-slate-500 truncate">admin@ledgerguard.io</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-gradient-to-r from-white to-[#f0f4ff] border-b border-slate-200 flex items-center justify-between px-8 z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
              Ledger Connected
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors group">
              <Sun size={20} className="hidden" />
              <Moon size={20} className="group-hover:fill-indigo-100" />
            </button>
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
              <Wallet size={18} />
              Connect Wallet
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 font-inter">
          <div className="max-w-6xl mx-auto space-y-8">
            
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Treasury Overview</h1>
                <p className="text-slate-500 text-sm">Welcome back. Here's what's happening with your funds.</p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Balance */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden stat-card-hover group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500"></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  Treasury Balance
                </p>
                <div className="flex items-end gap-2 animate-fade-in" style={{ animationDelay: '0ms' }}>
                  <span className="text-4xl font-bold gradient-text">1247.85</span>
                  <span className="text-slate-400 font-medium mb-1">SOL</span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm text-green-600 font-medium bg-green-50 w-fit px-2 py-0.5 rounded">
                  <TrendingUp size={14} />
                  <span>+2.4%</span>
                </div>
              </div>

              {/* Outflow */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden stat-card-hover group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300"></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Monthly Outflow
                </p>
                <div className="flex items-end gap-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
                  <span className="text-3xl font-bold text-slate-900">17.95</span>
                  <span className="text-slate-400 font-medium mb-1">SOL</span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm text-slate-500 font-medium bg-slate-100 w-fit px-2 py-0.5 rounded">
                  <TrendingDown size={14} />
                  <span>-0.8%</span>
                </div>
              </div>

              {/* Risk Score */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden stat-card-hover group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Risk Score
                </p>
                <div className="flex items-end gap-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <span className="text-3xl font-bold text-slate-900">32</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md mb-1">LOW</span>
                </div>
                <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '32%' }}></div>
                </div>
              </div>

              {/* Health */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden stat-card-hover group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0ea5e9]"></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Health Score
                </p>
                <div className="flex items-end gap-1 animate-fade-in" style={{ animationDelay: '300ms' }}>
                  <span className="text-3xl font-bold text-slate-900">87</span>
                  <span className="text-slate-400 font-medium mb-1">/100</span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm text-[#0ea5e9] font-medium bg-sky-50 w-fit px-2 py-0.5 rounded">
                  <Activity size={14} />
                  <span>Healthy</span>
                </div>
              </div>
            </div>

            {/* Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Pending Approvals */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-900">Pending Approvals</h2>
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">2 Requires Action</span>
                </div>
                
                <div className="divide-y divide-slate-100 flex-1">
                  <ApprovalItem 
                    title="Pay Roll - Q3 Engineering"
                    amount="450.00 SOL"
                    to="Multiple (12)"
                    time="2 hours ago"
                    status="urgent"
                  />
                  <ApprovalItem 
                    title="Marketing Retainer"
                    amount="25.50 SOL"
                    to="Hx7...9pL"
                    time="5 hours ago"
                    status="normal"
                  />
                  <ApprovalItem 
                    title="Infrastructure AWS"
                    amount="8.25 SOL"
                    to="Aws...x22"
                    time="1 day ago"
                    status="normal"
                  />
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                  <button className="w-full py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors">
                    View All Requests
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
                  <button className="text-slate-400 hover:text-slate-600 p-1 rounded">
                    <Settings size={16} />
                  </button>
                </div>
                
                <div className="p-6 flex-1">
                  <div className="relative space-y-6 before:absolute before:inset-0 before:ml-3 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:to-transparent">
                    
                    <ActivityItem 
                      icon={<CheckCircle2 size={16} className="text-green-600" />}
                      iconBg="bg-green-100"
                      title="Transaction Approved"
                      desc="Admin 1 approved 45.00 SOL to Marketing"
                      time="10 mins ago"
                    />
                    
                    <ActivityItem 
                      icon={<AlertTriangle size={16} className="text-amber-600" />}
                      iconBg="bg-amber-100"
                      title="High Risk Transfer Flagged"
                      desc="Unusual contract interaction detected (Score: 85)"
                      time="2 hours ago"
                    />

                    <ActivityItem 
                      icon={<Sparkles size={16} className="text-indigo-600" />}
                      iconBg="bg-indigo-100"
                      title="AI Policy Updated"
                      desc="Daily spending limit automatically adjusted based on velocity"
                      time="5 hours ago"
                    />

                    <ActivityItem 
                      icon={<XCircle size={16} className="text-red-600" />}
                      iconBg="bg-red-100"
                      title="Transaction Rejected"
                      desc="Failed multi-sig threshold (1/3)"
                      time="1 day ago"
                    />

                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents

function NavItem({ icon, label, isActive, onClick, badge }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all relative ${
        isActive 
          ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-500/20' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
      )}
      <div className="flex items-center gap-3">
        <span className={isActive ? 'text-indigo-100' : 'text-slate-400'}>{icon}</span>
        <span>{label}</span>
      </div>
      {badge && (
        <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
          isActive ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-600'
        }`}>
          <Sparkles size={10} className={isActive ? "text-indigo-200" : "text-indigo-500"} />
          {badge}
        </span>
      )}
    </button>
  );
}

function ApprovalItem({ title, amount, to, time, status }: any) {
  return (
    <div className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          status === 'urgent' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
        }`}>
          <ArrowRightLeft size={18} />
        </div>
        <div>
          <p className="font-semibold text-sm text-slate-900 flex items-center gap-2">
            {title}
            {status === 'urgent' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">To: {to}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-xs text-slate-400">{time}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-sm text-slate-900">{amount}</p>
        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-medium">Reject</button>
          <button className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded font-medium">Approve</button>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ icon, iconBg, title, desc, time }: any) {
  return (
    <div className="relative flex items-center gap-4">
      <div className={`absolute left-0 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-4 border-white ${iconBg} flex items-center justify-center z-10 shadow-sm`}>
        {icon}
      </div>
      <div className="pl-12 md:pl-0 md:w-1/2 md:pr-12 md:text-right">
        {/* Empty left side for layout trick */}
      </div>
      <div className="pl-12 md:pl-0 md:w-1/2 md:pl-12">
        <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
          <p className="text-sm font-bold text-slate-900 mb-0.5">{title}</p>
          <p className="text-xs text-slate-500 leading-relaxed mb-2">{desc}</p>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{time}</p>
        </div>
      </div>
    </div>
  );
}
