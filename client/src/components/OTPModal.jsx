import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Timer } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

function OTPModal({ isOpen, onClose, onVerify, amount }) {
    const [otp, setOtp] = useState(['', '', '', '']);
    const [generatedOtp, setGeneratedOtp] = useState(null);
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        if (isOpen) {
            // 1. Generate random 4-digit code
            const code = Math.floor(1000 + Math.random() * 9000).toString();
            setGeneratedOtp(code);
            setOtp(['', '', '', '']);
            setTimeLeft(30);

            // 2. Simulate SMS after 2 seconds
            setTimeout(() => {
                toast.custom((t) => (
                    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                        <div className="flex-1 w-0 p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 pt-0.5">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <ShieldCheck className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium text-gray-900">OpenBank Security</p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Your OTP for ₹{amount} transfer is <span className="font-bold text-blue-600 text-lg">{code}</span>.
                                        Do not share this with anyone.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ), { duration: 5000 });
            }, 1000);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onClose(); // Auto close on timeout
                    toast.error("OTP Expired! Transaction Cancelled.");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isOpen, timeLeft]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return;
        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
        if (element.nextSibling) element.nextSibling.focus();
    };

    const handleVerify = () => {
        const enteredOtp = otp.join('');
        if (enteredOtp === generatedOtp) {
            toast.success("Identity Verified!");
            onVerify();
        } else {
            toast.error("Incorrect OTP! Security Alert triggered.");
            setOtp(['', '', '', '']);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-[#1D3557] p-6 text-white text-center relative">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-[#E63946]" />
                    <h2 className="text-xl font-bold">Security Verification</h2>
                    <p className="text-sm text-gray-300">Protecting your hard-earned money.</p>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8">
                    <div className="flex items-center justify-center gap-2 mb-8 text-orange-600 bg-orange-50 py-2 rounded-lg">
                        <Timer className="w-5 h-5" />
                        <span className="font-mono font-bold">{timeLeft}s remaining</span>
                    </div>

                    <p className="text-center text-gray-600 mb-6 font-medium">
                        Enter the 4-digit code sent to your secure mobile.
                    </p>

                    <div className="flex justify-center gap-4 mb-8">
                        {otp.map((data, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength="1"
                                className="w-14 h-14 border-2 border-gray-200 rounded-xl text-center text-2xl font-bold text-[#1D3557] focus:border-[#E63946] focus:ring-4 focus:ring-[#E63946]/10 outline-none transition-all"
                                value={data}
                                onChange={(e) => handleChange(e.target, index)}
                                onFocus={(e) => e.target.select()}
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleVerify}
                        className="w-full py-3 bg-[#1D3557] text-white rounded-xl font-bold text-lg hover:bg-[#152744] transition-colors shadow-lg"
                    >
                        Verify & Pay ₹{Number(amount).toLocaleString()}
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-400">
                            <span className="font-bold text-[#E63946]">Did You Know?</span> Never share your OTP. Banks never ask for it.
                        </p>
                    </div>
                </div>
            </div>
            <Toaster position="top-center" />
        </div>
    );
}

export default OTPModal;
