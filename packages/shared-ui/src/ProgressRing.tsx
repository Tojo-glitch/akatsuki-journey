export interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  remainingText?: string;
  currentValue?: number;
  targetValue?: number;
  colorClass?: string;
}

export function ProgressRing({
  progress,
  size = 130,
  strokeWidth = 9,
  remainingText,
  currentValue,
  targetValue,
  colorClass = '#0ea5e9'
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorClass}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        {currentValue !== undefined && (
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {currentValue}
            {targetValue !== undefined && <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>/{targetValue}</span>}
          </span>
        )}
        {remainingText && (
          <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
            {remainingText}
          </span>
        )}
      </div>
    </div>
  );
}
