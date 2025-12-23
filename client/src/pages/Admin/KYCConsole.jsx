import React, { useState, useEffect } from 'react';
import { getKycQueue, updateKycStatus } from '../../api';
import { Check, X, AlertTriangle, User, Calendar, MapPin, Search, FileText } from 'lucide-react';

const KYCConsole = () => {
    const [queue, setQueue] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadQueue();
    }, []);

    const loadQueue = async () => {
        try {
            const { data } = await getKycQueue();
            setQueue(data);
        } catch (error) {
            console.error("Failed to load queue", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (status, riskRating = 'LOW') => {
        if (!selectedUser) return;
        setProcessing(true);
        try {
            await updateKycStatus({
                accountNumber: selectedUser.accountNumber,
                status,
                riskRating
            });
            // Remove from local queue
            setQueue(prev => prev.filter(u => u.accountNumber !== selectedUser.accountNumber));
            setSelectedUser(null);
        } catch (error) {
            alert("Action failed: " + error.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
                <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Queue...</span>
            </div>
        </div>
    );

    // VIEW 1: QUEUE LIST
    if (!selectedUser) {
        return (
            <div className="animate-in fade-in duration-500">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <User className="text-cyan-400" /> KYC Verification Queue
                    <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/30 uppercase tracking-widest">{queue.length} Pending</span>
                </h2>

                {queue.length === 0 ? (
                    <div className="glass-card p-16 rounded-3xl border border-white/10 text-center text-slate-400 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <Check size={40} className="text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">All Clear!</h3>
                        <p>No pending verification requests at the moment.</p>
                    </div>
                ) : (
                    <div className="glass-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        <table className="w-full text-left">
                            <thead className="bg-black/30 text-slate-500 border-b border-white/10">
                                <tr>
                                    <th className="p-5 font-bold uppercase tracking-widest text-[10px]">Account #</th>
                                    <th className="p-5 font-bold uppercase tracking-widest text-[10px]">Name</th>
                                    <th className="p-5 font-bold uppercase tracking-widest text-[10px]">Email</th>
                                    <th className="p-5 font-bold uppercase tracking-widest text-[10px]">Applied On</th>
                                    <th className="p-5 font-bold uppercase tracking-widest text-[10px]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {queue.map(user => (
                                    <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-5 font-mono text-slate-400 text-xs">{user.accountNumber}</td>
                                        <td className="p-5 font-bold text-white">{user.ownerName}</td>
                                        <td className="p-5 text-slate-400 text-sm">{user.email}</td>
                                        <td className="p-5 text-slate-500 text-xs font-medium">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="p-5">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                                            >
                                                Start Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }

    // VIEW 2: SPLIT CONSOLE
    return (
        <div className="h-[calc(100vh-100px)] flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="mb-4 flex items-center justify-between">
                <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-white flex items-center gap-2 font-bold text-sm uppercase tracking-wider transition-colors">
                    ← Back to Queue
                </button>
                <div className="text-xs text-slate-500 font-mono bg-black/30 px-3 py-1 rounded border border-white/5">ID: {selectedUser.accountNumber}</div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* LEFT: DOCUMENT VIEWER */}
                <div className="w-1/2 glass-card rounded-2xl overflow-hidden flex flex-col relative shadow-2xl border border-white/10 group">
                    <div className="absolute top-4 left-4 bg-black/60 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 z-10 flex items-center gap-2">
                        <FileText size={12} className="text-cyan-400" /> Document Preview
                    </div>
                    {selectedUser.profileImage ? (
                        <div className="relative w-full h-full bg-black/50 overflow-hidden">
                            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]"></div>
                            <img
                                src={selectedUser.profileImage}
                                alt="KYC Doc"
                                className="w-full h-full object-contain relative z-10 p-8 hover:scale-[1.02] transition-transform duration-500"
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-black/20">
                            <AlertTriangle size={64} className="mb-4 text-slate-700" />
                            <p className="font-bold uppercase tracking-wider text-xs">No document uploaded</p>
                        </div>
                    )}
                </div>

                {/* RIGHT: DATA CHECKER */}
                <div className="w-1/2 glass-card rounded-2xl shadow-2xl border border-white/10 flex flex-col bg-slate-900/50 backdrop-blur-xl">
                    <div className="p-6 border-b border-white/10 bg-black/20">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <User className="text-emerald-400" size={18} /> Applicant Details
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Compare these details with the provided document.</p>
                    </div>

                    <div className="flex-1 p-8 space-y-8 overflow-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-8">
                            <Field label="Full Name" value={selectedUser.ownerName} icon={<User size={14} />} />
                            <Field label="Father's Name" value={selectedUser.fatherName} icon={<User size={14} />} />
                            <Field label="Date of Birth" value={new Date(selectedUser.dob).toLocaleDateString()} icon={<Calendar size={14} />} />
                            <Field label="Gender" value={selectedUser.gender} />
                            <Field label="Mobile" value={selectedUser.mobile} />
                            <Field label="Email" value={selectedUser.email} />
                        </div>

                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-start gap-3">
                                <MapPin className="text-cyan-400 mt-1 shrink-0" size={18} />
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Registered Address</label>
                                    <p className="text-slate-200 font-medium leading-relaxed max-w-sm">{selectedUser.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ACTION FOOTER */}
                    <div className="p-6 border-t border-white/10 bg-black/20 gap-4 flex items-center justify-between">
                        <button
                            onClick={() => handleAction('REJECTED')}
                            disabled={processing}
                            className="flex-1 bg-transparent border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-wider text-xs hover:border-rose-500/50"
                        >
                            <X size={16} /> Reject By Admin
                        </button>

                        <div className="flex-1 flex gap-3">
                            <button
                                onClick={() => handleAction('VERIFIED', 'HIGH')}
                                disabled={processing}
                                className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-wider hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                            >
                                Verify (High Risk)
                            </button>
                            <button
                                onClick={() => handleAction('VERIFIED', 'LOW')}
                                disabled={processing}
                                className="flex-[1.5] bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] uppercase tracking-wider text-xs active:scale-95"
                            >
                                <Check size={16} /> Verify & Activate
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Field = ({ label, value, icon }) => (
    <div>
        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            {icon}{label}
        </label>
        <p className="text-base font-bold text-white border-b border-white/5 hover:border-white/20 transition-colors pb-1 truncate" title={value}>
            {value || "N/A"}
        </p>
    </div>
);

export default KYCConsole;
