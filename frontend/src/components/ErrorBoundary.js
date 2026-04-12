import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.group('🛑 [Schuber] Rendering Crash Detected');
    console.error('Error:', error);
    console.error('Info:', errorInfo);
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFFBF0',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🤕</div>
          <h1 style={{ color: '#1C1917', fontWeight: 800, margin: '0 0 1rem' }}>Something went wrong</h1>
          <p style={{ color: '#78716C', maxWidth: 400, margin: '0 0 2rem', lineHeight: 1.6 }}>
            The application encountered a rendering error. This usually happens when data from the backend is unexpected.
          </p>
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 12,
            padding: '1rem',
            color: '#DC2626',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            maxWidth: '90%',
            overflow: 'auto',
            marginBottom: '2rem'
          }}>
            {this.state.error?.toString()}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#F59E0B',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: 10,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
            }}
          >
            🔄 Reload Schuber
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
