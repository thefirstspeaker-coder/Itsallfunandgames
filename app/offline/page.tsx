// app/offline/page.tsx
'use client';

export default function OfflinePage() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold">You are Offline</h1>
      <p className="mt-4">
        It looks like you've lost your internet connection. Don't worry, some pages may still be available.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 inline-block rounded bg-sky-500 px-4 py-2 text-white"
      >
        Try Again
      </button>
    </div>
  );
}