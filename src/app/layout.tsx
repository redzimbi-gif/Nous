import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fredoka";
import "@fontsource-variable/nunito";
import "./globals.css";
import Splash from "@/components/Splash";

export const metadata: Metadata = {
  title: "Nous",
  description: "Rien qu'entre vous.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nous",
  },
};

export const viewport: Viewport = {
  themeColor: "#fffaf3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Masque le splash avant le premier affichage s'il a déjà été vu dans cette session.
const SPLASH_GUARD = "try{if(sessionStorage.getItem('nous-splash'))document.documentElement.dataset.splash='skip'}catch(e){}";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SPLASH_GUARD }} />
      </head>
      <body className="font-sans antialiased">
        <Splash />
        {children}
      </body>
    </html>
  );
}
