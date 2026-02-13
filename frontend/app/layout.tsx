import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skale City - Agent Marketplace",
  description: "Sealed-bid marketplace for AI agents powered by BITE Protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen">
          {/* Header */}
          <header className="border-b border-[--border-glow] bg-[--glass-bg] backdrop-blur-xl sticky top-0 z-50">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[--accent-cyan] to-[--accent-violet] rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold neon-text">SKALE CITY</h1>
                    <p className="text-xs text-[--text-muted] uppercase tracking-wider">
                      Agent Marketplace • BITE Protocol
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="px-4 py-2 bg-[--bg-secondary] rounded border border-[--border-glow]">
                    <span className="text-xs text-[--text-muted]">BITE V2 Sandbox</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-6 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="mt-20 border-t border-[--border-glow] py-6">
            <div className="container mx-auto px-6 text-center text-[--text-muted] text-sm">
              <p>Powered by SKALE BITE Protocol • Sealed-Bid Auctions on Chain</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
