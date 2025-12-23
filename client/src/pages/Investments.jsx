import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Download, Plus, Briefcase, PieChart as PieIcon, Activity, AlertTriangle, RefreshCw, Trash2, X, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getInvestments, getAccount, deleteInvestment, withdrawMoney } from '../api';
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import InvestmentWizard from '../components/InvestmentWizard';
import { BANK_DETAILS } from '../constants';

const COLORS = ['#22d3ee', '#34d399', '#facc15', '#f472b6'];

function Investments() {
    const navigate = useNavigate();
    const [investments, setInvestments] = useState([]);
    const [account, setAccount] = useState(null);
    const [showWizard, setShowWizard] = useState(false);
    const [activeTab, setActiveTab] = useState('ALL');
    const [deleteModal, setDeleteModal] = useState({ show: false, inv: null });
    const [installmentModal, setInstallmentModal] = useState({ show: false, inv: null, txnId: null });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const { accountNumber } = JSON.parse(storedUser);
            const accRes = await getAccount(accountNumber);
            setAccount(accRes.data);
            const invRes = await getInvestments(accountNumber);
            setInvestments(invRes.data);
        }
    };

    const handleWithdraw = async () => {
        if (!deleteModal.inv) return;
        setLoading(true);
        try {
            await deleteInvestment(deleteModal.inv._id, { reason: 'Premature Withdrawal' });
            toast.success("Investment Closed & Refunded");
            setDeleteModal({ show: false, inv: null });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || "Withdrawal Failed");
        } finally {
            setLoading(false);
        }
    };

    const openInstallmentModal = (inv) => {
        const mockTxnId = 'TXN' + Math.floor(1000000000 + Math.random() * 9000000000);
        setInstallmentModal({ show: true, inv, txnId: mockTxnId });
    };

    const handlePayInstallment = async () => {
        if (!installmentModal.inv) return;
        setLoading(true);
        try {
            const monthlyAmount = installmentModal.inv.principalAmount;

            await withdrawMoney({
                accountNumber: account.accountNumber,
                amount: monthlyAmount,
                description: `RD Installment [${installmentModal.txnId}] - ${new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}`
            });

            toast.success(`Installment Paid Successfully! Txn: ${installmentModal.txnId}`);
            setInstallmentModal({ show: false, inv: null, txnId: null });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || "Payment Failed");
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = (inv) => {
        const doc = new jsPDF();
        doc.setFont("helvetica", "normal");
        const logoUrl = '/logo.png';
        const signatureUrl = '/signature.png';

        const img = new Image();
        img.src = logoUrl;
        img.onload = () => { drawCertificate(doc, inv, img, signatureUrl); };
        img.onerror = () => { drawCertificate(doc, inv, null, signatureUrl); };
    };

    const drawCertificate = (doc, inv, logoImg, signatureUrl) => {
        doc.setDrawColor(29, 53, 87);
        doc.setLineWidth(3);
        doc.rect(5, 5, 200, 287);
        doc.setLineWidth(0.5);
        doc.rect(8, 8, 194, 281);

        if (logoImg) {
            doc.addImage(logoImg, 'PNG', 15, 15, 30, 30);
        } else {
            doc.setFontSize(22);
            doc.setTextColor(29, 53, 87);
            doc.setFont("helvetica", "bold");
            doc.text("OPENBANK", 15, 30);
        }

        doc.setFont("times", "bold");
        doc.setTextColor(29, 53, 87);
        doc.setFontSize(26);
        doc.text("OPENBANK PRO", 105, 25, null, null, "center");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(BANK_DETAILS.ADDRESS_FULL, 105, 32, null, null, "center");
        doc.text(`IFS Code: ${BANK_DETAILS.IFSC} | Phone: ${BANK_DETAILS.HELPLINE}`, 105, 37, null, null, "center");

        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.line(15, 42, 195, 42);

        doc.setFont("times", "bolditalic");
        doc.setFontSize(24);
        doc.setTextColor(0);
        doc.text("Certificate of Investment", 105, 60, null, null, "center");
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80);
        doc.text(`${inv.type === 'FD' ? 'FIXED DEPOSIT' : 'RECURRING DEPOSIT'} RECEIPT`, 105, 68, null, null, "center");

        const startY = 85;
        doc.setFillColor(248, 250, 252);
        doc.rect(20, startY, 170, 95, 'F');
        doc.setDrawColor(220);
        doc.rect(20, startY, 170, 95);

        let y = startY + 15;
        const col1 = 30;
        const col2 = 90;
        const lineHeight = 12;

        const addDetail = (label, value, isHighlight = false) => {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(100);
            doc.setFontSize(10);
            doc.text(label.toUpperCase(), col1, y);

            doc.setFont("courier", isHighlight ? "bold" : "normal");
            doc.setTextColor(isHighlight ? 22 : 0, isHighlight ? 163 : 0, isHighlight ? 74 : 0);
            doc.setFontSize(isHighlight ? 12 : 11);
            doc.text(value, col2, y);
            y += lineHeight;
        };

        addDetail("Certificate Reference", `REF-${inv._id.toUpperCase().substring(0, 8)}`);
        addDetail("Account Holder", account.ownerName.toUpperCase());
        addDetail("Customer ID / Acc No", account.accountNumber);

        y += 3;
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.line(25, y - 8, 185, y - 8);

        addDetail("Investment Type", inv.type === 'FD' ? "Fixed Deposit (Term)" : "Recurring Deposit");
        addDetail("Principal Amount", `Rs. ${inv.principalAmount.toLocaleString()}/-`);
        addDetail("Interest Rate", `${inv.interestRate.toFixed(2)}% Per Annum`);
        addDetail("Value Date", new Date(inv.startDate).toLocaleDateString().toUpperCase());
        addDetail("Maturity Date", new Date(inv.maturityDate).toLocaleDateString().toUpperCase());
        addDetail("Maturity Value", `Rs. ${Math.round(inv.maturityAmount).toLocaleString()}/-`, true);

        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.1 }));
        doc.setFontSize(60);
        doc.setTextColor(150);
        doc.text("ORIGINAL", 105, 150, null, 45, "center");
        doc.restoreGraphicsState();

        y = 200;
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.setTextColor(60);
        const legalText = "This is a computer-generated receipt. The bank acknowledges the receipt of the sum mentioned above used for the type of investment plan selected. The maturity value is subject to applicable taxes (TDS) as per government regulations. Premature withdrawal is allowed subject to a penalty of 2% on the principal amount. This receipt is not transferable.";
        const splitText = doc.splitTextToSize(legalText, 170);
        doc.text(splitText, 20, y);

        doc.setDrawColor(29, 53, 87);
        doc.setLineWidth(1);
        doc.circle(50, 260, 18);
        doc.setFontSize(8);
        doc.setTextColor(29, 53, 87);
        doc.text("OFFICIAL SEAL", 50, 260, null, null, "center");
        doc.text("OPENBANK", 50, 255, null, 15, "center");
        doc.text("AUTHORIZED", 50, 265, null, -15, "center");

        const sigY = 245;
        const sigX = 140;

        const sig = new Image();
        sig.src = signatureUrl;
        sig.onload = () => {
            doc.addImage(sig, 'PNG', sigX, sigY, 40, 20);
            finishPDF(doc, inv._id, sigX, sigY + 25);
        };
        sig.onerror = () => {
            finishPDF(doc, inv._id, sigX, sigY + 25);
        };
    };

    const finishPDF = (doc, id, x, y) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text("For OpenBank Pro", x + 20, y, null, null, "center");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Authorized Signatory", x + 20, y + 5, null, null, "center");
        doc.save(`Bond_${id}.pdf`);
    };

    const filteredInvestments = activeTab === 'ALL' ? investments : investments.filter(i => i.type === activeTab);
    const portfolioData = [
        { name: 'Fixed Deposit', value: investments.filter(i => i.type === 'FD').reduce((a, b) => a + b.principalAmount, 0) },
        { name: 'Recurring Deposit', value: investments.filter(i => i.type === 'RD').reduce((a, b) => a + b.principalAmount, 0) }
    ].filter(d => d.value > 0);

    return (
        <div className="min-h-screen p-6 font-sans text-white">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-full transition-colors bg-white/5 border border-white/5">
                            <ArrowLeft className="w-6 h-6 text-slate-300" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Your Portfolio</h1>
                            <p className="text-slate-400">Wealth insights & management</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowWizard(true)}
                        className="bg-cyan-500 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(34,211,238,0.3)] transform active:scale-95 duration-200"
                    >
                        <Plus className="w-5 h-5" />
                        New Investment
                    </button>
                </div>

                {/* Portfolio Summary Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-blue-900/30 to-purple-900/30">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <Briefcase className="w-32 h-32 text-cyan-500" />
                        </div>
                        <div>
                            <p className="text-slate-400 font-medium mb-1">Total Invested Value</p>
                            <h2 className="text-4xl font-bold text-white">
                                ₹{investments.reduce((sum, i) => sum + i.principalAmount, 0).toLocaleString()}
                            </h2>
                        </div>
                        <div className="mt-6 flex items-center gap-2 text-emerald-400 bg-emerald-500/10 w-fit px-3 py-1 rounded-full text-sm font-bold border border-emerald-500/20">
                            <TrendingUp className="w-4 h-4" />
                            <span>+12.5% Annual Growth</span>
                        </div>
                    </div>
                    <div className="glass-card p-6 flex items-center justify-between lg:col-span-2">
                        <div className="flex-1">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <PieIcon className="w-5 h-5 text-slate-400" />
                                Asset Allocation
                            </h3>
                            <div className="flex flex-wrap gap-6">
                                {portfolioData.map((d, i) => (
                                    <div key={d.name} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                        <div>
                                            <p className="text-sm text-slate-400">{d.name}</p>
                                            <p className="font-bold text-white">₹{d.value.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                                {portfolioData.length === 0 && <p className="text-slate-500 italic">No investments yet</p>}
                            </div>
                        </div>
                        <div className="h-40 w-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={portfolioData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {portfolioData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                    {['ALL', 'FD', 'RD'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-full font-bold transition-all text-sm whitespace-nowrap ${activeTab === tab
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-glass'
                                : 'bg-white/5 text-slate-500 hover:bg-white/10 border border-white/5'
                                }`}
                        >
                            {tab === 'ALL' ? 'All Investments' : tab === 'FD' ? 'Fixed Deposits (FD)' : 'Recurring Deposits (RD)'}
                        </button>
                    ))}
                </div>

                {/* Investments List */}
                <div className="space-y-4">
                    {filteredInvestments.length === 0 ? (
                        <div className="text-center py-20 glass-card border-dashed">
                            <Activity className="w-10 h-10 text-slate-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-300">No Active Investments</h3>
                            <button onClick={() => setShowWizard(true)} className="mt-6 text-cyan-400 font-bold hover:underline">
                                Start Investing &rarr;
                            </button>
                        </div>
                    ) : (
                        filteredInvestments.map((inv) => (
                            <div key={inv._id} className="glass-card hover:bg-white/10 transition-all duration-300 group overflow-hidden border border-white/10">
                                {/* Card Header */}
                                <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-black shadow-md ${inv.type === 'FD' ? 'bg-cyan-400' : 'bg-pink-400'}`}>
                                            {inv.type}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xl text-white tracking-tight">
                                                ₹{inv.principalAmount.toLocaleString()}
                                            </h4>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Principal Amount</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${inv.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                                            {inv.status || 'Active'}
                                        </span>
                                        <div className="text-right hidden md:block">
                                            <p className="text-sm font-bold text-cyan-400">{inv.interestRate}%</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">Interest Rate</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Grid */}
                                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Issue Date</p>
                                        <p className="font-semibold text-slate-300 text-sm">
                                            {new Date(inv.issueDate || inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Maturity Date</p>
                                        <p className="font-semibold text-slate-300 text-sm">
                                            {new Date(inv.maturityDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Maturity Value</p>
                                        <p className="font-bold text-emerald-400">
                                            ₹{Math.round(inv.maturityAmount).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Transaction Ref</p>
                                        <p className="font-mono text-xs text-slate-600 truncate" title={inv.transactionId || inv._id}>
                                            {inv.transactionId || `REF-${inv._id.substr(-8).toUpperCase()}`}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex flex-wrap gap-3 items-center justify-between">
                                    {/* RD Actions */}
                                    {inv.type === 'RD' ? (
                                        <button
                                            onClick={() => openInstallmentModal(inv)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-bold hover:bg-cyan-500/30 transition shadow-glass"
                                        >
                                            <RefreshCw className="w-4 h-4" /> Pay Installment
                                        </button>
                                    ) : (
                                        <div className="hidden md:block text-xs text-slate-600 italic">
                                            *Interest componded quarterly
                                        </div>
                                    )}

                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button
                                            onClick={() => setDeleteModal({ show: true, inv })}
                                            className="flex-1 md:flex-none py-2 px-4 bg-white/5 border border-white/10 text-rose-400 rounded-lg text-sm font-bold hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors flex items-center justify-center gap-2"
                                            title="Premature Withdrawal"
                                        >
                                            <Trash2 className="w-4 h-4" /> Break Deposit
                                        </button>
                                        <button
                                            onClick={() => generatePDF(inv)}
                                            className="flex-1 md:flex-none py-2 px-4 bg-white/5 border border-white/10 text-slate-300 rounded-lg text-sm font-bold hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2"
                                            title="Download Certificate"
                                        >
                                            <Download className="w-4 h-4" /> Certificate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Wizards & Modals */}
            {showWizard && (
                <InvestmentWizard
                    account={account}
                    onClose={() => setShowWizard(false)}
                    onSuccess={() => { fetchData(); }}
                />
            )}

            {/* Delete Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card bg-[#0f172a] rounded-2xl w-full max-w-sm p-6 shadow-2xl border-white/10">
                        <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center mb-4 text-rose-500">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Break Investment?</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Premature withdrawal attracts a <span className="font-bold text-rose-500">2% penalty</span> on the principal amount.
                        </p>
                        <div className="bg-white/5 p-4 rounded-xl mb-6 space-y-2 border border-white/5">
                            <div className="flex justify-between text-sm text-slate-300">
                                <span>Principal</span>
                                <span className="font-bold">₹{deleteModal.inv.principalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-rose-500">
                                <span>Penalty (2%)</span>
                                <span className="font-bold">- ₹{Math.round(deleteModal.inv.principalAmount * 0.02).toLocaleString()}</span>
                            </div>
                            <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-cyan-400">
                                <span>Refund Amount</span>
                                <span>₹{Math.round(deleteModal.inv.principalAmount * 0.98).toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteModal({ show: false, inv: null })} className="flex-1 py-3 bg-white/5 text-slate-400 rounded-xl font-bold hover:bg-white/10">Cancel</button>
                            <button onClick={handleWithdraw} disabled={loading} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 shadow-lg shadow-rose-500/30">
                                {loading ? 'Processing...' : 'Confirm Break'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Installment Modal (Enhanced) */}
            {installmentModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card bg-[#0f172a] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border-white/10">
                        {/* Modal Header */}
                        <div className="bg-cyan-500/20 p-6 text-white flex justify-between items-start border-b border-cyan-500/20">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
                                    <RefreshCw className="w-5 h-5" />
                                    Upcoming Installment
                                </h3>
                                <p className="text-cyan-200/60 text-sm mt-1">Recurring Deposit #{installmentModal.inv._id.substr(-6)}</p>
                            </div>
                            <button onClick={() => setInstallmentModal({ show: false, inv: null })} className="p-1 hover:bg-white/10 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Bill Details */}
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">Billing Period</p>
                                        <p className="font-bold text-white">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 font-bold uppercase">Due Date</p>
                                    <p className="font-bold text-rose-400">{new Date().toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Transaction ID</span>
                                    <span className="font-mono text-slate-300">{installmentModal.txnId}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Installment Amount</span>
                                    <span className="font-bold text-white">₹{installmentModal.inv.principalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Late Fees</span>
                                    <span className="font-bold text-emerald-400">₹0.00</span>
                                </div>
                                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                                    <span className="font-bold text-lg text-cyan-400">Total Payable</span>
                                    <span className="font-bold text-2xl text-white">₹{installmentModal.inv.principalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 bg-black/20 border-t border-white/10 flex gap-4">
                            <button onClick={() => setInstallmentModal({ show: false, inv: null })} className="flex-1 py-3 font-bold text-slate-500 hover:text-white">Cancel</button>
                            <button onClick={handlePayInstallment} disabled={loading} className="flex-[2] py-3 bg-cyan-500 text-black rounded-xl font-bold hover:bg-cyan-400 shadow-lg flex justify-center items-center gap-2 transition">
                                {loading ? <Activity className="w-5 h-5 animate-spin" /> : 'Confirm & Pay'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <Toaster position="bottom-right" toastOptions={{ className: 'font-bold', style: { background: '#1e293b', color: '#fff' } }} />
        </div>
    );
}

export default Investments;
