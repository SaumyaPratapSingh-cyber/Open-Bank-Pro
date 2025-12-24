import React, { useState, useEffect } from 'react';
import { getAllCustomers, resendWelcomeEmail } from '../../api';
import axios from 'axios';
import { Search, Filter, ArrowUpDown, ChevronRight, Download, Users, RefreshCcw, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerDirectory = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const handleTestEmail = async () => {
        try {
            const token = localStorage.getItem('token');
            // Using relative path assuming proxy or same domain, otherwise fallback to configured API logic
            const res = await axios.get('/api/admin/debug-email', {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("SMTP Status: " + JSON.stringify(res.data, null, 2));
        } catch (err) {
            alert("SMTP Test Failed: " + JSON.stringify(err.response?.data || err.message));
        }
    };

    const [error, setError] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); // Auto-refresh user list every 10s
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            setError(null);
            const { data } = await getAllCustomers();
            console.log("Admin Directory Fetch:", data);
            setCustomers(data);
        } catch (error) {
            console.error("Failed to load customers", error);
            setError(error.response?.data?.error || error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch =
            c.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.accountNumber.includes(searchTerm) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'ALL' || c.kycStatus === filterStatus;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-500">
            {/* Header / Controls */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users className="text-cyan-400" /> Customer Directory
                    </h2>
                    <p className="text-slate-400 text-sm font-medium">Global registry of all bank account holders.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleTestEmail}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 hover:bg-purple-500/20 transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                        🐞 Test Email
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 text-slate-300 rounded-xl border border-white/5 hover:bg-white/10 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
                        <Download size={14} /> Export CSV
                    </button>
                    <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-xl hover:bg-cyan-600/30 transition-colors text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                        <RefreshCcw size={14} /> Refresh Data
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="glass-card p-4 rounded-t-2xl border-b-0 border-white/10 flex items-center gap-4">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Name, Account #, or Email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-600 text-sm"
                    />
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-3 py-2.5 rounded-xl border border-white/10">
                    <Filter size={16} className="text-slate-500" />
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="bg-transparent text-slate-300 text-sm focus:outline-none cursor-pointer font-bold"
                    >
                        <option value="ALL" className="bg-slate-900 text-slate-300">All Statuses</option>
                        <option value="VERIFIED" className="bg-slate-900 text-emerald-400">Verified</option>
                        <option value="PENDING" className="bg-slate-900 text-amber-400">Pending</option>
                        <option value="FROZEN" className="bg-slate-900 text-rose-400">Frozen</option>
                    </select>
                </div>
                <div className="ml-auto text-slate-500 text-xs font-mono font-bold uppercase tracking-wider">
                    Showing <span className="text-white">{filteredCustomers.length}</span> records
                </div>
            </div>

            {/* Data Grid */}
            <div className="flex-1 glass-card border-t-0 rounded-t-none border-white/10 overflow-hidden flex flex-col">
                <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-black/20 text-slate-500 sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="p-5 font-bold uppercase tracking-widest text-[10px] border-b border-white/10">Account Identity</th>
                                <th className="p-5 font-bold uppercase tracking-widest text-[10px] border-b border-white/10">Status</th>
                                <th className="p-5 font-bold uppercase tracking-widest text-[10px] border-b border-white/10 text-right">Balance</th>
                                <th className="p-5 font-bold uppercase tracking-widest text-[10px] border-b border-white/10">Role</th>
                                <th className="p-5 font-bold uppercase tracking-widest text-[10px] border-b border-white/10 text-right">Joined</th>
                                <th className="p-5 font-bold uppercase tracking-widest text-[10px] border-b border-white/10 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {error && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center">
                                        <div className="bg-rose-500/10 text-rose-400 p-6 rounded-2xl inline-block border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                                            <p className="font-bold mb-1">Session Expired / Invalid Token</p>
                                            <p className="text-sm mb-4 text-rose-300">{error}</p>
                                            <div className="flex gap-3 justify-center">
                                                <button onClick={loadData} className="text-xs bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-lg font-bold">Retry</button>
                                                <button
                                                    onClick={() => {
                                                        localStorage.removeItem('token');
                                                        localStorage.removeItem('user');
                                                        navigate('/login');
                                                    }}
                                                    className="text-xs bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 font-bold shadow-lg"
                                                >
                                                    Login Again
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Directory...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCustomers.map(c => (
                                <tr key={c._id} className="hover:bg-white/5 group transition-colors cursor-default">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 border border-white/10 shadow-inner group-hover:border-cyan-500/30 group-hover:text-cyan-400 transition-all">
                                                {c.ownerName[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-200 group-hover:text-white transition-colors">{c.ownerName}</div>
                                                <div className="text-[10px] text-slate-500 font-mono tracking-wider">{c.accountNumber}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <StatusBadge status={c.kycStatus} risk={c.riskRating} />
                                    </td>
                                    <td className="p-5 text-right font-mono text-slate-300 font-bold">
                                        ₹{(c.balances?.INR || c.balance || 0).toLocaleString()}
                                    </td>
                                    <td className="p-5">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${c.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'border-transparent text-slate-500'}`}>
                                            {c.role}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right text-slate-500 text-xs font-medium">
                                        {new Date(c.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-5 text-right flex justify-end gap-2">
                                        <ResendEmailButton customer={c} />
                                        <button
                                            onClick={() => navigate(`/admin/customer-360?id=${c.accountNumber}`)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-cyan-400 transition-colors"
                                            title="View Details"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ResendEmailButton = ({ customer }) => {
    const [status, setStatus] = useState('IDLE'); // IDLE, LOADING, SUCCESS, ERROR

    const handleResend = async (e) => {
        e.stopPropagation();
        if (status === 'LOADING') return;

        setStatus('LOADING');
        try {
            await resendWelcomeEmail(customer.accountNumber);
            setStatus('SUCCESS');
            setTimeout(() => setStatus('IDLE'), 2000); // Reset after 2s
        } catch (err) {
            console.error("Email failed detailed:", JSON.stringify(err.response?.data || err.message));
            setStatus('ERROR');
            setTimeout(() => setStatus('IDLE'), 3000);
        }
    };

    return (
        <button
            onClick={handleResend}
            disabled={status === 'LOADING' || status === 'SUCCESS'}
            className={`p-2 rounded-lg transition-all duration-300 ${status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : status === 'ERROR' ? 'bg-rose-500/10 text-rose-400' : 'hover:bg-white/10 text-slate-500 hover:text-emerald-400'}`}
            title="Resend Welcome Email"
        >
            {status === 'LOADING' ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : status === 'SUCCESS' ? (
                <span className="text-[10px] font-bold">SENT</span>
            ) : status === 'ERROR' ? (
                <span className="text-[10px] font-bold">FAIL</span>
            ) : (
                <Send size={16} />
            )}
        </button>
    );
};

const StatusBadge = ({ status, risk }) => {
    let colorClass = 'bg-slate-800 text-slate-400 border-slate-700';
    if (status === 'VERIFIED') colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]';
    if (status === 'FROZEN') colorClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.2)]';
    if (status === 'PENDING') colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.2)]';

    return (
        <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${colorClass}`}>
                {status || 'PENDING'}
            </span>
            {risk === 'HIGH' && (
                <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold uppercase shadow-sm animate-pulse">RISK</span>
            )}
        </div>
    );
};

export default CustomerDirectory;
