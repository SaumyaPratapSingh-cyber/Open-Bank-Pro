import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calculator, Percent, DollarSign, Info, ChevronRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Loan() {
    const navigate = useNavigate();
    const [principal, setPrincipal] = useState(500000);
    const [duration, setDuration] = useState(24);
    const [interestRate, setInterestRate] = useState(10.5);

    const [emi, setEmi] = useState(0);
    const [totalInterest, setTotalInterest] = useState(0);

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    useEffect(() => {
        // EMI Calculation: P * r * (1 + r)^n / ((1 + r)^n - 1)
        const P = principal;
        const r = interestRate / 12 / 100;
        const n = duration;

        const emiValue = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayable = emiValue * n;

        setEmi(Math.round(emiValue) || 0);
        setTotalInterest(Math.round(totalPayable - P) || 0);
    }, [principal, duration, interestRate]);

    return (
        <div className="min-h-screen bg-slate-950 font-sans flex flex-col relative overflow-hidden">

            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Loan Simulator</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Financial Planning Tool</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6 md:p-12 flex items-center justify-center pt-24 relative z-10">
                <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* Controls Card */}
                    <div className="glass-card p-8 space-y-8 bg-black/40 border-white/10">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                                <Calculator className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Configure Loan</h2>
                        </div>

                        {/* Principal Slider */}
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors group">
                            <div className="flex justify-between mb-6">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-cyan-400 transition-colors">Loan Amount</label>
                                <div className="text-xl font-bold text-white bg-black/40 px-4 py-1 rounded-lg border border-white/10 shadow-inner font-mono">
                                    {formatCurrency(principal)}
                                </div>
                            </div>
                            <input
                                type="range"
                                min="50000"
                                max="5000000"
                                step="10000"
                                value={principal}
                                onChange={(e) => setPrincipal(Number(e.target.value))}
                                className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                            />
                            <div className="flex justify-between mt-3 text-xs text-slate-500 font-bold font-mono">
                                <span>₹50K</span>
                                <span>₹50L</span>
                            </div>
                        </div>

                        {/* Duration Slider */}
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors group">
                            <div className="flex justify-between mb-6">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-emerald-400 transition-colors">Tenure</label>
                                <div className="text-xl font-bold text-white bg-black/40 px-4 py-1 rounded-lg border border-white/10 shadow-inner font-mono">
                                    {duration} Months
                                </div>
                            </div>
                            <input
                                type="range"
                                min="6"
                                max="120"
                                step="6"
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                            />
                            <div className="flex justify-between mt-3 text-xs text-slate-500 font-bold font-mono">
                                <span>6M</span>
                                <span>120M</span>
                            </div>
                        </div>

                        {/* Interest Rate Slider */}
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors group">
                            <div className="flex justify-between mb-6">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-purple-400 transition-colors">Interest Rate (P.A.)</label>
                                <div className="text-xl font-bold text-white bg-black/40 px-4 py-1 rounded-lg border border-white/10 shadow-inner font-mono">
                                    {interestRate}%
                                </div>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="20"
                                step="0.5"
                                value={interestRate}
                                onChange={(e) => setInterestRate(Number(e.target.value))}
                                className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                            />
                            <div className="flex justify-between mt-3 text-xs text-slate-500 font-bold font-mono">
                                <span>5%</span>
                                <span>20%</span>
                            </div>
                        </div>
                    </div>

                    {/* Results Card */}
                    <div className="space-y-6">
                        <div className="glass-card p-10 bg-gradient-to-br from-slate-900 via-slate-900 to-black border-white/10 relative overflow-hidden shadow-2xl">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                            <div className="relative z-10 text-center">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Estimated Monthly EMI</p>
                                <div className="text-6xl font-bold mb-10 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                                    {formatCurrency(emi)}
                                </div>

                                <div className="grid grid-cols-2 gap-8 text-left border-t border-white/10 pt-8">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Interest</p>
                                        <p className="text-2xl font-bold text-rose-400 drop-shadow-sm">+{formatCurrency(totalInterest)}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Payment</p>
                                        <p className="text-2xl font-bold text-white drop-shadow-sm">{formatCurrency(principal + totalInterest)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Call to Action */}
                        <div className="glass-card p-8 border border-white/10 flex flex-col items-start gap-4 hover:bg-white/5 transition-all group">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    Ready to proceed? <ArrowRight className="w-4 h-4 text-emerald-400" />
                                </h3>
                                <p className="text-sm text-slate-400 leading-relaxed">Apply for a secured loan tailored to your needs with minimal documentation directly from the dashboard.</p>
                            </div>
                            <button
                                onClick={() => navigate('/loans')}
                                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-4 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2"
                            >
                                Apply Now <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

export default Loan;
