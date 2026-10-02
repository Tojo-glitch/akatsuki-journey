import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface PinOtpInputProps {
  length?: number;
  onComplete: (pin: string) => Promise<boolean> | boolean;
  status: 'idle' | 'error' | 'success';
}

export function PinOtpInput({ length = 4, onComplete, status }: PinOtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (status === 'error') {
      setTimeout(() => {
        setDigits(Array(length).fill(''));
        inputsRef.current[0]?.focus();
      }, 600);
    }
  }, [status, length]);

  const handleChange = (index: number, val: string) => {
    const char = val.slice(-1);
    if (!/^\d*$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== '')) {
      onComplete(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const isError = status === 'error';
  const isSuccess = status === 'success';

  return (
    <motion.div
      animate={isError ? { x: [0, -12, 12, -12, 12, -6, 6, 0] } : isSuccess ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: 0.45 }}
      style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}
    >
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={isSuccess}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          style={{
            width: '52px',
            height: '62px',
            borderRadius: '16px',
            textAlign: 'center',
            fontSize: '1.6rem',
            fontWeight: 800,
            outline: 'none',
            border: isError
              ? '2px solid #ef4444'
              : isSuccess
              ? '2px solid #22c55e'
              : digit
              ? '2px solid #0f172a'
              : '1.5px solid #e2e8f0',
            backgroundColor: isError
              ? '#fef2f2'
              : isSuccess
              ? '#f0fdf4'
              : '#ffffff',
            color: isError ? '#ef4444' : isSuccess ? '#15803d' : '#0f172a',
            boxShadow: isSuccess
              ? '0 0 15px rgba(34, 197, 94, 0.25)'
              : '0 2px 8px rgba(0,0,0,0.02)',
            transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s'
          }}
        />
      ))}
    </motion.div>
  );
}
