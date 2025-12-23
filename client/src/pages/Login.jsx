import { useState } from 'react';
import { loginUser } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, ArrowRight, ShieldCheck, Globe, ScanLine } from 'lucide-react';

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ accountNumber: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginUser(form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'ADMIN' || data.user.role === 'MANAGER') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (!err.response) {
        setError('Server Unreachable. Please try again later.');
      } else if (err.response.status === 401 || err.response.status === 404) {
        setError('Invalid Credentials.');
      } else {
        setError(err.response?.data?.error || 'Login Failed');
      }
    } finally {
      setLoading(false);
    }
  };

  /* --- FORGOT PASSWORD STATE --- */
  const [forgotMode, setForgotMode] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Info, 2: OTP, 3: New Password
  const [resetForm, setResetForm] = useState({ accountNumber: '', mobile: '', otp: '', newPassword: '' });
  const [resetError, setResetError] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const handleForgotInit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResetError('');
    setResetMsg('');
    try {
      // Dynamic Import to avoid top-level issues if api.js isn't ready
      const axios = require('axios');
      await axios.post('http://localhost:5000/api/auth/forgot-password-init', {
        accountNumber: resetForm.accountNumber,
        mobile: resetForm.mobile
      });
      setResetStep(2);
      setResetMsg('OTP Sent! Check your mobile.');
    } catch (err) {
      setResetError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotComplete = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResetError('');
    try {
      const axios = require('axios');
      await axios.post('http://localhost:5000/api/auth/reset-password', {
        accountNumber: resetForm.accountNumber,
        otp: resetForm.otp,
        newPassword: resetForm.newPassword
      });
      setResetMsg('Password Reset Successful! returning to login...');
      setTimeout(() => {
        setForgotMode(false);
        setResetStep(1);
        setResetForm({ accountNumber: '', mobile: '', otp: '', newPassword: '' });
        setResetMsg('');
      }, 3000);
    } catch (err) {
      setResetError(err.response?.data?.error || 'Reset Failed');
    } finally {
      setLoading(false);
    }
  };

  if (forgotMode) {
    return (
      <div className="min-h-screen flex bg-black overflow-hidden relative items-center justify-center p-6">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2232&auto=format&fit=crop')] bg-cover bg-center opacity-10 pointer-events-none"></div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full glass-card p-8 rounded-3xl border border-white/10 bg-black/60 relative z-10">
          <button onClick={() => setForgotMode(false)} className="text-slate-400 hover:text-white mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-widest"><ArrowRight className="rotate-180 w-4 h-4" /> Back to Login</button>

          <h2 className="text-2xl font-bold text-white mb-2">Recover Access</h2>
          <p className="text-slate-400 mb-8 text-sm">Follow the steps to secure your vault.</p>

          {/* STEPS INDICATOR */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-1 flex-1 rounded-full ${resetStep >= 1 ? 'bg-cyan-500' : 'bg-white/10'}`}></div>
            <div className={`h-1 flex-1 rounded-full ${resetStep >= 2 ? 'bg-cyan-500' : 'bg-white/10'}`}></div>
            <div className={`h-1 flex-1 rounded-full ${resetStep >= 3 ? 'bg-cyan-500' : 'bg-white/10'}`}></div>
          </div>

          {resetStep === 1 && (
            <form onSubmit={handleForgotInit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Account Number</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-all"
                  placeholder="8899XXXX" value={resetForm.accountNumber} onChange={e => setResetForm({ ...resetForm, accountNumber: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Registered Mobile</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-all"
                  placeholder="9876543210" value={resetForm.mobile} onChange={e => setResetForm({ ...resetForm, mobile: e.target.value })} required />
              </div>
              <button disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl mt-4 transition-all">
                {loading ? 'Verifying...' : 'Send Details'}
              </button>
            </form>
          )}

          {resetStep === 2 && (
            <div className="space-y-4">
              <div className="bg-cyan-500/10 border border-cyan-500/30 p-4 rounded-xl text-center">
                <p className="text-cyan-400 text-sm font-bold mb-1">OTP Sent Successfully</p>
                <p className="text-slate-400 text-xs">Please check your mobile messages.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Enter OTP</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-all text-center tracking-widest text-xl font-mono"
                  placeholder="XXXXXX" value={resetForm.otp} onChange={e => setResetForm({ ...resetForm, otp: e.target.value })} required />
              </div>
              <button onClick={() => setResetStep(3)} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl mt-4 transition-all">
                Verify & Proceed
              </button>
            </div>
          )}

          {resetStep === 3 && (
            <form onSubmit={handleForgotComplete} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">New Password</label>
                <input type="password" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-all"
                  placeholder="New Secure Password" value={resetForm.newPassword} onChange={e => setResetForm({ ...resetForm, newPassword: e.target.value })} required />
              </div>
              <button disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl mt-4 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                {loading ? 'Reseting...' : 'Confirm New Password'}
              </button>
            </form>
          )}

          {resetError && <p className="mt-4 text-center text-rose-400 text-xs font-bold">{resetError}</p>}
          {resetMsg && <p className="mt-4 text-center text-green-400 text-xs font-bold">{resetMsg}</p>}

        </motion.div>
      </div>
    );
  }

  /* --- MAIN LOGIN RENDER --- */
  return (
    <div className="min-h-screen flex bg-black overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-20 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black pointer-events-none"></div>

      {/* LEFT SIDE: 3D Visuals & Branding */}
      <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Animated Globe/Grid Effect */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, ease: "linear", repeat: Infinity }}
          className="absolute -left-[30%] top-[10%] w-[1200px] h-[1200px] border-[1px] border-cyan-500/10 rounded-full border-dashed pointer-events-none"
        ></motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 80, ease: "linear", repeat: Infinity }}
          className="absolute -left-[20%] top-[20%] w-[900px] h-[900px] border-[1px] border-blue-500/10 rounded-full pointer-events-none"
        ></motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: -50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 text-left w-full max-w-lg"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.4)] relative group">
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg group-hover:blur-xl transition-all"></div>
              <Globe className="w-8 h-8 text-white relative z-10" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight">OpenBank <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Pro</span></h1>
          </div>

          <h2 className="text-3xl font-bold text-slate-200 mb-6 leading-tight">
            The World's Most <br />
            <span className="text-white border-b-4 border-cyan-500 pb-1">Secure</span> Vault.
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed max-w-md">
            Advanced encryption, real-time biometrics, and a truly global financial network. Access your assets with confidence.
          </p>

          <div className="mt-12 flex gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-4xl font-bold text-white">256<span className="text-cyan-500 text-lg align-top">+</span></span>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Encrypted Nodes</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-4xl font-bold text-white">0.02<span className="text-cyan-500 text-lg align-top">s</span></span>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Latency</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT SIDE: Glass Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-10 rounded-[2rem] border border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
            {/* Glow Effect on Hover */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-[60px] group-hover:bg-blue-500/30 transition-all duration-700"></div>

            <div className="mb-10">
              <h3 className="text-2xl font-bold text-white mb-2">Welcome Back</h3>
              <p className="text-slate-400">Authenticate to access your dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-cyan-400 transition-colors">Account Number</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors w-5 h-5" />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:bg-white/10 outline-none text-white placeholder-slate-600 transition-all font-mono"
                    placeholder="8899XXXX"
                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-cyan-400 transition-colors">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors w-5 h-5" />
                  <input
                    type="password"
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:bg-white/10 outline-none text-white placeholder-slate-600 transition-all"
                    placeholder="••••••••"
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    disabled={loading}
                  />
                </div>
                {/* FORGOT PASSWORD LINK */}
                <div className="flex justify-end">
                  <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-cyan-400 hover:text-cyan-300 font-bold tracking-wide">Forgot Password?</button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 bg-rose-500/10 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/20 text-center"
                >
                  {error}
                </motion.div>
              )}

              <div className="pt-4">
                <button
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>Authenticated Access <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </div>
            </form>

            <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/5 text-sm">
              <Link to="/register" className="text-slate-400 hover:text-white transition-colors">Create Account</Link>
              <button className="flex items-center gap-2 text-cyan-400 font-bold hover:text-cyan-300 transition-colors">
                <ScanLine className="w-4 h-4" /> Scan to Login
              </button>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}

export default Login;