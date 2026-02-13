import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LaundryOps Admin",
  description: "Owner dashboard for LaundryOps outlets, orders, and analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="flex min-h-screen">
          <aside className="w-56 bg-slate-800 border-r border-slate-700 flex flex-col">
            <div className="p-4 border-b border-slate-700">
              <h1 className="font-bold text-lg text-sky-400">LaundryOps</h1>
              <p className="text-xs text-slate-400">Owner Dashboard</p>
            </div>
            <nav className="flex-1 p-2">
              <a
                href="/"
                className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white mb-1"
              >
                Overview
              </a>
              <a
                href="/outlets"
                className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white mb-1"
              >
                Outlets
              </a>
              <a
                href="/orders"
                className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white mb-1"
              >
                Orders
              </a>
              <a
                href="/staff"
                className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white mb-1"
              >
                Staff
              </a>
              <a
                href="/feedback"
                className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Feedback
              </a>
            </nav>
          </aside>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
