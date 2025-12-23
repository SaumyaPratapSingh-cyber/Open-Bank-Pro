import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, AlertCircle, CheckCircle, Clock, ShieldAlert, Send } from 'lucide-react';
import { raiseTicket, getTickets } from '../api';

function Support() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const prefillTxId = searchParams.get('txId') || '';

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);

    const [formData, setFormData] = useState({
        transactionId: prefillTxId,
        issueType: 'TRANSACTION_FAILURE',
        description: ''
    });

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            const { data } = await getTickets();
            setTickets(data);
        } catch (error) {
            console.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.description) return alert("Description required");

        setStatus({ type: 'loading', msg: 'Submitting Ticket...' });
        try {
            await raiseTicket(formData);
            setStatus({ type: 'success', msg: 'Ticket Raised #' + Math.floor(Math.random() * 1000) });
            setFormData({ transactionId: '', issueType: 'TRANSACTION_FAILURE', description: '' });
            loadTickets();
        } catch (error) {
            setStatus({ type: 'error', msg: error.response?.data?.error || "Failed" });
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 font-sans text-white">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors shadow-lg border border-white/5 group">
                        <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">Support & Disputes</h1>
                        <p className="text-slate-400">Track issues, raise disputes, and get help 24/7.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card p-8 bg-black/20 relative overflow-hidden"
                    >
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                            <div className="p-2 bg-cyan-500/10 rounded-lg">
                                <MessageSquare className="w-5 h-5 text-cyan-400" />
                            </div>
                            Raise New Ticket
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <div>
                                <label className="text-xs font-bold text-cyan-400/80 uppercase tracking-wider block mb-2">Transaction ID (Optional)</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all font-mono text-sm"
                                    placeholder="e.g. TXN12345678"
                                    value={formData.transactionId}
                                    onChange={e => setFormData({ ...formData, transactionId: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-cyan-400/80 uppercase tracking-wider block mb-2">Issue Type</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all appearance-none cursor-pointer font-bold text-sm"
                                        value={formData.issueType}
                                        onChange={e => setFormData({ ...formData, issueType: e.target.value })}
                                    >
                                        <option value="TRANSACTION_FAILURE">Transaction Failure</option>
                                        <option value="FRAUD">Fraud / Unauthorized Action</option>
                                        <option value="BILLING">Billing / Fees Issue</option>
                                        <option value="ACCOUNT">Account Access Issue</option>
                                        <option value="OTHER">Other Inquiry</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-cyan-400/80 uppercase tracking-wider block mb-2">Description</label>
                                <textarea
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all h-32 resize-none text-sm leading-relaxed scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                                    placeholder="Please describe your issue in detail so we can assist you better..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
                                <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                Submit Ticket
                            </button>

                            {status && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`text-center font-bold text-sm p-3 rounded-lg border ${status.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}
                                >
                                    {status.msg}
                                </motion.div>
                            )}
                        </form>
                    </motion.div>

                    {/* History List */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-white">Ticket History</h2>
                            <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-slate-300">{tickets.length} Tickets</span>
                        </div>

                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {tickets.length === 0 ? (
                                <div className="glass-card p-10 flex flex-col items-center justify-center text-slate-500 border-dashed border-white/10">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <MessageSquare className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <p>No tickets raised yet.</p>
                                </div>
                            ) : (
                                tickets.map((ticket, idx) => (
                                    <motion.div
                                        key={ticket._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="glass-card p-0 relative overflow-hidden group hover:bg-white/5 transition-colors border border-white/10"
                                    >
                                        {/* Status Glow Bar */}
                                        <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${ticket.status === 'OPEN' ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' :
                                                ticket.status === 'RESOLVED' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                                                    'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                                            }`}></div>

                                        <div className="p-5 pl-7">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${ticket.status === 'OPEN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                                ticket.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                            }`}>
                                                            {ticket.status === 'OPEN' ? <Clock className="w-3 h-3" /> : ticket.status === 'RESOLVED' ? <CheckCircle className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                                            {ticket.status}
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 font-mono tracking-wide opacity-50">#{ticket._id.slice(-6).toUpperCase()}</span>
                                                    </div>
                                                    <h3 className="font-bold text-white text-sm tracking-wide">{ticket.issueType.replace(/_/g, ' ')}</h3>
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-500 bg-black/40 px-2 py-1 rounded border border-white/5 whitespace-nowrap">
                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <p className="text-slate-300 text-sm bg-black/20 p-3 rounded-lg border border-white/5 leading-relaxed">
                                                {ticket.description}
                                            </p>

                                            {ticket.transactionId && (
                                                <div className="flex items-center gap-2 mt-3">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ref ID:</span>
                                                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/20 tracking-wider">
                                                        {ticket.transactionId}
                                                    </span>
                                                </div>
                                            )}

                                            {ticket.adminResponse && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    className="mt-4 pt-4 border-t border-white/10"
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                                            <ShieldAlert className="w-3 h-3 text-indigo-400" />
                                                        </div>
                                                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Bank Response</p>
                                                    </div>
                                                    <p className="text-sm text-white font-medium bg-gradient-to-r from-indigo-500/10 to-blue-500/10 p-4 rounded-xl border border-indigo-500/20 shadow-inner">
                                                        "{ticket.adminResponse}"
                                                    </p>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default Support;
