import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rutgers Smoke Shop',
  description: 'Customer rewards and tracking for Rutgers Smoke Shop',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-[var(--rutgers-red)] text-white font-black text-2xl leading-none rounded-md">R</div>
            <div>
              <h1 className="text-xl font-bold text-black">Rutgers Smoke Shop</h1>
              <p className="text-sm text-gray-600">Rewards to $200 · Red, White, and Black</p>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl p-4">{children}</main>
      </body>
    </html>
  );
}
