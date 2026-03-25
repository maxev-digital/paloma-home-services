import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Get an Estimate — Paloma Home Services',
  description: 'Build your own estimate for home services from Paloma Home Services in Little Elm, TX.',
};

export default function EstimateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Paloma Home Services" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">Paloma Home Services</p>
              <p className="text-xs text-gray-500">Little Elm, TX</p>
            </div>
          </div>
          <a
            href="tel:9402418244"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            <span className="hidden sm:inline">(940) 241-8244</span>
            <span className="sm:hidden">Call</span>
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Paloma Home Services &middot; Little Elm, TX
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Questions? Call us at{' '}
            <a href="tel:9402418244" className="text-blue-600 hover:underline">(940) 241-8244</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
