import React, { useState, useEffect } from 'react';
import { getAllTicketsAdmin, resolveTicket } from '../../api';
import { MessageSquare, CheckCircle, XCircle, Clock, User, FileText, ChevronRight, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SupportTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [filter, setFilter] = useState('ALL'); // ALL, OPEN, RESOLVED

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            const { data } = await getAllTicketsAdmin();
            setTickets(data);
        } catch (error) {
            console.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (filter === 'ALL') return true;
        return t.status === filter;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MessageSquare className="text-blue-400" /> Support Tickets
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Manage customer disputes and inquiries.</p>
                </div>
                <div className="flex gap-2 p-1 bg-black/30 rounded-xl border border-white/10 backdrop-blur-sm">
                    {['ALL', 'OPEN', 'RESOLVED', 'REJECTED'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="text-center text-slate-500 py-20 flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <span className="text-xs font-bold uppercase tracking-widest">Loading Tickets...</span>
                </div>
            ) : (
                <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/30 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-white/10">
                                <th className="p-5">Status</th>
                                <th className="p-5">Customer</th>
                                <th className="p-5">Issue Type</th>
                                <th className="p-5">Description</th>
                                <th className="p-5">Date</th>
                                <th className="p-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300 text-sm">
                            {filteredTickets.map(ticket => (
                                <tr key={ticket._id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-5">
                                        <StatusBadge status={ticket.status} />
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white">{ticket.ownerName}</span>
                                            <span className="text-[10px] text-slate-500 font-mono tracking-wider">#{ticket.userId}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 font-bold text-blue-400 uppercase text-xs tracking-wide">{ticket.issueType.replace('_', ' ')}</td>
                                    <td className="p-5 max-w-xs truncate text-slate-400 text-xs" title={ticket.description}>
                                        {ticket.description}
                                    </td>
                                    <td className="p-5 text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-5 text-right">
                                        <button
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="px-4 py-1.5 bg-white/5 hover:bg-blue-500/20 border border-white/5 hover:border-blue-500/50 text-slate-300 hover:text-blue-400 rounded-lg text-xs font-bold transition-all uppercase tracking-wider"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredTickets.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-500 italic">No tickets found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <AnimatePresence>
                {selectedTicket && (
                    <TicketModal
                        ticket={selectedTicket}
                        onClose={() => setSelectedTicket(null)}
                        onUpdate={() => { setSelectedTicket(null); loadTickets(); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        'OPEN': 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
        'RESOLVED': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]',
        'REJECTED': 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.2)]',
    };
    return (
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles['OPEN']}`}>
            {status}
        </span>
    );
};

const TicketModal = ({ ticket, onClose, onUpdate }) => {
    const [response, setResponse] = useState('');
    const [status, setStatus] = useState(null); // 'loading' | 'success' | 'error'

    const handleResolve = async (resolutionStatus) => {
        if (!response) return alert("Please enter a response message.");
        setStatus('loading');
        try {
            await resolveTicket(ticket._id, { response, status: resolutionStatus });
            setStatus('success');
            setTimeout(onUpdate, 1000);
        } catch (error) {
            alert(error.response?.data?.error || "Failed");
            setStatus(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden bg-slate-900/50"
            >
                <div className="p-6 border-b border-white/10 flex justify-between items-start bg-black/20">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <MessageSquare className="text-blue-400" /> Ticket Details
                        </h3>
                        <p className="text-slate-500 text-xs mt-1 font-mono uppercase tracking-widest">ID: {ticket._id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-colors">✕</button>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Customer Info */}
                    <div className="flex gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center border border-white/10">
                            <User className="text-slate-400" />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Raised By</div>
                            <div className="text-lg font-bold text-white">{ticket.ownerName || 'Customer'}</div>
                            <div className="text-xs text-slate-400 font-mono tracking-wider">ACC: {ticket.userId}</div>
                        </div>
                        {ticket.transactionId && (
                            <div className="ml-auto text-right">
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Transaction Ref</div>
                                <div className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded inline-block border border-blue-500/20">
                                    {ticket.transactionId}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Issue Description */}
                    <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Issue Description</div>
                        <div className="bg-black/40 p-5 rounded-2xl text-slate-200 leading-relaxed border border-white/10 text-sm">
                            {ticket.description}
                        </div>
                    </div>

                    {/* Admin Action */}
                    {ticket.status === 'OPEN' ? (
                        <div className="space-y-4 pt-6 border-t border-white/10">
                            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Resolution</div>
                            <textarea
                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500/50 focus:outline-none h-32 placeholder-slate-600 resize-none"
                                placeholder="Type your response to the customer here..."
                                value={response}
                                onChange={e => setResponse(e.target.value)}
                            />
                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleResolve('RESOLVED')}
                                    disabled={status === 'loading'}
                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white py-4 rounded-xl font-bold transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                >
                                    {status === 'loading' ? 'Processing...' : <><CheckCircle size={18} /> Resolve Issue</>}
                                </button>
                                <button
                                    onClick={() => handleResolve('REJECTED')}
                                    disabled={status === 'loading'}
                                    className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 py-4 rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
                                >
                                    <XCircle size={18} /> Reject
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                            <div className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                                <CheckCircle size={16} /> Ticket {ticket.status}
                            </div>
                            <div className="text-slate-300 text-sm italic mb-4 pl-6 border-l-2 border-emerald-500/20">
                                "{ticket.adminResponse}"
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest pl-6">
                                Resolved on: {new Date(ticket.resolvedAt).toLocaleString()}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default SupportTickets;
