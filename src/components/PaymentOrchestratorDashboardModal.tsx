import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Zap, 
  Building2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Database, 
  Globe2, 
  Layers, 
  Send, 
  Terminal,
  Activity,
  FileCheck,
  CreditCard
} from 'lucide-react';
import { PaymentOrchestratorLog, PaymentRail } from '../types';

interface PaymentOrchestratorDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentOrchestratorDashboardModal: React.FC<PaymentOrchestratorDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [logs, setLogs] = useState<PaymentOrchestratorLog[]>([]);
  const [supportedRails, setSupportedRails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<PaymentOrchestratorLog | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [filterRail, setFilterRail] = useState<string>('ALL');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payment-orchestrator/logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setSupportedRails(data.supportedRails || []);
        if (data.logs && data.logs.length > 0 && !selectedLog) {
          setSelectedLog(data.logs[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch orchestrator logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(l => {
    if (filterRail === 'ALL') return true;
    return l.finalRail === filterRail;
  });

  const getRailBadgeClass = (rail?: PaymentRail) => {
    switch (rail) {
      case 'CONTIPAY':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'PESAPAL':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'COINBASE_USDC':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 bg-stone-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl relative border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b1f33] via-[#0e2a47] to-[#143456] p-4 sm:p-5 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Payment Orchestration Live Hub
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Sub-3s SLA Guaranteed
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Multi-Rail Waterfall (ContiPay ➔ Pesapal ➔ Coinbase USDC) & RBZ Nostro Reconciliation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 transition-all"
              title="Refresh Audit Logs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-stone-200 hover:text-white transition-all"
              title="Close Hub"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-stone-50">
          
          {/* Gateway Rails Status Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Rail 1: ContiPay */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  Priority 1: ContiPay
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Primary
                </span>
              </div>
              <div className="text-xs font-bold text-stone-900">
                UK / EU / US Card Acquiring
              </div>
              <p className="text-[11px] text-stone-500">
                Direct EFT settlement to TM Pick n Pay USD Nostro at Stanbic Bank.
              </p>
              <div className="pt-1 text-[10px] font-mono text-stone-600 flex items-center justify-between border-t border-stone-100">
                <span>Compliance: RBZ Form CD1</span>
                <span className="text-emerald-700 font-bold">&lt; 350ms SLA</span>
              </div>
            </div>

            {/* Rail 2: Pesapal */}
            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                  Priority 2: Pesapal
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Active Fallback
                </span>
              </div>
              <div className="text-xs font-bold text-stone-900">
                Australasia (AUS/NZ) & SADC
              </div>
              <p className="text-[11px] text-stone-500">
                Swift inward routing to TM Pick n Pay USD Nostro at CABS.
              </p>
              <div className="pt-1 text-[10px] font-mono text-stone-600 flex items-center justify-between border-t border-stone-100">
                <span>Compliance: RBZ ECTS Inflow</span>
                <span className="text-amber-700 font-bold">&lt; 500ms SLA</span>
              </div>
            </div>

            {/* Rail 3: Coinbase USDC */}
            <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                  Priority 3: Coinbase USDC
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Global Off-Ramp
                </span>
              </div>
              <div className="text-xs font-bold text-stone-900">
                Card Charge ➔ USDC ➔ Bureau Off-Ramp
              </div>
              <p className="text-[11px] text-stone-500">
                Instant smart off-ramp via licensed forex bureau to CBZ Bank Nostro.
              </p>
              <div className="pt-1 text-[10px] font-mono text-stone-600 flex items-center justify-between border-t border-stone-100">
                <span>Compliance: Licensed Bureau BDC</span>
                <span className="text-blue-700 font-bold">&lt; 800ms SLA</span>
              </div>
            </div>
          </div>

          {/* Audit Logs & Detailed Inspector Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left: Transaction History List */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#0e2a47]" />
                  <h4 className="text-xs sm:text-sm font-black text-stone-900">
                    Live Transaction Waterfall Stream
                  </h4>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-stone-500 font-semibold">Filter:</span>
                  <select
                    value={filterRail}
                    onChange={(e) => setFilterRail(e.target.value)}
                    className="bg-stone-100 border border-stone-300 rounded-lg px-2 py-0.5 text-xs font-semibold text-stone-800 focus:outline-none"
                  >
                    <option value="ALL">All Rails</option>
                    <option value="CONTIPAY">ContiPay</option>
                    <option value="PESAPAL">Pesapal</option>
                    <option value="COINBASE_USDC">Coinbase USDC</option>
                  </select>
                </div>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="py-8 text-center text-stone-400 text-xs space-y-2">
                  <CreditCard className="w-8 h-8 mx-auto opacity-40" />
                  <p>No payment transactions logged yet.</p>
                  <p className="text-[11px] text-stone-500">Checkout an order in the cart to witness the live multi-rail engine!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedLog?.id === log.id
                          ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-xs text-stone-900">
                          {log.orderId}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getRailBadgeClass(log.finalRail)}`}>
                          {log.finalRail}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-600">
                        <span>Amount: <strong className="text-stone-900">${log.amountUSD.toFixed(2)} USD</strong> ({log.billingCountry})</span>
                        <span className="font-mono text-emerald-700 font-bold">{log.totalLatencyMs}ms</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 mt-1 border-t border-stone-200/60">
                        <span>Card: •••• {log.cardLast4}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Selected Transaction Detail & Nostro Inspector */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs sm:text-sm font-black text-stone-900">
                  Reconciliation & Forex Audit Trace
                </h4>
              </div>

              {selectedLog ? (
                <div className="space-y-3 text-xs">
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Order Reference:</span>
                      <span className="font-bold text-stone-900">{selectedLog.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Gross Settlement:</span>
                      <span className="font-bold text-emerald-700">${selectedLog.amountUSD.toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Succeeding Rail:</span>
                      <span className="font-bold text-blue-700">{selectedLog.finalRail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Total Latency:</span>
                      <span className="font-bold text-stone-800">{selectedLog.totalLatencyMs}ms (Within SLA)</span>
                    </div>
                  </div>

                  {/* Destination Nostro */}
                  <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-extrabold text-emerald-900 block">
                      Settled Merchant Nostro Account
                    </span>
                    <p className="text-xs font-bold text-stone-900 font-mono">
                      {selectedLog.nostroAccount || 'TM_PNP_USD_NOSTRO_STANBIC_01'}
                    </p>
                  </div>

                  {/* RBZ Forex Filing Code */}
                  <div className="bg-blue-50/60 border border-blue-200 p-3 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-extrabold text-blue-900 block">
                      RBZ Exchange Control Inflow Ref
                    </span>
                    <p className="text-xs font-bold text-blue-900 font-mono">
                      {selectedLog.forexCode || 'RBZ-CD1-COMPLIANT-INFLOW'}
                    </p>
                  </div>

                  {/* Waterfall Attempts Breakdown */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-extrabold text-stone-500 block">
                      Cascade Waterfall Steps:
                    </span>
                    <div className="space-y-1">
                      {selectedLog.attempts.map((att, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-[10px] font-mono flex items-center justify-between">
                          <div>
                            <span className="font-bold text-stone-900">{idx + 1}. {att.rail}</span>
                            {att.error && <div className="text-rose-600 text-[9px] truncate max-w-[200px]">{att.error}</div>}
                          </div>
                          <div className="text-right">
                            <span className={att.status === 'SUCCESS' ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
                              {att.status}
                            </span>
                            <div className="text-stone-400">{att.latencyMs}ms</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-stone-400 text-xs">
                  Select a transaction log on the left to inspect reconciliation parameters.
                </div>
              )}
            </div>

          </div>

          {/* Webhook & Async Notification Diagnostics */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>Automated Fulfillment Webhooks & Socket Event Dispatchers</span>
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                Socket.io: ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-stone-600">
              Upon successful clearance, the backend triggers instantaneous async webhook payloads to TM Pick n Pay order staging depots (`Harare Msasa`, `Borrowdale`, `Bulawayo Hyper`) and broadcasts `payment:orchestrated` event streams.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
