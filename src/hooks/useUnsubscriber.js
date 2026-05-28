const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me';

export async function fetchProfileEmail(token) {
  const r = await fetch(`${GMAIL}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await r.json();
  return data.emailAddress;
}

/**
 * Encode a plain-text email as base64url for the Gmail API.
 */
function encodeEmail(to, from, subject, body) {
  const raw = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    '',
    body,
  ].join('\r\n');

  // TextEncoder handles non-ASCII safely
  const bytes = new TextEncoder().encode(raw);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function unsubscribeOne(googleToken, item, profileEmail) {
  const { unsubscribeMethod, unsubscribeValue, senderName, oneClick } = item;

  if (unsubscribeMethod === 'email') {
    const raw = encodeEmail(
      unsubscribeValue,
      profileEmail,
      'Unsubscribe',
      'Please remove me from your mailing list.\r\n\r\nThank you.'
    );

    const r = await fetch(`${GMAIL}/messages/send`, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${googleToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Failed to send unsubscribe email.');
    }

    return { success: true, message: `Unsubscribe email sent to ${unsubscribeValue}` };
  }

  if (unsubscribeMethod === 'url') {
    if (oneClick) {
      const r = await fetch(unsubscribeValue, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'List-Unsubscribe=One-Click',
      });

      if (!r.ok) {
        throw new Error(`One-click unsubscribe failed (HTTP ${r.status})`);
      }

      return { success: true, message: `One-click unsubscribe sent to ${senderName}` };
    }

    // Fallback: open tab. Delay before opening so the browser considers each
    // call user-gesture-adjacent and does not block the popup.
    await new Promise((resolve) => setTimeout(resolve, 500));
    window.open(unsubscribeValue, '_blank', 'noopener,noreferrer');
    return {
      success: true,
      message: `Unsubscribe page opened for ${senderName} — confirm on the page if required`,
    };
  }

  return { success: false, message: 'Unknown unsubscribe method.' };
}
