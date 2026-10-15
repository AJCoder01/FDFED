# Running ServiceHub

## Prerequisites

- Node.js 20.19+ (20.x), or Node.js 22.12+.
- npm (included with Node.js).

## Run locally

Open a terminal in the project folder (`FDFED`) and run:

```bash
npm ci
npm run dev
```

Open the local URL printed in the terminal, usually [http://localhost:5173](http://localhost:5173). If that port is busy, Vite will print a different URL.

The app uses mock data stored in your browser's local storage. No backend, database, or `.env` file is required.

Press `Ctrl+C` in the terminal to stop the app.

## Build and preview

To create a production build and preview it locally:

```bash
npm run build
npm run preview
```

The build is saved in `dist/`. Open the preview URL printed in the terminal, usually [http://localhost:4173](http://localhost:4173).
