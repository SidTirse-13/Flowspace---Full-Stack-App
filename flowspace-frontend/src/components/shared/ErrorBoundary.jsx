// FILE: src/components/shared/ErrorBoundary.jsx
import { Component } from 'react'

export default class ErrorBoundary extends Component {
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
          minHeight: '100vh', background: '#0a0b0e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Outfit, sans-serif', padding: '2rem',
        }}>
          <div style={{
            background: '#12141a', border: '1px solid rgba(255,107,107,0.3)',
            borderRadius: 20, padding: '2.5rem', maxWidth: 500, textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#ff9b9b', fontWeight: 800, marginBottom: '0.75rem' }}>Something went wrong</h2>
            <p style={{ color: '#7a7f95', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/dashboard' }}
              style={{
                background: 'linear-gradient(135deg, #6c63ff, #5a52d5)',
                color: '#fff', border: 'none', padding: '0.75rem 1.5rem',
                borderRadius: 10, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                fontWeight: 700, fontSize: '0.9rem',
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
