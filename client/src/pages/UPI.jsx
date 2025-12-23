import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ScanLine, Smartphone, CheckCircle, ShieldCheck, Loader, QrCode, Trash2, Copy, Wallet, Download, History, AlertTriangle, KeyRound } from 'lucide-react';
import API from '../api';
import toast, { Toaster } from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { Scanner } from '@yudiel/react-qr-scanner';
import html2canvas from 'html2canvas';

const PinInput = ({ values, setValues, autoFocus = false }) => {
    const inputRefs = useRef([]);

    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [autoFocus]);

    const handleChange = (e, index) => {
        const val = e.target.value;
        if (isNaN(val)) return;

        const newVals = [...values];
        newVals[index] = val.slice(-1); // Ensure only 1 digit
        setValues(newVals);

        // Auto-focus next
        if (val && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !values[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    return (
        <div className="flex gap-2 justify-center">
            {values.map((digit, i) => (
                <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    type="password"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    className="w-12 h-12 bg-black/30 border border-white/20 rounded-lg text-center text-2xl font-bold focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all text-white placeholder-slate-600"
                />
            ))}
        </div>
    );
};

function UPI() {
    const qrRef = useRef(null);
    const [activeTab, setActiveTab] = useState('pay');

    const [userVpas, setUserVpas] = useState([]);
    const [primaryVpa, setPrimaryVpa] = useState('');
    const [hasPin, setHasPin] = useState(true);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const [vpa, setVpa] = useState('');
    const [recipient, setRecipient] = useState(null);
    const [amount, setAmount] = useState('');
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const [showSetPinModal, setShowSetPinModal] = useState(false);
    const [newPin, setNewPin] = useState(['', '', '', '', '', '']);
    const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
    const [pinStep, setPinStep] = useState(1);

    const [newVpaSuffix, setNewVpaSuffix] = useState('');

    const storedUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (storedUser) fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const { data } = await API.get(`/upi/profile/${storedUser.accountNumber}`);
            setUserVpas(Array.isArray(data.upiIds) ? data.upiIds : []);
            setPrimaryVpa(data.primaryVpa);
            setHasPin(data.hasPin);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleVerify = async (inputVpa) => {
        setLoading(true);
        let searchVpa = inputVpa || vpa;
        searchVpa = searchVpa.trim();

        try {
            const { data } = await API.post('/upi/verify', { vpa: searchVpa });
            setRecipient(data);
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.error || "Invalid UPI ID or Number");
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async () => {
        setLoading(true);
        try {
            if (pin.join('').length !== 6) throw new Error("Enter complete 6-digit PIN");

            await API.post('/upi/pay', {
                fromAccount: storedUser.accountNumber,
                toVpa: recipient.vpa,
                amount,
                pin: pin.join('')
            });

            setStep(4);
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => { });

            fetchUserProfile();
            setTimeout(() => {
                resetPayment();
            }, 5000);

        } catch (err) {
            toast.error(err.response?.data?.error || "Payment Failed");
            setPin(['', '', '', '', '', '']);
        } finally {
            setLoading(false);
        }
    };

    const resetPayment = () => {
        setStep(1);
        setVpa('');
        setAmount('');
        setRecipient(null);
        setPin(['', '', '', '', '', '']);
    };

    const handleSetPin = async () => {
        try {
            if (newPin.join('').length !== 6) throw new Error("PIN must be 6 digits");
            if (newPin.join('') !== confirmPin.join('') && pinStep === 2) throw new Error("PINs do not match");

            if (pinStep === 1) {
                setPinStep(2);
                return;
            }

            await API.post('/upi/set-pin', {
                accountNumber: storedUser.accountNumber,
                pin: newPin.join('')
            });

            toast.success("UPI PIN Set Successfully");
            setShowSetPinModal(false);
            setHasPin(true);
            setNewPin(['', '', '', '', '', '']);
            setConfirmPin(['', '', '', '', '', '']);
            setPinStep(1);

        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to set PIN");
        }
    };

    const handleAddVpa = async () => {
        if (!newVpaSuffix) return;
        const fullVpa = `${newVpaSuffix}@openbank`;
        try {
            await API.post('/upi/manage/add', {
                accountNumber: storedUser.accountNumber,
                newVpa: fullVpa
            });
            toast.success("VPA Activated");
            setNewVpaSuffix('');
            fetchUserProfile();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to create VPA");
        }
    };

    const handleDeleteVpa = async (vpaToDelete) => {
        try {
            await API.post('/upi/manage/delete', {
                accountNumber: storedUser.accountNumber,
                vpaToDelete
            });
            toast.success("VPA Deactivated");
            fetchUserProfile();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed");
        }
    };

    const handleDownloadQr = async () => {
        if (!qrRef.current) return;
        try {
            const canvas = await html2canvas(qrRef.current, { backgroundColor: '#ffffff' });
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `OpenBank-QR-${storedUser.ownerName}.png`;
            link.href = url;
            link.click();
            toast.success("QR Saved to Gallery");
        } catch (err) {
            toast.error("Download Failed");
        }
    };

    if (loadingProfile) {
        return <div className="h-full flex items-center justify-center"><Loader className="animate-spin text-cyan-400" /></div>
    }

    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-8 font-sans text-white">
            <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />

            {/* Set PIN Warning */}
            {!hasPin && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between mb-8 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-500/20 p-2 rounded-full text-amber-400">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-400">UPI PIN Not Set</h3>
                            <p className="text-amber-200/60 text-sm">You need to set a 6-digit PIN to make transactions.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSetPinModal(true)}
                        className="glass-button bg-amber-500 hover:bg-amber-600 text-black border-amber-400"
                    >
                        Set PIN Now
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-3 space-y-2">
                    {[
                        { id: 'pay', icon: Wallet, label: 'Send Money', desc: 'To Mobile or UPI ID' },
                        { id: 'scan', icon: ScanLine, label: 'Scan QR', desc: 'Pay via Camera' },
                        { id: 'myqr', icon: QrCode, label: 'My QR Code', desc: 'Receive Money' },
                        { id: 'manage', icon: ShieldCheck, label: 'Manage IDs', desc: 'VPAs & Settings' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); resetPayment(); }}
                            className={`w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all ${activeTab === tab.id
                                ? 'bg-cyan-500/10 text-white border border-cyan-500/50 shadow-glass'
                                : 'bg-transparent text-slate-400 hover:bg-white/5 border border-transparent hover:border-white/10'
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${activeTab === tab.id ? 'bg-cyan-400 text-black' : 'bg-white/5'}`}>
                                <tab.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className={`font-bold text-sm ${activeTab === tab.id ? 'text-cyan-400' : 'text-slate-300'}`}>{tab.label}</p>
                                <p className={`text-xs ${activeTab === tab.id ? 'text-cyan-200/60' : 'text-slate-500'}`}>{tab.desc}</p>
                            </div>
                        </button>
                    ))}

                    <div className="mt-8 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 p-6 rounded-2xl text-white relative overflow-hidden border border-white/10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">Primary VPA</p>
                        <p className="font-mono text-lg font-bold flex items-center gap-2 text-slate-200">
                            {primaryVpa} <Copy className="w-4 h-4 cursor-pointer opacity-50 hover:opacity-100 hover:text-cyan-400" onClick={() => { navigator.clipboard.writeText(primaryVpa); toast.success("Copied") }} />
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-9 glass-card p-8 min-h-[600px] relative overflow-hidden">

                    {/* PAY TAB */}
                    {activeTab === 'pay' && (
                        <div className="max-w-xl mx-auto py-8">
                            {step === 1 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="text-center md:text-left">
                                        <h2 className="text-2xl font-bold text-white">Send Money</h2>
                                        <p className="text-slate-400">Instant transfers to any UPI App</p>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Smartphone className="h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            value={vpa}
                                            onChange={(e) => setVpa(e.target.value)}
                                            placeholder="Enter Mobile Number or UPI ID"
                                            className="block w-full pl-12 pr-28 py-4 bg-black/20 border border-white/10 rounded-xl focus:border-cyan-500/50 outline-none transition-all text-lg font-medium text-white placeholder-slate-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                                        />
                                        <button
                                            onClick={() => handleVerify()}
                                            disabled={!vpa || loading}
                                            className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-6 rounded-lg font-bold hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
                                        >
                                            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <> Verify <ArrowRight className="w-4 h-4" /></>}
                                        </button>
                                    </div>

                                    <div className="mt-8">
                                        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><History className="w-5 h-5 text-slate-400" /> Quick Transfer</h3>
                                        <div className="grid grid-cols-4 gap-4">
                                            {[1, 2, 3, 4].map(idx => (
                                                <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 text-center cursor-pointer hover:border-cyan-500/50 hover:bg-white/10 transition-all group">
                                                    <div className="w-10 h-10 bg-cyan-500/20 rounded-full mx-auto mb-2 flex items-center justify-center text-cyan-400 font-bold group-hover:scale-110 transition-transform">U{idx}</div>
                                                    <p className="text-xs font-bold text-slate-400 group-hover:text-white">User {idx}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="text-center space-y-8 animate-in slide-in-from-right-8">
                                    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 rounded-2xl inline-block border border-cyan-500/20">
                                        <div className="w-16 h-16 bg-cyan-500 text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                                            {recipient?.name?.[0]}
                                        </div>
                                        <h3 className="font-bold text-xl text-white">{recipient?.name}</h3>
                                        <p className="text-cyan-200/60 font-mono text-sm">{recipient?.vpa}</p>
                                    </div>

                                    <div>
                                        <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-2">Enter Amount</p>
                                        <div className="flex items-center justify-center">
                                            <span className="text-4xl font-bold text-slate-500 mr-2">₹</span>
                                            <input
                                                type="number"
                                                autoFocus
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="0"
                                                className="text-6xl font-bold text-white w-64 text-center outline-none bg-transparent placeholder:text-white/10 drop-shadow-lg"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={resetPayment} className="flex-1 py-4 text-slate-400 font-bold hover:bg-white/5 rounded-xl transition">Back</button>
                                        <button
                                            onClick={() => Number(amount) > 0 && setStep(3)}
                                            disabled={!amount || Number(amount) <= 0}
                                            className="flex-1 bg-gradient-to-r from-cyan-400 to-blue-600 text-black py-4 rounded-xl font-bold hover:brightness-110 shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50 transition"
                                        >
                                            Pay Now
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="max-w-sm mx-auto text-center animate-in zoom-in-95">
                                    <h3 className="text-xl font-bold mb-8 flex items-center justify-center gap-2 text-white">
                                        <ShieldCheck className="w-6 h-6 text-emerald-400" /> Enter UPI PIN
                                    </h3>

                                    <div className="bg-white/5 p-8 rounded-2xl border border-white/10 mb-8 backdrop-blur-sm">
                                        <p className="text-sm text-slate-400 mb-6">Payment of <b className="text-white">₹{amount}</b> to <b className="text-white">{recipient?.name}</b></p>
                                        <PinInput values={pin} setValues={setPin} autoFocus={true} />
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={() => setStep(2)} className="flex-1 py-3 text-slate-500 font-bold hover:text-white">Back</button>
                                        <button
                                            onClick={handlePay}
                                            disabled={loading || pin.join('').length !== 6}
                                            className="flex-1 bg-emerald-500 text-black py-3 rounded-xl font-bold hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 transition flex justify-center items-center gap-2"
                                        >
                                            {loading ? <Loader className="animate-spin w-5 h-5" /> : 'CONFIRM'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="text-center animate-in zoom-in-95 py-12">
                                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)] border border-emerald-500/30">
                                        <CheckCircle className="w-12 h-12 text-emerald-400" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-2">₹{amount}</h2>
                                    <p className="text-emerald-400 font-bold text-lg mb-8">Payment Successful</p>

                                    <div className="bg-white/5 p-6 rounded-xl border border-white/10 max-w-sm mx-auto text-left space-y-3 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 text-sm">To</span>
                                            <span className="font-bold text-slate-200">{recipient?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 text-sm">Date</span>
                                            <span className="font-bold text-slate-200">{new Date().toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 text-sm">Trans ID</span>
                                            <span className="font-mono text-xs text-slate-400">UPI{Math.floor(Math.random() * 100000000)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SCAN TAB */}
                    {activeTab === 'scan' && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="w-[400px] h-[400px] relative rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10">
                                <Scanner
                                    onScan={(res) => {
                                        if (res?.[0]) {
                                            handleVerify(res[0].rawValue);
                                            setActiveTab('pay');
                                        }
                                    }}
                                    styles={{ container: { height: '100%' } }}
                                />
                                <div className="absolute inset-0 border-[40px] border-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                    <div className="w-64 h-64 border-2 border-cyan-400/50 rounded-2xl relative shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                                        <div className="absolute top-1/2 w-full h-0.5 bg-cyan-400 animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.8)]"></div>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-8 text-slate-400 font-medium">Point your camera at any UPI QR Code</p>
                        </div>
                    )}

                    {/* MY QR TAB */}
                    {activeTab === 'myqr' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center h-full max-w-4xl mx-auto">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-white">Receive Money</h2>
                                <p className="text-slate-400 leading-relaxed">
                                    Share this QR code to receive payments instantly from any UPI app.
                                    Money will be credited directly to your primary account.
                                </p>
                                <div className="flex gap-4">
                                    <button onClick={handleDownloadQr} className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-slate-200 flex items-center gap-2 transition">
                                        <Download className="w-4 h-4" /> Download PNG
                                    </button>
                                </div>
                            </div>
                            <div ref={qrRef} className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
                                <div className="mb-6 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-black rounded-lg"></div>
                                    <span className="font-bold text-xl text-black">OpenBank</span>
                                </div>
                                <QRCode value={`upi://pay?pa=${primaryVpa}&pn=${storedUser.ownerName}`} size={220} />
                                <div className="mt-6 text-gray-900">
                                    <h3 className="text-xl font-bold">{storedUser.ownerName}</h3>
                                    <p className="font-mono text-gray-500 mt-1">{primaryVpa}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MANAGE TAB */}
                    {activeTab === 'manage' && (
                        <div className="max-w-2xl mx-auto py-8">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-white">Manage UPI IDs</h2>
                                <button onClick={() => setShowSetPinModal(true)} className="text-cyan-400 font-bold text-sm hover:underline flex items-center gap-2">
                                    <KeyRound className="w-4 h-4" /> {hasPin ? 'Reset PIN' : 'Set PIN'}
                                </button>
                            </div>

                            <div className="space-y-4">
                                {userVpas.map((id, idx) => (
                                    <div key={idx} className="bg-white/5 border border-white/5 p-5 rounded-xl flex justify-between items-center hover:bg-white/10 transition group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                                                <ShieldCheck className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white font-mono">{id}</p>
                                                {idx === 0 && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase border border-emerald-500/20">Primary</span>}
                                            </div>
                                        </div>
                                        {idx !== 0 && (
                                            <button onClick={() => handleDeleteVpa(id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {userVpas.length < 3 && (
                                    <div className="mt-8 pt-8 border-t border-white/10">
                                        <h3 className="font-bold text-white mb-4">Create New VPA</h3>
                                        <div className="flex gap-2">
                                            <div className="flex-1 flex items-center bg-black/20 border border-white/10 rounded-xl px-4 focus-within:border-cyan-500/50 transition">
                                                <input
                                                    type="text"
                                                    placeholder="username"
                                                    value={newVpaSuffix}
                                                    onChange={(e) => setNewVpaSuffix(e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ''))}
                                                    className="flex-1 bg-transparent py-3 outline-none font-mono text-white placeholder-slate-600"
                                                />
                                                <span className="text-slate-500 font-mono">@openbank</span>
                                            </div>
                                            <button
                                                onClick={handleAddVpa}
                                                disabled={!newVpaSuffix}
                                                className="glass-button bg-white text-black hover:bg-slate-200 disabled:opacity-50"
                                            >
                                                Create
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SET PIN MODAL */}
            {showSetPinModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in">
                    <div className="glass-card bg-[#0f172a] p-8 rounded-3xl w-full max-w-md shadow-2xl relative border-white/10">
                        <button onClick={() => setShowSetPinModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-cyan-400">
                                <KeyRound className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">{pinStep === 1 ? 'Set New UPI PIN' : 'Confirm UPI PIN'}</h2>
                            <p className="text-slate-400 text-sm">Create a secure 6-digit PIN for transactions</p>
                        </div>

                        <div className="mb-8">
                            <PinInput
                                values={pinStep === 1 ? newPin : confirmPin}
                                setValues={pinStep === 1 ? setNewPin : setConfirmPin}
                                autoFocus={true}
                            />
                        </div>

                        <button
                            onClick={handleSetPin}
                            className="w-full bg-cyan-500 text-black py-4 rounded-xl font-bold text-lg hover:bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition"
                        >
                            {pinStep === 1 ? 'Next' : 'Confirm PIN'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UPI;
