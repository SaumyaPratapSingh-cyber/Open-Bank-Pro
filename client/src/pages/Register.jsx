import { useState } from 'react';
import { registerUser } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Lock, Upload, Calendar, ArrowRight, ShieldCheck, CheckCircle, Smartphone } from 'lucide-react';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ownerName: '', fatherName: '', email: '', mobile: '',
    address: '', password: '', dob: '', gender: 'Male',
    profileImage: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputClasses = "w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500/50 focus:bg-white/10 outline-none text-white placeholder-slate-600 transition-all font-medium";
  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await registerUser(formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black overflow-hidden relative">

      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 pointer-events-none mix-blend-overlay"></div>

      {/* LEFT SIDE: Marketing Visuals */}
      <div className="hidden lg:flex w-5/12 relative flex-col justify-between p-16 border-r border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div>
          <div className="inline-flex items-center gap-3 mb-12 px-4 py-2 rounded-full bg-white/5 border border-white/5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold text-white tracking-wider">SECURE REGISTRATION PROTOCOL</span>
          </div>

          <h1 className="text-5xl font-black text-white leading-[1.1] mb-6">
            Join the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Elite Financial</span> <br />
            Network.
          </h1>
          <p className="text-lg text-slate-400 max-w-sm leading-relaxed">
            Create your digital vault today. Experience banking without borders, limits, or delays.
          </p>
        </div>

        <div className="space-y-8">
          <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Mobile First</h3>
              <p className="text-slate-500 text-sm">Access your wealth from anywhere in the world.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Instant Approval</h3>
              <p className="text-slate-500 text-sm">Pass our automated KYC and get started in minutes.</p>
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-600">
          SESSION_ID: {Math.random().toString(36).substring(7).toUpperCase()}
        </div>
      </div>

      {/* RIGHT SIDE: Scrollable Glass Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-4 lg:p-0 overflow-y-auto h-screen relative z-10 custom-scrollbar scroll-smooth">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-2xl py-12 lg:py-20 px-8"
        >
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Initialize Account</h2>
            <p className="text-slate-400">Complete the form below to provision your new account.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelClasses}>Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 w-5 h-5 transition-colors" />
                <input name="ownerName" type="text" className={inputClasses} onChange={handleChange} required placeholder="John Doe" />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>Father's Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 w-5 h-5 transition-colors" />
                <input name="fatherName" type="text" className={inputClasses} onChange={handleChange} required placeholder="Robert Doe" />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>Date of Birth</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 w-5 h-5 transition-colors" />
                <input name="dob" type="date" className={`${inputClasses} [color-scheme:dark]`} onChange={handleChange} required />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>Gender</label>
              <div className="relative group">
                <select name="gender" className={`${inputClasses} appearance-none cursor-pointer`} onChange={handleChange}>
                  <option className="bg-slate-900">Male</option>
                  <option className="bg-slate-900">Female</option>
                  <option className="bg-slate-900">Other</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</div>
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>Mobile Number</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 w-5 h-5 transition-colors" />
                <input name="mobile" type="tel" className={inputClasses} onChange={handleChange} required placeholder="+1 234 567 890" />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className={labelClasses}>High-Priority Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 w-5 h-5 transition-colors" />
                <input name="email" type="email" className={inputClasses} onChange={handleChange} required placeholder="john@example.com" />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className={labelClasses}>Permanent Address</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-4 text-slate-500 group-focus-within:text-emerald-400 w-5 h-5 transition-colors" />
                <textarea name="address" className={`${inputClasses} h-28 pt-4 resize-none`} onChange={handleChange} required placeholder="123 Banking Street, Finance City" />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className={labelClasses}>Create Master Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 w-5 h-5 transition-colors" />
                <input name="password" type="password" className={inputClasses} onChange={handleChange} required placeholder="••••••••" />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className={labelClasses}>Identity Document (Photo)</label>
              <div className="relative border border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300 group">
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImage} />
                {formData.profileImage ? (
                  <div className="flex items-center gap-6 justify-center">
                    <img src={formData.profileImage} alt="Profile Preview" className="h-20 w-20 rounded-full object-cover border-4 border-emerald-500 shadow-lg shadow-emerald-500/20" />
                    <div className="text-left">
                      <span className="block text-emerald-400 text-sm font-bold uppercase tracking-wide">Image Selected</span>
                      <span className="text-slate-500 text-xs">Click to replace</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-black transition-colors text-slate-400">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-slate-300 font-bold text-sm">Upload Profile Picture</span>
                    <span className="text-slate-600 text-xs mt-1">JPG or PNG (Max 5MB)</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="md:col-span-2 p-4 bg-rose-500/10 text-rose-400 rounded-xl text-center text-sm font-bold border border-rose-500/20"
              >
                {error}
              </motion.div>
            )}

            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white py-5 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>Confirm & Create Account <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-slate-500 mt-8 pt-6 border-t border-white/5 text-sm">
            Already have an identity?{' '}
            <Link to="/login" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
              Access Vault
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Register;