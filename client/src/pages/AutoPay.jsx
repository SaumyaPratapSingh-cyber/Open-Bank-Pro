import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Calendar, Trash2, CheckCircle, Clock } from 'lucide-react';
import { getBeneficiaries, createAutoPay, getAutoPayList, deleteAutoPay } from '../api';

function AutoPay() {
    const navigate = useNavigate();
    const [payees, setPayees] = useState([]);
    const [instructions, setInstructions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);

    const [formData, setFormData] = useState({
        payeeAccount: '',
        amount: '',
        dayOfMonth: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [payeesRes, instructionsRes] = await Promise.all([
                getBeneficiaries(),
                getAutoPayList()
            ]);
            setPayees(payeesRes.data.filter(p => p.status === 'ACTIVE'));
            setInstructions(instructionsRes.data);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.payeeAccount || !formData.amount || !formData.dayOfMonth) {
            alert("Please fill all fields");
            return;
        }

        const selectedPayee = payees.find(p => p.payeeAccountNum === formData.payeeAccount);

        setStatus({ type: 'loading', msg: 'Scheduling...' });
        try {
            await createAutoPay({
                payeeAccount: formData.payeeAccount,
                payeeName: selectedPayee.payeeName,
                amount: Number(formData.amount),
                dayOfMonth: Number(formData.dayOfMonth)
            });
            setStatus({ type: 'success', msg: 'Auto-Pay Scheduled!' });
            setFormData({ payeeAccount: '', amount: '', dayOfMonth: '' });
            loadData();
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            setStatus({ type: 'error', msg: error.response?.data?.error || "Failed to schedule" });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Cancel this Auto-Pay?")) return;
        try {
            await deleteAutoPay(id);
            loadData();
        } catch (error) {
            alert("Failed to delete");
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 font-sans text-white">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors shadow-lg border border-white/5 group">
                        <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Auto-Pay</h1>
                        <p className="text-slate-400 pointer-events-none">Scheduled Recurring Payments</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Form Section */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 bg-black/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>

                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                            <div className="p-2 bg-cyan-500/10 rounded-lg">
                                <Plus className="w-5 h-5 text-cyan-400" />
                            </div>
                            New Instruction
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <div>
                                <label className="text-xs font-bold text-cyan-400/80 uppercase tracking-wider block mb-2">Select Payee</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all appearance-none cursor-pointer font-bold text-sm"
                                        value={formData.payeeAccount}
                                        onChange={e => setFormData({ ...formData, payeeAccount: e.target.value })}
                                    >
                                        <option value="" className="bg-slate-900">-- Choose Beneficiary --</option>
                                        {payees.map(p => (
                                            <option key={p._id} value={p.payeeAccountNum} className="bg-slate-900 text-white">
                                                {p.payeeName} ({p.payeeAccountNum})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-cyan-400/80 uppercase tracking-wider block mb-2">Amount (INR)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                    <input
                                        type="number"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all font-bold tracking-widest"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-cyan-400/80 uppercase tracking-wider block mb-2">Execute On (Day of Month)</label>
                                <input
                                    type="number"
                                    min="1" max="28"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                                    placeholder="e.g. 5 (5th of every month)"
                                    value={formData.dayOfMonth}
                                    onChange={e => setFormData({ ...formData, dayOfMonth: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                                    Safe limit capped at 28th to handle all months.
                                </p>
                            </div>

                            <button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                {status?.type === 'loading' ? 'Scheduling...' : 'Set Auto-Pay'}
                            </button>

                            {status?.type && (
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`text-center text-sm font-bold mt-2 p-3 rounded-lg border ${status.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}
                                >
                                    {status.msg}
                                </motion.p>
                            )}
                        </form>
                    </motion.div>

                    {/* List Section */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-white">Active Instructions</h2>
                            <span className="text-xs bg-white/10 text-slate-300 px-3 py-1 rounded-full">{instructions.length} Active</span>
                        </div>

                        {loading ? (
                            <div className="text-center text-slate-500 py-10 flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                                Loading...
                            </div>
                        ) : instructions.length === 0 ? (
                            <div className="glass-card p-10 flex flex-col items-center justify-center text-slate-500 border-dashed border-white/10">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                    <Calendar className="w-8 h-8 text-slate-600" />
                                </div>
                                <p>No active auto-pays found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {instructions.map((inst, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={inst._id}
                                        className="glass-card p-5 border border-white/10 flex justify-between items-center group hover:bg-white/5 transition-all relative overflow-hidden"
                                    >
                                        <div className="absolute left-0 top-0 w-1 h-full bg-cyan-500/50"></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Day {inst.dayOfMonth} of Month
                                            </p>
                                            <h3 className="font-bold text-white text-xl mb-1">₹{inst.amount.toLocaleString()}</h3>
                                            <p className="text-sm text-slate-400">To: <span className="font-bold text-slate-200">{inst.payeeName}</span></p>

                                            <div className="flex items-center gap-3 mt-2">
                                                <p className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                                    Next: {new Date(inst.nextExecutionDate).toLocaleDateString()}
                                                </p>
                                                {inst.failureReason && (
                                                    <p className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                                        Failed: {inst.failureReason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(inst._id)} className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 border border-rose-500/20">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default AutoPay;
