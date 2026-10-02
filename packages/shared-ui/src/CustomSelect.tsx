import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  options: (string | Option)[];
  onChange: (value: string) => void;
}

export function CustomSelect({ label, value, options, onChange }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: Option[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((o) => o.value === value) || normalizedOptions[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', padding: '11px 16px', borderRadius: '16px',
          border: '1px solid #e2e8f0', background: '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer'
        }}
      >
        <span>{selectedOption?.label || value}</span>
        <ChevronDown size={16} color="#64748b" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          backgroundColor: '#ffffff', borderRadius: '18px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid #f1f5f9', padding: '6px', zIndex: 9999,
          maxHeight: '200px', overflowY: 'auto'
        }}>
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '12px',
                  border: 'none', background: isSelected ? '#f1f5f9' : 'transparent',
                  color: isSelected ? '#0f172a' : '#475569',
                  fontWeight: isSelected ? 700 : 500, fontSize: '0.85rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} color="#0ea5e9" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
