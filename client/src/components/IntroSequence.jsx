import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const IntroSequence = ({ onComplete }) => {
    const [phase, setPhase] = useState('enter'); // enter, hold, exit

    useEffect(() => {
        const t1 = setTimeout(() => setPhase('exit'), 2000); // Start exit sequence
        const t2 = setTimeout(() => onComplete(), 3200);     // Unmount

        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [onComplete]);

    // Custom Easing for "Professional" feel (Exponential Out)
    const transition = { duration: 1.2, ease: [0.22, 1, 0.36, 1] };
    const shutterTransition = { duration: 0.8, ease: [0.76, 0, 0.24, 1] };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden pointer-events-none"
            >
                {/* 
                   THE SHUTTERS 
                   We use multiple vertical divs to create a "blind" reveal effect.
                */}
                <div className="absolute inset-0 flex">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                            key={i}
                            className="h-full bg-[#050505] relative z-20 border-r border-[#111]"
                            style={{ width: '20%' }}
                            initial={{ y: 0 }}
                            animate={phase === 'exit' ? { y: '-100%' } : { y: 0 }}
                            transition={{ ...shutterTransition, delay: i * 0.05 }}
                        />
                    ))}
                </div>

                {/* LOGO CONTAINER (Z-Index higher than shutters to sit on top, but needs to move with them? 
                   Actually, let's have the text sit ON the shutters, so it slides up with them, or fades out?
                   "Professional" usually implies the overlay lifts off.
                   Let's put the text inside a container that rides up, OR fade it out before shutters lift.
                */}

                <div className="absolute inset-0 z-30 flex items-center justify-center">
                    <AnimatePresence>
                        {phase !== 'exit' && (
                            <motion.div
                                className="relative flex flex-col items-center"
                                exit={{ opacity: 0, y: -50, transition: { duration: 0.5 } }}
                            >
                                {/* SPLIT TEXT REVEAL: "OPEN" slides Right, "BANK" slides Left */}
                                <div className="flex items-center overflow-hidden relative">
                                    <motion.div
                                        initial={{ y: "100%" }}
                                        animate={{ y: 0 }}
                                        transition={{ ...transition, delay: 0.1 }}
                                        className="text-6xl md:text-8xl font-black text-white tracking-tighter"
                                    >
                                        OPEN
                                    </motion.div>
                                    <motion.div
                                        initial={{ y: "-100%" }}
                                        animate={{ y: 0 }}
                                        transition={{ ...transition, delay: 0.1 }}
                                        className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 tracking-tighter ml-2"
                                    >
                                        BANK
                                    </motion.div>

                                    {/* Small "PRO" Badge */}
                                    <motion.sup
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ ...transition, delay: 0.8 }}
                                        className="text-xs md:text-lg font-bold text-slate-500 ml-2 mt-4"
                                    >
                                        PRO
                                    </motion.sup>
                                </div>

                                {/* Minimalist Line */}
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: 100 }}
                                    transition={{ ...transition, delay: 0.5 }}
                                    className="h-1 bg-white mt-6"
                                />

                                {/* Subtitle */}
                                <div className="overflow-hidden mt-4 h-6">
                                    <motion.p
                                        initial={{ y: "100%" }}
                                        animate={{ y: 0 }}
                                        transition={{ ...transition, delay: 0.6 }}
                                        className="text-slate-500 font-mono text-xs tracking-[0.4em] uppercase"
                                    >
                                        Establishing Secure Link
                                    </motion.p>
                                </div>

                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </motion.div>
        </AnimatePresence>
    );
};

export default IntroSequence;
