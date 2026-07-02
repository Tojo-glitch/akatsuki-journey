import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: 48, textAlign: 'center',
          minHeight: 300,
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <div style={{
            fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700,
            marginBottom: 8, color: 'var(--text)'
          }}>
            Something went wrong
          </div>
          <div style={{ color: 'var(--t2)', fontSize: 13, marginBottom: 20, maxWidth: 340 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </div>
          <button
            className="btn-primary"
            onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Network status banner ────────────────────────────────────────
export function NetworkBanner() {
  const [offline, setOffline] = React.useState(!navigator.onLine)

  React.useEffect(() => {
    const on  = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  if (!offline) return null
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998,
      background: '#FF5C7A', color: '#fff',
      padding: '8px 16px', textAlign: 'center',
      fontSize: 13, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      <span>⚡</span> No internet connection — changes will not be saved
    </div>
  )
}