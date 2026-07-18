import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * CalendarReconnect (iter 273).
 *
 * Landing page for the reconnect CTA in sendCalendarDisconnectedAlert email.
 * On mount, fetches Google Calendar OAuth URL from
 * /api/google-calendar/auth-url and redirects the browser to Google's
 * consent screen.
 *
 * Zero-friction: user clicks email button → lands here for a fraction of a
 * second → automatically redirected to Google. No additional clicks.
 *
 * Uses useRef guard to prevent StrictMode double-fire (same pattern as
 * iter 269's VerifyEmailChange).
 *
 * Auth: /api/google-calendar/auth-url requires authMiddleware which reads
 * the JWT from an HTTP-only cookie. credentials: 'include' sends the
 * cookie automatically. If the user is not logged in, the endpoint returns
 * 401 and we show the error state with a link back to Scheduling settings.
 */
export default function CalendarReconnect() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const resp = await fetch(`${API_URL}/api/google-calendar/auth-url`, {
          credentials: 'include',
        });

        if (cancelled) return;

        if (resp.status === 401) {
          setError('You need to sign in first before reconnecting your calendar.');
          return;
        }

        if (!resp.ok) {
          setError(`Could not start reconnect flow (error ${resp.status}).`);
          return;
        }

        const data = await resp.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        } else {
          setError('Server did not return an authorization URL.');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unexpected error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-surface-elevated rounded-lg shadow-md p-6 sm:p-8">
        {error ? (
          <div className="text-center space-y-4" data-testid="calendar-reconnect-error">
            <h1 className="text-2xl font-bold text-text-primary">Reconnect failed</h1>
            <p className="text-sm text-text-secondary">{error}</p>
            <p className="text-sm text-text-secondary">
              You can also reconnect from Settings &rarr; Scheduling.
            </p>
            <button
              onClick={() => navigate('/settings/scheduling', { replace: true })}
              className="w-full px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90"
              data-testid="calendar-reconnect-settings-button"
            >
              Go to Scheduling settings
            </button>
          </div>
        ) : (
          <div className="text-center space-y-3" data-testid="calendar-reconnect-loading">
            <h1 className="text-2xl font-bold text-text-primary">Reconnecting&hellip;</h1>
            <p className="text-sm text-text-secondary">
              Redirecting you to Google to reconnect your calendar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
