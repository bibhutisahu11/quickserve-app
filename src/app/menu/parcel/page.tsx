import Link from "next/link";

export default function GenericParcelPage() {
  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🍽️</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Menu Not Found</h1>
        <p className="text-slate-500 mb-6">
          This URL doesn&apos;t point to a specific restaurant. Please use your
          restaurant&apos;s unique menu link.
        </p>
        <p className="text-sm text-slate-400 bg-slate-50 rounded-lg px-4 py-3 font-mono">
          https://quicktab.vercel.app/<span className="text-amber-600 font-bold">your-restaurant-slug</span>/menu/parcel
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-block bg-amber-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-amber-600 transition-colors text-sm"
        >
          Go to Admin Login
        </Link>
      </div>
    </div>
  );
}
