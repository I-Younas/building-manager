export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-blue-600">
          Building Manager
        </p>
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
