# Gmail Unsubscriber

A browser app that scans your Gmail inbox for mailing list emails and lets you unsubscribe from them in bulk.

## What it does

1. Connects to your Gmail account via Google OAuth.
2. Scans a configurable number of recent emails across selected inbox categories.
3. Detects emails with a `List-Unsubscribe` header and groups them by sender domain.
4. Displays each unique sender as a card you can select.
5. Unsubscribes from selected senders, either by sending an unsubscribe email or opening the unsubscribe URL.

You can run multiple rounds of unsubscribing in a single session. Processed senders stay visible but inactive, while any remaining pending senders stay selectable.

## Tech stack

- React 19 and Vite
- Gmail REST API (messages.list, messages.get, messages.send, users.getProfile)
- Google Identity Services for browser OAuth token flow
- Plain CSS with a Liquid Glass design aesthetic

## Setup

### Google Cloud project

1. Go to the [Google Cloud Console](https://console.cloud.google.com) and create a project.
2. Enable the **Gmail API** for the project.
3. Under **APIs and Services > Credentials**, create an OAuth 2.0 Client ID with application type **Web application**.
4. Add `http://localhost:5173` to the list of authorised JavaScript origins.
5. Under **APIs and Services > OAuth consent screen**, add your Gmail address as a test user.

### Running locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser, paste your OAuth Client ID into the app, and connect your Gmail account.

### Building for production

```bash
npm run build
npm run preview
```
