import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Shield, Users, Activity, FileText, LayoutGrid, Clock, Database, ChevronRight, Building2, CreditCard, MessageSquare, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = () => {
        if (confirm("Terminate Admin Session?")) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    const isActive = (path) => location.pathname.includes(path);

    return (
        <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden">

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl transition-transform duration-300 transform lg:translate-x-0 lg:static lg:shadow-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Brand Header */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm relative">
                    <Shield size={24} className="text-blue-500 mr-3" />
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-white leading-none">OPENBANK <span className="text-blue-500">PRO</span></h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-1">Core Banking System</p>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden absolute right-4 text-slate-500 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 w-full px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    <div className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Modules</div>

                    <NavLink to="/admin/headquarters" icon={<Building2 size={18} />} label="Headquarters" active={isActive('headquarters')} badge="Pro" />
                    <NavLink to="/admin/kyc-queue" icon={<FileText size={18} />} label="KYC Queue" active={isActive('kyc-queue')} badge="Live" />
                    <NavLink to="/admin/tickets" icon={<MessageSquare size={18} />} label="Support Tickets" active={isActive('tickets')} badge="Prior" />
                    <NavLink to="/admin/card-requests" icon={<CreditCard size={18} />} label="Card Requests" active={isActive('card-requests')} badge="New" />
                    <NavLink to="/admin/directory" icon={<Users size={18} />} label="Customer Directory" active={isActive('directory')} />
                    <NavLink to="/admin/monitor" icon={<Activity size={18} />} label="Global Transactions" active={isActive('monitor')} />

                    <div className="px-3 mt-8 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Tools</div>
                    <NavLink to="/admin/customer-360" icon={<LayoutGrid size={18} />} label="Customer 360" active={isActive('customer-360')} />
                </nav>

                {/* System Stats Footer */}
                <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs font-mono text-slate-500 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2"><Database size={10} className="text-green-500" /> DB Connection</span>
                        <span className="text-green-500">ONLINE</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2"><Activity size={10} className="text-blue-500" /> Gateway Latency</span>
                        <span className="text-slate-300">24ms</span>
                    </div>
                </div>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-slate-800 bg-slate-900">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-sm">SP</div>
                            <div>
                                <div className="text-sm font-bold text-white">Saumya Pratap</div>
                                <div className="text-xs text-blue-400">Super Admin</div>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors p-2">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative bg-slate-950 min-w-0">
                {/* Top Bar */}
                <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-4 lg:px-8 z-40">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden text-slate-400 hover:text-white"
                        >
                            <Menu size={24} />
                        </button>

                        {/* Breadcrumbs / Page Title */}
                        <div className="flex items-center text-sm font-medium text-slate-400">
                            <span className="hidden sm:inline hover:text-white cursor-pointer transition-colors">Admin Portal</span>
                            <ChevronRight size={14} className="mx-2 hidden sm:block" />
                            <span className="text-white">
                                {location.pathname.split('/').pop().replace('-', ' ').toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* Global Clock */}
                    <div className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                        <Clock size={14} className="text-blue-400" />
                        <span className="text-xs sm:text-sm font-mono text-blue-100 font-medium">
                            {currentTime.toLocaleTimeString('en-US', { hour12: false })} <span className="hidden sm:inline text-slate-500 text-xs text-[10px]">UTC+5:30</span>
                        </span>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-auto p-4 lg:p-8 relative custom-scrollbar">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

const NavLink = ({ to, icon, label, active, badge }) => {
    return (
        <Link
            to={to}
            className={`flex items-center justify-between px-4 py-3 mx-2 rounded-md transition-all duration-200 group ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
            <div className="flex items-center gap-3">
                {icon}
                <span className="font-medium text-sm">{label}</span>
            </div>
            {badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                    {badge}
                </span>
            )}
        </Link>
    );
};

export default AdminLayout;
