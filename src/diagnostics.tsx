import { Component, type ReactNode } from 'react';

// Technical status only. This is the sole allowlisted implementation-copy file.
// Never put learner-facing instruction, hints, or feedback here.
export function StatusBanner({ status }: { status: string }) {
  return status === 'approved' ? null : <strong className="status-banner">UNAPPROVED · {status.toUpperCase()}</strong>;
}

export function Diagnostic({ error }: { error?: string }) {
  return <main className="diagnostic" role={error ? 'alert' : 'status'}>
    <h1>{error ? 'Specification error' : 'Loading specification'}</h1>
    {error && <><p>The experience cannot run. An author or implementer must resolve this error.</p><pre>{error}</pre></>}
  </main>;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { error?: string }> {
  state: { error?: string } = {};
  static getDerivedStateFromError(error: Error) { return { error: error.message }; }
  render() { return this.state.error ? <Diagnostic error={this.state.error} /> : this.props.children; }
}
