import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Navigation } from "@/components/Navigation";
import { AuthInitializer } from "@/components/AuthInitializer";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AuthInitializer />
          <Navigation />
          <main className="min-h-screen bg-background">
            {children}
          </main>

        </Providers>
      </body>
    </html>
  );
}