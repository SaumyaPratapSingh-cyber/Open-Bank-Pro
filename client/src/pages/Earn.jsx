import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Brush, Coffee, CheckCircle, TrendingUp, ShieldCheck, Gamepad2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAccount, depositMoney } from '../api';
import toast, { Toaster } from 'react-hot-toast';

function Earn() {
    const navigate = useNavigate();
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(false);

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

    const tasks = [
        { id: 1, title: 'Clean Your Room', reward: 50, icon: Brush, color: 'from-orange-400 to-red-500', shadow: 'shadow-orange-500/20', bg: 'bg-orange-500/10 text-orange-400' },
        { id: 2, title: 'Read a Chapter', reward: 100, icon: BookOpen, color: 'from-blue-400 to-indigo-500', shadow: 'shadow-blue-500/20', bg: 'bg-blue-500/10 text-blue-400' },
        { id: 3, title: 'Walk the Dog', reward: 30, icon: Coffee, color: 'from-emerald-400 to-green-500', shadow: 'shadow-emerald-500/20', bg: 'bg-emerald-500/10 text-emerald-400' },
        { id: 4, title: 'Help with Dinner', reward: 75, icon: TrendingUp, color: 'from-purple-400 to-pink-500', shadow: 'shadow-purple-500/20', bg: 'bg-purple-500/10 text-purple-400' },
    ];

    const handleCompleteTask = async (task) => {
        if (loading) return;
        setLoading(true);

        // Simulate verification delay
        const promise = new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    await depositMoney({
                        accountNumber: account.accountNumber,
                        amount: task.reward,
                        description: `Task: ${task.title}`
                    });
                    fetchAccount();
                    resolve();
                } catch (err) {
                    reject(err);
                }
            }, 1500);
        });

        toast.promise(promise, {
            loading: 'Verifying with Parent...',
            success: `Verified! You earned ₹${task.reward}`,
            error: 'Task verification failed',
        });

        try {
            await promise;
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center relative overflow-hidden font-sans">

            {/* Background Effects */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-5xl w-full relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <button onClick={() => navigate('/dashboard')} className="p-3 hover:bg-white/10 rounded-full transition-colors bg-white/5 border border-white/10 text-slate-400 hover:text-white shadow-lg">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-2">
                                Earn Board <span className="text-cyan-400 text-lg bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">BETA</span>
                            </h1>
                            <p className="text-slate-400 mt-1">Complete tasks to unlock your allowance.</p>
                        </div>
                    </div>

                    <div className="glass-card px-8 py-4 border border-white/10 flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Your Pocket Money</p>
                            <p className="text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">₹{account?.balance?.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Task Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tasks.map((task) => (
                        <motion.div
                            key={task.id}
                            whileHover={{ y: -5, scale: 1.01 }}
                            className="glass-card p-6 bg-white/5 border border-white/10 relative overflow-hidden group transition-all"
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${task.color} opacity-5 rounded-bl-[100px] transition-all group-hover:opacity-10`}></div>

                            <div className="flex justify-between items-start mb-6 relative">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${task.bg} ${task.shadow} border border-white/5`}>
                                    <task.icon className="w-8 h-8" />
                                </div>
                                <div className={`px-4 py-2 rounded-full font-bold text-sm bg-gradient-to-r ${task.color} text-white shadow-lg`}>
                                    +₹{task.reward}
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">{task.title}</h3>
                            <p className="text-slate-400 text-sm mb-8 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified by Parent App
                            </p>

                            <button
                                onClick={() => handleCompleteTask(task)}
                                disabled={loading}
                                className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3 border border-white/10 hover:border-cyan-500/30 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                            >
                                <div className={`w-5 h-5 rounded-full border-2 border-slate-500 group-hover:border-cyan-400 group-hover:bg-cyan-400 transition-all`}></div>
                                Mark as Complete
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
            <Toaster position="bottom-center" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />
        </div>
    );
}

export default Earn;
