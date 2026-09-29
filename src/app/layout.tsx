import type { Metadata, Viewport } from "next";
import { Geist_Mono, Roboto } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { EnregistrementServiceWorker } from "@/components/EnregistrementServiceWorker";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ordi'Space Fournisseur",
  description: "Espace Fournisseur OrdiSpace.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fournisseur",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d63e0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${roboto.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-brand-ink md:bg-[linear-gradient(160deg,#eef3fb_0%,#e3e9f5_45%,#eef1f8_100%)]">
        <EnregistrementServiceWorker />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
