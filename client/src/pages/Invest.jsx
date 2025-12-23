import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, Unlock, TrendingUp, ShieldCheck, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAccount, withdrawMoney, depositMoney } from '../api';
import toast, { Toaster } from 'react-hot-toast';

function Invest() {
    const navigate = useNavigate();
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [lockedAmount, setLockedAmount] = useState(500);
    const [isLocked, setIsLocked] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [canClaim, setCanClaim] = useState(false);

    useEffect(() => {
        fetchAccount();
    }, []);

    const fetchAccount = async () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const { accountNumber } = JSON.parse(storedUser);
            const { data } = await getAccount(accountNumber);
            setAccount(data);
        }
    };

    const handleLockFunds = async () => {
        if (lockedAmount > account.balance) {
            toast.error("Insufficient Funds!");
            return;
        }
        setLoading(true);
        try {
            await withdrawMoney({
                accountNumber: account.accountNumber,
                amount: lockedAmount,
                description: "Locked in FD Vault"
            });
            setIsLocked(true);
            setTimeLeft(10); // 10 seconds simulation
            fetchAccount(); // Update balance
            toast.success("Funds Locked Successfully!");
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to Lock Funds");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (isLocked && timeLeft === 0) {
            setCanClaim(true);
        }
    }, [timeLeft, isLocked]);

    const handleClaim = async () => {
        setLoading(true);
        try {
            const interest = Math.round(lockedAmount * 0.10); // 10% Return
            const totalReturn = lockedAmount + interest;

            await depositMoney({
                accountNumber: account.accountNumber,
                amount: totalReturn,
                description: "FD Maturity + Interest"
            });

            toast.success(`Claimed ₹${totalReturn} (Principal + Interest)!`);
            setIsLocked(false);
            setCanClaim(false);
            fetchAccount(); // Update balance
        } catch (err) {
            toast.error("Failed to Claim");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center relative overflow-hidden text-white font-sans">

            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-rose-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-5xl w-full flex flex-col md:flex-row gap-8 relative z-10">

                {/* Left: Info */}
                <div className="w-full md:w-1/3 space-y-6">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-full transition-colors bg-white/5 border border-white/10 text-slate-400 hover:text-white">
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    <div className="glass-card p-8 border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Time Vault</h1>
                        <p className="text-slate-400 leading-relaxed">Lock your money to earn high returns. Experience the power of fast-forward compounding.</p>

                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-4 text-emerald-400 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="font-bold block text-sm uppercase tracking-wide">10% Instant Return</span>
                                    <span className="text-xs text-emerald-400/70">Guaranteed Yield</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-amber-400 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="font-bold block text-sm uppercase tracking-wide">Locked for 10s</span>
                                    <span className="text-xs text-amber-400/70">Simulated 1 Year Tenure</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 border border-white/10 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Available Balance</p>
                            <h2 className="text-2xl font-bold text-white">₹{account?.balance?.toLocaleString()}</h2>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                            <ShieldCheck className="w-5 h-5 text-cyan-400" />
                        </div>
                    </div>
                </div>

                {/* Right: The Vault */}
                <div className="w-full md:w-2/3 glass-card bg-black/40 border border-white/10 rounded-[2.5rem] shadow-2xl p-12 flex flex-col items-center justify-center relative overflow-hidden text-center min-h-[500px]">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>

                    {/* Animated Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                    <AnimatePresence mode="wait">
                        {!isLocked ? (
                            <motion.div
                                key="setup"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative z-10 w-full max-w-sm"
                            >
                                <div className="w-32 h-32 mx-auto mb-8 relative">
                                    <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
                                    <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full"></div>
                                    <div className="w-full h-full flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                                        <Lock className="w-12 h-12 text-cyan-400" />
                                    </div>
                                </div>

                                <h3 className="text-3xl font-bold text-white mb-8 tracking-tight">Setup Fixed Deposit</h3>

                                <div className="bg-white/5 p-8 rounded-2xl backdrop-blur-md border border-white/10 mb-8 hover:border-cyan-500/30 transition-colors group">
                                    <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-4">Amount to Lock</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-4xl text-slate-500 font-light">₹</span>
                                        <input
                                            type="number"
                                            value={lockedAmount}
                                            onChange={(e) => setLockedAmount(Number(e.target.value))}
                                            className="bg-transparent text-5xl font-bold text-white outline-none w-48 text-center border-b-2 border-slate-700 focus:border-cyan-500 transition-colors placeholder-slate-700"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleLockFunds}
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Processing...' : <><Lock className="w-5 h-5" /> Lock Funds Now</>}
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="locked"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative z-10 w-full max-w-sm"
                            >
                                {canClaim ? (
                                    <div className="text-center">
                                        <motion.div
                                            animate={{ rotate: [0, -10, 10, 0] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="mb-8"
                                        >
                                            <div className="w-32 h-32 mx-auto relative cursor-pointer" onClick={handleClaim}>
                                                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                                                <div className="w-full h-full flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                                                    <Unlock className="w-14 h-14 text-emerald-400" />
                                                </div>
                                            </div>
                                        </motion.div>
                                        <h3 className="text-3xl font-bold text-white mb-2">Vault Unlocked!</h3>
                                        <p className="text-emerald-400 mb-8 font-bold tracking-wide">Investment Matured Successfully</p>

                                        <button
                                            onClick={handleClaim}
                                            disabled={loading}
                                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95"
                                        >
                                            Claim Reward (+10%)
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-32 h-32 mx-auto mb-8 relative">
                                            <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-xl animate-pulse"></div>
                                            <div className="w-full h-full flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                                                <Lock className="w-12 h-12 text-rose-500" />
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-bold text-white mb-6">Funds Locked</h3>
                                        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 mb-4 inline-block min-w-[200px]">
                                            <div className="text-6xl font-mono font-bold text-white tabular-nums tracking-wider text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                                                00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                                            </div>
                                        </div>
                                        <p className="text-slate-400 text-sm uppercase tracking-widest mt-4">Matures in 1 Year</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />
        </div>
    );
}

export default Invest;
