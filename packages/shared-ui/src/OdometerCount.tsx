import { useEffect, useState } from 'react';

export interface OdometerCountProps {
  value: number;
  duration?: number;
  suffix?: string;
}

export function OdometerCount({
  value,
  duration = 700,
  suffix = ''
}: OdometerCountProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const diff = value - startValue;

    if (diff === 0) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + diff * easeOut));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, letterSpacing: '-0.03em' }}>
      {displayValue}{suffix}
    </span>
  );
}
