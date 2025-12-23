import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Wallet, Upload, FileText, CheckCircle, XCircle, AlertTriangle,
    Home, Car, GraduationCap, User, TrendingUp, Calendar, Filter, Download,
    ChevronRight, ShieldCheck, Building, HelpCircle, Search, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { applyLoan, getLoans, getAccount, repayLoan } from '../api';
import toast, { Toaster } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BANK_DETAILS } from '../constants';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

function Loans() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('market');
    const [loans, setLoans] = useState([]);
    const [account, setAccount] = useState(null);

    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const [showApply, setShowApply] = useState(false);
    const [selectedType, setSelectedType] = useState(null);
    const [amount, setAmount] = useState('');
    const [tenure, setTenure] = useState(12);
    const [proofUploaded, setProofUploaded] = useState(false);
    const [loading, setLoading] = useState(false);

    const [verificationStage, setVerificationStage] = useState(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [repayModalData, setRepayModalData] = useState(null);
    const [showGuide, setShowGuide] = useState(false);

    const LOAN_TYPES = [
        { id: 'Personal', name: 'Personal Loan', rate: 12.0, icon: <User />, desc: 'Unsecured credit for personal use', maxAmount: 1500000, tenureRange: '12-60 Months' },
        { id: 'Home', name: 'Home Mortgage', rate: 8.5, icon: <Home />, desc: 'Purchase or construction financing', maxAmount: 50000000, tenureRange: '60-360 Months' },
        { id: 'Car', name: 'Vehicle Finance', rate: 9.0, icon: <Car />, desc: 'New or used car loans', maxAmount: 5000000, tenureRange: '12-84 Months' },
        { id: 'Education', name: 'Education Loan', rate: 10.0, icon: <GraduationCap />, desc: 'Domestic & overseas studies', maxAmount: 7500000, tenureRange: '12-120 Months' }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const { accountNumber } = JSON.parse(storedUser);
                const [accRes, loanRes] = await Promise.all([
                    getAccount(accountNumber),
                    getLoans(accountNumber)
                ]);
                setAccount(accRes.data);
                setLoans(loanRes.data || []);
            } catch (error) {
                console.error("Fetch Error", error);
                toast.error("Could not load financial data");
            }
        }
    };

    const calculateEMI = () => {
        if (!amount || !selectedType) return 0;
        const rate = LOAN_TYPES.find(t => t.id === selectedType).rate;
        const r = rate / 12 / 100;
        const n = tenure;
        return Math.round((amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    };

    const handleApplyStart = (type) => {
        setSelectedType(type.id);
        setShowApply(true);
    };

    const handleApplySubmit = async (e) => {
        e.preventDefault();
        if (!proofUploaded) return toast.error("Income Proof Document Required");
        if (!termsAccepted) return toast.error("Acceptance of Terms is mandatory");

        setLoading(true);

        try {
            const res = await applyLoan({
                accountNumber: account.accountNumber,
                amount: Number(amount),
                tenureMonths: tenure,
                loanType: selectedType,
                documents: ["simulated_proof.pdf"]
            });

            if (res.data.loan) {
                toast.success("Facility Approved Successfully");
                setShowApply(false);
                setTermsAccepted(false);
                setProofUploaded(false);
                setVerificationStage(null);
                fetchData();
                setActiveTab('services');
                generateSanctionLetter(res.data.loan);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Application Declined");
        } finally {
            setLoading(false);
            setVerificationStage(null);
        }
    };

    const verifyRepayment = (loan, emi) => {
        setRepayModalData({
            loanId: loan.loanId,
            loanType: loan.loanType,
            installmentNo: emi.installmentNo,
            amount: emi.emi
        });
    };

    const confirmRepayment = async () => {
        if (!repayModalData) return;
        try {
            await repayLoan({
                accountNumber: account.accountNumber,
                loanId: repayModalData.loanId,
                installmentNo: repayModalData.installmentNo
            });
            toast.success("Transaction Processed Successfully");
            setRepayModalData(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || "Transaction Failed");
        }
    };

    const generateSanctionLetter = async (loan) => {
        const toastId = toast.loading("Generating Detailed Sanction Letter...");

        const loadImage = (url) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = url;
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL("image/png"));
                };
                img.onerror = () => {
                    resolve(null);
                };
            });
        };

        try {
            const [logoData, signData] = await Promise.all([
                loadImage('/logo.png'),
                loadImage('/signature.png')
            ]);

            const doc = new jsPDF();

            const addHeader = (pageNo) => {
                doc.setPage(pageNo);
                if (logoData) {
                    doc.addImage(logoData, 'PNG', 15, 10, 15, 15);
                } else {
                    doc.setFillColor(29, 53, 87);
                    doc.rect(15, 10, 15, 15, 'F');
                    doc.setTextColor(255);
                    doc.setFontSize(10);
                    doc.text("OB", 18, 20);
                }

                doc.setFont("helvetica", "bold");
                doc.setFontSize(14);
                doc.setTextColor(29, 53, 87);
                doc.text(BANK_DETAILS.NAME, 30, 17);

                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100);
                doc.text(BANK_DETAILS.ADDRESS_FULL, 30, 22);

                doc.setDrawColor(29, 53, 87);
                doc.setLineWidth(0.5);
                doc.line(15, 25, 195, 25);
            };

            const addFooter = (pageNo) => {
                doc.setPage(pageNo);
                const pageHeight = doc.internal.pageSize.height;

                doc.setDrawColor(200);
                doc.line(15, pageHeight - 20, 195, pageHeight - 20);

                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Page ${pageNo} of 3`, 195, pageHeight - 10, null, null, "right");
                doc.text(`Ref: ${loan.loanId} | Confidential`, 15, pageHeight - 10);
            };

            addHeader(1);
            doc.setFontSize(16);
            doc.setTextColor(29, 53, 87);
            doc.setFont("times", "bold");
            doc.text("SANCTION LETTER", 105, 40, null, null, "center");

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 50);
            doc.text(`Sanction Ref No: ${loan.loanId}`, 15, 50);

            doc.text("To,", 15, 60);
            doc.setFont("helvetica", "bold");
            doc.text(account.ownerName, 15, 65);
            doc.setFont("helvetica", "normal");
            doc.text(account.address || "Registered Address", 15, 70);
            doc.text(`Mobile: ${account.mobile || "N/A"}`, 15, 75);

            doc.setFont("helvetica", "bold");
            doc.text(`Sub: Sanction of ${loan.loanType} Facility of Rs. ${loan.amount.toLocaleString()}/-`, 15, 85);

            doc.setFont("helvetica", "normal");
            doc.text("Dear Sir/Madam,", 15, 95);
            doc.text("With reference to your application, we are pleased to sanction the credit facility as per the terms mentioned below:", 15, 102);

            autoTable(doc, {
                startY: 110,
                head: [['Key Fact Statement (KFS)', 'Details']],
                body: [
                    ['Borrower Name', account.ownerName],
                    ['Facility Type', `${loan.loanType} Loan`],
                    ['Sanctioned Amount', `Rs. ${loan.amount.toLocaleString()}/-`],
                    ['Purpose', loan.loanType === 'Home' ? 'Property Purchase' : 'Personal Use'],
                    ['Rate of Interest', `${loan.interestRate}% P.A. (Fixed)`],
                    ['Tenure', `${loan.tenureMonths} Months`],
                    ['EMI Amount', `Rs. ${loan.emiAmount}/-`],
                    ['Processing Fee', '1.00% + GST (Applicable)'],
                    ['Prepayment Charges', 'Nil after 12 months'],
                    ['Late Payment Penalty', '2% per month on overdue amount']
                ],
                theme: 'grid',
                headStyles: { fillColor: [29, 53, 87], textColor: 255 },
                styles: { fontSize: 9, cellPadding: 2 },
                columnStyles: { 0: { fontStyle: 'bold', width: 80 } }
            });

            addFooter(1);

            doc.addPage();
            addHeader(2);

            doc.setFontSize(14);
            doc.setFont("times", "bold");
            doc.text("TERMS AND CONDITIONS", 105, 40, null, null, "center");

            const terms = [
                "1. Interest: The interest rate is fixed as mentioned in the KFS. The bank reserves the right to reset the rate based on MCLR changes every 12 months.",
                "2. Repayment: The loan shall be repaid in Equated Monthly Installments (EMI) as per the schedule attached. EMIs will be auto-debited from your savings account on the 5th of every month.",
                "3. Security: For secured loans, the original property/asset documents shall remain with the bank until full closure of the loan account.",
                "4. Utilization: The funds must be strictly used for the purpose stated in the application. Any diversion of funds will lead to immediate recall of the entire loan amount.",
                "5. Default: In case of default in payment of any EMI, the entire outstanding amount shall become payable immediately. The bank reserves the right to initiate legal proceedings under the SARFAESI Act.",
                "6. Insurance: It is mandatory to keep the funded asset insured against fire, earthquake, and other perils with the Bank clause endorsed.",
                "7. CIBIL Reporting: The bank will report the track record of this loan to Credit Information Companies (CIBIL/Equifax) on a monthly basis.",
                "8. Jurisdiction: Any disputes arising out of this agreement shall be subject to the exclusive jurisdiction of the courts in Mumbai.",
                "9. Taxes: All applicable taxes, duties, and statutory levies shall be borne by the Borrower.",
                "10. Amendment: The Bank reserves the right to amend any of the terms and conditions with prior notice to the borrower."
            ];

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            let yPos = 55;

            terms.forEach(term => {
                const textLines = doc.splitTextToSize(term, 180);
                doc.text(textLines, 15, yPos);
                yPos += (textLines.length * 6) + 4;
            });

            addFooter(2);

            doc.addPage();
            addHeader(3);

            doc.setFontSize(14);
            doc.setFont("times", "bold");
            doc.text("ACCEPTANCE", 105, 40, null, null, "center");

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const declaration = "I/We hereby accept the detailed terms and conditions mentioned in this sanction letter (Page 1 & 2). I/We authorize the bank to debit the processing fee and EMI from my/our account.";
            const lines = doc.splitTextToSize(declaration, 180);
            doc.text(lines, 15, 55);

            doc.rect(15, 80, 80, 40);
            doc.text("Accepted by Borrower:", 20, 90);
            doc.setFont("helvetica", "bold");
            doc.text(account.ownerName, 20, 115);
            doc.setFont("helvetica", "normal");
            doc.text(`(Digital Acceptance: ${new Date().toLocaleTimeString()})`, 20, 120);

            doc.rect(110, 80, 80, 40);
            doc.text("For OpenBank Pro:", 115, 90);

            if (signData) {
                doc.addImage(signData, 'PNG', 115, 100, 40, 15);
            } else {
                doc.setFont("times", "italic");
                doc.text("Authorized Signatory", 120, 110);
            }

            doc.setFont("helvetica", "bold");
            doc.text("Authorized Signatory", 115, 115);
            doc.setFont("helvetica", "normal");
            doc.text("Credit Department", 115, 120);

            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.text("Note: This document is electronically generated and is valid without a physical wet signature under the IT Act, 2000.", 15, 140);

            addFooter(3);

            doc.save(`Sanction_Letter_${loan.loanId}_Full.pdf`);
            toast.success("Detailed Sanction Letter Downloaded!", { id: toastId });
        } catch (error) {
            console.error("PDF Error:", error);
            toast.error("Error: " + error.message, { id: toastId });
        }
    };

    return (
        <div className="min-h-screen text-white font-sans">
            {/* Top Navigation Bar */}
            <header className="fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">Enterprise Lending</h1>
                            <p className="text-xs text-slate-400 font-medium">Corporate & Retail Credit Division</p>
                        </div>
                    </div>

                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                        {[
                            { id: 'market', label: 'Offerings' },
                            { id: 'services', label: 'My Facilities' },
                            { id: 'repay', label: 'Repayment Schedule' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === tab.id
                                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 pt-24">

                {/* --- MARKETPLACE TAB --- */}
                {activeTab === 'market' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Credit Products</h2>
                                <p className="text-slate-400 mt-1">Tailored financial solutions for your needs.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowGuide(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 shadow-sm transition-colors"
                                >
                                    <Download className="w-4 h-4" /> Product Guide
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {LOAN_TYPES.map((type) => (
                                <div key={type.id} className="group glass-card p-0 overflow-hidden hover:bg-white/5 transition-all duration-300 relative border border-white/10">
                                    <div className="p-6">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 transition-colors ${type.id === 'Personal' ? 'bg-purple-500/20 text-purple-400' :
                                            type.id === 'Home' ? 'bg-blue-500/20 text-blue-400' :
                                                type.id === 'Car' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'
                                            }`}>
                                            {type.icon}
                                        </div>
                                        <h3 className="text-lg font-bold text-white">{type.name}</h3>
                                        <p className="text-sm text-slate-400 mt-2 leading-relaxed">{type.desc}</p>

                                        <div className="mt-6 pt-6 border-t border-white/10 flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-white">{type.rate}%</span>
                                            <span className="text-xs text-slate-500 font-bold uppercase">Fixed P.A.</span>
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">Up to {formatCurrency(type.maxAmount)}</div>
                                    </div>
                                    <div className="bg-black/20 px-6 py-4 border-t border-white/10 group-hover:bg-cyan-500/20 transition-colors">
                                        <button
                                            onClick={() => handleApplyStart(type)}
                                            className="w-full text-sm font-bold text-slate-400 group-hover:text-cyan-400 flex items-center justify-between"
                                        >
                                            Check Eligibility <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- SERVICES / DASHBOARD TAB --- */}
                {activeTab === 'services' && (
                    <div className="space-y-8">
                        {/* Summary Widget */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-card p-6 border border-white/10">
                                <div className="text-sm text-slate-400 font-medium mb-1">Total Outstanding</div>
                                <div className="text-2xl font-bold text-white">
                                    {formatCurrency(loans.reduce((acc, l) => acc + (l.status === 'Active' ? l.amount : 0), 0))}
                                </div>
                                <div className="mt-4 flex items-center text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded w-fit font-bold border border-emerald-500/20">
                                    <ShieldCheck className="w-3 h-3 mr-1" /> Secured
                                </div>
                            </div>
                            <div className="glass-card p-6 border border-white/10">
                                <div className="text-sm text-slate-400 font-medium mb-1">Active Facilities</div>
                                <div className="text-2xl font-bold text-white">
                                    {loans.filter(l => l.status === 'Active').length}
                                </div>
                                <div className="mt-4 text-xs text-slate-500">
                                    Across {loans.length} total applications
                                </div>
                            </div>
                        </div>

                        {/* Loans List */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white">Active Facilities</h3>
                            {loans.length === 0 ? (
                                <div className="glass-card border-dashed p-12 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-6 h-6 text-slate-500" />
                                    </div>
                                    <h4 className="text-lg font-bold text-white">No Active Facilities</h4>
                                    <p className="text-slate-400 text-sm mt-1 mb-6">You have no active credit lines or loans.</p>
                                    <button onClick={() => setActiveTab('market')} className="text-cyan-400 font-bold text-sm hover:underline">Explore Products</button>
                                </div>
                            ) : (
                                loans.map(loan => (
                                    <div key={loan.loanId} className="glass-card p-6 hover:border-cyan-500/30 transition-all border border-white/10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center font-bold text-lg">
                                                    {loan.loanType[0]}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold text-white">{loan.loanType} Facility</h4>
                                                    <div className="flex gap-2 text-xs mt-1">
                                                        <span className="font-mono text-slate-500">#{loan.loanId}</span>
                                                        <span className={`px-2 py-0.5 rounded-full font-bold ${loan.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{loan.status}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-white">{formatCurrency(loan.amount)}</div>
                                                <div className="text-sm text-slate-400">{loan.interestRate}% Interest</div>
                                            </div>
                                        </div>

                                        {/* Progress */}
                                        <div className="bg-black/20 rounded-lg p-4 mb-6 border border-white/5">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-slate-400 font-medium">Repayment Progress</span>
                                                <span className="text-white font-bold">{Math.round((loan.paidAmount / (loan.amount * 1.5)) * 100)}%</span>
                                            </div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(loan.paidAmount / (loan.amount * 1.5)) * 100}%` }}></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-500 mt-2">
                                                <span>Paid: {formatCurrency(loan.paidAmount)}</span>
                                                <span>Tenure: {loan.tenureMonths} Months</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 justify-end border-t border-white/10 pt-4">
                                            <button
                                                onClick={() => generateSanctionLetter(loan)}
                                                className="text-sm font-bold text-slate-400 hover:text-white px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 flex items-center gap-2"
                                            >
                                                <Download className="w-4 h-4" /> Sanction Letter
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* --- REPAYMENT SCHEDULE TAB (Enterprise Grid) --- */}
                {activeTab === 'repay' && (
                    <div className="space-y-6">
                        <div className="glass-card p-4 flex justify-between items-center shadow-sm border border-white/10">
                            <div className="flex gap-4">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search Transactions..."
                                        className="pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm outline-none focus:border-cyan-500/50 w-64 text-white placeholder-slate-600"
                                    />
                                </div>
                                <select className="px-4 py-2 border border-white/10 rounded-lg text-sm outline-none text-slate-400 bg-black/20 focus:border-cyan-500/50">
                                    <option>All Statuses</option>
                                    <option>Pending</option>
                                    <option>Paid</option>
                                </select>
                            </div>
                            <div className="text-sm text-slate-500">
                                Showing <strong className="text-white">{loans.length}</strong> facilities
                            </div>
                        </div>

                        {loans.length === 0 ? (
                            <div className="text-center py-20 glass-card border border-white/10">
                                <p className="text-slate-500">No active repayment schedules initiated.</p>
                            </div>
                        ) : (
                            loans.map(loan => (
                                <div key={loan.loanId} className="glass-card p-0 overflow-hidden shadow-sm border border-white/10">
                                    <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                                        <h4 className="font-bold text-white text-sm">{loan.loanType} - {loan.loanId}</h4>
                                        <span className="text-xs font-mono text-slate-400">EMI: {formatCurrency(loan.emiAmount)}</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-black/20 text-slate-400 border-b border-white/10">
                                                <tr>
                                                    <th className="px-6 py-4 font-medium w-24">#</th>
                                                    <th className="px-6 py-4 font-medium">Due Date</th>
                                                    <th className="px-6 py-4 font-medium text-right">Principal</th>
                                                    <th className="px-6 py-4 font-medium text-right">Interest</th>
                                                    <th className="px-6 py-4 font-medium text-center">Status</th>
                                                    <th className="px-6 py-4 font-medium text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {loan.amortizationSchedule?.length > 0 ? (
                                                    loan.amortizationSchedule.map((emi) => (
                                                        <tr key={emi.installmentNo} className={emi.status === 'Paid' ? 'bg-white/5' : 'hover:bg-white/5'}>
                                                            <td className="px-6 py-4 font-mono text-slate-500">{String(emi.installmentNo).padStart(2, '0')}</td>
                                                            <td className="px-6 py-4 text-slate-300">{new Date(emi.dueDate).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4 text-right text-slate-400">{formatCurrency(emi.principal)}</td>
                                                            <td className="px-6 py-4 text-right text-slate-400">{formatCurrency(emi.interest)}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${emi.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                                                    }`}>
                                                                    {emi.status === 'Paid' && <CheckCircle className="w-3 h-3" />}
                                                                    {emi.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {emi.status === 'Pending' && (
                                                                    <button
                                                                        onClick={() => verifyRepayment(loan, emi)}
                                                                        className="px-4 py-1.5 bg-cyan-500 text-black rounded-md text-xs font-bold hover:bg-cyan-400 transition-colors shadow-sm"
                                                                    >
                                                                        Pay
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Schedule unavailable</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* --- MODALS --- */}

            {/* PRODUCT GUIDE MODAL */}
            <AnimatePresence>
                {showGuide && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card bg-[#0f172a] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/10"
                        >
                            <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Product Portfolio Guide</h2>
                                    <p className="text-sm text-slate-400">Comparative analysis of our credit facilities</p>
                                </div>
                                <button onClick={() => setShowGuide(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <div className="overflow-hidden border border-white/10 rounded-xl">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-white/10 text-white">
                                            <tr>
                                                <th className="px-6 py-4 font-bold">Feature</th>
                                                {LOAN_TYPES.map(t => (
                                                    <th key={t.id} className="px-6 py-4 font-bold whitespace-nowrap">{t.name}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 bg-white/5">
                                            <tr>
                                                <td className="px-6 py-4 font-bold text-slate-300 bg-white/5">Interest Rate</td>
                                                {LOAN_TYPES.map(t => (
                                                    <td key={t.id} className="px-6 py-4 font-mono font-bold text-cyan-400">{t.rate}%</td>
                                                ))}
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 font-bold text-slate-300 bg-white/5">Max Amount</td>
                                                {LOAN_TYPES.map(t => (
                                                    <td key={t.id} className="px-6 py-4 text-slate-400">{formatCurrency(t.maxAmount)}</td>
                                                ))}
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 font-bold text-slate-300 bg-white/5">Tenure</td>
                                                {LOAN_TYPES.map(t => (
                                                    <td key={t.id} className="px-6 py-4 text-slate-400">{t.tenureRange}</td>
                                                ))}
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 font-bold text-slate-300 bg-white/5">Collateral</td>
                                                {LOAN_TYPES.map(t => (
                                                    <td key={t.id} className="px-6 py-4">
                                                        {t.id === 'Personal' || t.id === 'Education' ?
                                                            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold">Unsecured</span> :
                                                            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs font-bold">Secured</span>
                                                        }
                                                    </td>
                                                ))}
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 font-bold text-slate-300 bg-white/5">Processing Fee</td>
                                                {LOAN_TYPES.map(t => (
                                                    <td key={t.id} className="px-6 py-4 text-slate-500">
                                                        {t.id === 'Personal' ? '1.5%' : t.id === 'Home' ? '0.5%' : '1.0%'}
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-8 bg-cyan-500/10 p-6 rounded-xl flex gap-4 items-start border border-cyan-500/20">
                                    <Info className="w-6 h-6 text-cyan-400 shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-bold text-cyan-300">Important Note</h4>
                                        <p className="text-sm text-cyan-200/70 mt-1 leading-relaxed">
                                            Interest rates are subject to change based on RBI guidelines and applicant's credit score.
                                            Processing fees are non-refundable. Secured loans require property/vehicle documents to be deposited with the bank.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
                                <button onClick={() => setShowGuide(false)} className="px-6 py-2 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-colors">
                                    Close Guide
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showApply && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card bg-[#0f172a] rounded-2xl shadow-xl w-full max-w-lg p-8 relative border border-white/10">
                            <h2 className="text-xl font-bold text-white mb-2">New Application</h2>
                            <p className="text-slate-500 text-sm mb-6">Requesting: <span className="font-bold text-cyan-400">{LOAN_TYPES.find(t => t.id === selectedType)?.name}</span></p>

                            <form onSubmit={handleApplySubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Loan Amount</label>
                                        <input type="number" required value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 font-bold text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20" placeholder="0.00" />
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-lg flex justify-between items-center border border-white/10">
                                        <div className="text-sm font-medium text-slate-400">Calculated EMI</div>
                                        <div className="text-xl font-bold text-white">{formatCurrency(calculateEMI())}</div>
                                    </div>

                                    <div onClick={() => setProofUploaded(true)} className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors ${proofUploaded ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/20'}`}>
                                        {proofUploaded ? <span className="text-emerald-400 font-bold text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Verified Document</span> : <span className="text-slate-400 text-sm font-medium">Upload Income Proof (PDF/JPG)</span>}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={termsAccepted} onChange={() => setTermsAccepted(!termsAccepted)} className="w-5 h-5 accent-cyan-500 bg-black/20 border-white/20 rounded" />
                                        <span className="text-sm text-slate-400">I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-cyan-400 font-bold hover:underline">Terms of Service</button></span>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setShowApply(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-white/5 rounded-lg">Cancel</button>
                                    <button disabled={loading} className="flex-1 bg-cyan-500 text-black py-3 rounded-lg font-bold hover:bg-cyan-400 disabled:opacity-50 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                                        {loading ? 'Processing...' : 'Submit Application'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showTermsModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
                        <div className="glass-card bg-[#0f172a] p-8 rounded-xl max-w-md shadow-2xl border border-white/10">
                            <h3 className="font-bold text-lg mb-4 text-white">Terms & Conditions</h3>
                            <p className="text-sm text-slate-400 leading-relaxed mb-6">By proceding, you agree to the standard lending terms determined by regulatory authorities. Interest rates are fixed for the tenure. Pre-payment charges may apply.</p>
                            <button onClick={() => setShowTermsModal(false)} className="w-full bg-white/10 py-2 rounded-lg font-bold text-white hover:bg-white/20">Acknowledge</button>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {repayModalData && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="glass-card bg-[#0f172a] rounded-xl shadow-2xl p-8 max-w-sm w-full text-center border border-white/10">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Wallet className="w-8 h-8 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Authorize Payment</h3>
                            <p className="text-slate-400 text-sm mb-8">
                                Pay <span className="font-bold text-white">{formatCurrency(repayModalData.amount)}</span> for Loan #{repayModalData.loanId}
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setRepayModalData(null)} className="flex-1 py-3 bg-white/5 text-slate-400 rounded-xl font-bold hover:bg-white/10">Cancel</button>
                                <button onClick={confirmRepayment} className="flex-1 py-3 bg-cyan-500 text-black rounded-xl font-bold hover:bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />
        </div>
    );
}

export default Loans;
