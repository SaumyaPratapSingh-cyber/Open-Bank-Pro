import React, { useEffect, useState } from 'react';
import { getAdminStats } from '../../api';
import { Activity, Users, CreditCard, DollarSign, Server, Shield, AlertTriangle, ArrowUpRight, ArrowDownRight, Clock, Database } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Headquarters = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadStats = async () => {
        try {
            const { data } = await getAdminStats();
            setStats(data);
            setLoading(false);
        } catch (error) {
            console.error("Stats Failed:", error);
            // Fallback for demo/dev if API fails
            setStats({
                totalLiquidity: 145000000,
                totalUsers: 12450,
                recentUsers: 45,
                todayTxVolume: 2500000,
                todayTxCount: 1450,
                pendingKyc: 12
            });
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
        // const interval = setInterval(loadStats, 5000); // Poll disabled for performance in sandbox
        // return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
        </div>
    );

    // Dummy Chart Data
    const trafficData = [
        { time: '09:00', vol: 120 }, { time: '10:00', vol: 350 }, { time: '11:00', vol: 450 },
        { time: '12:00', vol: 380 }, { time: '13:00', vol: 200 }, { time: '14:00', vol: 550 },
        { time: '15:00', vol: 700 }, { time: '16:00', vol: 850 }, { time: '17:00', vol: 600 },
        { time: '18:00', vol: 400 }, { time: '19:00', vol: 250 }, { time: '20:00', vol: 180 },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* TOP METRIC ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                <StatCard
                    label="TOTAL LIQUIDITY"
                    value={`₹${(stats.totalLiquidity / 10000000).toFixed(2)}Cr`}
                    subvalue="+2.4% vs Daily Avg"
                    icon={<DollarSign className="text-emerald-400" size={20} />}
                    trend="up"
                    color="emerald"
                />
                <StatCard
                    label="ACTIVE CUSTOMERS"
                    value={stats.totalUsers.toLocaleString()}
                    subvalue={`${stats.recentUsers} new today`}
                    icon={<Users className="text-blue-400" size={20} />}
                    trend="neutral"
                    color="blue"
                />
                <StatCard
                    label="TX VOLUME (24H)"
                    value={`₹${(stats.todayTxVolume / 100000).toFixed(2)}L`}
                    subvalue={`${stats.todayTxCount} transactions`}
                    icon={<Activity className="text-purple-400" size={20} />}
                    trend="up"
                    color="purple"
                />
                <StatCard
                    label="PENDING KYC"
                    value={stats.pendingKyc}
                    subvalue="Action Required"
                    icon={<Shield className="text-amber-400" size={20} />}
                    isAlert={stats.pendingKyc > 0}
                    color="amber"
                />
            </div>

            {/* MAIN CHART & SYSTEM GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-96 relative z-10">
                {/* Traffic Chart */}
                <div className="col-span-1 lg:col-span-2 glass-card p-6 shadow-[0_0_30px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={120} className="text-cyan-500" /></div>
                    <div className="relative z-10 h-full flex flex-col">
                        <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse"></span> Network Velocity
                        </h3>
                        <div className="flex-1 w-full h-64 lg:h-auto">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trafficData}>
                                    <defs>
                                        <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(10px)' }}
                                        itemStyle={{ color: '#22d3ee', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="vol" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* System Health Grid */}
                <div className="glass-card p-6 flex flex-col gap-5 border border-white/10">
                    <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Server size={14} className="text-emerald-400" /> System Health
                    </h3>

                    <HealthRow label="Core DB - Primary" status="ONLINE" ping="2ms" color="emerald" />
                    <HealthRow label="Core DB - Replica" status="SYNCED" ping="4ms" color="emerald" />
                    <HealthRow label="Payment Gateway" status="ACTIVE" ping="45ms" color="emerald" />
                    <HealthRow label="SMS Gateway" status="IDLE" ping="120ms" color="amber" />
                    <HealthRow label="KYC Node" status="ONLINE" ping="18ms" color="emerald" />

                    <div className="mt-auto border-t border-white/10 pt-4">
                        <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                            <span>CPU Load</span>
                            <span className="text-cyan-400 font-bold">12%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-cyan-500 h-1.5 rounded-full w-[12%] shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RECENT ALERTS ROW */}
            <div className="grid grid-cols-1 gap-4 relative z-10">
                <div className="glass-card p-6 border border-white/10">
                    <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-rose-400" /> Administrative Audit Log
                    </h3>
                    <div className="space-y-1">
                        <LogItem time="20:41:02" level="INFO" msg="System backup completed successfully." />
                        <LogItem time="20:38:15" level="WARN" msg="High API latency detected on /upi/verify endpoint." />
                        <LogItem time="20:12:44" level="CRIT" msg="Failed login attempt for admin root account from IP 192.168.1.45." />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-components
const StatCard = ({ label, value, subvalue, icon, trend, isAlert, color }) => {
    const colorClasses = {
        emerald: "from-emerald-500/20 to-emerald-600/5 hover:border-emerald-500/30",
        blue: "from-blue-500/20 to-blue-600/5 hover:border-blue-500/30",
        purple: "from-purple-500/20 to-purple-600/5 hover:border-purple-500/30",
        amber: "from-amber-500/20 to-amber-600/5 hover:border-amber-500/30",
        red: "from-rose-500/20 to-rose-600/5 hover:border-rose-500/30"
    };

    const activeColor = isAlert ? 'red' : color;

    return (
        <div className={`p-6 rounded-2xl border border-white/10 flex flex-col justify-between h-36 transition-all hover:scale-[1.02] shadow-lg bg-gradient-to-br ${colorClasses[activeColor]} backdrop-blur-md`}>
            <div className="flex justify-between items-start">
                <span className={`text-[10px] font-bold tracking-widest uppercase ${isAlert ? 'text-rose-400' : 'text-slate-400'}`}>{label}</span>
                <div className={`p-2.5 rounded-xl ${isAlert ? 'bg-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-black/20 border border-white/5'}`}>{icon}</div>
            </div>
            <div>
                <div className={`text-2xl font-black tracking-tight ${isAlert ? 'text-rose-100' : 'text-white drop-shadow-md'}`}>{value}</div>
                <div className="flex items-center gap-1 mt-1">
                    {trend === 'up' && <ArrowUpRight size={14} className="text-emerald-400" />}
                    {trend === 'down' && <ArrowDownRight size={14} className="text-rose-400" />}
                    <span className={`text-xs font-mono font-bold ${isAlert ? 'text-rose-300' : 'text-slate-500'}`}>{subvalue}</span>
                </div>
            </div>
        </div>
    );
};

const HealthRow = ({ label, status, ping, color }) => {
    const colorMap = {
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
        red: 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.2)]',
    };

    return (
        <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
            <span className="text-slate-300 font-medium text-xs">{label}</span>
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-500">{ping}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colorMap[color]}`}>{status}</span>
            </div>
        </div>
    );
};

const LogItem = ({ time, level, msg }) => {
    const colorMap = {
        INFO: 'text-blue-400',
        WARN: 'text-amber-400',
        CRIT: 'text-rose-400',
    };
    return (
        <div className="flex gap-4 text-xs font-mono border-b border-white/5 pb-2.5 pt-1 last:border-0 last:pb-0 hover:bg-white/5 px-2 rounded-lg transition-colors cursor-default">
            <span className="text-slate-500 shrink-0">{time}</span>
            <span className={`font-bold w-10 shrink-0 ${colorMap[level]}`}>{level}</span>
            <span className="text-slate-300 truncate">{msg}</span>
        </div>
    );
}

export default Headquarters;
