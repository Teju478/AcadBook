import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';

export function LoadingState({ label = 'Loading live data' }) {
  return <span className="visually-hidden" role="status" aria-live="polite">{label}</span>;
}

export function EmptyState({ title = 'Nothing here yet', description = 'New records will appear here once they are available.' }) {
  return (
    <div className="state-card">
      <Inbox size={22} />
      <div><strong>{title}</strong><span>{description}</span></div>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state-card state-error" role="alert">
      <AlertCircle size={22} />
      <div><strong>We could not load this view</strong><span>{error?.message || 'Please try again.'}</span></div>
      {onRetry && <button className="button button-quiet" onClick={onRetry}><RefreshCw size={16} /> Retry</button>}
    </div>
  );
}
