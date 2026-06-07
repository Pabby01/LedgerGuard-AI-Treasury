import React, { useState } from "react";
import {
  Shield,
  Bell,
  Home,
  Bot,
  List,
  Settings,
  ChevronRight,
  TrendingDown,
  Activity,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  CheckCircle2,
  Wallet
} from "lucide-react";

export function MobileDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-bg {
          position: relative;
          overflow: hidden;
        }
        .shimmer-bg::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer 2s infinite;
        }
        .pulse-dot {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      <div className="bg-[#04080f] min-h-screen flex justify-center w-full font-sans text-white">
        {/* Mobile Container */}
        <div className="w-full max-w-[390px] bg-[#080e1a] relative min-h-screen pb-[84px] shadow-2xl overflow-hidden border-x border-[#1a2333]">
          
          {/* Header */}
          <header className="sticky top-0 z-20 bg-[#080e1a]/90 backdrop-blur-md border-b border-[#1a2333] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#6d28ff]/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#6d28ff]" />
              </div>
              <span className="font-bold text-lg tracking-tight">LedgerGuard</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#1a2333] rounded-full pl-1 pr-3 py-1 border border-[#2a3441]">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#14f195] to-[#6d28ff] flex items-center justify-center text-[10px] font-bold">
                  S
                </div>
                <span className="text-xs font-mono text-gray-300">7xKX...AsU</span>
              </div>
              <button className="relative p-1.5 rounded-full hover:bg-[#1a2333] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Bell className="w-5 h-5 text-gray-300" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#14f195] pulse-dot border-2 border-[#080e1a]" />
              </button>
            </div>
          </header>

          <main className="p-4 space-y-6">
            {/* Hero Balance Card */}
            <div className="rounded-2xl p-5 text-white shimmer-bg shadow-lg" style={{ background: 'linear-gradient(135deg, #4f1d96, #6d28ff, #1e40af)' }}>
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-sm font-medium text-white/80">Treasury Balance</span>
                <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-semibold backdrop-blur-sm">Devnet</span>
              </div>
              <div className="mb-4 relative z-10">
                <div className="text-4xl font-bold tracking-tight">1,247.85 <span className="text-2xl text-white/80">SOL</span></div>
                <div className="text-sm text-white/70 mt-1 font-medium">≈ $184,681.80 USD</div>
              </div>
              <div className="flex gap-2 relative z-10">
                <button className="flex-1 bg-white text-[#6d28ff] rounded-xl py-2.5 text-sm font-bold min-h-[44px] shadow-sm">
                  Send
                </button>
                <button className="flex-1 bg-white/20 backdrop-blur-sm text-white rounded-xl py-2.5 text-sm font-bold min-h-[44px]">
                  Receive
                </button>
              </div>
            </div>

            {/* Quick Stats (Scrollable) */}
            <div className="flex overflow-x-auto gap-3 hide-scrollbar -mx-4 px-4 pb-2">
              <div className="min-w-[140px] bg-[#121927] border border-[#1a2333] rounded-2xl p-3 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-[11px] uppercase tracking-widest font-semibold">Monthly Out</span>
                </div>
                <div className="text-lg font-semibold text-white">17.95 SOL</div>
              </div>
              <div className="min-w-[140px] bg-[#121927] border border-[#1a2333] rounded-2xl p-3 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[11px] uppercase tracking-widest font-semibold">Risk Level</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-white">32</span>
                  <span className="text-[10px] bg-[#14f195]/20 text-[#14f195] px-1.5 py-0.5 rounded uppercase font-bold">Low</span>
                </div>
              </div>
              <div className="min-w-[140px] bg-[#121927] border border-[#1a2333] rounded-2xl p-3 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-[11px] uppercase tracking-widest font-semibold">Health</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-white">87</span>
                  <span className="text-xs text-gray-400">/100</span>
                </div>
              </div>
            </div>

            {/* Pending Approvals */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">Pending Approvals</h3>
                <span className="bg-[#6d28ff] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">5</span>
              </div>
              
              <div className="space-y-2">
                {[
                  { id: 1, recipient: 'Jupiter Aggregator', memo: 'DEX Swap', amount: '50.00 SOL', risk: 'LOW', riskColor: 'text-[#14f195]', riskBg: 'bg-[#14f195]/10' },
                  { id: 2, recipient: 'Fm9b...3k2a', memo: 'Payroll - Engineering', amount: '12.50 SOL', risk: 'MED', riskColor: 'text-amber-400', riskBg: 'bg-amber-400/10' },
                  { id: 3, recipient: 'Unknown Program', memo: 'Contract Interaction', amount: '0.05 SOL', risk: 'HIGH', riskColor: 'text-red-400', riskBg: 'bg-red-400/10' }
                ].map(txn => (
                  <button key={txn.id} className="w-full bg-[#121927] border border-[#1a2333] p-4 rounded-2xl flex items-center justify-between min-h-[44px] text-left hover:bg-[#1a2333] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1a2333] flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-white mb-0.5">{txn.recipient}</div>
                        <div className="text-xs text-gray-400">{txn.memo}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="font-semibold text-sm">{txn.amount}</div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${txn.riskBg} ${txn.riskColor}`}>
                          {txn.risk}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Recent Activity */}
            <section className="pb-4">
              <h3 className="text-[11px] uppercase tracking-widest text-gray-400 font-bold mb-4">Recent Activity</h3>
              <div className="space-y-0 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#1a2333] before:to-transparent">
                {[
                  { title: 'Policy Updated', desc: 'Transfer limit increased to 100 SOL', time: '2h ago', icon: Shield, color: 'text-[#6d28ff]' },
                  { title: 'Transaction Executed', desc: 'Sent 5.0 SOL to 8x2a...9b1c', time: '5h ago', icon: ArrowRightLeft, color: 'text-[#14f195]' },
                  { title: 'New Wallet Added', desc: 'Marketing Treasury connected', time: '1d ago', icon: CheckCircle2, color: 'text-blue-400' }
                ].map((item, i) => (
                  <div key={i} className="relative flex items-start gap-4 mb-5 last:mb-0">
                    <div className="absolute left-0 w-5 h-5 flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full ${item.color.replace('text-', 'bg-')} z-10 ring-4 ring-[#080e1a]`} />
                    </div>
                    <div className="pl-8 pt-0.5">
                      <div className="text-sm font-semibold text-white">{item.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
                      <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>

          {/* Bottom Navigation */}
          <nav className="absolute bottom-0 left-0 w-full bg-[#080e1a]/80 backdrop-blur-xl border-t border-[#1a2333] pb-safe pt-2 px-2 pb-6 z-30">
            <div className="flex justify-around items-center">
              {[
                { id: 'dashboard', icon: Home, label: 'Home' },
                { id: 'ai', icon: Bot, label: 'AI Bot' },
                { id: 'txns', icon: List, label: 'Txns' },
                { id: 'policies', icon: Shield, label: 'Policies' },
                { id: 'settings', icon: Settings, label: 'Settings' }
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex flex-col items-center justify-center w-16 min-h-[44px] gap-1 relative"
                  >
                    {isActive && (
                      <div className="absolute -top-3 w-10 h-1 bg-[#6d28ff] rounded-b-full shadow-[0_0_10px_#6d28ff]" />
                    )}
                    <tab.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#6d28ff]' : 'text-gray-500'}`} />
                    <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-[#6d28ff]' : 'text-gray-500'}`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
          
        </div>
      </div>
    </>
  );
}
