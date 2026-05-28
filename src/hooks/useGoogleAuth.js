import { useState, useCallback, useEffect } from 'react';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
].join(' ');

/**
 * Manages Google OAuth via the Google Identity Services library.
 * Provides an access token suitable for passing to Gmail MCP.
 */
export function useGoogleAuth() {
  const [token, setToken]           = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [gisReady, setGisReady]     = useState(false);

  // Poll until the async GIS script has loaded
  useEffect(() => {
    if (window.google?.accounts?.oauth2) { setGisReady(true); return; }
    let ticks = 0;
    const id = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        setGisReady(true);
        clearInterval(id);
      } else if (++ticks > 30) {
        clearInterval(id); // Give up after ~6 s
      }
    }, 200);
    return () => clearInterval(id);
  }, []);

  const connect = useCallback((clientId) => {
    if (!clientId?.trim()) {
      setError('Enter your Google Client ID first.');
      return;
    }
    if (!gisReady) {
      setError('Google Identity Services not loaded yet — refresh and try again.');
      return;
    }
    setLoading(true);
    setError('');

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: GMAIL_SCOPES,
      callback: (resp) => {
        setLoading(false);
        if (resp.error) {
          setError(resp.error_description || resp.error);
          return;
        }
        setToken(resp.access_token);
        setTokenExpiry(Date.now() + resp.expires_in * 1000);
      },
    });

    client.requestAccessToken();
  }, [gisReady]);

  const disconnect = useCallback(() => {
    setToken(null);
    setTokenExpiry(null);
  }, []);

  return { token, tokenExpiry, loading, error, gisReady, connect, disconnect };
}
