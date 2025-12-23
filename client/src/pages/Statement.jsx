import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Filter, Search, ArrowUpRight, ArrowDownLeft, Calendar, FileText, Ban, Building2, User, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTransactions, getAccount } from '../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BANK_DETAILS } from '../constants';

function Statement() {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [filteredTxns, setFilteredTxns] = useState([]);
    const [account, setAccount] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        const fetchData = async () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const { accountNumber } = JSON.parse(storedUser);
                const accRes = await getAccount(accountNumber);
                const txnRes = await getTransactions(accountNumber);

                setAccount(accRes.data);
                const sortedTxns = txnRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setTransactions(sortedTxns);
                setFilteredTxns(sortedTxns);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        let res = transactions;
        if (filter === 'IN') res = res.filter(t => t.toAccount === account?.accountNumber);
        if (filter === 'OUT') res = res.filter(t => t.fromAccount === account?.accountNumber);

        if (search) {
            const lowerSearch = search.toLowerCase();
            res = res.filter(t =>
                (t.description && t.description.toLowerCase().includes(lowerSearch)) ||
                (t.transactionId && t.transactionId.toLowerCase().includes(lowerSearch)) ||
                (t.refNo && t.refNo.toLowerCase().includes(lowerSearch))
            );
        }

        if (dateRange.start) {
            res = res.filter(t => new Date(t.createdAt) >= new Date(dateRange.start));
        }
        if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setDate(endDate.getDate() + 1);
            res = res.filter(t => new Date(t.createdAt) < endDate);
        }

        setFilteredTxns(res);
    }, [filter, search, transactions, account, dateRange]);

    const downloadPDF = async () => {
        if (!account) return;

        const doc = new jsPDF();

        // --- 1. Header Section ---

        // Add Logo
        try {
            const logoImg = new Image();
            logoImg.src = '/logo.png';
            await new Promise((resolve) => { logoImg.onload = resolve; });
            doc.addImage(logoImg, 'PNG', 15, 15, 40, 15);
        } catch (e) {
            console.error("Could not load logo", e);
            doc.setFontSize(20);
            doc.setTextColor(29, 53, 87);
            doc.text("OpenBank", 15, 25);
        }

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(BANK_DETAILS.NAME, 195, 20, { align: 'right' });
        doc.text(BANK_DETAILS.ADDRESS, 195, 25, { align: 'right' });
        doc.text(`IFSC: ${BANK_DETAILS.IFSC}`, 195, 30, { align: 'right' });
        doc.text(`Helpline: ${BANK_DETAILS.HELPLINE}`, 195, 35, { align: 'right' });

        doc.setDrawColor(200, 200, 200);
        doc.line(15, 40, 195, 40);

        // --- 2. Statement Details ---
        doc.setFontSize(16);
        doc.setTextColor(29, 53, 87);
        doc.text("ACCOUNT STATEMENT", 15, 50);

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);

        doc.text(`Name: ${account.ownerName.toUpperCase()}`, 15, 60);
        doc.text(`Address: ${account.address || 'Address Not Updated'}`, 15, 65);
        doc.text(`Mobile: ${account.mobile || 'NA'}`, 15, 70);

        const today = new Date().toLocaleDateString();
        doc.text(`Account Number: ${account.accountNumber}`, 195, 60, { align: 'right' });
        doc.text(`Account Type: Savings Account`, 195, 65, { align: 'right' });
        doc.text(`Statement Date: ${today}`, 195, 70, { align: 'right' });

        // Account Summary Box
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(15, 78, 180, 20, 2, 2, 'F');

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("Opening Balance", 25, 85);
        doc.text("Total Deposits", 75, 85);
        doc.text("Total Withdrawals", 125, 85);
        doc.text("Closing Balance", 175, 85, { align: 'right' });

        const totalDeposits = filteredTxns.filter(t => t.toAccount === account.accountNumber).reduce((acc, t) => acc + t.amount, 0);
        const totalWithdrawals = filteredTxns.filter(t => t.fromAccount === account.accountNumber).reduce((acc, t) => acc + t.amount, 0);
        const closingBal = account.balances?.INR || account.balance || 0;

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(`Rs. ${totalDeposits.toLocaleString()}`, 75, 92);
        doc.text(`Rs. ${totalWithdrawals.toLocaleString()}`, 125, 92);
        doc.text(`Rs. ${closingBal.toLocaleString()}`, 175, 92, { align: 'right' });
        doc.setFont("helvetica", "normal");


        // --- 3. Transactions Table ---
        const tableColumn = ["Date", "Description", "Ref No", "Debit", "Credit", "Balance"];
        const tableRows = [];

        filteredTxns.forEach(t => {
            const isDebit = t.fromAccount === account?.accountNumber;
            const creditVal = !isDebit ? t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "";
            const debitVal = isDebit ? t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "";

            const txnData = [
                new Date(t.createdAt).toLocaleDateString(),
                t.description || t.type,
                t.refNo || ("TXN" + t.transactionId.substring(0, 6).toUpperCase()),
                debitVal,
                creditVal,
                t.runningBalance ? t.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"
            ];
            tableRows.push(txnData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 110,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: [45, 55, 72], textColor: 255, fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 25 },
                3: { cellWidth: 25, halign: 'right', textColor: [220, 38, 38] },
                4: { cellWidth: 25, halign: 'right', textColor: [22, 163, 74] },
                5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
            },
            alternateRowStyles: { fillColor: [249, 250, 251] }
        });

        // --- 4. Footer & Signature ---
        const lastY = doc.lastAutoTable.finalY + 20;

        try {
            const sigImg = new Image();
            sigImg.src = '/signature.png';
            await new Promise((resolve) => { sigImg.onload = resolve; });
            doc.addImage(sigImg, 'PNG', 150, lastY, 30, 10);
            doc.setFontSize(8);
            doc.text("Authorized Signatory", 150, lastY + 15);
        } catch (e) {
            console.error("Could not load signature", e);
        }

        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        const disclaimY = lastY + 30;
        doc.text("This is an electronically generated statement and does not require a physical signature.", 15, disclaimY);
        doc.text(BANK_DETAILS.ADDRESS_FULL, 15, disclaimY + 4);

        doc.save(`Statement_${account.accountNumber}_${Date.now()}.pdf`);
    };

    if (!account) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-cyan-400">Loading...</div>;

    return (
        <div className="min-h-screen px-4 md:px-8 py-6 font-sans text-white">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Navigation */}
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <div className="p-2 bg-white/5 rounded-lg shadow-sm border border-white/5 hover:bg-white/10">
                            <ArrowLeft className="w-5 h-5" />
                        </div>
                        <span className="font-semibold">Back to Dashboard</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-500/20 shadow-glass">
                            Balance: ₹{(account.balances?.INR || account.balance || 0).toLocaleString()}
                        </span>
                        <div className="h-8 w-8 rounded-full bg-cyan-500 text-black flex items-center justify-center text-xs font-bold ring-2 ring-offset-2 ring-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                            {account.ownerName.charAt(0)}
                        </div>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="glass-card p-0 overflow-hidden border border-white/10">

                    {/* Top Banner with Account Info */}
                    <div className="bg-gradient-to-r from-blue-900/60 to-purple-900/60 p-6 md:p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

                        <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 relative z-10">
                            <div>
                                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                                    <FileText className="w-8 h-8 text-cyan-400" />
                                    Account Statement
                                </h1>
                                <p className="text-slate-400 text-sm md:text-base opacity-90">View, track, and download your transaction history.</p>
                            </div>
                            <button
                                onClick={downloadPDF}
                                className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-all shadow-lg active:scale-95"
                            >
                                <Download className="w-5 h-5" />
                                Download Statement
                            </button>
                        </div>

                        {/* Account Details Strips */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                            <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-3 mb-1 opacty-80 text-xs uppercase tracking-wider text-cyan-400">
                                    <User className="w-4 h-4" /> Account Number
                                </div>
                                <div className="text-lg font-mono tracking-wider font-bold">{account.accountNumber}</div>
                            </div>
                            <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-3 mb-1 opacty-80 text-xs uppercase tracking-wider text-cyan-400">
                                    <Building2 className="w-4 h-4" /> Account Type
                                </div>
                                <div className="text-lg font-bold">Savings Premium</div>
                            </div>
                            <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-3 mb-1 opacty-80 text-xs uppercase tracking-wider text-cyan-400">
                                    <Building2 className="w-4 h-4" /> Branch IFSC
                                </div>
                                <div className="text-lg font-mono font-bold">OPEN0123456</div>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="p-4 md:p-6 border-b border-white/10 bg-black/20 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                        <div className="flex flex-wrap gap-2">
                            {['ALL', 'IN', 'OUT'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${filter === f
                                        ? 'bg-cyan-500/20 text-cyan-400 shadow-glass border border-cyan-500/50'
                                        : 'bg-white/5 text-slate-500 hover:bg-white/10 border border-white/5'
                                        }`}
                                >
                                    {f === 'ALL' && <Filter className="w-4 h-4" />}
                                    {f === 'IN' && <ArrowDownLeft className="w-4 h-4" />}
                                    {f === 'OUT' && <ArrowUpRight className="w-4 h-4" />}
                                    {f === 'ALL' ? 'All' : f === 'IN' ? 'Deposits' : 'Withdrawals'}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                            <div className="relative group flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400" />
                                <input
                                    type="text"
                                    placeholder="Search by purpose, ID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-xl outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all text-white placeholder-slate-600"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl p-1 pr-3">
                                <div className="p-1.5 bg-white/5 rounded-lg">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                </div>
                                <input
                                    type="date"
                                    className="text-sm outline-none text-slate-400 bg-transparent [color-scheme:dark]"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                />
                                <span className="text-slate-600">-</span>
                                <input
                                    type="date"
                                    className="text-sm outline-none text-slate-400 bg-transparent [color-scheme:dark]"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table Area */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                    <th className="p-6 cursor-pointer hover:bg-white/10 transition-colors">Details</th>
                                    <th className="p-6">Reference ID</th>
                                    <th className="p-6 text-right">Amount</th>
                                    <th className="p-6 text-right">Balance</th>
                                    <th className="p-6 text-right">Date</th>
                                    <th className="p-6 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {filteredTxns.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500">
                                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                                                    <Ban className="w-8 h-8 text-slate-600" />
                                                </div>
                                                <p className="text-lg font-medium text-slate-400">No transactions found</p>
                                                <p className="text-sm">Try adjusting your filters or search terms.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTxns.map((t) => {
                                        const isDebit = t.fromAccount === account?.accountNumber;
                                        return (
                                            <tr key={t._id} className="hover:bg-cyan-500/5 transition-colors group border-b border-white/5 last:border-0">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${isDebit
                                                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                            }`}>
                                                            {isDebit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-bold text-base mb-0.5">{t.description || t.type}</p>
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-slate-400 border border-white/5">
                                                                {t.type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6 font-mono text-xs text-slate-500">{t.refNo || 'TXN' + t.transactionId.substring(0, 8).toUpperCase()}</td>
                                                <td className={`p-6 text-right font-bold text-base ${isDebit ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    {isDebit ? '-' : '+'} ₹{t.amount.toLocaleString()}
                                                </td>
                                                <td className="p-6 text-right font-mono font-medium text-slate-400">
                                                    {t.runningBalance ? `₹${t.runningBalance.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="p-6 text-right text-slate-500">
                                                    {new Date(t.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    <div className="text-xs text-slate-600 mt-1">{new Date(t.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <button
                                                        onClick={() => navigate(`/support?txId=${t.transactionId}`)}
                                                        className="p-2 bg-white/5 text-slate-500 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                                                        title="Report Issue"
                                                    >
                                                        <AlertCircle className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination/Foooter hint (Static for now) */}
                    <div className="p-4 border-t border-white/10 bg-black/20 text-center text-xs text-slate-500">
                        Showing {filteredTxns.length} transactions
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Statement;
