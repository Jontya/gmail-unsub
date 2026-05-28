import { useState, useCallback, useEffect } from 'react';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
].join(' ');

const SESSION_KEY = 'gmail_unsub_session';

function saveSession(accessToken, expiry) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ accessToken, expiry }));
  } catch {}
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { accessToken, expiry } = JSON.parse(raw);
    if (Date.now() >= expiry - 60_000) return null; // treat as expired if <60s left
    return { accessToken, expiry };
  } catch {
    return null;
  }
}

function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}

export function useGoogleAuth() {
  const [token, setToken]             = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [gisReady, setGisReady]       = useState(false);

  // Poll until the async GIS script has loaded
  useEffect(() => {
    if (window.google?.accounts?.oauth2) { setGisReady(true); return; }
    let ticks = 0;
    const id = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        setGisReady(true);
        clearInterval(id);
      } else if (++ticks > 30) {
        clearInterval(id);
      }
    }, 200);
    return () => clearInterval(id);
  }, []);

  // Restore session from sessionStorage on load — no popup, no GIS call needed
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setToken(session.accessToken);
      setTokenExpiry(session.expiry);
    }
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
        const expiry = Date.now() + resp.expires_in * 1000;
        setToken(resp.access_token);
        setTokenExpiry(expiry);
        saveSession(resp.access_token, expiry);
      },
    });

    client.requestAccessToken();
  }, [gisReady]);

  const disconnect = useCallback(() => {
    if (token) window.google?.accounts?.oauth2?.revoke(token);
    setToken(null);
    setTokenExpiry(null);
    clearSession();
  }, [token]);

  return { token, tokenExpiry, loading, error, gisReady, connect, disconnect };
}
