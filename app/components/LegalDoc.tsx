import Navbar from "./Navbar";
import Footer from "./Footer";

/** A content block in a legal document. */
export type Block =
  | { h2: string }
  | { h3: string }
  | { p: string }
  | { ul: string[] };

/** Shared renderer for long-form legal pages (Privacy Policy, Terms). */
export default function LegalDoc({
  title,
  effective,
  version,
  intro,
  blocks,
}: {
  title: string;
  effective: string;
  version: string;
  intro?: string;
  blocks: Block[];
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 bg-pj-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-pj-blue-900/5 border border-pj-slate-100">
            <span className="inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-6">
              Legal
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-pj-slate-900 mb-3 tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-pj-slate-500 mb-8">
              Effective {effective} · Version {version}
            </p>
            {intro && (
              <p className="text-lg text-pj-slate-600 leading-relaxed mb-4">{intro}</p>
            )}
            <div className="space-y-4">
              {blocks.map((b, i) => {
                if ("h2" in b)
                  return (
                    <h2 key={i} className="text-2xl font-bold text-pj-slate-900 mt-10 mb-2 tracking-tight">
                      {b.h2}
                    </h2>
                  );
                if ("h3" in b)
                  return (
                    <h3 key={i} className="text-lg font-semibold text-pj-slate-900 mt-6 mb-1">
                      {b.h3}
                    </h3>
                  );
                if ("ul" in b)
                  return (
                    <ul key={i} className="list-disc pl-6 space-y-1.5 text-pj-slate-600 leading-relaxed">
                      {b.ul.map((it, j) => (
                        <li key={j}>{it}</li>
                      ))}
                    </ul>
                  );
                return (
                  <p key={i} className="text-pj-slate-600 leading-relaxed">
                    {b.p}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
