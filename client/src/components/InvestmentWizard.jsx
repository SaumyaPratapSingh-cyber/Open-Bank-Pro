import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calculator, ArrowRight, CheckCircle, ShieldCheck, Download, KeyRound } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { createInvestment, validateUpiPin } from '../api';
import toast from 'react-hot-toast';
import PinInput from './PinInput';

const COLORS = ['#22d3ee', '#34d399']; // Cyan-400, Emerald-400

export default function InvestmentWizard({ onClose, onSuccess, account }) {
    const [step, setStep] = useState(1);
    const [type, setType] = useState('FD');
    const [amount, setAmount] = useState(10000);
    const [tenure, setTenure] = useState(12);
    const [loading, setLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [createdInvestment, setCreatedInvestment] = useState(null);
    const [pin, setPin] = useState(['', '', '', '', '', '']);

    // Calculations
    const interestRate = type === 'FD' ? 6.5 : 7.0; // Simplified rates
    const getCalculations = () => {
        let maturityAmount = 0;
        let totalInterest = 0;

        if (type === 'FD') {
            // Compound Interest for FD: A = P(1 + r/n)^(nt)
            // Assuming annual compounding for simplicity in display
            maturityAmount = amount * Math.pow((1 + interestRate / 100), (tenure / 12));
            totalInterest = maturityAmount - amount;
        } else {
            // RD Simple calculation approximation: P * n + (P * n(n+1) / 24) * (r/100)
            // Total Deposit
            const totalDeposit = amount * tenure;
            // Interest
            totalInterest = (amount * tenure * (tenure + 1) / 24) * (interestRate / 100);
            maturityAmount = totalDeposit + totalInterest;
        }

        return {
            invested: type === 'FD' ? amount : amount * tenure,
            interest: Math.round(totalInterest),
            total: Math.round(maturityAmount)
        };
    };

    const calculations = getCalculations();
    const chartData = [
        { name: 'Principal', value: calculations.invested },
        { name: 'Interest', value: calculations.interest }
    ];

    const handlePinSubmit = async () => {
        setLoading(true);
        try {
            if (pin.join('').length !== 6) throw new Error("Enter complete 6-digit PIN");

            // Verify PIN
            await validateUpiPin({ accountNumber: account.accountNumber, pin: pin.join('') });

            // If valid, proceed to create investment
            setStep(4); // Processing Step
        } catch (err) {
            toast.error(err.response?.data?.error || "Invalid UPI PIN");
            setPin(['', '', '', '', '', '']); // Reset PIN
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        // Simulate "Banking Process" lines
        const steps = ['Verifying Auth...', 'Creating Ledger Entry...', 'Allocating Bonds...', 'Finalizing Investment...'];

        for (const s of steps) {
            toast.loading(s, { id: 'process', duration: 1000, style: { background: '#1e293b', color: '#fff' } });
            await new Promise(r => setTimeout(r, 1000));
        }

        try {
            const res = await createInvestment({
                accountNumber: account.accountNumber,
                type,
                amount,
                tenureMonths: tenure,
            });
            toast.success("Investment Bond Issued!", { id: 'process', style: { background: '#1e293b', color: '#10b981' } });
            setCreatedInvestment(res.data);
            setStep(5); // Success Step
            if (onSuccess) onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.error || "Investment Failed", { id: 'process', style: { background: '#1e293b', color: '#f43f5e' } });
            setStep(2); // Go back to review on failure
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="bg-white/5 border-b border-white/5 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg border border-white/5">
                                <Calculator className="w-6 h-6 text-cyan-400" />
                            </div>
                            Investment Simulator
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Step {step} of 5: <span className="text-cyan-400 font-bold">
                                {step === 1 ? 'Configure' : step === 2 ? 'Review' : step === 3 ? 'Authenticate' : step === 4 ? 'Processing' : 'Success'}
                            </span>
                        </p>
                    </div>
                    {step !== 4 && step !== 5 && (
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <AnimatePresence mode="wait">

                        {/* STEP 1: SIMULATOR */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1 space-y-6">
                                    {/* Type Selection */}
                                    <div>
                                        <label className="block text-xs font-bold text-cyan-400/80 uppercase tracking-wider mb-2">Product Type</label>
                                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                                            {['FD', 'RD'].map((t) => (
                                                <button
                                                    key={t}
                                                    onClick={() => setType(t)}
                                                    className={`flex-1 py-3 rounded-lg font-bold transition-all text-sm ${type === t ? 'bg-cyan-500/20 text-cyan-400 shadow-glass border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                                                >
                                                    {t === 'FD' ? 'Fixed Deposit' : 'Recurring Deposit'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Amount Slider/Input */}
                                    <div>
                                        <label className="block text-xs font-bold text-cyan-400/80 uppercase tracking-wider mb-2">
                                            {type === 'FD' ? 'Investment Amount' : 'Monthly Deposit'}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xl">₹</span>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(Number(e.target.value))}
                                                className="w-full pl-10 p-4 bg-black/40 border border-white/10 rounded-xl font-bold text-2xl outline-none focus:border-cyan-500/50 transition-colors text-white placeholder-slate-600"
                                            />
                                        </div>
                                        <input
                                            type="range"
                                            min="500"
                                            max="1000000"
                                            step="500"
                                            value={amount}
                                            onChange={(e) => setAmount(Number(e.target.value))}
                                            className="w-full mt-6 accent-cyan-400 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    {/* Tenure Selection */}
                                    <div>
                                        <label className="block text-xs font-bold text-cyan-400/80 uppercase tracking-wider mb-2">Tenure Duration</label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {[12, 24, 36, 60].map((m) => (
                                                <button
                                                    key={m}
                                                    onClick={() => setTenure(m)}
                                                    className={`py-3 rounded-xl border font-bold transition-all text-sm ${tenure === m ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-glass' : 'border-white/10 bg-black/20 text-slate-400 hover:border-white/20'}`}
                                                >
                                                    {m} M
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

                                {/* Visuals */}
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="h-64 relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={chartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value) => `₹${value.toLocaleString()}`}
                                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Center Text */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ROI</p>
                                            <p className="text-xl font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">{((calculations.interest / calculations.invested) * 100).toFixed(1)}%</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 text-sm">Maturity Amount</span>
                                            <span className="text-2xl font-bold text-white tracking-wide">₹{calculations.total.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full h-px bg-white/5"></div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Total Interest</span>
                                            <span className="font-bold text-emerald-400">+ ₹{calculations.interest.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setStep(2)}
                                        className="mt-6 w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                                    >
                                        Proceed to Apply <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: REVIEW */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                                <div className="max-w-2xl mx-auto">
                                    <h3 className="text-2xl font-bold text-white mb-8 text-center">Confirm Application</h3>

                                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8 relative">
                                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
                                        <div className="p-6 grid grid-cols-2 gap-y-8 gap-x-4 relative z-10">
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Product</p>
                                                <p className="font-bold text-lg text-cyan-400">{type === 'FD' ? 'Fixed Deposit' : 'Recurring Deposit'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Interest Rate</p>
                                                <p className="font-bold text-lg text-emerald-400">{interestRate}% p.a.</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Principal Amount</p>
                                                <p className="font-bold text-lg text-white">₹{amount.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Maturity Date</p>
                                                <p className="font-bold text-lg text-white">
                                                    {new Date(new Date().setMonth(new Date().getMonth() + tenure)).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="col-span-2 bg-black/40 p-5 rounded-xl flex justify-between items-center border border-white/10">
                                                <span className="font-bold text-slate-300">Maturity Value</span>
                                                <span className="text-2xl font-bold text-white tracking-widest">₹{calculations.total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <label className="flex items-start gap-4 cursor-pointer group p-3 rounded-xl hover:bg-white/5 transition-colors">
                                            <div className="relative flex items-center pt-1">
                                                <input
                                                    type="checkbox"
                                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-500 transition-all checked:border-cyan-500 checked:bg-cyan-500"
                                                    checked={termsAccepted}
                                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                                />
                                                <CheckCircle className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                            </div>
                                            <span className="text-sm text-slate-400 group-hover:text-slate-300 leading-relaxed">
                                                I agree to the <button onClick={(e) => { e.preventDefault(); setShowTerms(true); }} className="text-cyan-400 font-bold underline hover:text-cyan-300">Terms & Conditions</button> and authorize the bank to deduct the amount from my savings account.
                                            </span>
                                        </label>
                                    </div>

                                    {/* Terms Modal Overlay */}
                                    {showTerms && (
                                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 max-h-screen">
                                            <div className="bg-[#1e293b] border border-white/10 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                                                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                                    <h3 className="text-xl font-bold text-white">Terms & Conditions</h3>
                                                    <button onClick={() => setShowTerms(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
                                                </div>
                                                <div className="p-6 overflow-y-auto text-sm text-slate-300 space-y-4 leading-relaxed scrollbar-thin scrollbar-thumb-white/10">
                                                    <p><strong className="text-cyan-400">1. Deposit Agreement:</strong> The depositor agrees to maintain the deposit for the specified tenure. Premature withdrawal is subject to penalties.</p>
                                                    <p><strong className="text-cyan-400">2. Interest Rates:</strong> Interest rates are subject to change based on RBI guidelines. The rate locked at the time of booking will apply for the full tenure.</p>
                                                    <p><strong className="text-cyan-400">3. Premature Withdrawal:</strong> Withdrawals before maturity will incur a penalty of 2% on the principal amount. Interest paid will be recalculated.</p>
                                                    <p><strong className="text-cyan-400">4. Auto-Renewal:</strong> Unless specified otherwise, the deposit will not auto-renew upon maturity. Funds will be credited to the primary savings account.</p>
                                                    <p><strong className="text-cyan-400">5. Tax Deduction:</strong> TDS provided is as per Income Tax Act, 1961. Please submit Form 15G/H if applicable to avoid deduction.</p>
                                                </div>
                                                <div className="p-4 bg-black/20 border-t border-white/10">
                                                    <button onClick={() => setShowTerms(false)} className="w-full py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors">I Understand</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setStep(1)}
                                            className="flex-1 py-4 bg-white/5 text-slate-400 rounded-xl font-bold hover:bg-white/10 hover:text-white transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={() => setStep(3)}
                                            disabled={!termsAccepted}
                                            className="flex-2 w-full py-4 bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg hover:bg-emerald-500 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                                        >
                                            Confirm Investment
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: AUTHENTICATE (NEW) */}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                                <div className="max-w-md mx-auto text-center py-8">
                                    <div className="mb-8">
                                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400 border border-emerald-500/20">
                                            <KeyRound className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Authorize Transaction</h3>
                                        <p className="text-slate-400 text-sm">Enter your 6-digit UPI PIN to verify this investment of <span className="text-white font-bold">₹{amount.toLocaleString()}</span></p>
                                    </div>

                                    <div className="bg-black/40 border border-white/10 rounded-2xl p-8 mb-8 backdrop-blur-sm">
                                        <PinInput values={pin} setValues={setPin} autoFocus={true} />
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setStep(2)}
                                            className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handlePinSubmit}
                                            disabled={loading || pin.join('').length !== 6}
                                            className="flex-2 w-full py-3 bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold hover:bg-emerald-500 transition-colors shadow-lg flex items-center justify-center gap-2"
                                        >
                                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Verify & Pay'}
                                        </button>
                                    </div>
                                    <p className="mt-6 text-xs text-slate-500 flex items-center justify-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> Secure Verification via OpenBank UPI
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: PROCESSING */}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                onAnimationComplete={() => handleCreate()}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-12"
                            >
                                <div className="relative mb-8">
                                    <div className="w-24 h-24 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
                                    <ShieldCheck className="w-8 h-8 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Processing Investment...</h3>
                                <p className="text-slate-500">Connecting to Core Banking System</p>
                            </motion.div>
                        )}

                        {/* STEP 5: SUCCESS */}
                        {step === 5 && (
                            <motion.div key="step5" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                                >
                                    <CheckCircle className="w-12 h-12" />
                                </motion.div>
                                <h2 className="text-3xl font-bold text-white mb-4">Investment Successful!</h2>
                                <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                                    Your {type === 'FD' ? 'Fixed Deposit' : 'Recurring Deposit'} of <span className="font-bold text-white">₹{amount.toLocaleString()}</span> has been successfully created.
                                </p>

                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={onClose}
                                        className="px-8 py-3 bg-white/5 text-slate-300 rounded-xl font-bold hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        Return to Dashboard
                                    </button>
                                    <button className="px-8 py-3 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-500 transition-colors flex items-center gap-2 shadow-lg shadow-cyan-600/20">
                                        <Download className="w-5 h-5" />
                                        Download Bond
                                    </button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
