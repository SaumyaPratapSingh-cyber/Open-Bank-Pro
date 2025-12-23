import { useState, useEffect } from 'react';
import { getCardRequests, approveCard } from '../../api';
import {
    CheckCircle, Clock, Search, CreditCard, User, ShieldCheck, Check, X,
    Filter, MoreHorizontal, ChevronRight, LayoutGrid, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CardRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [searchTerm, setSearchTerm] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data } = await getCardRequests();
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (cardId) => {
        if (!confirm("Are you sure you want to approve this card request? This will generate a new card number and CVV.")) return;
        setActionLoading(cardId);
        try {
            await approveCard({ cardId });
            // Show success animation or toast
            setRequests(prev => prev.filter(r => r._id !== cardId));
            alert("Card Approved and Generated.");
        } catch (error) {
            alert("Approval Failed: " + (error.response?.data?.error || error.message));
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = (req) => {
        if (!confirm("Reject this request?")) return;
        alert("Rejection feature coming soon. For now, please ignore this request.");
    };

    const filteredRequests = requests.filter(r =>
        r.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.accountNumber?.includes(searchTerm)
    );

    // Stats
    const stats = [
        { label: 'Pending Requests', value: requests.length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        { label: 'Processed Today', value: '12', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' }, // Dummy data for UI
        { label: 'Avg. Processing', value: '2m', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    ];

    return (
        <div className="space-y-8 p-6 lg:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Card Issuance</h1>
                    <p className="text-slate-400 mt-2 text-sm max-w-xl font-medium">
                        Review and approve debit card applications. Ensure KYC status is verified before approval.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-black/30 p-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <List size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx}
                        className="glass-card p-6 flex items-start justify-between relative overflow-hidden group hover:bg-white/5 transition-colors border border-white/10"
                    >
                        <div className="relative z-10">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-3xl font-black text-white mt-2">{stat.value}</h3>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,0,0,0.2)] border border-white/5`}>
                            <stat.icon size={24} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row justify-between gap-4 glass-card p-4 rounded-2xl border border-white/10">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600"
                        placeholder="Search by Name or Account ID..."
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-slate-400 text-sm font-bold hover:text-white hover:border-white/20 transition-colors">
                        <Filter size={16} />
                        Filter
                    </button>
                    <div className="h-6 w-px bg-white/10 mx-1"></div>
                    <button onClick={fetchRequests} className="text-cyan-400 text-sm font-bold hover:text-cyan-300 flex items-center gap-2 px-2">
                        <Clock size={14} /> Refresh Queue
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 animate-pulse">
                    <div className="w-16 h-16 bg-white/5 rounded-full mb-4 border border-white/10"></div>
                    <div className="h-4 bg-white/5 rounded w-48"></div>
                </div>
            ) : requests.length === 0 ? (
                <div className="glass-card border border-white/10 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">All Caught Up!</h2>
                    <p className="text-slate-400 max-w-sm">There are no pending card requests at the moment. Good job!</p>
                </div>
            ) : (
                <>
                    {viewMode === 'list' ? (
                        <div className="glass-card p-0 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-black/40 border-b border-white/10">
                                        <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Applicant</th>
                                        <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Card Details</th>
                                        <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Requested On</th>
                                        <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredRequests.map((req, i) => (
                                        <tr key={req._id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 flex items-center justify-center font-bold text-sm shadow-inner border border-white/10">
                                                        {req.ownerName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-200">{req.ownerName}</div>
                                                        <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                                                            <User size={10} />
                                                            {req.accountNumber}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-8 rounded-md flex items-center justify-center border ${req.network === 'VISA' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>
                                                        <span className="font-black text-[10px] italic">{req.network}</span>
                                                    </div>
                                                    <span className="text-sm text-slate-300 font-bold">{req.cardType}</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="text-sm text-slate-400 font-medium">
                                                    {new Date(req.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-slate-600">
                                                    {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                    Pending
                                                </span>
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleReject(req)}
                                                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                        title="Reject"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(req._id)}
                                                        disabled={actionLoading === req._id}
                                                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-500/20"
                                                    >
                                                        {actionLoading === req._id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Check size={16} />}
                                                        Approve
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRequests.map(req => (
                                <div key={req._id} className="glass-card border border-white/10 rounded-2xl p-6 relative group hover:border-cyan-500/30 transition-all hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                    <div className="absolute top-4 right-4">
                                        <span className="w-2 h-2 rounded-full bg-amber-400 block shadow-[0_0_10px_rgba(251,191,36,0.5)] animate-pulse"></span>
                                    </div>

                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-inner">
                                            <CreditCard className="text-cyan-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-lg">{req.ownerName}</h3>
                                            <p className="text-slate-500 text-xs font-mono">{req.accountNumber}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between items-center text-sm p-3 bg-white/5 rounded-xl border border-white/5">
                                            <span className="text-slate-500 text-xs font-bold uppercase">Card Type</span>
                                            <span className="text-slate-300 font-bold">{req.network} {req.cardType}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm p-2 px-3">
                                            <span className="text-slate-500">Request Date</span>
                                            <span className="text-slate-300 font-medium">{new Date(req.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm p-2 px-3">
                                            <span className="text-slate-500">Name on Card</span>
                                            <span className="text-slate-300 font-medium uppercase">{req.nameOnCard || req.ownerName}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleReject(req)}
                                            className="py-3 rounded-xl border border-white/10 text-slate-400 font-bold text-sm hover:bg-white/5 hover:text-white transition-colors"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleApprove(req._id)}
                                            disabled={actionLoading === req._id}
                                            className="py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all disabled:opacity-50"
                                        >
                                            {actionLoading === req._id ? 'Processing...' : 'Approve'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CardRequests;
