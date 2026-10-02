import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateTimePickerProps {
  selectedDate: string; // YYYY-MM-DD
  selectedTime: string; // HH:mm
  onChange: (date: string, time: string) => void;
}

const TIME_SLOTS = [
  '08:00', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '14:00', '14:30', '15:00', '16:00', '19:00', '19:30', '20:00', '21:00'
];

export function DateTimePicker({ selectedDate, selectedTime, onChange }: DateTimePickerProps) {
  const parsedDate = new Date(selectedDate || Date.now());
  const [currentYear, setCurrentYear] = useState(parsedDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(parsedDate.getMonth());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const monthName = new Date(currentYear, currentMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else { setCurrentMonth(currentMonth - 1); }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else { setCurrentMonth(currentMonth + 1); }
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    onChange(`${currentYear}-${formattedMonth}-${formattedDay}`, selectedTime || '14:00');
  };

  const currentSelectedDay = parsedDate.getFullYear() === currentYear && parsedDate.getMonth() === currentMonth
    ? parsedDate.getDate() : null;

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)', display: 'grid', gridTemplateColumns: '1.4fr 1fr', overflow: 'hidden' }}>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button type="button" onClick={handlePrevMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><ChevronLeft size={18} /></button>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{monthName}</span>
          <button type="button" onClick={handleNextMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><ChevronRight size={18} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <span key={d}>{d}</span>)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const isSelected = currentSelectedDay === dayNum;
            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => handleSelectDay(dayNum)}
                style={{
                  height: '34px', width: '34px', borderRadius: '12px', border: 'none',
                  background: isSelected ? '#0f172a' : 'transparent',
                  color: isSelected ? '#ffffff' : '#334155',
                  fontWeight: isSelected ? 700 : 500, fontSize: '0.82rem',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto'
                }}
              >
                {dayNum}
                {isSelected && <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#38bdf8', marginTop: '1px' }} />}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ borderLeft: '1px solid #f1f5f9', padding: '16px 14px', backgroundColor: '#fafbfc' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
          {parsedDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })} Time
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
          {TIME_SLOTS.map((slot) => {
            const isSelected = selectedTime === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => onChange(selectedDate, slot)}
                style={{
                  padding: '7px 12px', borderRadius: '10px',
                  border: isSelected ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  background: isSelected ? '#0f172a' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#334155',
                  fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textAlign: 'center'
                }}
              >
                {slot}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
