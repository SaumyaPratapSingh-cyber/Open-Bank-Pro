import { useState, useEffect } from 'react';
import { transferMoney, lookupAccount, addBeneficiary, getBeneficiaries, deleteBeneficiary, getCards, transferViaCard } from '../api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CreditCard, Send, CheckCircle, ShieldCheck, AlertCircle, ChevronRight, UserPlus, Trash2, Clock, Plus, Wallet } from 'lucide-react';
import OTPModal from '../components/OTPModal';

function Transfer() {
  const navigate = useNavigate();
  const [step, setStep] = useState('SEARCH'); // SEARCH, AMOUNT, REVIEW, OTP, SUCCESS

  const [formData, setFormData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    remarks: ''
  });

  const [paymentMode, setPaymentMode] = useState('ACCOUNT'); // ACCOUNT | CARD
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  const [view, setView] = useState('TRANSFER'); // TRANSFER | MANAGE
  const [payees, setPayees] = useState([]);
  const [newPayee, setNewPayee] = useState({ name: '', account: '', ifsc: '' });
  const [loadingPayees, setLoadingPayees] = useState(false);

  const [beneficiary, setBeneficiary] = useState(null);
  const [status, setStatus] = useState(null);
  const [showOtp, setShowOtp] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setCurrentUser(parsedUser);
    setFormData(prev => ({ ...prev, fromAccount: parsedUser.accountNumber }));
    loadPayees();
    loadCards(parsedUser.accountNumber);
  }, []);

  const loadPayees = async () => {
    setLoadingPayees(true);
    try {
      const { data } = await getBeneficiaries();
      setPayees(data);
    } catch (error) {
      console.error("Failed to load payees", error);
    } finally {
      setLoadingPayees(false);
    }
  };

  const loadCards = async (accNum) => {
    try {
      const { data } = await getCards(accNum);
      const activeCards = data.filter(c => c.status === 'ACTIVE');
      setCards(activeCards);
      if (activeCards.length > 0) setSelectedCard(activeCards[0]);
    } catch (error) {
      console.error("Failed to load cards", error);
    }
  };

  const handleAddPayee = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', msg: 'Adding Payee...' });
    try {
      await addBeneficiary({
        payeeName: newPayee.name,
        payeeAccountNum: newPayee.account,
        ifsc: newPayee.ifsc
      });
      setStatus({ type: 'success', msg: 'Payee Added! Cooling period started.' });
      setNewPayee({ name: '', account: '', ifsc: '' });
      loadPayees();
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus({ type: 'error', msg: error.response?.data?.error || "Failed to add" });
    }
  };

  const handleDeletePayee = async (id) => {
    if (!window.confirm("Delete this beneficiary?")) return;
    try {
      await deleteBeneficiary(id);
      loadPayees();
    } catch (error) {
      alert("Failed to delete");
    }
  };

  const getRemainingTime = (activationTime) => {
    const diff = new Date(activationTime) - new Date();
    if (diff <= 0) return null;
    const mins = Math.ceil(diff / 60000);
    return `${mins} mins`;
  };

  const selectPayee = (payee) => {
    if (payee.status === 'PENDING') {
      const remaining = getRemainingTime(payee.activationTime);
      setStatus({ type: 'error', msg: `Cooling Period Active. Returns in ${remaining}.` });
      return;
    }
    setBeneficiary({ ownerName: payee.payeeName });
    setFormData({ ...formData, toAccount: payee.payeeAccountNum });
    setStep('AMOUNT');
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', msg: 'Verifying Account...' });
    setBeneficiary(null);

    try {
      if (formData.toAccount === formData.fromAccount) {
        throw new Error("Cannot transfer to self.");
      }

      const { data } = await lookupAccount(formData.toAccount);
      setBeneficiary(data);
      setStatus(null);
      setStep('AMOUNT');
    } catch (err) {
      let errorMsg = err.response?.data?.error || err.message || 'Account not found';
      if (err.response?.status === 404 && !err.response?.data?.error) {
        errorMsg = "System Update Required: Please restart the backend server.";
      }
      setStatus({ type: 'error', msg: errorMsg });
    }
  };

  const handleAmountSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      setStatus({ type: 'error', msg: 'Please enter a valid amount' });
      return;
    }

    if (paymentMode === 'ACCOUNT') {
      if (Number(formData.amount) > currentUser.balance && Number(formData.amount) > (currentUser.balances?.INR || 0)) {
        setStatus({ type: 'error', msg: 'Insufficient Balance' });
        return;
      }
    } else {
      if (!selectedCard) {
        setStatus({ type: 'error', msg: 'Please select a valid card.' });
        return;
      }
    }

    setStatus(null);
    setStep('REVIEW');
  };

  const initiateTransfer = () => {
    setShowOtp(true);
  };

  const handleFinalTransfer = async () => {
    setShowOtp(false);
    setStatus({ type: 'loading', msg: 'Processing Secure Transfer...' });

    try {
      let response;
      if (paymentMode === 'CARD') {
        response = await transferViaCard({
          cardNumber: selectedCard.cardNumber,
          cvv: selectedCard.cvv,
          amount: Number(formData.amount),
          description: formData.remarks,
          toAccount: formData.toAccount
        });
      } else {
        response = await transferMoney(formData);
      }

      const { data } = response;
      setStatus({ type: 'success', msg: 'Transfer Successful!', data });
      setStep('SUCCESS');
    } catch (err) {
      setStatus({
        type: 'error',
        msg: err.response?.data?.error || 'Transfer Failed'
      });
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'SEARCH':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Select Beneficiary</h2>
              <p className="text-slate-400 text-xs text-center">Only added beneficiaries can receive funds.</p>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {loadingPayees ? (
                <div className="text-center text-slate-500 py-4">Loading Payees...</div>
              ) : payees.length === 0 ? (
                <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                  <UserPlus className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-400 font-medium">No Payees Added</p>
                </div>
              ) : (
                payees.map(p => {
                  const remaining = getRemainingTime(p.activationTime);
                  const isPending = p.status === 'PENDING' && remaining;
                  return (
                    <div
                      key={p._id}
                      onClick={() => selectPayee(p)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center group ${isPending ? 'bg-amber-900/10 border-amber-500/20 opacity-70' : 'bg-white/5 border-white/5 hover:border-cyan-500/50 hover:bg-white/10'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isPending ? 'bg-amber-500/20 text-amber-500' : 'bg-cyan-500/20 text-cyan-400'}`}>
                          {p.payeeName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-cyan-400 transition-colors">{p.payeeName}</p>
                          <p className="text-xs text-slate-400 font-mono">**** {p.payeeAccountNum.slice(-4)}</p>
                        </div>
                      </div>
                      {isPending && (
                        <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs font-bold">{remaining}</span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <button
              onClick={() => setView('MANAGE')}
              className="w-full glass-button bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Manage / Add Payee
            </button>
          </motion.div>
        );

      case 'AMOUNT':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Beneficiary Badge */}
            <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold text-xl">
                {beneficiary?.ownerName?.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Verified Recipient</p>
                <h3 className="font-bold text-white text-lg leading-tight">{beneficiary?.ownerName}</h3>
                <p className="text-sm text-slate-400 font-mono">ID: {formData.toAccount}</p>
              </div>
              <CheckCircle className="ml-auto w-6 h-6 text-emerald-500" />
            </div>

            {/* Payment Method Toggle */}
            <div className="bg-black/20 p-1 rounded-xl flex border border-white/5">
              <button
                onClick={() => setPaymentMode('ACCOUNT')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${paymentMode === 'ACCOUNT' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Bank Account
              </button>
              <button
                onClick={() => setPaymentMode('CARD')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${paymentMode === 'CARD' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <CreditCard className="w-4 h-4" />
                Debit Card
              </button>
            </div>

            {/* Card Selection */}
            <AnimatePresence>
              {paymentMode === 'CARD' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {cards.length === 0 ? (
                    <div className="text-center p-4 bg-rose-500/10 text-rose-400 rounded-xl text-xs font-bold border border-rose-500/20">
                      No Active Debit Cards Found.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Card</label>
                      <div className="grid gap-2">
                        {cards.map(card => (
                          <div
                            key={card._id}
                            onClick={() => setSelectedCard(card)}
                            className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${selectedCard?._id === card._id ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                          >
                            <div className="flex items-center gap-3">
                              <CreditCard className={`w-5 h-5 ${selectedCard?._id === card._id ? 'text-cyan-400' : 'text-slate-400'}`} />
                              <div>
                                <p className="font-bold text-sm text-white">{card.network} • {card.cardType}</p>
                                <p className="text-xs text-slate-400 font-mono">•••• {card.cardNumber.slice(-4)}</p>
                              </div>
                            </div>
                            {selectedCard?._id === card._id && <CheckCircle className="w-5 h-5 text-cyan-400" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleAmountSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Amount</label>
                <div className="relative group">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-500 group-focus-within:text-cyan-400 transition-colors">₹</span>
                  <input
                    type="number"
                    autoFocus
                    className="w-full pl-8 py-2 text-5xl font-bold text-white border-b-2 border-white/10 focus:border-cyan-400 outline-none bg-transparent placeholder-white/10 transition-colors"
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <p className="text-xs text-slate-400 text-right">Available Balance: ₹{(currentUser?.balances?.INR || currentUser?.balance || 0).toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Remarks (Optional)</label>
                <input
                  type="text"
                  maxLength={30}
                  className="input-glass"
                  placeholder="Rent, Dinner, Gift..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:to-blue-500 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2"
              >
                Review Transfer
                <ChevronRight className="w-5 h-5" />
              </button>
            </form>

            <button onClick={() => setStep('SEARCH')} className="w-full text-center text-slate-400 text-sm hover:text-white transition-colors">Cancel & Go Back</button>
          </motion.div>
        );

      case 'REVIEW':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-bold text-white text-center">Confirm Transfer</h2>

            {/* Visual Card Representation */}
            <div className="relative bg-gradient-to-br from-slate-900 to-black rounded-2xl p-6 text-white overflow-hidden shadow-2xl border border-white/10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="relative z-10 flex justify-between items-start mb-8">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Total Amount</p>
                  <h3 className="text-3xl font-bold text-white">₹{Number(formData.amount).toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/5">
                  <Send className="w-6 h-6 text-cyan-400" />
                </div>
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg backdrop-blur-sm border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-slate-300">You</div>
                    <div className="text-sm">
                      <p className="text-slate-400 text-xs">From</p>
                      <p className="font-mono font-bold leading-none text-slate-200">{formData.fromAccount}</p>
                    </div>
                  </div>
                  <ArrowLeft className="rotate-180 w-4 h-4 text-slate-500" />
                </div>

                <div className="flex justify-between items-center bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-3 rounded-lg border border-cyan-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500 text-black flex items-center justify-center text-xs font-bold">To</div>
                    <div className="text-sm">
                      <p className="text-cyan-200/80 text-xs">Receiver</p>
                      <p className="font-bold leading-none text-cyan-100">{beneficiary?.ownerName}</p>
                      <p className="font-mono text-xs opacity-80 text-cyan-200/50">{formData.toAccount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {formData.remarks && (
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Note</p>
                <p className="text-slate-300 font-medium">"{formData.remarks}"</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep('AMOUNT')}
                className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
              >
                Modify
              </button>
              <button
                onClick={initiateTransfer}
                className="flex-[2] bg-gradient-to-r from-rose-500 to-orange-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-rose-500/20 hover:shadow-xl transition-all"
              >
                Pay Securely
              </button>
            </div>
          </motion.div>
        );

      case 'SUCCESS':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative overflow-hidden border border-emerald-500/20">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </motion.div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-1">Payment Successful</h2>
            <p className="text-slate-400 mb-8">Ref: {status?.data?.receiverNewBalance ? 'TRF-' + Math.floor(Date.now() / 1000) : 'TRF-SUCCESS'}</p>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 relative overflow-hidden mb-8 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-slate-400 text-sm">Amount Paid</span>
                  <span className="text-2xl font-bold text-white">₹{Number(formData.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">To</span>
                  <span className="font-bold text-white">{beneficiary?.ownerName}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">From</span>
                  <span className="font-mono text-slate-300">{formData.fromAccount}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Time</span>
                  <span className="text-slate-300">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 rounded-xl font-bold text-slate-400 border border-white/10 hover:bg-white/5 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => setStep('SEARCH')} // Start Over
                className="flex-1 glass-button bg-cyan-500 hover:bg-cyan-400 text-black border-cyan-400"
              >
                Send Another
              </button>
            </div>
          </motion.div>
        );
    }
  };

  if (view === 'MANAGE') {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <motion.div layout className="glass-card w-full max-w-md p-0 overflow-hidden relative">
          <div className="px-6 pt-6 pb-2 flex items-center gap-4">
            <button onClick={() => setView('TRANSFER')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-white">Manage Payees</h2>
          </div>

          <div className="p-6 space-y-8">
            <div className="bg-cyan-500/5 p-4 rounded-2xl border border-cyan-500/10">
              <h3 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider">Add New Beneficiary</h3>
              <form onSubmit={handleAddPayee} className="space-y-3">
                <input
                  className="input-glass bg-black/20"
                  placeholder="Payee Name"
                  value={newPayee.name} onChange={e => setNewPayee({ ...newPayee, name: e.target.value })}
                />
                <input
                  className="input-glass bg-black/20"
                  placeholder="Account Number (8 Digits)"
                  value={newPayee.account} onChange={e => setNewPayee({ ...newPayee, account: e.target.value })}
                />
                <input
                  className="input-glass bg-black/20"
                  placeholder="IFSC Code (e.g. OBIN0001234)"
                  value={newPayee.ifsc} onChange={e => setNewPayee({ ...newPayee, ifsc: e.target.value })}
                />
                <button className="w-full glass-button bg-cyan-500 text-black hover:bg-cyan-400 mt-2">
                  Add Payee
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Your Payees</h3>
              {payees.map(p => {
                const remaining = getRemainingTime(p.activationTime);
                const isPending = p.status === 'PENDING' && remaining;
                return (
                  <div key={p._id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isPending ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {p.payeeName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">{p.payeeName}</p>
                        <p className="text-xs text-slate-400">{p.payeeAccountNum}</p>
                        {isPending && <p className="text-[10px] text-amber-400 font-bold mt-1">Active in: {remaining}</p>}
                      </div>
                    </div>
                    <button onClick={() => handleDeletePayee(p._id)} className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
          {status?.type === 'error' && (
            <div className="absolute bottom-6 left-6 right-6 bg-rose-500 text-white p-3 rounded-xl shadow-lg text-sm text-center border-rose-400">{status.msg}</div>
          )}
          {status?.type === 'success' && (
            <div className="absolute bottom-6 left-6 right-6 bg-emerald-500 text-white p-3 rounded-xl shadow-lg text-sm text-center border-emerald-400">{status.msg}</div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-6 h-full">
      <motion.div
        layout
        className="glass-card w-full max-w-md p-0 overflow-hidden relative"
      >
        {/* Header (Hidden on Success) */}
        {step !== 'SUCCESS' && (
          <div className="px-6 pt-6 pb-2 flex items-center justify-between">
            <button onClick={() => step === 'SEARCH' ? navigate('/dashboard') : setStep(prev => prev === 'REVIEW' ? 'AMOUNT' : 'SEARCH')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div className="flex items-center gap-2 text-cyan-400 font-bold opacity-80">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs uppercase tracking-widest">Secure Transfer</span>
            </div>
          </div>
        )}

        <div className="p-8">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>

        {/* Global Error Display */}
        {status?.type === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-6 left-6 right-6 bg-rose-500 text-white p-4 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            {status.msg}
            <button onClick={() => setStatus(null)} className="ml-auto opacity-50 hover:opacity-100">✕</button>
          </motion.div>
        )}
      </motion.div>

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOtp}
        onClose={() => setShowOtp(false)}
        onVerify={handleFinalTransfer}
        amount={formData.amount}
      />
    </div>
  );
}

export default Transfer;