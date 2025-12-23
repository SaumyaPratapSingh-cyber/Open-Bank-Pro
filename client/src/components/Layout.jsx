import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Send,
    CreditCard,
    PieChart,
    Wallet,
    FileText,
    User,
    Headphones,
    Bell,
    Search,
    LogOut,
    Menu,
    X,
    Smartphone
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, to, active }) => {
    return (
        <Link to={to} className="relative group block mb-2">
            <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${active ? 'bg-white/5 shadow-lg shadow-cyan-500/10' : 'hover:bg-white/5'}`}>
                {/* Active Indicator */}
                {active && (
                    <motion.div
                        layoutId="activeTab"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 rounded-full shadow-[0_0_10px_2px_rgba(34,211,238,0.5)]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    />
                )}

                {/* Icon with Gradient */}
                <div className={`p-2 rounded-lg ${active ? 'bg-gradient-to-br from-cyan-400/20 to-blue-500/20' : 'bg-white/5 group-hover:bg-white/10'} transition-colors`}>
                    <Icon className={`w-5 h-5 ${active ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white'}`} style={active ? { filter: 'drop-shadow(0 0 5px rgba(34,211,238,0.5))' } : {}} />
                </div>

                {/* Label */}
                <span className={`font-medium ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} transition-colors`}>
                    {label}
                </span>
            </div>
        </Link>
    );
};

const Layout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState({ name: 'User', role: 'Member' });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user data");
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const getInitials = (name) => {
        return name
            ? name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
            : 'U';
    };

    // Navigation Links configuration
    const navLinks = [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
        { icon: Send, label: 'Transfer', to: '/transfer' },
        { icon: Smartphone, label: 'UPI Payment', to: '/upi' },
        { icon: CreditCard, label: 'Cards', to: '/cards' },
        { icon: PieChart, label: 'Investments', to: '/investments' },
        { icon: Wallet, label: 'Loans', to: '/loans' },
        { icon: FileText, label: 'Statement', to: '/statement' },
        { icon: User, label: 'Profile', to: '/profile' },
        { icon: Headphones, label: 'Support', to: '/support' },
    ];

    return (
        <div className="flex min-h-screen bg-slate-950 selection:bg-cyan-500/30 selection:text-cyan-100 font-sans overflow-hidden">

            {/* Glass Sidebar */}
            <motion.aside
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-950/50 backdrop-blur-2xl border-r border-white/5 flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Logo Area */}
                <div className="p-8 pb-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">OpenBank <span className="text-cyan-400 font-light">Pro</span></h1>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online Banking
                    </p>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    {navLinks.map((link) => (
                        <SidebarItem
                            key={link.to}
                            {...link}
                            active={location.pathname === link.to}
                        />
                    ))}
                </nav>

                {/* User Profile / Logout */}
                <div className="p-4 m-4 mt-0 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 p-[1px]">
                            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                <span className="text-sm font-bold text-white">{getInitials(user.name || user.ownerName)}</span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{user.name || user.ownerName}</p>
                            <p className="text-[10px] text-slate-400 truncate uppercase tracking-wider">{user.role || 'Member'}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">

                {/* Top Navbar */}
                <header className="sticky top-0 z-30 h-16 px-8 flex items-center justify-between bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>

                    <div className="hidden lg:flex items-center gap-4 flex-1 max-w-xl">
                        <div className="relative w-full group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search transactions, bills, or help..."
                                className="w-full bg-black/40 border border-white/10 focus:border-cyan-400/50 rounded-full py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none transition-all placeholder-slate-600"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse"></span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative custom-scrollbar bg-slate-950 text-white">
                    {/* Global background effects could go here if not in index.css */}
                    <AnimatePresence mode="wait">
                        <Outlet />
                    </AnimatePresence>
                </main>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
};

export default Layout;
