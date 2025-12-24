import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAccount, getCards } from '../api';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    const storedUser = userString ? JSON.parse(userString) : null;
    const accountNumber = storedUser?.accountNumber;

    useEffect(() => {
        const fetchData = async () => {
            if (!accountNumber) return;
            try {
                const [userRes, cardRes] = await Promise.all([
                    getAccount(accountNumber),
                    getCards(accountNumber)
                ]);
                setUser(userRes.data);
                setCards(cardRes.data);
            } catch (error) {
                console.error("Error loading profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [accountNumber]);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
            <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
        </div>
    );
    if (!user) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white">User not found</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans overflow-x-hidden relative">

            {/* Background Gradients */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600 rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-blob animation-delay-2000"></div>
                <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-emerald-600 rounded-full mix-blend-screen filter blur-[90px] opacity-10 animate-blob animation-delay-4000"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: ID Card & Quick Actions */}
                <div className="lg:col-span-1 space-y-8">

                    {/* Digital ID Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group perspective"
                        style={{ perspective: '1000px' }}
                    >
                        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 transform group-hover:rotate-y-6 bg-black/40 border border-white/10">
                            {/* Glass Background */}
                            <div className="absolute inset-0 bg-white/5 backdrop-blur-md z-0"></div>

                            {/* Content */}
                            <div className="relative z-10 p-6 flex flex-col h-full bg-gradient-to-br from-white/5 to-transparent">

                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                                        <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 14.5v.51m0 0h10m-10 0h-10m10-10h10m -10 0h-10" />
                                        </svg>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-xs uppercase tracking-widest text-slate-400">Status</h3>
                                        <span className={`text-sm font-bold ${user.kycStatus === 'VERIFIED' ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 'text-amber-400'}`}>
                                            {user.kycStatus}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-lg relative">
                                        <img
                                            src={user.profileImage || "https://api.dicebear.com/9.x/avataaars/svg?seed=" + user.ownerName}
                                            alt="Profile"
                                            className="w-full h-full rounded-full object-cover bg-slate-900 border-2 border-slate-900"
                                        />
                                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white tracking-wide">{user.ownerName}</h1>
                                        <p className="text-slate-400 text-sm mt-1 uppercase tracking-wider">{user.accountType} Account</p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">CIF Number</span>
                                        <span className="font-mono text-slate-300 tracking-wider">{user.cifNumber || 'Generating...'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Account No.</span>
                                        <span className="font-mono text-cyan-400 font-bold tracking-wider">{user.accountNumber}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Info: Balance & UPI */}
                    <div className="grid grid-cols-1 gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all"
                        >
                            <h3 className="text-slate-400 text-xs uppercase mb-1 tracking-wider">Total Balance</h3>
                            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-md">
                                ₹ {(user.balances?.INR ?? user.balance ?? 0).toLocaleString('en-IN')}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 to-cyan-900/40 backdrop-blur-xl border border-white/10 flex items-center justify-between group cursor-pointer hover:border-cyan-500/30 transition-all shadow-glass"
                            onClick={() => navigator.clipboard.writeText(user.primaryVpa || user.upiId || user.upiIds?.[0])}
                        >
                            <div>
                                <h3 className="text-cyan-300/80 text-xs uppercase mb-1 tracking-wider">Default UPI ID</h3>
                                <div className="text-lg font-mono text-white flex items-center gap-2">
                                    {user.primaryVpa || user.upiId || user.upiIds?.[0] || 'Not Assigned'}
                                    <svg className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 group-hover:bg-cyan-500/30 transition-colors">
                                <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </motion.div>
                    </div>

                </div>

                {/* Right Column: Personal Details & Cards */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Issued Cards Section */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-cyan-500 rounded-full shadow-[0_0_10px_cyan]"></span>
                            Issued Cards
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {cards.length > 0 ? cards.map((card, index) => (
                                <motion.div
                                    key={card._id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl group transition-all duration-300 hover:scale-[1.02] border border-white/10"
                                >
                                    {/* Card Design based on Type */}
                                    <div className={`absolute inset-0 ${card.cardType === 'CREDIT' ? 'bg-gradient-to-br from-slate-900 via-[#0f172a] to-black' : 'bg-gradient-to-br from-blue-900 via-slate-900 to-black'} p-6 flex flex-col justify-between z-10`}>

                                        {/* Card Texture */}
                                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                                        <div className="absolute top-[-50%] right-[-20%] w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[60px]"></div>

                                        {/* Top Row */}
                                        <div className="flex justify-between items-start">
                                            <div className="text-white/80 font-bold tracking-widest text-sm flex items-center gap-1">
                                                OPENBANK <span className="bg-white/10 text-[8px] px-1 rounded ml-1 border border-white/10">PRO</span>
                                            </div>
                                            <div className="text-white font-bold italic tracking-widest text-lg opacity-80">{card.network}</div>
                                        </div>

                                        {/* Chip */}
                                        <div className="w-12 h-9 rounded-md bg-gradient-to-br from-amber-200 to-amber-600 shadow-inner border border-amber-500/50 flex relative overflow-hidden">
                                            <div className="absolute inset-0 border-[0.5px] border-black/20 rounded-md"></div>
                                        </div>

                                        {/* Card Number */}
                                        <div className="mt-4">
                                            <div className="text-2xl font-mono text-white tracking-widest drop-shadow-md">
                                                {card.cardNumber?.replace(/(\d{4})/g, '$1 ').trim()}
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-[10px] text-cyan-400/60 uppercase font-bold mb-0.5">Card Holder</div>
                                                <div className="text-sm font-bold text-white tracking-wide uppercase">{user.ownerName}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-cyan-400/60 uppercase font-bold mb-0.5">Expires</div>
                                                <div className="text-sm font-bold text-white tracking-wider">{card.expiryDate}</div>
                                            </div>
                                        </div>

                                        {/* Type Label */}
                                        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-[0.3em] text-white/20 uppercase border border-white/10 px-2 py-0.5 rounded-full">
                                            {card.cardType}
                                        </div>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="col-span-2 p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:bg-white/5 transition-colors">
                                    <p>No cards issued yet.</p>
                                </div>
                            )}

                            {/* Apply for New Card Button (Placeholder) */}
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full aspect-[1.586/1] rounded-2xl border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-cyan-500/50 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black text-slate-400 transition-all shadow-lg">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <span className="mt-3 text-sm font-medium text-slate-400 group-hover:text-cyan-400 transition-colors">Request New Card</span>
                            </motion.div>
                        </div>
                    </div>

                    {/* Personal Details Grid */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_blue]"></span>
                            Personal Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: 'Full Name', value: user.ownerName },
                                { label: 'Father\'s Name', value: user.fatherName || 'Not Provided' },
                                { label: 'Date of Birth', value: user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A' },
                                { label: 'Gender', value: user.gender || 'N/A' },
                                { label: 'Email Address', value: user.email },
                                { label: 'Mobile Number', value: user.mobile },
                                { label: 'Address', value: user.address || 'N/A', full: true },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + (i * 0.05) }}
                                    className={`p-4 rounded-xl bg-white/5 backdrop-blur border border-white/5 hover:border-cyan-500/30 hover:bg-white/10 transition-all ${item.full ? 'md:col-span-2' : ''}`}
                                >
                                    <label className="block text-xs uppercase text-cyan-400/60 font-bold mb-1 tracking-wider">{item.label}</label>
                                    <div className="text-white font-medium">{item.value}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;
