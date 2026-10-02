import { Lock, Sparkles } from 'lucide-react';
import { JourneyLevel } from '@kecha/shared-types';

interface LevelPlaceholderProps {
  level: JourneyLevel;
}

export function LevelPlaceholder({ level }: LevelPlaceholderProps) {
  const isLevel2 = level === 2;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '28px',
      padding: '70px 24px',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '20px',
        background: '#f1f5f9',
        color: '#64748b',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <Lock size={30} />
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#b45309', padding: '4px 14px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>
        <Sparkles size={14} /> LEVEL {level} QUEST ROADMAP
      </div>

      <h3 style={{ margin: '0 0 10px', fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
        {isLevel2 ? 'Level 2: Advanced Order Flow & Liquidity Engineering' : 'Level 3: Execution Mastery & Edge Architecture'}
      </h3>

      <p style={{ margin: '0 auto', maxWidth: '520px', fontSize: '0.92rem', color: '#64748b', lineHeight: 1.6 }}>
        {isLevel2
          ? 'Prepare to record specialized mitigation blocks, inducement patterns, and session momentum continuations. Level structure parts will be unlocked soon.'
          : 'The pinnacle of the Ninja journey. Statistical risk profiling and edge quantification database.'}
      </p>
    </div>
  );
}
