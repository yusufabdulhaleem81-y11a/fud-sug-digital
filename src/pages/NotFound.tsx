import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-5xl font-extrabold text-fud">404</h1>
      <p className="text-stone-500">This page could not be found.</p>
      <Link to="/" className="rounded-lg bg-fud px-5 py-2.5 font-semibold text-white">Back to Home</Link>
    </div>
  );
}