import React from 'react'

export default function LockedPage({ page, onUnlock }) {
  const pageLabel = page === 'add' ? 'LOG TRANSACTION' : 'SYSTEM CONFIGURATIONS'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', textAlign: 'center', padding: '24px'
    }}>
      <div style={{
        maxWidth: 360, width: '100%', padding: '32px 24px',
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4
      }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--green)',
          textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12
        }}>
          [ RESTRICTED ACCESS ]
        </div>
        
        <h3 style={{
          fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700,
          letterSpacing: '-0.01em', marginBottom: 8, color: 'var(--text)'
        }}>
          Authentication Required
        </h3>
        
        <p style={{ color: 'var(--t2)', fontSize: 12, lineHeight: 1.6, marginBottom: 24 }}>
          The section <strong style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{pageLabel}</strong> is encrypted and requires Owner Mode credentials to view.
        </p>

        <button className="btn-primary" onClick={onUnlock} style={{
          width: '100%', padding: '10px', fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          Unlock with PIN
        </button>

        <p style={{ fontSize: 10, color: 'var(--t3)', marginTop: 14, margin: 0 }}>
          Sessions expire automatically after 15 minutes of inactivity.
        </p>
      </div>
    </div>
  )
}