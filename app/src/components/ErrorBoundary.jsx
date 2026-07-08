import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Render Engine Exception:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <div style={{
            maxWidth: 440, margin: '0 auto', padding: '24px',
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4
          }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--red)',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8
            }}>
              [ System Exception ]
            </div>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              Interface Render Error
            </h3>
            <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 16 }}>
              A failure occurred while plotting this statistical view. This might be due to incomplete database migrations or network timeout.
            </p>
            <button className="btn-ghost"
              onClick={() => window.location.reload()}
              style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function NetworkBanner() {
  const [offline, setOffline] = React.useState(!navigator.onLine)

  React.useEffect(() => {
    const onOn  = () => setOffline(false)
    const onOff = () => setOffline(true)
    window.addEventListener('online',  onOn)
    window.addEventListener('offline', onOff)
    return () => {
      window.removeEventListener('online',  onOn)
      window.removeEventListener('offline', onOff)
    }
  }, [])

  if (!offline) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9998,
      background: 'var(--red)', color: '#fff', padding: '6px 16px',
      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center'
    }}>
      Offline Mode — Local Cache Active
    </div>
  )
}