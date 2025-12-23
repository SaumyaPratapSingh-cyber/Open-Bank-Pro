import React, { useState, useEffect } from 'react';
import { getAuditTransactions } from '../../api';
import { Activity, AlertTriangle, ArrowDownLeft, ArrowUpRight, RefreshCw, ShieldAlert } from 'lucide-react';

const TransactionMonitor = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await getAuditTransactions();
            setTransactions(data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5s for Live Feed
        return () => clearInterval(interval);
    }, []);

    const getRiskLevel = (amount) => {
        if (amount > 100000) return 'CRITICAL';
        if (amount > 10000) return 'HIGH';
        return 'NORMAL';
    };

    const getRowStyle = (amount) => {
        if (amount > 100000) return 'bg-rose-500/10 hover:bg-rose-500/20 border-l-4 border-l-rose-500';
        if (amount > 10000) return 'bg-amber-500/5 hover:bg-amber-500/10 border-l-4 border-l-amber-500';
        return 'hover:bg-white/5 border-l-4 border-l-transparent';
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Activity className="text-cyan-400" /> Global Transaction Monitor
                    </h2>
                    <p className="text-slate-400 text-sm flex items-center gap-3 mt-1">
                        Displaying live stream of all banking transactions.
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse">Live Feed Active</span>
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Updated: {lastUpdated.toLocaleTimeString()}</span>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 bg-white/5 text-white px-4 py-2 rounded-xl border border-white/5 hover:bg-white/10 transition-all disabled:opacity-50 text-xs font-bold uppercase tracking-wider"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> {loading ? 'Syncing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                    <thead className="bg-black/30 text-slate-500 border-b border-white/10 uppercase text-[10px] font-bold tracking-widest">
                        <tr>
                            <th className="p-5">Risk</th>
                            <th className="p-5">Ref ID</th>
                            <th className="p-5">From Account</th>
                            <th className="p-5">To Account</th>
                            <th className="p-5">Type</th>
                            <th className="p-5 text-right">Amount</th>
                            <th className="p-5 text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-sm">
                        {transactions.map(tx => {
                            const risk = getRiskLevel(tx.amount);
                            return (
                                <tr key={tx._id} className={`${getRowStyle(tx.amount)} transition-colors cursor-default`}>
                                    <td className="p-5">
                                        {risk === 'CRITICAL' && <span className="flex items-center gap-1 text-rose-500 font-bold text-[10px] uppercase tracking-wider shadow-sm animate-pulse"><ShieldAlert size={14} /> Critical</span>}
                                        {risk === 'HIGH' && <span className="flex items-center gap-1 text-amber-500 font-bold text-[10px] uppercase tracking-wider"><AlertTriangle size={14} /> High Value</span>}
                                        {risk === 'NORMAL' && <span className="text-slate-600 text-[10px] font-bold uppercase tracking-wider">Normal</span>}
                                    </td>
                                    <td className="p-5 text-slate-500 text-xs">{tx.refNo || tx.transactionId.substring(0, 8)}</td>
                                    <td className="p-5 text-slate-300 font-bold">{tx.fromAccount}</td>
                                    <td className="p-5 text-slate-300 font-bold">{tx.toAccount}</td>
                                    <td className="p-5">
                                        <span className="px-2 py-1 rounded bg-white/5 text-slate-400 text-[10px] font-bold border border-white/5">{tx.type}</span>
                                    </td>
                                    <td className="p-5 text-right font-bold text-white">₹{tx.amount.toLocaleString()}</td>
                                    <td className="p-5 text-right text-slate-500 text-xs">{new Date(tx.createdAt).toLocaleTimeString()}</td>
                                </tr>
                            );
                        })}
                        {transactions.length === 0 && !loading && (
                            <tr>
                                <td colSpan="7" className="p-16 text-center text-slate-500 italic">
                                    Waiting for live transactions...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionMonitor;
