// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
      <p className="mt-4">Sorry, the page you are looking for does not exist.</p>
      <Link href="/" className="mt-6 inline-block rounded bg-sky-500 px-4 py-2 text-white">
        Go Back Home
      </Link>
    </div>
  );
}