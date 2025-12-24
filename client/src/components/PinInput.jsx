import { useEffect, useRef } from 'react';

const PinInput = ({ values, setValues, autoFocus = false }) => {
    const inputRefs = useRef([]);

    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [autoFocus]);

    const handleChange = (e, index) => {
        const val = e.target.value;
        if (isNaN(val)) return;

        const newVals = [...values];
        newVals[index] = val.slice(-1); // Ensure only 1 digit
        setValues(newVals);

        // Auto-focus next
        if (val && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !values[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    return (
        <div className="flex gap-2 justify-center">
            {values.map((digit, i) => (
                <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    type="password"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    className="w-12 h-12 bg-black/30 border border-white/20 rounded-lg text-center text-2xl font-bold focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all text-white placeholder-slate-600"
                />
            ))}
        </div>
    );
};

export default PinInput;
