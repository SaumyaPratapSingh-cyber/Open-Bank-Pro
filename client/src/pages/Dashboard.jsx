import { useState, useEffect } from 'react';
import { getAccount, getTransactions, getNotifications, getCards, convertCurrency } from '../api';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion } from 'framer-motion';
import {
  Download, TrendingUp, CreditCard, ArrowUpRight, ArrowDownLeft,
  Activity, Wallet, RefreshCcw, Globe, ChevronRight, Plus, Shield, Bell, User, Smartphone
} from 'lucide-react';
import CreditCard3D from '../components/CreditCard3D';

function Dashboard() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [history, setHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cardLoading, setCardLoading] = useState(true);

  // Forex State
  const [activeCurrency, setActiveCurrency] = useState('INR');
  const [convertAmount, setConvertAmount] = useState('');
  const [targetCurrency, setTargetCurrency] = useState('USD');
  const [conversionLoading, setConversionLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const { accountNumber } = JSON.parse(storedUser);

    const fetchData = async () => {
      // setLoading(true); // Don't trigger full reload on poll
      try {
        const accRes = await getAccount(accountNumber);
        setAccount(accRes.data);

        try {
          const { data } = await getCards(accountNumber);
          const activeCard = data.find(c => c.status === 'ACTIVE') || data[0];
          setCard(activeCard || null);
        } catch (e) {
          console.error(e);
          setCard(null);
        }
        setCardLoading(false);

        const txRes = await getTransactions(accountNumber);
        setHistory(txRes.data);

        const notifRes = await getNotifications(accountNumber);
        setNotifications(notifRes.data);
      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getBalance = () => {
    if (!account?.balances) return account?.balance || 0;
    return account.balances[activeCurrency] || 0;
  };

  const handleConvert = async () => {
    if (!convertAmount || isNaN(convertAmount) || Number(convertAmount) <= 0) return;
    setConversionLoading(true);
    try {
      await convertCurrency({ from: activeCurrency, to: targetCurrency, amount: Number(convertAmount) });
      alert(`Converted ${convertAmount} ${activeCurrency} to ${targetCurrency}`);
      setConvertAmount('');
    } catch (error) {
      alert(error.response?.data?.error || "Conversion Failed");
    } finally {
      setConversionLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!account) return;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(29, 53, 87);
    doc.text("OpenBank Pro Statement", 15, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Account: ${account.accountNumber}`, 15, 30);
    doc.text(`Balance: ${account.balances?.INR || account.balance}`, 15, 35);

    autoTable(doc, {
      startY: 45,
      head: [['Date', 'Description', 'Amount', 'Type']],
      body: history.slice(0, 20).map(t => [
        new Date(t.createdAt).toLocaleDateString(),
        t.description || t.type,
        t.amount,
        t.type
      ]),
      theme: 'grid',
      headStyles: { fillColor: [45, 55, 72] }
    });
    doc.save('statement.pdf');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50 } }
  };

  if (loading || !account) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans bg-slate-950 text-white overflow-x-hidden">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Welcome Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
              Hello, <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">{account.ownerName}</span>
            </h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Here is your financial overview.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={downloadPDF} className="glass-button bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center gap-2 transition-all active:scale-95">
              <Download size={16} /> <span className="hidden sm:inline">Statement</span>
            </button>
            <button onClick={() => navigate('/transfer')} className="glass-button bg-cyan-500 hover:bg-cyan-400 text-black border border-cyan-400 flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all active:scale-95 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]">
              <ArrowUpRight size={18} strokeWidth={2.5} /> Send Money
            </button>
          </div>
        </motion.div>

        {/* Top Grid: Cards & Balance */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left: 3D Card Area */}
          <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
            <div className="relative group perspective">
              <CreditCard3D
                card={card}
                loading={cardLoading}
                onFreezeToggle={() => navigate('/cards')}
              />
            </div>

            {/* Total Balance Card */}
            <div className="glass-card p-6 relative overflow-hidden group border border-white/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                    <Wallet size={14} /> Total Balance
                  </span>
                  <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                    {['INR', 'USD', 'EUR'].map(curr => (
                      <button
                        key={curr}
                        onClick={() => setActiveCurrency(curr)}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${activeCurrency === curr
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-glass'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                          }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl text-slate-400 font-light">{activeCurrency === 'INR' ? '₹' : activeCurrency === 'USD' ? '$' : '€'}</span>
                  <span className="text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                    {getBalance().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 inline-flex px-2 py-1 rounded border border-emerald-500/20">
                  <TrendingUp size={14} />
                  <span>+2.5% this month</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Widgets */}
          <motion.div variants={itemVariants} className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Quick Services */}
            <div className="md:col-span-2 glass-card p-6 border border-white/10 bg-white/5">
              <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"></span>
                Quick Services
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { title: "Loan Simulator", icon: Activity, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", path: "/loan" },
                  { title: "Investments", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", path: "/investments" },
                  { title: "Manage Cards", icon: CreditCard, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", path: "/cards" },
                  { title: "UPI Payment", icon: Smartphone, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", path: "/upi" },
                ].map((item, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(item.path)}
                    className="p-5 rounded-2xl bg-black/20 hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer group text-center active:scale-95"
                  >
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 ${item.bg} ${item.color} border ${item.border}`}>
                      <item.icon size={22} />
                    </div>
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Forex Widget */}
            <div className="glass-card p-6 relative overflow-hidden flex flex-col justify-between border border-white/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Globe className="text-blue-400" size={18} />
                  </div>
                  <h3 className="font-bold text-white">Forex Exchange</h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/30 rounded-xl p-3 flex items-center border border-white/10 focus-within:border-blue-500/50 transition-colors">
                    <input
                      value={convertAmount}
                      onChange={(e) => setConvertAmount(e.target.value)}
                      placeholder="Amount"
                      className="bg-transparent border-none text-white w-full focus:ring-0 text-sm font-bold placeholder-slate-600 outline-none"
                    />
                    <div className="flex items-center gap-2 px-3 border-l border-white/10">
                      <span className="text-xs font-bold text-blue-400">{activeCurrency}</span>
                    </div>
                  </div>

                  <div className="flex justify-center relative my-0">
                    <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -z-10"></div>
                    <div className="bg-slate-900 border border-white/10 p-1.5 rounded-full z-10">
                      <RefreshCcw className="text-slate-500" size={14} />
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-xl p-3 flex items-center border border-white/10">
                    <div className="w-full text-sm font-bold text-slate-400">
                      {convertAmount ? `${(Number(convertAmount) * 1.2).toFixed(2)}` : '0.00'}
                    </div>
                    <select
                      value={targetCurrency}
                      onChange={(e) => setTargetCurrency(e.target.value)}
                      className="bg-transparent border-none text-blue-400 text-xs font-bold focus:ring-0 cursor-pointer outline-none w-16 text-right appearance-none"
                    >
                      {['USD', 'EUR', 'INR'].filter(c => c !== activeCurrency).map(c => <option key={c} value={c} className="bg-slate-800 text-white">{c}</option>)}
                    </select>
                  </div>

                  <button onClick={handleConvert} disabled={conversionLoading} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs font-bold mt-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50">
                    {conversionLoading ? 'Exchanging...' : 'Convert Now'}
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications / Messages Mini */}
            <div className="glass-card p-6 border border-white/10 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="text-amber-400" size={18} />
                <h3 className="font-bold text-white">Updates</h3>
              </div>
              <div className="space-y-4">
                {notifications.slice(0, 4).map((n, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div>
                    <div>
                      <p className="text-xs font-bold text-slate-200 mb-0.5">{n.title}</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No new notifications</p>}
              </div>
            </div>

          </motion.div>
        </div>

        {/* Recent Transactions Table */}
        <motion.div variants={itemVariants} className="glass-card p-0 border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="text-emerald-400" size={18} /> Recent Activity
            </h3>
            <button onClick={() => navigate('/statement')} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-all hover:gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20">
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-white/5 bg-black/20">
                  <th className="py-4 pl-6 font-semibold">Transaction</th>
                  <th className="py-4 font-semibold">Type</th>
                  <th className="py-4 font-semibold">Date</th>
                  <th className="py-4 pr-6 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {history.slice(0, 5).map((txn, i) => {
                  const isDebit = txn.fromAccount === account.accountNumber;
                  return (
                    <tr key={i} className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 cursor-default">
                      <td className="py-4 pl-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 border ${isDebit ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            }`}>
                            {isDebit ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                          </div>
                          <span className="font-bold text-slate-200 group-hover:text-white transition-colors">{txn.description || txn.type}</span>
                        </div>
                      </td>
                      <td className="py-4 text-slate-500 capitalize">
                        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-xs">
                          {txn.type.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </td>
                      <td className="py-4 text-slate-500 text-xs font-mono">{new Date(txn.createdAt).toLocaleDateString()}</td>
                      <td className={`py-4 pr-6 text-right font-bold text-base ${isDebit ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isDebit ? '-' : '+'} {txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
                {history.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2 opacity-50">
                        <Activity size={24} />
                        <span>No recent transactions found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Dashboard;