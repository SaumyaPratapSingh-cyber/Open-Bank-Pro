import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getAccount, getTransactions, freezeAccount, changeUserRole, sendAdminNotification, getInvestments, getCards } from '../../api';
import { Search, Shield, AlertOctagon, TrendingUp, CreditCard, Lock, UserPlus, UserMinus, ArrowLeft, Mail, Phone, MapPin, Calendar, FileText, CheckCircle, XCircle, Send, MessageSquare, PieChart, Briefcase, Eye } from 'lucide-react';

const Customer360 = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialId = searchParams.get('id') || '';

    const [searchTerm, setSearchTerm] = useState(initialId);
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [investments, setInvestments] = useState([]);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('OVERVIEW');

    // Message Modal State
    const [showMsgModal, setShowMsgModal] = useState(false);
    const [msgData, setMsgData] = useState({ title: '', message: '', type: 'INFO' });

    const handleSendMessage = async () => {
        if (!msgData.title || !msgData.message) return alert("Title and Message required");
        try {
            await sendAdminNotification({
                accountNumber: user.accountNumber,
                ...msgData
            });
            alert("Notification Sent Successfully");
            setShowMsgModal(false);
            setMsgData({ title: '', message: '', type: 'INFO' });
        } catch (err) {
            alert("Failed to send: " + err.message);
        }
    };

    useEffect(() => {
        if (initialId) {
            handleSearch(initialId);
        }
    }, [initialId]);

    const handleSearch = async (term = searchTerm) => {
        if (!term) return;
        setLoading(true);
        try {
            const { data } = await getAccount(term);
            setUser(data);
            const txRes = await getTransactions(term);
            setTransactions(txRes.data.slice(0, 50));
            const invRes = await getInvestments(term);
            setInvestments(invRes.data);
            try {
                const cardRes = await getCards(term);
                setCards(cardRes.data);
            } catch (e) { console.error("Cards fetch failed", e); setCards([]); }
        } catch (err) {
            alert('User not found');
        } finally {
            setLoading(false);
        }
    };

    const handleFreeze = async () => {
        if (!confirm('🚨 FREEZE ACCOUNT: This action is irreversible by automated systems. Proceed?')) return;
        try {
            await freezeAccount({ accountNumber: user.accountNumber });
            setUser(prev => ({ ...prev, kycStatus: 'FROZEN', riskRating: 'HIGH' }));
        } catch (err) {
            alert("Action Failed: " + err.message);
        }
    };

    const handleRoleChange = async (newRole) => {
        if (!confirm(`CAUTION: Change user role to ${newRole}?`)) return;
        try {
            await changeUserRole({ accountNumber: user.accountNumber, newRole });
            setUser(prev => ({ ...prev, role: newRole }));
        } catch (err) {
            alert("Action Failed: " + err.message);
        }
    };

    if (!user && !loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 animate-in fade-in zoom-in duration-300 relative">
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                <Search size={64} className="mb-6 text-slate-700" />
                <h3 className="text-2xl font-bold text-white mb-2">Customer 360 Search</h3>
                <p className="text-slate-400 mb-8">Locate any customer record by Account Number.</p>
                <div className="mt-4 flex gap-3 w-full max-w-md">
                    <input
                        className="bg-black/40 border border-white/10 text-white px-6 py-4 rounded-xl focus:outline-none focus:border-cyan-500/50 w-full transition-all text-lg placeholder-slate-600"
                        placeholder="Enter Account Number"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                    <button onClick={() => handleSearch()} className="bg-cyan-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all">Search</button>
                </div>
            </div>
        );
    }

    // Safe Render Helpers
    const safeBalance = (val) => val?.toLocaleString() || '0';
    const safeDate = (date) => date ? new Date(date).toLocaleString() : 'N/A';

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-300 relative">
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Header Identity */}
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between mb-8 glass-card p-8 border border-white/10 overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="flex flex-col md:flex-row items-center cursor-default gap-8 relative z-10 w-full md:w-auto">
                    <button onClick={() => navigate('/admin/directory')} className="absolute md:static top-0 left-0 text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-black border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden relative group-hover:scale-105 transition-transform duration-500">
                        {user?.profileImage ? (
                            <img src={user.profileImage} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl font-black text-slate-700 select-none">{user?.ownerName?.[0] || '?'}</span>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-bold text-white flex flex-col md:flex-row items-center gap-3">
                            {user?.ownerName || 'Unknown User'}
                            {user?.kycStatus === 'VERIFIED' && <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]"><CheckCircle size={12} /> Verified</div>}
                            {user?.kycStatus === 'FROZEN' && <div className="bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-rose-500/20 flex items-center gap-1 shadow-[0_0_10px_rgba(244,63,94,0.2)]"><Lock size={12} /> Frozen</div>}
                        </h1>
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-3 text-sm font-mono text-slate-400">
                            <span className="bg-black/30 px-3 py-1 rounded-lg border border-white/10 select-all hover:text-white hover:border-cyan-500/30 transition-colors cursor-pointer">ACC: {user?.accountNumber}</span>
                            <span className="flex items-center gap-1.5"><Mail size={14} className="text-cyan-500" /> {user?.email}</span>
                            <span className="flex items-center gap-1.5"><Phone size={14} className="text-cyan-500" /> {user?.mobile}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 relative z-10 mt-6 md:mt-0 w-full md:w-auto">
                    <button onClick={() => setShowMsgModal(true)} className="flex-1 md:flex-none glass-button bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                        <MessageSquare size={18} /> Message
                    </button>
                    {user?.kycStatus !== 'FROZEN' && (
                        <button onClick={handleFreeze} className="flex-1 md:flex-none glass-button bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                            <Lock size={18} /> Freeze
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 mb-8 overflow-x-auto pb-1 gap-8">
                <Tab label="Overview" active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} />
                <Tab label="Financial Portfolio" active={activeTab === 'FINANCIALS'} onClick={() => setActiveTab('FINANCIALS')} />
                <Tab label="Issued Cards" active={activeTab === 'CARDS'} onClick={() => setActiveTab('CARDS')} />
                <Tab label="Transactions" active={activeTab === 'ACTIVITY'} onClick={() => setActiveTab('ACTIVITY')} />
                <Tab label="Access Control" active={activeTab === 'ADMIN'} onClick={() => setActiveTab('ADMIN')} />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto custom-scrollbar pr-2 pb-10">

                {/* OVERVIEW TAB */}
                {activeTab === 'OVERVIEW' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Personal Info Card */}
                        <Card title="Official Records" icon={<FileText className="text-blue-400" />}>
                            <div className="space-y-4">
                                <InfoRow label="Full Name" value={user?.ownerName} />
                                <InfoRow label="Guardian / Father" value={user?.fatherName} />
                                <InfoRow label="Date of Birth" value={user?.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'} icon={<Calendar size={14} />} />
                                <InfoRow label="Gender" value={user?.gender} />
                                <InfoRow label="Address" value={user?.address} icon={<MapPin size={14} />} />
                            </div>
                        </Card>

                        {/* Risk Profile Card */}
                        <Card title="Compliance & Risk" icon={<AlertOctagon className="text-amber-400" />}>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                    <span className="text-sm text-slate-400 font-bold uppercase tracking-wider">KYC Verification</span>
                                    <span className={`font-black text-sm tracking-wide ${user?.kycStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'}`}>{user?.kycStatus}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                    <span className="text-sm text-slate-400 font-bold uppercase tracking-wider">AML Risk Rating</span>
                                    <span className={`font-black text-sm tracking-wide ${user?.riskRating === 'HIGH' ? 'text-rose-400' : user?.riskRating === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>{user?.riskRating || 'LOW'}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                    <span className="text-sm text-slate-400 font-bold uppercase tracking-wider">Customer Role</span>
                                    <span className="font-mono text-purple-400 font-bold">{user?.role}</span>
                                </div>
                            </div>
                        </Card>

                        {/* Net Worth */}
                        <Card title="Net Liquid Assets" icon={<TrendingUp className="text-emerald-400" />}>
                            <div className="text-center py-6 relative">
                                <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full"></div>
                                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2 tracking-tighter drop-shadow-lg">₹{safeBalance(user?.balance)}</div>
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-8">Savings Account Balance</div>

                                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                                    <div className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                                        <div className="text-xl font-bold text-white">₹{investments.reduce((acc, inv) => acc + inv.principalAmount, 0).toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">Investment Value</div>
                                    </div>
                                    <div className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                                        <div className="text-xl font-bold text-white">{investments.length}</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">Active Holdings</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* FINANCIALS TAB */}
                {activeTab === 'FINANCIALS' && (
                    <div className="space-y-6">
                        {/* Accounts */}
                        <Card title="Depository Accounts" icon={<CreditCard className="text-blue-400" />}>
                            <table className="w-full text-sm text-left">
                                <thead className="text-slate-500 border-b border-white/10 font-bold text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="pb-4 pl-4">Product</th>
                                        <th className="pb-4">Account Number</th>
                                        <th className="pb-4 text-right pr-4">Available Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-300">
                                    <tr className="hover:bg-white/5 transition-colors group">
                                        <td className="py-5 pl-4 font-bold text-white flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div> Savings Premium
                                        </td>
                                        <td className="py-5 font-mono text-slate-400 group-hover:text-cyan-400 transition-colors">{user?.accountNumber}</td>
                                        <td className="py-5 text-right font-bold text-emerald-400 pr-4 drop-shadow-sm">₹{safeBalance(user?.balance)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </Card>

                        {/* Investments */}
                        <Card title="Investment Holdings (FD/RD)" icon={<PieChart className="text-purple-400" />}>
                            {investments.length > 0 ? (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-slate-500 border-b border-white/10 font-bold text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="pb-4 pl-4">Type</th>
                                            <th className="pb-4">Certificate ID</th>
                                            <th className="pb-4">Principal</th>
                                            <th className="pb-4">Rate</th>
                                            <th className="pb-4">Maturity Date</th>
                                            <th className="pb-4 text-right pr-4">Maturity Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-300 divide-y divide-white/5">
                                        {investments.map(inv => (
                                            <tr key={inv._id} className="hover:bg-white/5 transition-colors">
                                                <td className="py-5 pl-4 font-bold text-white">{inv.type}</td>
                                                <td className="py-5 font-mono text-slate-500 text-xs">{inv._id}</td>
                                                <td className="py-5 text-slate-300 font-mono">₹{inv.principalAmount.toLocaleString()}</td>
                                                <td className="py-5 text-blue-400 font-mono font-bold">{inv.interestRate}%</td>
                                                <td className="py-5 text-slate-400 text-xs font-bold uppercase">{new Date(inv.maturityDate).toLocaleDateString()}</td>
                                                <td className="py-5 text-right font-bold text-emerald-400 pr-4">₹{Math.round(inv.maturityAmount).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 text-center text-slate-600 italic border border-dashed border-white/10 rounded-2xl bg-black/20">
                                    No active investments found for this customer.
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* CARDS TAB (NEW) */}
                {activeTab === 'CARDS' && (
                    <Card title="Issued Cards" icon={<CreditCard className="text-emerald-400" />}>
                        {cards.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {cards.map((card) => (
                                    <div key={card._id} className="glass-card rounded-2xl p-8 border border-white/10 relative group overflow-hidden hover:border-emerald-500/30 transition-all shadow-lg">
                                        {/* Background Decoration */}
                                        <div className="absolute top-0 right-0 p-8 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
                                            <CreditCard size={150} />
                                        </div>

                                        <div className="flex justify-between items-start mb-8">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{card.network}</span>
                                                <h3 className="text-white font-black text-xl tracking-tight">{card.cardType} Card</h3>
                                            </div>
                                            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                                {card.status}
                                            </div>
                                        </div>

                                        <div className="mb-8">
                                            <div className="text-2xl text-slate-200 font-mono tracking-widest drop-shadow-md">
                                                {card.status === 'ACTIVE' ? card.cardNumber.replace(/(.{4})/g, '$1 ') : '**** **** **** ' + card.cardNumber.slice(-4)}
                                            </div>
                                        </div>

                                        <div className="flex justify-between text-sm">
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Expiry</p>
                                                <p className="text-white font-mono">{card.expiryDate}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">CVV</p>
                                                <p className="text-white font-mono">***</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Holder</p>
                                                <p className="text-white font-bold">{user.ownerName}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-600 italic border border-dashed border-white/10 rounded-2xl bg-black/20">
                                No cards issued to this customer.
                            </div>
                        )}
                    </Card>
                )}

                {/* ACTIVITY TAB */}
                {activeTab === 'ACTIVITY' && (
                    <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-black/30 text-slate-500 border-b border-white/10 font-bold text-xs uppercase tracking-widest">
                                <tr>
                                    <th className="p-5">Date & Time</th>
                                    <th className="p-5">Reference</th>
                                    <th className="p-5">Description</th>
                                    <th className="p-5 text-right">Amount</th>
                                    <th className="p-5 text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {transactions.length > 0 ? transactions.map(tx => (
                                    <tr key={tx._id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-5 text-slate-400 font-mono text-xs font-bold">{safeDate(tx.createdAt)}</td>
                                        <td className="p-5 text-slate-500 font-mono text-xs">{tx.refNo || 'N/A'}</td>
                                        <td className="p-5 text-slate-300 font-medium group-hover:text-white transition-colors">{tx.description}</td>
                                        <td className={`p-5 text-right font-bold font-mono ${['DEPOSIT', 'INVESTMENT_WITHDRAWAL', 'LOAN_DISBURSAL'].includes(tx.type) || tx.toAccount === user?.accountNumber ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {['DEPOSIT', 'INVESTMENT_WITHDRAWAL', 'LOAN_DISBURSAL'].includes(tx.type) || tx.toAccount === user?.accountNumber ? '+' : '-'}₹{safeBalance(tx.amount)}
                                        </td>
                                        <td className="p-5 text-right text-slate-400 font-mono font-bold">₹{safeBalance(tx.runningBalance)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="p-12 text-center text-slate-500 italic">No recent transactions recorded.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ADMIN CONTROLS TAB */}
                {activeTab === 'ADMIN' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card title="Privilege & Access Control" icon={<Briefcase className="text-purple-400" />}>
                            <div className="p-6 bg-black/30 rounded-xl border border-white/10 mb-8 relative overflow-hidden">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-2 tracking-widest">Current Authorization Level</div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`text-3xl font-black tracking-tight ${user?.role === 'ADMIN' ? 'text-purple-400' : 'text-white'}`}>
                                        {user?.role || 'CUSTOMER'}
                                    </div>
                                    {user?.role === 'ADMIN' && <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(168,85,247,0.5)]">Superuser</span>}
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-medium">
                                    {user?.role === 'CUSTOMER' ? 'Standard access to personal banking modules only.' : 'Elevated system privileges enabled.'}
                                </p>
                            </div>

                            <p className="text-slate-400 mb-4 text-xs font-bold uppercase tracking-widest">Elevate Privileges (Root Access Required)</p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleRoleChange('MANAGER')}
                                    disabled={user?.role === 'MANAGER'}
                                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-left group"
                                >
                                    <div className="text-slate-200 font-bold text-sm group-hover:text-blue-400 transition-colors">Manager</div>
                                    <div className="text-[10px] text-slate-500 mt-1">View Data, Verify KYC</div>
                                </button>

                                <button
                                    onClick={() => handleRoleChange('ADMIN')}
                                    disabled={user?.role === 'ADMIN'}
                                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-left group"
                                >
                                    <div className="text-slate-200 font-bold text-sm group-hover:text-purple-400 transition-colors">Administrator</div>
                                    <div className="text-[10px] text-slate-500 mt-1">Full System Access</div>
                                </button>

                                {user?.role !== 'CUSTOMER' && (
                                    <button
                                        onClick={() => handleRoleChange('CUSTOMER')}
                                        className="col-span-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 hover:border-rose-500/40 transition-all text-center group"
                                    >
                                        <div className="text-rose-400 font-bold text-sm group-hover:text-rose-300">Revoke Admin Access</div>
                                    </button>
                                )}
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* Message Modal */}
            {showMsgModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in zoom-in duration-200">
                    <div className="glass-card border border-white/10 rounded-2xl p-8 w-[500px] shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3 border-b border-white/10 pb-6">
                            <Send size={24} className="text-cyan-400" /> Send Custom Notification
                        </h3>

                        <div className="space-y-6 relative z-10">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">Subject Line</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500/50 outline-none transition-all placeholder-slate-600 font-bold"
                                    value={msgData.title}
                                    onChange={e => setMsgData({ ...msgData, title: e.target.value })}
                                    placeholder="e.g., Action Required: Update KYC"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">Notification Type</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['INFO', 'SUCCESS', 'ALERT', 'WARNING'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setMsgData({ ...msgData, type })}
                                            className={`px-2 py-2 rounded-lg text-[10px] font-bold border transition-all ${msgData.type === type
                                                ? type === 'INFO' ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                                                    : type === 'SUCCESS' ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                                        : type === 'ALERT' ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                                                            : 'bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                                                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">Message Body</label>
                                <textarea
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-500/50 outline-none h-32 leading-relaxed resize-none placeholder-slate-600"
                                    value={msgData.message}
                                    onChange={e => setMsgData({ ...msgData, message: e.target.value })}
                                    placeholder="Write your message here..."
                                />
                            </div>

                            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-white/10">
                                <button onClick={() => setShowMsgModal(false)} className="px-6 py-3 text-slate-400 hover:text-white transition-colors font-bold text-sm">Cancel</button>
                                <button onClick={handleSendMessage} className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] font-bold transition-all flex items-center gap-2">
                                    <Send size={16} /> Send Message
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// UI Components
const Tab = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-3 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${active ? 'border-cyan-400 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
    >
        {label}
    </button>
);

const Card = ({ title, icon, children }) => (
    <div className="glass-card rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors shadow-lg">
        <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
            {icon} {title}
        </h3>
        {children}
    </div>
);

const InfoRow = ({ label, value, icon }) => (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 hover:bg-white/5 px-2 -mx-2 rounded transition-colors">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
            {icon} {label}
        </div>
        <div className="font-bold text-slate-200 text-right">{value || 'N/A'}</div>
    </div>
);

export default Customer360;
