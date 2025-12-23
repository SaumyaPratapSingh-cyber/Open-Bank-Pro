import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Wifi } from 'lucide-react';

const CreditCard3D = ({ card, onFreezeToggle, onRegenerateCVV, loading }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    // Default values if card is loading/null
    const cardNumber = card?.cardNumber ? card.cardNumber.match(/.{1,4}/g).join(' ') : '•••• •••• •••• ••••';
    const holder = card?.ownerName || 'LOADING...';
    const expiry = card?.expiryDate || 'MM/YY';
    const cvv = card?.cvv || '•••';

    return (
        <div className="perspective-1000 relative w-full h-56 group z-10">
            <motion.div
                className="w-full h-full relative preserve-3d transition-all duration-700 cursor-pointer"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 50 }}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                {/* FRONT */}
                <div
                    className="absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col justify-between backface-hidden shadow-2xl overflow-hidden border border-white/10 bg-[#0f172a]"
                >
                    {/* Dark Glass Background & Neon Gradients */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0f172a] to-black z-0"></div>

                    {/* Noise Texture */}
                    <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay z-0"></div>

                    {/* Cyber Neon Accents */}
                    <div className="absolute -top-[100px] -right-[100px] w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none z-0"></div>
                    <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-0"></div>

                    {/* Glowing Border specific to Cyber theme */}
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 z-0"></div>

                    {/* Frozen Overlay */}
                    {card?.isFrozen && (
                        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-[2px] flex items-center justify-center rounded-2xl border-2 border-rose-500/30">
                            <div className="bg-rose-500/20 px-6 py-3 rounded-xl flex items-center gap-2 text-rose-500 font-bold border border-rose-500/50 shadow-xl backdrop-blur-md">
                                <Lock className="w-5 h-5" /> CARD FROZEN
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <div className="text-white/90 font-bold tracking-widest text-lg italic flex items-center gap-1">
                                OpenBank
                                <span className="text-[10px] not-italic bg-gradient-to-r from-cyan-400 to-emerald-400 text-black px-1.5 py-0.5 rounded font-bold shadow-[0_0_10px_rgba(34,211,238,0.4)]">PRO</span>
                            </div>
                        </div>
                        <Wifi className="text-white/50 rotate-90 w-6 h-6" />
                    </div>

                    {/* Chip & Contactless */}
                    <div className="flex items-center gap-4 z-10 relative">
                        <div className="w-12 h-9 bg-gradient-to-b from-amber-200 to-amber-600 rounded-md relative overflow-hidden shadow-lg border border-amber-400/30">
                            <div className="absolute inset-0 border border-black/10 rounded-md"></div>
                            <div className="w-full h-[1px] bg-black/20 absolute top-1/2"></div>
                            <div className="h-full w-[1px] bg-black/20 absolute left-1/3"></div>
                            <div className="h-full w-[1px] bg-black/20 absolute right-1/3"></div>
                        </div>
                    </div>

                    {/* Number & Details */}
                    <div className="text-white z-10 space-y-2 relative">
                        <p className="font-mono text-xl md:text-2xl tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-white/90">{cardNumber}</p>
                        <div className="flex justify-between items-end pt-2">
                            <div>
                                <p className="text-[9px] text-cyan-400/80 uppercase tracking-widest mb-0.5 font-bold">Card Holder</p>
                                <p className="font-bold tracking-wider text-sm text-white/90 uppercase">{holder}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] text-cyan-400/80 uppercase tracking-widest mb-0.5 font-bold">Expires</p>
                                <p className="font-bold tracking-wider text-sm text-white/90">{expiry}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BACK */}
                <div
                    className="absolute inset-0 w-full h-full bg-[#0f172a] rounded-2xl flex flex-col overflow-hidden backface-hidden rotate-y-180 shadow-2xl border border-white/10"
                    style={{ transform: "rotateY(180deg)" }}
                >
                    {/* Magnetic Strip */}
                    <div className="w-full h-12 bg-black mt-6 relative border-t border-b border-white/5"></div>

                    {/* CVV Area */}
                    <div className="px-6 mt-6 flex gap-4 items-center">
                        <div className="flex-1 h-10 bg-white/5 rounded flex items-center justify-end px-3 relative overflow-hidden border border-white/10">
                            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/diag-diamonds-light.png')]"></div>
                            <span className="font-mono font-bold text-white tracking-widest relative z-10">{cvv}</span>
                        </div>
                        <div className="text-white/50 text-[10px] w-12 leading-tight">
                            Security Code
                        </div>
                    </div>

                    {/* Hologram/Logo */}
                    <div className="mt-auto p-6 flex justify-between items-end">
                        <div className="text-white/30 text-[10px] max-w-[150px]">
                            ISSUED BY OPENBANK.<br />CYBER GLASS EDITION.
                        </div>
                        <div className="text-white font-bold italic text-3xl opacity-50 tracking-tighter">VISA</div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CreditCard3D;
