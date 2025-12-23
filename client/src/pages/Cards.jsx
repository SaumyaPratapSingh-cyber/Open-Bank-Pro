import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCards, requestCard } from '../api';
import CreditCard3D from '../components/CreditCard3D';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, CreditCard as CardIcon, ShieldCheck, Loader2 } from 'lucide-react';

const Cards = () => {
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);

    const [requestData, setRequestData] = useState({
        nameOnCard: '',
        cardType: 'DEBIT',
        network: 'VISA'
    });
    const [requestStatus, setRequestStatus] = useState(null);

    const fetchCards = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) { navigate('/login'); return; }

            const { data } = await getCards(user.accountNumber);
            setCards(data);
        } catch (error) {
            console.error("Failed to fetch cards", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCards();
    }, []);

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setRequestStatus('loading');
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            await requestCard({ ...requestData, accountNumber: user.accountNumber });
            setRequestStatus('success');
            setTimeout(() => {
                setShowRequestModal(false);
                setRequestStatus(null);
                fetchCards();
            }, 2000);
        } catch (error) {
            setRequestStatus('error');
            alert(error.response?.data?.error || "Request Failed");
        }
    };

    return (
        <div className="min-h-screen p-6 font-sans text-white">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/dashboard')} className="p-2 glass-button bg-white/5 rounded-full shadow-sm hover:bg-white/10 transition-colors border border-white/5 text-slate-300">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-white">My Cards</h1>
                    </div>
                    <button
                        onClick={() => setShowRequestModal(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-black px-5 py-2.5 rounded-xl font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:brightness-110 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Request New Card</span>
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    </div>
                ) : cards.length === 0 ? (
                    <div className="text-center py-20 glass-card border-dashed">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                            <CardIcon className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white">No Cards Found</h3>
                        <p className="text-slate-400 max-w-sm mx-auto mt-2">You don't have any active debit cards. Request one to get started.</p>
                        <button
                            onClick={() => setShowRequestModal(true)}
                            className="mt-6 text-cyan-400 font-bold hover:underline"
                        >
                            Request Now
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {cards.map(card => (
                            <div key={card._id} className="relative">
                                {card.status === 'REQUESTED' ? (
                                    <div className="glass-card h-56 p-6 border-dashed flex flex-col items-center justify-center text-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-amber-500/5 opacity-50"></div>
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                                <CardIcon className="w-6 h-6 text-amber-500" />
                                            </div>
                                            <h3 className="font-bold text-white">Processing Request</h3>
                                            <p className="text-xs text-slate-400 mt-1">Pending Admin Approval</p>
                                            <div className="mt-4 text-xs font-mono bg-white/5 px-3 py-1 rounded border border-white/10 text-slate-500">
                                                {card.network} • {card.cardType}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-transparent">
                                        <CreditCard3D
                                            card={card}
                                            onFreezeToggle={() => alert("Freeze/Unfreeze managed in Dashboard")}
                                            onRegenerateCVV={() => alert("CVV is fixed for this card.")}
                                            loading={false}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Request Modal */}
            <AnimatePresence>
                {showRequestModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-card bg-[#0f172a] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-0 border border-white/10"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h2 className="text-xl font-bold text-white">Request Physical Card</h2>
                                <button onClick={() => setShowRequestModal(false)} className="text-slate-500 hover:text-white">✕</button>
                            </div>

                            {requestStatus === 'success' ? (
                                <div className="p-10 text-center">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Request Sent!</h3>
                                    <p className="text-slate-400 mt-2">You will be notified once the admin approves your card.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleRequestSubmit} className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Name on Card</label>
                                        <input
                                            required
                                            value={requestData.nameOnCard}
                                            onChange={e => setRequestData({ ...requestData, nameOnCard: e.target.value })}
                                            className="w-full p-4 bg-black/20 rounded-xl border border-white/10 outline-none focus:border-cyan-500/50 font-bold text-white placeholder-slate-600 focus:shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all"
                                            placeholder="e.g. JOHN DOE"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Network</label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {['VISA', 'MASTERCARD', 'RUPAY'].map(net => (
                                                    <div
                                                        key={net}
                                                        onClick={() => setRequestData({ ...requestData, network: net })}
                                                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all font-bold text-sm ${requestData.network === net ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'}`}
                                                    >
                                                        {net}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Type</label>
                                            <div
                                                className="p-3 rounded-xl border border-white/5 bg-white/5 text-slate-500 font-bold text-center cursor-not-allowed opacity-70"
                                            >
                                                DEBIT
                                            </div>
                                            <p className="text-[10px] text-slate-600 text-center">Credit cards currently unavailable.</p>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={requestStatus === 'loading'}
                                        className="w-full bg-cyan-500 text-black py-4 rounded-xl font-bold text-lg hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {requestStatus === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
                                        Submit Request
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Cards;
