import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <p className="text-5xl font-extrabold text-pj-blue-600">404</p>
      <h1 className="mt-3 text-xl font-bold text-pj-slate-900">Page not found</h1>
      <p className="mt-2 text-pj-slate-500">The page you’re looking for doesn’t exist or has moved.</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-full bg-pj-blue-600 px-5 py-2.5 text-white font-semibold hover:bg-pj-blue-700"
      >
        Back home
      </Link>
    </div>
  );
}
