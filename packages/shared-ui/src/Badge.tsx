export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'neutral' | 'session';
  size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'neutral', size = 'sm' }: BadgeProps) {
  const getStyle = () => {
    switch (variant) {
      case 'primary':
        return { background: '#e0f2fe', color: '#0369a1' };
      case 'success':
        return { background: '#dcfce7', color: '#15803d' };
      case 'warning':
        return { background: '#fef3c7', color: '#b45309' };
      case 'session':
        return { background: '#f3e8ff', color: '#7e22ce' };
      default:
        return { background: '#f1f5f9', color: '#475569' };
    }
  };

  return (
    <span
      style={{
        ...getStyle(),
        fontSize: size === 'sm' ? '0.72rem' : '0.82rem',
        fontWeight: 600,
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        borderRadius: '9999px',
        display: 'inline-flex',
        alignItems: 'center',
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}
    >
      {label}
    </span>
  );
}
